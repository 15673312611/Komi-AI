<!--
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { notificationService, type Notification } from '@/services/notification'
import { getNotificationIcon } from './notificationIcons'
import { conversationSessionUrl } from '@/pwa/pushContract'

const router = useRouter()

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    close: [],
    'notification-read': []
}>()

const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const error = ref('')
const actionBusy = ref(new Set<number>())
const isMarkingAll = ref(false)
const isClearingAll = ref(false)
let fetchVersion = 0

const invalidatePendingFetches = () => {
    fetchVersion += 1
    // A superseded request must not leave the drawer stuck in its loading
    // state while a mutation updates the already-visible rows.
    isLoading.value = false
}

const setActionBusy = (id: number, busy: boolean) => {
    const next = new Set(actionBusy.value)
    if (busy) next.add(id)
    else next.delete(id)
    actionBusy.value = next
}

const fetchNotifications = async () => {
    const version = ++fetchVersion
    try {
        isLoading.value = true
        const next = await notificationService.getNotifications()
        if (version !== fetchVersion) return
        notifications.value = Array.isArray(next) ? next : []
        error.value = ''
    } catch (err) {
        if (version !== fetchVersion) return
        error.value = '加载通知列表失败'
        console.error('Error fetching notifications:', err)
    } finally {
        if (version === fetchVersion) isLoading.value = false
    }
}

const markAsRead = async (id: number): Promise<boolean> => {
    if (actionBusy.value.has(id)) return false
    invalidatePendingFetches()
    setActionBusy(id, true)
    try {
        await notificationService.markAsRead(id)
        const notification = notifications.value.find(n => n.id === id)
        if (notification && !notification.is_read) {
            notification.is_read = true
            emit('notification-read')
        }
        error.value = ''
        return true
    } catch (err) {
        console.error('Error marking notification as read:', err)
        error.value = '标记通知为已读失败'
        return false
    } finally {
        setActionBusy(id, false)
    }
}

// Chat notifications (new chat, transfer, assignment) carry the session id in
// their metadata; clicking one marks it read and deep-links to that
// conversation, closing the drawer.
const sessionIdOf = (notification: Notification): string | undefined => {
    const id = notification.notification_metadata?.session_id
    return id ? String(id) : undefined
}

const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
        if (!(await markAsRead(notification.id))) return
    }
    const sessionId = sessionIdOf(notification)
    if (sessionId) {
        emit('close')
        void router.push(conversationSessionUrl(sessionId)).catch((navigationError) => {
            console.debug('Failed to open notification conversation:', navigationError)
        })
    }
}

const activeFilter = ref<'all' | 'unread'>('all')

const filteredNotifications = computed(() =>
    activeFilter.value === 'unread'
        ? notifications.value.filter(n => !n.is_read)
        : notifications.value
)

const hasUnread = computed(() => notifications.value.some(n => !n.is_read))
const hasActionBusy = computed(() => actionBusy.value.size > 0)

// One request that clears everything, not one per loaded row. The list is a
// 50-row page, so looping it could never clear a badge showing 99+ however many
// times you tapped.
const markAllRead = async () => {
    if (isMarkingAll.value || isClearingAll.value || hasActionBusy.value || !hasUnread.value) return
    invalidatePendingFetches()
    isMarkingAll.value = true
    try {
        await notificationService.markAllAsRead()
        notifications.value.forEach(n => { n.is_read = true })
        error.value = ''
        emit('notification-read')
    } catch (err) {
        console.error('Error marking all notifications as read:', err)
        error.value = '无法全部标为已读'
    } finally {
        isMarkingAll.value = false
    }
}

const deleteNotification = async (id: number) => {
    if (isMarkingAll.value || isClearingAll.value || hasActionBusy.value) return
    const index = notifications.value.findIndex(n => n.id === id)
    if (index < 0) return
    const removed = notifications.value[index]
    invalidatePendingFetches()
    setActionBusy(id, true)
    // Optimistic: the row disappears on tap, and comes back if the call fails.
    notifications.value.splice(index, 1)
    try {
        await notificationService.deleteNotification(id)
        error.value = ''
        emit('notification-read')
    } catch (err) {
        console.error('Error deleting notification:', err)
        if (!notifications.value.some(n => n.id === id)) {
            notifications.value.splice(Math.min(index, notifications.value.length), 0, removed)
        }
        error.value = '删除该通知失败'
    } finally {
        setActionBusy(id, false)
    }
}

