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

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import MoreSheet from '@/components/layout/MoreSheet.vue'
import { navIconSvg } from '@/components/layout/navIcons'
import userAvatar from '@/assets/user.svg'
import notificationIcon from '@/assets/notification.svg'
import NotificationList from '@/components/notifications/NotificationList.vue'
import EnablePushPrompt from '@/components/notifications/EnablePushPrompt.vue'
import { userService } from '@/services/user'
import { permissionChecks } from '@/utils/permissions'
import type { User } from '@/types/user'
import { useNotifications } from '@/composables/useNotifications'
import { notificationService } from '@/services/notification'
import { useRoute, useRouter } from 'vue-router'
import { updateUserStatus } from '@/services/users'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'
import { myAvatarUrl } from '@/config/api'
import { useBreakpoint } from '@/composables/useBreakpoint'

const props = defineProps<{
    hideSidebar?: boolean
    hideHeader?: boolean
}>()

// Initialize sidebar state based on current route and screen size
const route = useRoute()
const { isMobile: isPhone, isTablet: isMobile } = useBreakpoint()
const isSidebarOpen = ref(
    route.path !== '/conversations' && !isMobile.value
)
const showUserMenu = ref(false)
const showNotifications = ref(false)
const showMoreSheet = ref(false)
const currentUser = ref<User>(userService.getCurrentUser() as User)
const userName = ref(userService.getUserName())
const userRole = ref(userService.getUserRole())
const unreadCount = ref(0)
const statusUpdating = ref(false)
const { logout } = useAuth()
const { mode: themeMode, toggle: toggleTheme } = useTheme()
const themeTitle = computed(() =>
  themeMode.value === 'dark' ? '主题：深色模式 (点击切换为浅色)'
    : themeMode.value === 'light' ? '主题：浅色模式 (点击切换为跟随系统)'
    : '主题：跟随系统 (点击切换为深色模式)'
)
// Attaches push listeners when permission is already granted; the permission
// request itself only happens from the EnablePushPrompt user gesture.
const { enableNotifications } = useNotifications()
const router = useRouter()

const PAGE_TITLES: Record<string, string> = {
    '/ai-agents': 'AI 智能体',
    '/human-agents': '人工客服',
    '/conversations': '会话收件箱',
    '/tickets': '工单中心',
    '/people': '团队成员',
    '/knowledge': '知识库',
    '/faq': '帮助中心',
    '/analytics': '数据分析',
    '/settings/organization': '组织设置',
    '/settings/subscription': '订阅管理',
    '/settings/ticketing': '工单配置',
    '/settings/integrations': '渠道集成',
    '/settings/widget-apps': '挂件应用',
    '/settings/ai-config': 'AI 模型配置',
    '/settings/canned-responses': '快捷话术',
    '/settings/user': '个人设置',
}
const pageTitle = computed(() => PAGE_TITLES[route.path] || '')

// Initialize enterprise features
const { hasEnterpriseModule, subscriptionStore, initializeSubscriptionStore, showMessageLimitWarning, messageLimitStatus } = useEnterpriseFeatures()

const currentPlan = computed(() => subscriptionStore.value.currentPlan)
const isLoadingPlan = computed(() => subscriptionStore.value.isLoadingPlan)
const isInTrial = computed(() => subscriptionStore.value.isInTrial)
const trialDaysLeft = computed(() => subscriptionStore.value.trialDaysLeft)

const userAvatarSrc = computed(() => {
  if (!currentUser.value?.profile_pic) return userAvatar
  // Never the stored URL: the copy we hold was signed at login and expires an
  // hour later. Ask the API, which signs on the spot. Cache-busted so a freshly
  // uploaded picture replaces the one the browser already cached.
  return myAvatarUrl(new Date().getTime())
})

