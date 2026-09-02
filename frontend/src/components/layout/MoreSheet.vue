<!--
Copyright 2024-2026 Komi AI

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

<script setup lang="ts" name="MoreSheet">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNavItems, navIconSvg, formatBadgeCount } from './navItems'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import type { ThemeMode } from '@/composables/useTheme'

const props = defineProps<{
    open: boolean
    isOnline?: boolean
    statusUpdating?: boolean
    themeMode?: ThemeMode
    unreadCount?: number
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'toggle-status'): void
    (e: 'toggle-theme'): void
    (e: 'notifications'): void
    (e: 'logout'): void
}>()

const router = useRouter()
const { moreNavGroups } = useNavItems()

const themeLabel = computed(() =>
    props.themeMode === 'dark' ? '深色' : props.themeMode === 'light' ? '浅色' : '跟随系统'
)

const themeIconName = computed(() =>
    props.themeMode === 'dark' ? 'moon' : props.themeMode === 'light' ? 'sun' : 'monitor'
)

const badgeText = computed(() => formatBadgeCount(props.unreadCount))

const navigate = (to?: string) => {
    if (!to) return
    emit('close')
    router.push(to)
}
</script>

<template>
    <Teleport to="body">
        <Transition name="more-sheet">
            <div v-if="open" class="more-sheet-root">
                <div class="more-scrim" @click="emit('close')"></div>
                <div class="more-sheet" role="dialog" aria-label="更多功能">
                    <div class="drag-handle" aria-hidden="true"></div>

                    <!-- Availability -->
                    <button
                        type="button"
                        class="availability-card"
                        :class="{ offline: !isOnline }"
                        :disabled="statusUpdating"
                        @click="emit('toggle-status')"
                    >
                        <span class="availability-dot" :class="{ online: isOnline }"></span>
                        <span class="availability-text">
                            <span class="availability-title">{{ isOnline ? "当前在线" : "当前离线" }}</span>
                            <span class="availability-sub">{{ isOnline ? '正常接收新客户咨询' : '暂停分配新客户会话' }}</span>
                        </span>
                        <span class="toggle-track" :class="{ on: isOnline }">
                            <span class="toggle-knob"></span>
                        </span>
                    </button>

                    <!-- Theme -->
                    <button type="button" class="sheet-row standalone" @click="emit('toggle-theme')">
                        <span class="row-icon theme-icon" aria-hidden="true" v-html="navIconSvg(themeIconName, 20)"></span>
                        <span class="row-label">界面主题</span>
                        <span class="row-value">{{ themeLabel }}</span>
                    </button>

                    <!-- Overflow nav links, grouped exactly as the desktop sidebar -->
                    <template v-for="(group, index) in moreNavGroups" :key="group.section || index">
                        <div v-if="group.section" class="sheet-section nav-section-heading">{{ group.section }}</div>
                        <div class="sheet-card">
                            <button
                                v-for="item in group.items"
                                :key="item.to"
                                type="button"
                                class="sheet-row"
                                @click="navigate(item.to)"
                            >
                                <span class="row-icon" v-html="navIconSvg(item.icon, 20)"></span>
                                <span class="row-label">{{ item.label }}</span>
                                <span class="row-chevron" aria-hidden="true" v-html="navIconSvg('chevronRight', 18)"></span>
                            </button>
                        </div>
                    </template>

                    <!-- Notifications -->
                    <button type="button" class="sheet-row standalone" @click="emit('notifications')">
                        <span class="row-icon" v-html="navIconSvg('bell', 20)"></span>
                        <span class="row-label">消息通知</span>
                        <span v-if="unreadCount" class="row-badge">{{ badgeText }}</span>
                    </button>

                    <!-- Install as app (hidden once installed) -->
                    <div class="install-slot">
                        <InstallPrompt />
                    </div>

                    <!-- Logout -->
                    <button type="button" class="logout-row" @click="emit('logout')">
                        <span class="row-icon" v-html="navIconSvg('logout', 19)"></span>
                        退出登录
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.more-sheet-root {
    position: fixed;
    inset: 0;
    z-index: var(--z-sheet);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.more-scrim {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
}

.more-sheet {
    position: relative;
    background: #FFFFFF;
    border-top: 1px solid var(--border-color);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 12px 18px calc(var(--space-lg) + var(--safe-bottom));
    box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.12);
    max-height: calc(100dvh - 60px);
    overflow-y: auto;
}