const clearAll = async () => {
    if (isMarkingAll.value || isClearingAll.value || hasActionBusy.value || !notifications.value.length) return
    const previous = notifications.value
    invalidatePendingFetches()
    isClearingAll.value = true
    notifications.value = []
    try {
        await notificationService.clearAll()
        error.value = ''
        emit('notification-read')
    } catch (err) {
        console.error('Error clearing notifications:', err)
        notifications.value = previous
        error.value = '清空通知失败'
    } finally {
        isClearingAll.value = false
    }
}

const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    if (!Number.isFinite(date.getTime())) return '时间未知'
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than a minute
    if (diff < 60000) {
        return '刚刚'
    }

    // Less than an hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000)
        return `${mins} 分钟前`
    }

    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `${hours} 小时前`
    }

    // Show date
    return date.toLocaleDateString()
}

const notificationType = (notification: Notification): string =>
    typeof notification.type === 'string' ? notification.type.toLowerCase() : ''

// Refresh when the drawer is opened so a long-lived dashboard does not show a
// stale snapshot. The version guard prevents an older response from replacing
// a newer one when opening and refreshing happen close together.
watch(() => props.isOpen, () => { void fetchNotifications() }, { immediate: true })

onBeforeUnmount(() => {
    fetchVersion += 1
})
</script>

<template>
    <div class="notification-drawer" :class="{ open: isOpen }">
        <div class="drawer-header">
            <h3>消息通知</h3>
            <div class="header-actions">
                <button
                    class="refresh-button"
                    @click="fetchNotifications"
                    :disabled="isLoading"
                    :class="{ 'loading': isLoading }"
                    title="刷新通知"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                </button>
                <button class="close-button" @click="emit('close')" title="关闭">&times;</button>
            </div>
        </div>

        <div class="drawer-filter">
            <div class="filter-tabs">
                <button class="filter-tab" :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">全部</button>
                <button class="filter-tab" :class="{ active: activeFilter === 'unread' }" @click="activeFilter = 'unread'">未读</button>
            </div>
            <div class="filter-actions">
                <button class="mark-all" :disabled="isLoading || isMarkingAll || isClearingAll || hasActionBusy || !hasUnread" @click="markAllRead">全部已读</button>
                <button class="mark-all" :disabled="isLoading || isMarkingAll || isClearingAll || hasActionBusy || !notifications.length" @click="clearAll">清空全部</button>
            </div>
        </div>

        <div class="drawer-content">
            <div v-if="isLoading" class="state-message">
                正在加载通知列表...
            </div>

            <div v-else-if="error" class="state-message">
                {{ error }}
            </div>

            <div v-else-if="!filteredNotifications.length" class="empty-state">
                <div class="empty-title">一切已就绪</div>
                <div class="empty-sub">暂无{{ activeFilter === 'unread' ? '未读' : '' }}消息通知。</div>
            </div>

            <div v-else class="notifications">
                <div v-for="notification in filteredNotifications" :key="notification.id" class="notification-item"
                    :class="{ unread: !notification.is_read, linkable: sessionIdOf(notification) }"
                    @click="handleNotificationClick(notification)">
                    <span class="notification-icon-wrap">
                        <img v-if="getNotificationIcon(notificationType(notification))"
                            :src="getNotificationIcon(notificationType(notification))" class="notification-type-icon"
                            :alt="notification.type" />
                    </span>
                    <div class="notification-body">
                        <div class="notification-top">
                            <span class="notification-title">{{ notification.title }}</span>
                            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
                        </div>
                        <div class="notification-message">{{ notification.message }}</div>
                    </div>
                    <span class="unread-dot" :class="{ on: !notification.is_read }"></span>
                    <!-- .stop: the row itself deep-links to the conversation -->
                    <button
                        class="delete-notification"
                        :aria-label="`删除通知: ${notification.title}`"
                        title="删除通知"
                        :disabled="isLoading || isMarkingAll || isClearingAll || actionBusy.has(notification.id)"
                        @click.stop="deleteNotification(notification.id)"
                    >&times;</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notification-drawer {
    position: fixed;
    top: 0;
    right: -380px;
    width: 380px;
    max-width: 90vw;
    height: 100vh;
    background: var(--bg2);
    border-left: 1px solid var(--o08);
    transition: right 0.3s ease;
    z-index: var(--z-drawer);
    display: flex;
    flex-direction: column;
}