const toggleOnlineStatus = async () => {
  if (statusUpdating.value) return
  
  try {
    statusUpdating.value = true
    const newStatus = !currentUser.value?.is_online
    await updateUserStatus(currentUser.value?.id as string, newStatus)
    
    // Update local state
    currentUser.value = {
      ...currentUser.value,
      is_online: newStatus,
      last_seen: new Date().toISOString()
    } as User
    
    userService.setCurrentUser(currentUser.value as User)
    showUserMenu.value = false
  } catch (error) {
    console.error('Failed to update status:', error)
  } finally {
    statusUpdating.value = false
  }
}

// Bottom nav shows on phones only; hidden in fullscreen workflows and on the
// full-screen chat pane (mobile chat detail = /conversations with ?session=)
const showBottomNav = computed(() =>
    isPhone.value &&
    !props.hideSidebar &&
    !(route.path === '/conversations' && route.query.session)
)

// Watch for route changes to update sidebar state and close menus
watch(
  () => route.path,
  (newPath) => {
    showUserMenu.value = false
    showNotifications.value = false
    showMoreSheet.value = false

    // Set sidebar state based on route and screen size
    if (newPath === '/conversations') {
      isSidebarOpen.value = false // Collapsed for conversations
    } else if (isMobile.value) {
      isSidebarOpen.value = false // Collapsed on mobile by default
    } else {
      isSidebarOpen.value = true // Expanded for all other routes on desktop
    }
  }
)

const fetchUnreadCount = async () => {
    try {
        unreadCount.value = await notificationService.getUnreadCount()
    } catch (err) {
        console.error('Error fetching unread count:', err)
    }
}

// React to breakpoint changes (was a manual resize listener)
watch(isMobile, (mobile) => {
    if (mobile && isSidebarOpen.value) {
        isSidebarOpen.value = false
    } else if (!mobile && !isSidebarOpen.value && route.path !== '/conversations') {
        isSidebarOpen.value = true
    }
})

onMounted(() => {
    fetchUnreadCount()

    if (hasEnterpriseModule) {
        initializeSubscriptionStore().then(() => {
            subscriptionStore.value.fetchCurrentPlan().then(() => {
            }).catch((err: Error) => {
                console.error('Error fetching current plan:', err)
            })
        }).catch((err: Error) => {
            console.error('Error initializing subscription store:', err)
        })
    }
})

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
    // On mobile, close the sidebar when clicking backdrop
    if (isMobile.value) {
        isSidebarOpen.value = false
    }
}

const navigateToUpgrade = () => {
    router.push('/settings/subscription')
}

// The usage warning is for everyone — an agent hitting a message ceiling needs
// to know why replies stop. The two remedies are not: both lead to pages a
// non-admin cannot open, so they rendered as doors into a 403.
const canManageSubscription = permissionChecks.canManageSubscription()
const canViewAIConfig = permissionChecks.canViewAIConfig()

// Computed for layout classes
const layoutClasses = computed(() => ({
    'sidebar-collapsed': !isSidebarOpen.value || props.hideSidebar,
    'header-hidden': props.hideHeader,
    'fullscreen-workflow': props.hideSidebar && props.hideHeader,
    'has-bottom-nav': showBottomNav.value
}))

const openNotificationsFromSheet = () => {
    showMoreSheet.value = false
    showNotifications.value = true
}
</script>