.drag-handle {
    width: 38px;
    height: 4.5px;
    border-radius: 99px;
    background: rgba(15, 23, 42, 0.12);
    margin: 0 auto 16px;
}

.availability-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.22);
    margin-bottom: 14px;
    cursor: pointer;
    font-family: var(--font-sans);
    color: var(--text);
    text-align: left;
    transition: all var(--transition-fast);
}

.availability-card.offline {
    background: #F8FAFC;
    border-color: var(--border-color);
}

.availability-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.availability-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--muted);
    flex-shrink: 0;
}

.availability-dot.online {
    background: var(--success-color);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.availability-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.availability-title {
    font-weight: 600;
    font-size: 14.5px;
    color: var(--text);
}

.availability-sub {
    font-size: 12px;
    color: var(--muted);
}

.toggle-track {
    width: 44px;
    height: 24px;
    border-radius: 99px;
    background: rgba(15, 23, 42, 0.12);
    position: relative;
    flex-shrink: 0;
    transition: background-color var(--transition-fast);
}

.toggle-track.on {
    background: var(--success-color);
}

.toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform var(--transition-fast);
}

.toggle-track.on .toggle-knob {
    transform: translateX(20px);
}

.sheet-section {
    padding: 0 4px;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--muted2);
    text-transform: uppercase;
}

.sheet-card {
    background: #F8FAFC;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 14px;
}

.sheet-card .sheet-row + .sheet-row {
    border-top: 1px solid var(--border-color);
}

.sheet-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    background: none;
    border: none;
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background-color var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
}

.sheet-row:hover {
    background: rgba(15, 23, 42, 0.04);
}

.sheet-row.standalone {
    background: #F8FAFC;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    margin-bottom: 14px;
}

.row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text3);
    flex-shrink: 0;
}

.theme-icon {
    color: var(--accent-solid);
}

.row-label {
    flex: 1;
    min-width: 0;
    font-weight: 500;
}

.row-value {
    color: var(--muted);
    font-size: 13px;
}

.row-chevron {
    color: var(--muted2);
    display: flex;
}

.row-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--c-danger);
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.install-slot {
    margin-bottom: 14px;
}

.install-slot:empty {
    display: none;
}

.logout-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: none;
    border: none;
    color: var(--c-danger);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
}

.logout-row .row-icon {
    color: inherit;
}

/* Slide-up transition */
.more-sheet-enter-active,
.more-sheet-leave-active {
    transition: opacity var(--transition-normal);
}

.more-sheet-enter-active .more-sheet,
.more-sheet-leave-active .more-sheet {
    transition: transform var(--transition-normal);
}

.more-sheet-enter-from,
.more-sheet-leave-to {
    opacity: 0;
}

.more-sheet-enter-from .more-sheet,
.more-sheet-leave-to .more-sheet {
    transform: translateY(100%);
}

/* Dark theme overrides */
[data-theme="dark"] .more-sheet {
    background: var(--surface);
    border-top-color: var(--border-color);
}

[data-theme="dark"] .drag-handle {
    background: rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .sheet-card,
[data-theme="dark"] .sheet-row.standalone {
    background: var(--bg2);
    border-color: var(--border-color);
}

[data-theme="dark"] .sheet-card .sheet-row + .sheet-row {
    border-top-color: var(--border-color);
}

[data-theme="dark"] .sheet-row:hover {
    background: rgba(255, 255, 255, 0.05);
}
</style>

