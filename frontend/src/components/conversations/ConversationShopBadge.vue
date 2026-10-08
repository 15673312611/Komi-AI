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
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    storeName?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg'
    showIcon?: boolean
    variant?: 'default' | 'accent' | 'subtle' | 'glow'
  }>(),
  {
    storeName: '',
    size: 'sm',
    showIcon: true,
    variant: 'default',
  },
)

const displayName = computed(() => {
  if (!props.storeName) return ''
  return props.storeName.trim().replace(/\.myshopify\.com$/i, '')
})

// Palette mapping based on shop name hash for distinct visual identification
const shopTheme = computed(() => {
  if (!displayName.value) return 0
  let hash = 0
  for (let i = 0; i < displayName.value.length; i++) {
    hash = (hash << 5) - hash + displayName.value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 4
})
</script>

<template>
  <span
    v-if="displayName"
    class="shop-badge"
    :class="[
      `shop-badge--${size}`,
      `shop-badge--variant-${variant}`,
      `shop-badge--theme-${shopTheme}`,
    ]"
    :title="`所属电商店铺: ${displayName}`"
  >
    <span v-if="showIcon" class="shop-badge__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
        <path d="M2 7h20"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    </span>
    <span class="shop-badge__label">{{ displayName }}</span>
  </span>
</template>

<style scoped>
.shop-badge {
  display: inline-flex;
  align-items: center;
  gap: 4.5px;
  border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  max-width: 170px;
  position: relative;
  backdrop-filter: blur(8px);
}

.shop-badge__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
}

.shop-badge__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

/* ── Sizes ─────────────────────────────────────────────────────────────────── */

.shop-badge--xs {
  padding: 1.5px 5.5px;
  font-size: 10.5px;
}
.shop-badge--xs .shop-badge__icon svg {
  width: 10px;
  height: 10px;
}

.shop-badge--sm {
  padding: 2.5px 7.5px;
  font-size: 11px;
}
.shop-badge--sm .shop-badge__icon svg {
  width: 11px;
  height: 11px;
}

.shop-badge--md {
  padding: 3.5px 9px;
  font-size: 12px;
  border-radius: var(--radius-md, 8px);
}
.shop-badge--md .shop-badge__icon svg {
  width: 12px;
  height: 12px;
}

.shop-badge--lg {
  padding: 5px 12px;
  font-size: 13px;
  border-radius: var(--radius-md, 8px);
}
.shop-badge--lg .shop-badge__icon svg {
  width: 14px;
  height: 14px;
}

/* ── Elegant Dark-Themed Color Palettes ────────────────────────────────────── */

.shop-badge--theme-0 {
  background: rgba(157, 140, 255, 0.08);
  color: #B4A7FF;
  border: 1px solid rgba(157, 140, 255, 0.22);
}
.shop-badge--theme-0:hover {
  background: rgba(157, 140, 255, 0.14);
  border-color: rgba(157, 140, 255, 0.35);
}

.shop-badge--theme-1 {
  background: rgba(95, 227, 214, 0.08);
  color: #6EE7DC;
  border: 1px solid rgba(95, 227, 214, 0.22);
}
.shop-badge--theme-1:hover {
  background: rgba(95, 227, 214, 0.14);
  border-color: rgba(95, 227, 214, 0.35);
}

.shop-badge--theme-2 {
  background: rgba(201, 242, 78, 0.08);
  color: #D4F56E;
  border: 1px solid rgba(201, 242, 78, 0.24);
}
.shop-badge--theme-2:hover {
  background: rgba(201, 242, 78, 0.14);
  border-color: rgba(201, 242, 78, 0.38);
}

.shop-badge--theme-3 {
  background: rgba(255, 138, 115, 0.08);
  color: #FFA18F;
  border: 1px solid rgba(255, 138, 115, 0.22);
}
.shop-badge--theme-3:hover {
  background: rgba(255, 138, 115, 0.14);
  border-color: rgba(255, 138, 115, 0.35);
}

/* ── Specific Variants ─────────────────────────────────────────────────────── */

.shop-badge--variant-subtle {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text3);
}

.shop-badge--variant-accent {
  background: rgba(201, 242, 78, 0.12);
  border-color: rgba(201, 242, 78, 0.3);
  color: var(--accent-ink);
  font-weight: 600;
}

.shop-badge--variant-glow {
  box-shadow: 0 0 12px rgba(201, 242, 78, 0.15);
}
</style>