<template>
    <div class="dashboard-layout" :class="layoutClasses">

        <!-- Backdrop for mobile -->
        <div 
            v-if="!props.hideSidebar && isSidebarOpen" 
            class="sidebar-backdrop"
            @click="closeSidebar"
        ></div>

        <AppSidebar 
            v-if="!props.hideSidebar"
            :isCollapsed="!isSidebarOpen" 
            @toggle="toggleSidebar" 
        />

        <!-- Main Content Wrapper with Ambient Canvas Glow -->
        <div class="main-content">
            <!-- Message Limit Warning Banner -->
            <div v-if="!props.hideHeader && hasEnterpriseModule && showMessageLimitWarning && messageLimitStatus" 
                 class="message-limit-banner"
                 :class="messageLimitStatus.type">
                <div class="banner-content">
                    <div class="banner-text">
                        <span class="banner-icon" v-if="messageLimitStatus.type === 'error'">⚠️</span>
                        <span class="banner-icon" v-else>ℹ️</span>
                        <span>{{ messageLimitStatus.message }}</span>
                    </div>
                    <div v-if="canManageSubscription || canViewAIConfig" class="banner-actions">
                        <button
                            v-if="canManageSubscription"
                            class="action-button primary"
                            @click="navigateToUpgrade"
                        >
                            升级套餐
                        </button>
                        <button
                            v-if="canViewAIConfig"
                            class="action-button secondary"
                            @click="router.push('/settings/ai-config')"
                        >
                            配置自有模型
                        </button>
                    </div>
                </div>
                <div class="usage-bar">
                    <div class="usage-progress" 
                         :style="{ width: `${Math.min(messageLimitStatus.percentage, 100)}%` }"
                         :class="{ 'exceeded': messageLimitStatus.percentage >= 100 }">
                    </div>
                </div>
            </div>

            <!-- Topbar Header -->
            <header v-if="!props.hideHeader" class="header">
                <div class="header-content">
                    <div class="left-section">
                        <!-- Hamburger menu for mobile/tablet -->
                        <button class="hamburger-menu" @click="toggleSidebar" aria-label="切换菜单">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div class="page-title-wrap" v-if="pageTitle">
                            <h1 class="topbar-page-title">{{ pageTitle }}</h1>
                        </div>
                    </div>

                    <div class="right-section">
                        <!-- Theme Toggle Button -->
                        <button class="icon-btn" @click="toggleTheme" :title="themeTitle" :aria-label="themeTitle"
                            v-html="navIconSvg(themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sun' : 'monitor', 16)">
                        </button>

                        <!-- Enterprise Trial / Plan Info -->
                        <div v-if="hasEnterpriseModule && (isLoadingPlan || isInTrial)" class="plan-display">
                            <div v-if="isLoadingPlan" class="plan-loading">
                                <span class="loading-spinner"></span>
                                加载中...
                            </div>
                            <div v-else-if="isInTrial" class="trial-info">
                                <span
                                    class="trial-badge"
                                    :class="{ clickable: canManageSubscription }"
                                    @click="canManageSubscription && navigateToUpgrade()"
                                >
                                    <span class="sparkle-icon">✨</span>
                                    免费试用期 (剩余 {{ trialDaysLeft }} 天)
                                </span>
                            </div>
                        </div>

                        <!-- Notifications Trigger -->
                        <button class="icon-btn notification-button" @click="showNotifications = !showNotifications" title="消息通知" aria-label="消息通知">
                            <img :src="notificationIcon" alt="通知" class="notification-icon" />
                            <span v-if="unreadCount > 0" class="notification-badge">
                                {{ unreadCount > 99 ? '99+' : unreadCount }}
                            </span>
                        </button>

                        <div class="topbar-divider" aria-hidden="true"></div>

                        <!-- User Profile Card & Dropdown Menu -->
                        <div class="user-profile">
                            <div class="profile-trigger" @click="showUserMenu = !showUserMenu" :class="{ 'menu-open': showUserMenu }">
                                <div class="avatar-wrapper">
                                    <img :src="userAvatarSrc" alt="用户头像" class="avatar" />
                                    <span 
                                        class="status-indicator" 
                                        :class="{ 'online': currentUser?.is_online }"
                                        :title="currentUser?.is_online ? '当前在线' : '当前离线'"
                                    ></span>
                                </div>
                                <div class="user-info-text">
                                    <span class="user-name">{{ userName }}</span>
                                    <span v-if="currentPlan?.plan?.name" class="user-plan-tag">
                                        {{ currentPlan.plan.name }}
                                    </span>
                                </div>
                                <svg class="profile-chevron" :class="{ 'rotated': showUserMenu }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            <!-- Floating Glass Dropdown Menu -->
                            <Transition name="dropdown-scale">
                                <div class="dropdown-menu" v-if="showUserMenu">
                                    <!-- User Summary Card in Menu -->
                                    <div class="menu-user-header">
                                        <div class="menu-user-avatar">
                                            <img :src="userAvatarSrc" alt="用户头像" class="avatar" />
                                        </div>
                                        <div class="menu-user-meta">
                                            <span class="menu-name">{{ userName }}</span>
                                            <span class="menu-role-badge">{{ userRole }}</span>
                                        </div>
                                    </div>

                                    <div class="menu-divider"></div>

                                    <!-- Online Status Switcher Row -->
                                    <div class="menu-item status-toggle-item" @click.stop="toggleOnlineStatus">
                                        <div class="status-toggle-label">
                                            <span class="status-dot-icon" :class="{ 'online': currentUser?.is_online }"></span>
                                            <span>{{ currentUser?.is_online ? '工作状态：在线接待中' : '工作状态：离线待命' }}</span>
                                        </div>
                                        <div class="ios-switch" :class="{ 'active': currentUser?.is_online, 'disabled': statusUpdating }">
                                            <div class="ios-switch-knob"></div>
                                        </div>
                                    </div>

                                    <div class="menu-divider"></div>

                                    <!-- Profile Navigation Links -->
                                    <router-link to="/settings/user" class="menu-item" @click="showUserMenu = false">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>个人账号设置</span>
                                    </router-link>

                                    <router-link v-if="canManageSubscription" to="/settings/subscription" class="menu-item" @click="showUserMenu = false">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                        </svg>
                                        <span>订阅套餐与配额</span>
                                    </router-link>

                                    <div class="menu-divider"></div>

                                    <!-- Logout -->
                                    <button class="menu-item logout-btn" @click="logout">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        <span>退出登录</span>
                                    </button>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content Viewport -->
            <main class="content">
                <slot></slot>
            </main>
        </div>

        <!-- Notification Drawer -->
        <NotificationList :is-open="showNotifications" @close="showNotifications = false"
            @notification-read="fetchUnreadCount" />

        <EnablePushPrompt @enable="enableNotifications" />

        <!-- Mobile Bottom Nav & More Sheet -->
        <BottomNav
            v-if="showBottomNav"
            :unread-count="unreadCount"
            :more-open="showMoreSheet"
            @more="showMoreSheet = true"
        />
        <MoreSheet
            :open="showMoreSheet"
            :is-online="currentUser?.is_online"
            :status-updating="statusUpdating"
            :theme-mode="themeMode"
            :unread-count="unreadCount"
            @close="showMoreSheet = false"
            @toggle-status="toggleOnlineStatus"
            @toggle-theme="toggleTheme"
            @notifications="openNotificationsFromSheet"
            @logout="logout"
        />
    </div>
