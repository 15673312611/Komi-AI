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
const props = defineProps<{
  sessionId: string
  aiEnabled: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', newValue: boolean): void
}>()

const handleToggle = () => {
  if (props.loading) return
  emit('toggle', !props.aiEnabled)
}
</script>

<template>
  <button
    class="ai-toggle-pill"
    :class="{ 'ai-toggle-pill--active': aiEnabled, 'ai-toggle-pill--busy': loading }"
    :disabled="loading"
    :title="aiEnabled ? '点击暂停 AI 自动回复（将等待人工客服应答）' : '点击开启 AI 智能体自动回复'"
    @click="handleToggle"
    aria-label="切换 AI 自动回复"
  >
    <!-- Glowing Status Indicator Dot -->
    <span class="ai-toggle-indicator" :class="{ 'is-active': aiEnabled }"></span>

    <!-- Robot Icon -->
    <span class="ai-toggle-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="8" width="18" height="13" rx="3" />
        <path d="M9 8V5a3 3 0 0 1 6 0v3" />
        <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
        <path d="M8 18h8" />
      </svg>
    </span>

    <!-- Label -->
    <span class="ai-toggle-label">AI 自动回复</span>

    <!-- Switch Track -->
    <span class="ai-toggle-switch" aria-hidden="true">
      <span v-if="loading" class="ai-toggle-spinner" />
      <span v-else class="ai-toggle-thumb" />
    </span>
  </button>
</template>

<style scoped>
.ai-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: var(--radius-pill, 999px);
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--muted);
  font-size: 11.5px;
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;
  user-select: none;
  backdrop-filter: blur(8px);
}

.ai-toggle-pill:hover:not(:disabled) {
  background: var(--o08);
  border-color: var(--o16);
  color: var(--text);
  transform: translateY(-0.5px);
}

.ai-toggle-pill:active:not(:disabled) {
  transform: translateY(0);
}

.ai-toggle-pill:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Enabled State */
.ai-toggle-pill--active {
  background: rgba(95, 227, 214, 0.08);
  border-color: rgba(95, 227, 214, 0.3);
  color: #72ece2;
  box-shadow: 0 0 14px rgba(95, 227, 214, 0.08);
}

.ai-toggle-pill--active:hover:not(:disabled) {
  background: rgba(95, 227, 214, 0.13);
  border-color: rgba(95, 227, 214, 0.45);
  color: #8ffede;
}

/* Pulse Dot */
.ai-toggle-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--muted2);
  transition: all 0.25s ease;
}

.ai-toggle-indicator.is-active {
  background: #5FE3D6;
  box-shadow: 0 0 8px #5FE3D6;
}

/* Robot Icon */
.ai-toggle-icon {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

/* Label text */
.ai-toggle-label {
  letter-spacing: -0.01em;
}

/* Switch */
.ai-toggle-switch {
  position: relative;
  width: 26px;
  height: 14px;
  border-radius: 7px;
  background: var(--o12);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
}

.ai-toggle-pill--active .ai-toggle-switch {
  background: #5FE3D6;
}

.ai-toggle-thumb {
  position: absolute;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-toggle-pill--active .ai-toggle-thumb {
  transform: translateX(12px);
  background: #0B0C10;
}

/* Loading spinner */
.ai-toggle-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
