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
defineProps<{
    isCollapsed: boolean
}>()

defineEmits<{
    (e: 'toggle'): void
}>()
</script>

<template>
    <button class="toggle-btn" @click="$emit('toggle')" :title="isCollapsed ? '展开导航栏' : '折叠导航栏'" :aria-label="isCollapsed ? '展开导航栏' : '折叠导航栏'">
        <svg class="toggle-icon" :class="{ 'collapsed': isCollapsed }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    </button>
</template>

<style scoped>
.toggle-btn {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-chip);
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-xs);
    transition: all var(--transition-fast);
}

.toggle-btn:hover {
    background: var(--bg-deep);
    color: var(--text);
    border-color: var(--border-color-hover);
    box-shadow: var(--shadow-sm);
    transform: scale(1.04);
}

.toggle-btn:active {
    transform: scale(0.96);
}

.toggle-btn:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus);
}

.toggle-icon {
    transition: transform var(--transition-normal);
}

.toggle-icon.collapsed {
    transform: rotate(180deg);
}

[data-theme="dark"] .toggle-btn {
    background: var(--surface);
    border-color: var(--border-color);
    color: var(--muted);
}

[data-theme="dark"] .toggle-btn:hover {
    background: var(--o08);
    color: var(--text);
}
</style>