</template>

<style scoped>
.dashboard-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    height: 100vh;
    height: 100dvh;
    transition: grid-template-columns 0.24s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    width: 100%;
    position: relative;
    background: var(--bg);
}

.sidebar-backdrop {
    display: none;
}

/* Main Content Area & Ambient Canvas Glow */
.main-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    background: var(--mesh-studio-light), var(--bg);
}

/* Header Styles — Crystal Frosted Glass */
.header {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(15, 23, 42, 0.05);
    position: sticky;
    top: 0;
    z-index: 50;
    padding-top: var(--safe-top);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.015);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    padding: 0 28px;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 16px;
}

.hamburger-menu {
    display: none;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    color: var(--text2);
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-btn);
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-xs);
}

.hamburger-menu:hover {
    background: var(--bg-deep);
    color: var(--text);
}

.page-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.topbar-page-title {
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text);
    margin: 0;
    line-height: 1.2;
}

.right-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* Icon Buttons (Theme, Notifications) */
.icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-btn);
    color: var(--text3);
    cursor: pointer;
    box-shadow: var(--shadow-xs);
    transition: all var(--transition-fast);
    flex-shrink: 0;
    position: relative;
}

.icon-btn:hover {
    background: #F8FAFC;
    border-color: var(--border-color-hover);
    color: var(--text);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
}