.notification-drawer.open {
    right: 0;
    /* Only while open. Parked at right:-380px the panel is off-screen, but a
       shadow cast 20px leftward with a 50px blur still reaches ~45px back onto
       the page, above the content — and this drawer is mounted by
       DashboardLayout on every screen, so the band followed you everywhere.
       Invisible on the dark theme, a grey edge on the light one. */
    box-shadow: -20px 0 50px rgba(0, 0, 0, 0.4);
}

.drawer-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--o07);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg2);
}

.drawer-header h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: var(--font-weight-bold);
    color: var(--text);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.refresh-button {
    background: transparent;
    border: 1px solid var(--o12);
    border-radius: 8px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    color: var(--muted);
    transition: background-color 0.2s ease, color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.refresh-button:hover {
    background: var(--o06);
    color: var(--text);
}

.refresh-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.refresh-button.loading svg {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.close-button {
    background: transparent;
    border: 1px solid var(--o12);
    font-size: 15px;
    cursor: pointer;
    color: var(--muted);
    transition: background-color 0.2s ease, color 0.2s ease;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.close-button:hover {
    background: var(--o06);
    color: var(--text);
}

/* Filter row */
.drawer-filter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--o07);
}

.filter-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    background: var(--surface);
    border: 1px solid var(--o08);
    border-radius: 9px;
}

.filter-tab {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 5px 13px;
    border-radius: 6px;
    color: var(--muted);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    transition: background-color 0.15s ease, color 0.15s ease;
}

.filter-tab.active {
    background: var(--accent-bg-12);
    color: var(--accent-ink);
}

.filter-actions {
    display: flex;
    align-items: center;
    gap: 14px;
}

/* Sits over the row; the row itself is the deep-link, so the button stops
   propagation. 32px keeps it thumb-reachable without crowding the text. */
.delete-notification {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.55;
    transition: opacity 0.15s ease, background-color 0.15s ease;
}

.delete-notification:hover,
.delete-notification:focus-visible {
    opacity: 1;
    background: var(--o07);
}

.mark-all {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--accent-ink);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    transition: filter 0.15s ease, opacity 0.15s ease;
}

.mark-all:hover:not(:disabled) {
    filter: brightness(1.1);
}

.mark-all:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.drawer-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--o05);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.notification-item:hover {
    background: var(--o03);
}

/* Chat notifications deep-link to their conversation — hint it on hover. */
.notification-item.linkable {
    position: relative;
}

.notification-item.linkable::after {
    content: 'Open ›';
    position: absolute;
    right: 18px;
    bottom: 10px;
    font-size: 11px;
    font-weight: var(--font-weight-medium);
    color: var(--accent-ink);
    opacity: 0;
    transition: opacity 0.15s ease;
}

.notification-item.linkable:hover::after {
    opacity: 1;
}

.notification-item.unread {
    background: var(--accent-bg-06);
}

.notification-icon-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
}

.notification-type-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    filter: var(--icon-filter, brightness(0) invert(1));
    opacity: var(--icon-opacity, 0.55);
}

.notification-body {
    flex: 1;
    min-width: 0;
}

.notification-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.notification-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--text2);
    word-break: break-word;
}

.notification-time {
    font-size: 11px;
    color: var(--muted2);
    flex-shrink: 0;
    white-space: nowrap;
}

.notification-message {
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.5;
    margin-top: 3px;
    word-break: break-word;
}

.unread-dot {
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: transparent;
    margin-top: 6px;
}

.unread-dot.on {
    background: var(--accent-solid);
}

.state-message {
    padding: var(--space-md);
    text-align: center;
    color: var(--muted2);
}

.empty-state {
    padding: 60px 24px;
    text-align: center;
}

.empty-title {
    font-size: 14px;
    color: var(--muted2);
    margin-bottom: 4px;
}

.empty-sub {
    font-size: 12.5px;
    color: var(--faint);
}

/* Mobile: full-screen panel per design */
@media (max-width: 768px) {
    .notification-drawer {
        width: 100%;
        max-width: 100vw;
        right: -100vw;
        height: 100vh;
        height: 100dvh;
        border-left: none;
    }

    .notification-drawer.open {
        right: 0;
    }

    .drawer-header {
        padding-top: calc(20px + var(--safe-top));
    }

    .drawer-content {
        padding-bottom: var(--safe-bottom);
    }
}
</style>
