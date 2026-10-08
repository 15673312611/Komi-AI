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

<script setup lang="ts" name="BottomNav">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavItems, navIconSvg, formatBadgeCount } from './navItems'

const props = defineProps<{
    unreadCount?: number
    moreOpen?: boolean
}>()

const emit = defineEmits<{
    (e: 'more'): void
}>()

const route = useRoute()
const { primaryNavItems, moreNavItems } = useNavItems()

const isActive = (path?: string) => !!path && route.path.startsWith(path)

// More is "active" while its sheet is open or when the current page lives in it
const moreActive = computed(() =>
    props.moreOpen || moreNavItems.value.some(item => isActive(item.to))
)

const badgeText = computed(() => formatBadgeCount(props.unreadCount))
</script>

<template>
    <nav class="bottom-nav" aria-label="Primary">
        <router-link
            v-for="item in primaryNavItems"
            :key="item.to"
            :to="item.to!"
            class="bottom-nav-item"
            :class="{ active: isActive(item.to) }"
        >
            <span class="bottom-nav-icon" v-html="navIconSvg(item.icon, 24)"></span>
            <span class="bottom-nav-label">{{ item.label }}</span>
        </router-link>

        <button
            type="button"
            class="bottom-nav-item"
            :class="{ active: moreActive }"
            aria-label="更多"
            @click="emit('more')"
        >
            <span class="bottom-nav-icon" v-html="navIconSvg('more', 24)"></span>
            <span class="bottom-nav-label">更多</span>
            <span v-if="unreadCount" class="bottom-nav-badge">{{ badgeText }}</span>
        </button>
    </nav>
</template>

<style scoped>
.bottom-nav {
    display: none;
}

@media (max-width: 768px) {
    .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-bottom-nav);
        display: flex;
        justify-content: space-around;
        align-items: center;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-top: 1px solid var(--border-color);
        padding: 6px 12px calc(6px + var(--safe-bottom));
        box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.04);
    }
}

.bottom-nav-item {
    position: relative;
    flex: 1;
    min-height: 46px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 0;
    background: none;
    border: none;
    color: var(--muted);
    text-decoration: none;
    font-family: var(--font-sans);
    cursor: pointer;
    border-radius: var(--radius-btn);
    transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item.active {
    color: var(--accent-solid);
}

.bottom-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast);
}

.bottom-nav-item.active .bottom-nav-icon {
    transform: scale(1.08);
}

.bottom-nav-icon :deep(svg) {
    width: 22px;
    height: 22px;
    display: block;
    stroke-width: 1.75;
}

.bottom-nav-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
}

.bottom-nav-item.active .bottom-nav-label {
    font-weight: 600;
}

.bottom-nav-badge {
    position: absolute;
    top: 2px;
    left: calc(50% + 8px);
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--c-danger);
    color: #FFFFFF;
    border: 2px solid #FFFFFF;
    border-radius: var(--radius-pill);
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

[data-theme="dark"] .bottom-nav {
    background: rgba(15, 17, 24, 0.92);
    border-top-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .bottom-nav-badge {
    border-color: var(--bg2);
}
</style>

