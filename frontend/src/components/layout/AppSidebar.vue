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

<script setup lang="ts" name="AppSidebar">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavItems, navIconSvg } from './navItems'

import SidebarToggle from './SidebarToggle.vue'

defineProps<{
    isCollapsed: boolean
}>()

const emit = defineEmits<{
    (e: 'toggle'): void
    (e: 'navigate'): void
}>()

const route = useRoute()

const { navItems } = useNavItems()

const isActiveRoute = computed(() => (path?: string) => path ? route.path === path : false)

const handleNavigation = () => {
    emit('navigate')
}
</script>

<template>
    <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
        <!-- Logo & Brand Header -->
        <div class="sidebar-header">
            <router-link to="/" class="logo-container" title="Komi AI">
                <div class="logo-mark" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#prism-g1)" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="url(#prism-g2)" stroke-width="2" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <defs>
                            <linearGradient id="prism-g1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#38BDF8"/>
                                <stop offset="1" stop-color="#818CF8"/>
                            </linearGradient>
                            <linearGradient id="prism-g2" x1="2" y1="12" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#C084FC"/>
                                <stop offset="1" stop-color="#38BDF8"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div v-if="!isCollapsed" class="brand-title-wrap">
                    <span class="logo-text">Komi AI</span>
                </div>
            </router-link>
            <SidebarToggle :isCollapsed="isCollapsed" @toggle="emit('toggle')" />
        </div>

        <!-- Navigation Scroll Area -->
        <nav class="sidebar-nav">
            <div v-for="(item, index) in navItems" :key="index" class="nav-entry">
                <!-- Section Header -->
                <div v-if="item.section" class="nav-section" :class="{ 'collapsed': isCollapsed }">
                    <span v-if="!isCollapsed" class="section-label">{{ item.section }}</span>
                    <span v-else class="section-divider" aria-hidden="true"></span>
                </div>

                <!-- Nav Item Link -->
                <router-link v-else-if="item.to" :to="item.to" class="nav-item"
                    :class="{ 'active': isActiveRoute(item.to) }"
                    :title="isCollapsed ? item.label : undefined"
                    @click="handleNavigation">
                    <span class="nav-icon" v-html="navIconSvg(item.icon, 17)"></span>
                    <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
                    <span v-if="!isCollapsed && isActiveRoute(item.to)" class="active-dot"></span>
                </router-link>
            </div>
        </nav>

        <!-- Bottom Model Engine Shortcut -->
        <div v-if="!isCollapsed" class="sidebar-bottom">
            <router-link to="/settings/ai-config" class="engine-card" title="模型设置">
                <div class="engine-meta">
                    <div class="engine-title-row">
                        <span class="engine-indicator"></span>
                        <span class="engine-name">模型与 API 配置</span>
                    </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="engine-arrow">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </router-link>
        </div>
    </aside>
</template>

<style scoped>
/* ─── Sidebar Layout & Surface ──────────────────────────────────── */
.sidebar {
    width: 250px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;
    height: 100vh;
    height: 100dvh;
    z-index: 100;
    user-select: none;
    box-shadow: 1px 0 0 0 rgba(15, 23, 42, 0.02);
}

.sidebar.collapsed {
    width: 68px;
}

.sidebar-header {
    height: 60px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
}

/* Collapsed header */
.sidebar.collapsed .sidebar-header {
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    height: auto;
    padding: 14px 0;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    text-decoration: none;
    cursor: pointer;
}

/* High-end Hologram Prism Logo Mark */
.logo-mark {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #090A0F 0%, #1E1B4B 50%, #0F172A 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.logo-container:hover .logo-mark {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.brand-title-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    min-width: 0;
}

.logo-text {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: -0.025em;
    font-size: 16px;
    color: var(--text);
    white-space: nowrap;
}

.sidebar-nav {
    flex: 1;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.sidebar-nav::-webkit-scrollbar {
    display: none;
}

.sidebar.collapsed .sidebar-nav {
    padding: 12px 6px;
}

.nav-entry {
    display: flex;
    flex-direction: column;
}

/* Section Header */
.nav-section {
    padding: 14px 10px 4px;
}

.section-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--muted2);
    text-transform: uppercase;
    font-family: var(--font-sans);
}

.section-divider {
    display: block;
    height: 1px;
    background: rgba(15, 23, 42, 0.06);
    margin: 8px 6px;
}

.nav-section.collapsed {
    padding: 6px 0;
}

/* Nav Item Link — Linear/Raycast Minimalist Style */
.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 11px;
    color: var(--text3);
    font-family: var(--font-sans);
    font-size: 13.5px;
    font-weight: 500;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Collapsed touch target */
.sidebar.collapsed .nav-item {
    padding: 9px 0;
    width: 40px;
    height: 40px;
    margin: 0 auto 3px;
    gap: 0;
    justify-content: center;
}

.nav-item:hover:not(.active) {
    background: rgba(15, 23, 42, 0.04);
    color: var(--text);
    transform: translateX(1.5px);
}

.sidebar.collapsed .nav-item:hover:not(.active) {
    transform: scale(1.05);
}

.nav-item:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus);
}

/* Active State — Obsidian Minimalist Pill */
.nav-item.active {
    background: #0F172A;
    color: #FFFFFF;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.active-dot {
    margin-left: auto;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #38BDF8;
    box-shadow: 0 0 6px #38BDF8;
}

.nav-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: inherit;
    transition: transform var(--transition-fast);
}

.nav-icon :deep(svg) {
    width: 16px;
    height: 16px;
    display: block;
    stroke-width: 1.8;
}

.nav-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
}

/* Bottom AI Engine Card */
.sidebar-bottom {
    padding: 10px 12px;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
    background: rgba(255, 255, 255, 0.6);
}

.engine-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 11px;
    background: #FFFFFF;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 9px;
    text-decoration: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    transition: all 0.15s ease;
}

.engine-card:hover {
    border-color: rgba(15, 23, 42, 0.18);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    transform: translateY(-0.5px);
}

.engine-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.engine-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.engine-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.6);
}

.engine-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
}

.engine-arrow {
    color: var(--muted2);
    transition: transform var(--transition-fast);
}

.engine-card:hover .engine-arrow {
    transform: translateX(2px);
    color: var(--text);
}

/* Dark mode overrides */
[data-theme="dark"] .sidebar {
    background: var(--bg2);
    box-shadow: 1px 0 0 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .sidebar-bottom {
    background: var(--bg);
}

[data-theme="dark"] .engine-card {
    background: var(--surface);
}

[data-theme="dark"] .nav-item.active {
    background: #FFFFFF;
    color: #090A0F;
}

[data-theme="dark"] .active-dot {
    background: #6366F1;
    box-shadow: 0 0 6px #6366F1;
}

/* Responsive Overrides */
@media (max-width: 1024px) {
    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1000;
        box-shadow: 8px 0 32px rgba(15, 23, 42, 0.12);
        transform: translateX(0);
    }

    .sidebar.collapsed {
        transform: translateX(-100%);
        width: 256px;
        box-shadow: none;
    }

    .sidebar.collapsed .sidebar-header {
        flex-direction: row;
        justify-content: space-between;
        padding: 0 16px;
        height: 64px;
    }

    .sidebar.collapsed .nav-item {
        padding: 9px 12px;
        width: auto;
        height: auto;
        margin-bottom: 2px;
        gap: 11px;
        justify-content: flex-start;
    }
}

@media (max-width: 768px) {
    .sidebar {
        width: 280px;
        max-width: 85vw;
    }

    .sidebar.collapsed {
        width: 280px;
        max-width: 85vw;
    }
}
</style>