.icon-btn:active {
    transform: translateY(0);
}

.icon-btn:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus);
}

.notification-icon {
    width: 17px;
    height: 17px;
    opacity: 0.7;
    transition: opacity var(--transition-fast);
}

.notification-button:hover .notification-icon {
    opacity: 1;
}

.notification-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background-color: var(--c-danger);
    color: #FFFFFF;
    border: 2px solid #FFFFFF;
    border-radius: var(--radius-pill);
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4);
}

.topbar-divider {
    width: 1px;
    height: 22px;
    background: var(--border-color);
    flex-shrink: 0;
    margin: 0 2px;
}

/* Enterprise Trial Badge */
.plan-display {
    display: flex;
    align-items: center;
}

.trial-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
    color: #FFFFFF;
    padding: 5px 12px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.01em;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    transition: all var(--transition-fast);
}

.trial-badge.clickable {
    cursor: pointer;
}

.trial-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* User Profile Trigger Capsule */
.user-profile {
    position: relative;
    cursor: pointer;
}

.profile-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px 4px 5px;
    border-radius: var(--radius-pill);
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-xs);
    transition: all var(--transition-fast);
}

.profile-trigger:hover,
.profile-trigger.menu-open {
    background: #F8FAFC;
    border-color: var(--border-color-hover);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
}

.avatar-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--grad-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.status-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9.5px;
    height: 9.5px;
    border-radius: 50%;
    background-color: var(--muted);
    border: 2px solid #FFFFFF;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-indicator.online {
    background-color: var(--success-color);
    box-shadow: 0 0 0 1.5px #FFFFFF, 0 0 6px rgba(16, 185, 129, 0.6);
}

.user-info-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    line-height: 1.2;
}

.user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.01em;
    white-space: nowrap;
}

.user-plan-tag {
    font-size: 10.5px;
    color: var(--accent-solid);
    font-weight: 600;
}

.profile-chevron {
    color: var(--muted);
    transition: transform var(--transition-fast);
}

.profile-chevron.rotated {
    transform: rotate(180deg);
}

/* Floating Glass User Dropdown */
.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 6px;
    min-width: 220px;
    z-index: 100;
    box-shadow: 0 12px 36px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
}

.menu-user-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
}

.menu-user-avatar .avatar {
    width: 36px;
    height: 36px;
}

.menu-user-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.menu-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
}

.menu-role {
    font-size: 11.5px;
    color: var(--muted);
}

.menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
}

/* Status Menu Switch Row */
.status-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-fast);
}

.status-menu-item:hover {
    background: rgba(15, 23, 42, 0.04);
}

.status-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
}

.status-dot.online {
    background: var(--success-color);
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.status-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text2);
}

/* iOS-Style Toggle Switch */
.ios-switch {
    width: 36px;
    height: 20px;
    border-radius: 99px;
    background: rgba(15, 23, 42, 0.12);
    position: relative;
    transition: background-color var(--transition-fast);
}

.ios-switch.active {
    background: var(--success-color);
}

.ios-switch-knob {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FFFFFF;
    position: absolute;
    top: 2px;
    left: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform var(--transition-fast);
}

.ios-switch.active .ios-switch-knob {
    transform: translateX(16px);
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 8px 10px;
    text-align: left;
    background: none;
    border: none;
    color: var(--text2);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: all var(--transition-fast);
}

.menu-item:hover {
    background: rgba(15, 23, 42, 0.05);
    color: var(--text);
}

.menu-item.logout {
    color: var(--c-danger);
}

