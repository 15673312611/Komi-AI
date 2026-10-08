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

<script setup lang="ts" name="EnablePushPrompt">
import { ref, onMounted } from 'vue'
import { isShopifyEmbedded } from '@/pwa/register'
import { usePWAInstall } from '@/composables/usePWAInstall'
import { navIconSvg } from '@/components/layout/navIcons'

const emit = defineEmits<{
  // Parent (DashboardLayout) owns the notifications composable instance and
  // performs the actual permission request from this user gesture.
  (e: 'enable'): void
}>()

const SNOOZE_KEY = 'cm-push-prompt-snoozed-at'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

const visible = ref(false)
const needsInstallFirst = ref(false)
const { isIOS, isStandalone } = usePWAInstall()

const isSnoozed = () => {
  const at = Number(localStorage.getItem(SNOOZE_KEY) || 0)
  return at > 0 && Date.now() - at < SNOOZE_MS
}

onMounted(() => {
  if (isShopifyEmbedded() || isSnoozed()) return

  if (isIOS && !isStandalone.value) {
    // Safari tab on iOS: the Push API only exists once installed to Home Screen
    needsInstallFirst.value = true
    visible.value = true
    return
  }

  if ('Notification' in window && Notification.permission === 'default') {
    visible.value = true
  }
})

const snooze = () => {
  localStorage.setItem(SNOOZE_KEY, String(Date.now()))
  visible.value = false
}

const enable = () => {
  emit('enable')
  // The browser permission dialog takes over from here
  visible.value = false
}
</script>

<template>
  <Transition name="push-prompt">
    <div v-if="visible" class="push-prompt" role="dialog" aria-label="开启消息通知">
      <div class="bell-tile" aria-hidden="true" v-html="navIconSvg('bell', 28)"></div>

      <template v-if="needsInstallFirst">
        <div class="prompt-title">安装应用以接收实时通知</div>
        <div class="prompt-body">
          请先将 Komi AI 添加到主屏幕 — 在 iPhone 上，推送通知需要在添加到主屏幕的应用中启用。点击分享图标，然后选择“添加到主屏幕”。
        </div>
        <button type="button" class="secondary-btn" @click="snooze">知道了</button>
      </template>

      <template v-else>
        <div class="prompt-title">当客户需要人工介入时即时提醒</div>
        <div class="prompt-body">
          当 AI 智能体将客户会话转接给您时，系统将第一时间推送桌面提醒，让客户无需久等。
        </div>
        <button type="button" class="primary-btn" @click="enable">
          开启桌面通知
        </button>
        <button type="button" class="secondary-btn" @click="snooze">暂不开启</button>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.push-prompt {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: var(--z-prompt);
  width: 340px;
  max-width: calc(100vw - 40px);
  background: var(--bg2);
  border: 1px solid var(--o10);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.bell-tile {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: var(--teal-bg);
  border: 1px solid var(--teal-border);
  color: var(--c-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.prompt-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--tracking-display);
  line-height: 1.2;
  color: var(--text);
}

.prompt-body {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.5;
  margin-top: 10px;
}

.primary-btn {
  width: 100%;
  height: 48px;
  margin-top: var(--space-lg);
  border: none;
  border-radius: var(--radius-btn);
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.primary-btn:hover:not(:disabled) {
  filter: brightness(1.05);
}

.secondary-btn {
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  padding: 8px;
}

.secondary-btn:hover {
  color: var(--text);
}

/* Mobile: bottom sheet over the nav, safe-area aware */
@media (max-width: 768px) {
  .push-prompt {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 24px 24px 0 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    padding-bottom: calc(var(--space-lg) + var(--safe-bottom));
  }
}

.push-prompt-enter-active,
.push-prompt-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.push-prompt-enter-from,
.push-prompt-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