.menu-item.logout:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #DC2626;
}

/* Dropdown Animation */
.dropdown-scale-enter-active,
.dropdown-scale-leave-active {
    transition: all 0.16s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top right;
}

.dropdown-scale-enter-from,
.dropdown-scale-leave-to {
    opacity: 0;
    transform: scale(0.94) translateY(-6px);
}

/* Content Area */
.content {
    flex: 1;
    padding: var(--space-xl);
}

.dashboard-layout.header-hidden .content {
    padding: 0;
}

/* Message Limit Warning Banner */
.message-limit-banner {
    position: relative;
    padding: 12px 24px;
    background: rgba(245, 158, 11, 0.08);
    border-bottom: 1px solid rgba(245, 158, 11, 0.25);
    width: 100%;
}

.message-limit-banner.error {
    background: rgba(239, 68, 68, 0.08);
    border-bottom: 1px solid rgba(239, 68, 68, 0.25);
}

.banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
}

.banner-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text);
}

.banner-actions {
    display: flex;
    gap: 8px;
}

.action-button {
    padding: 6px 12px;
    border-radius: var(--radius-btn);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
}

.action-button.primary {
    background: var(--accent-solid);
    color: #FFFFFF;
}

.action-button.primary:hover {
    background: #1D4ED8;
}

.action-button.secondary {
    background: #FFFFFF;
    color: var(--text);
    border-color: var(--border-color);
}

.action-button.secondary:hover {
    background: var(--bg-deep);
}

.usage-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(15, 23, 42, 0.06);
}

.usage-progress {
    height: 100%;
    background: var(--warning-color);
    transition: width 0.3s ease;
}

.usage-progress.exceeded {
    background: var(--error-color);
}

/* Fullscreen Workflow Mode */
.dashboard-layout.fullscreen-workflow {
    grid-template-columns: 1fr;
}

.dashboard-layout.fullscreen-workflow .main-content {
    padding: 0;
}

.dashboard-layout.fullscreen-workflow .content {
    padding: 0;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
}

/* Dark Mode Overrides for Layout */
[data-theme="dark"] .main-content {
    background: radial-gradient(circle at 90% 8%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
                var(--bg);
}

[data-theme="dark"] .header {
    background: rgba(9, 10, 15, 0.85);
    box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .icon-btn,
[data-theme="dark"] .profile-trigger,
[data-theme="dark"] .hamburger-menu {
    background: var(--surface);
    color: var(--text2);
}

[data-theme="dark"] .icon-btn:hover,
[data-theme="dark"] .profile-trigger:hover,
[data-theme="dark"] .profile-trigger.menu-open {
    background: var(--o08);
    color: var(--text);
}

[data-theme="dark"] .status-indicator {
    border-color: var(--surface);
}

[data-theme="dark"] .dropdown-menu {
    background: rgba(20, 23, 34, 0.95);
}

[data-theme="dark"] .menu-item:hover {
    background: rgba(255, 255, 255, 0.06);
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }

    .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        z-index: 999;
        backdrop-filter: blur(4px);
    }

    .dashboard-layout.sidebar-collapsed .sidebar-backdrop {
        display: none;
    }

    .hamburger-menu {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .user-info-text {
        display: none;
    }
}

@media (max-width: 768px) {
    .header-content {
        padding: 0 14px;
        height: 56px;
    }

    .content {
        padding: var(--space-md);
    }

    .topbar-divider {
        display: none;
    }

    .dashboard-layout.has-bottom-nav .content {
        padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--space-sm));
    }

    .dashboard-layout.has-bottom-nav.header-hidden .content {
        flex: 0 0 auto;
        height: calc(100dvh - var(--bottom-nav-height) - var(--safe-bottom));
        padding-bottom: 0;
    }

    .right-section {
        gap: 8px;
    }

    .trial-badge {
        display: none;
    }
}
</style>

