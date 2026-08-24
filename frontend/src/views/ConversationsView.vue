<!--
Copyright 2024-2026 ChatterMate
多渠道跨境电商 AI + 人工客服三栏工作台核心视图 (ConversationsView.vue)
-->

<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ConversationsList from '@/components/conversations/ConversationsList.vue'
import ConversationChat from '@/components/conversations/ConversationChat.vue'
import ChatInfoPanel from '@/components/conversations/ChatInfoPanel.vue'
import TrackingTimelineModal from '@/components/conversations/TrackingTimelineModal.vue'
import SessionTransferModal from '@/components/conversations/SessionTransferModal.vue'

// 会话状态
const activeSessionId = ref('conv-1')
const showRightDrawer = ref(true)
const showTrackingModal = ref(false)
const showTransferModal = ref(false)
const currentOrderForTracking = ref<any>(null)

// 全局 Toast 提示
interface ToastItem {
  id: number
  text: string
  type: 'success' | 'info' | 'error'
}
const toasts = ref<ToastItem[]>([])

const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, text: msg, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

const handleSelectSession = (sessionId: string) => {
  activeSessionId.value = sessionId
}

const handleOpenTracking = (order: any) => {
  currentOrderForTracking.value = order
  showTrackingModal.value = true
}

// 模拟会话详情
const currentChatDetail = ref<any>({
  session_id: 'conv-1',
  customer: {
    full_name: 'Jessica Miller',
    email: 'jessica.m@outlook.com',
  },
  agent: {
    name: 'AI Agent',
    ai_replies_enabled: true,
  },
  status: 'active',
  channel: 'whatsapp',
  messages: [],
})
</script>

<template>
  <DashboardLayout :hide-header="true">
    <div class="h-full w-full bg-[#080B11] text-slate-100 antialiased overflow-hidden flex select-none font-sans relative">
      <!-- 1. 会话导航栏：3+2 零横向滚动状态矩阵 (320px) -->
      <ConversationsList
        :active-session-id="activeSessionId"
        @select-session="handleSelectSession"
        @refresh="addToast('正在同步全渠道最新会话与订单数据...', 'info')"
        @action-toast="addToast"
      />

      <!-- 2. 中栏：聊天流与多模式回复区 (Flex-1 大气主屏) -->
      <ConversationChat
        :chat="currentChatDetail"
        @toggle-right-drawer="showRightDrawer = !showRightDrawer"
        @open-transfer="showTransferModal = true"
        @refresh="addToast('会话流已更新', 'info')"
        @action-toast="addToast"
      />

      <!-- 3. 右栏：客户 360° 画像与 Shopify 订单上下文 (340px 豪华面板) -->
      <ChatInfoPanel
        v-if="showRightDrawer"
        :chat-info="currentChatDetail"
        @open-tracking="handleOpenTracking"
        @open-transfer="showTransferModal = true"
        @action-toast="addToast"
      />

      <!-- 物流全球实时轨迹弹窗 -->
      <TrackingTimelineModal
        :show="showTrackingModal"
        :tracking-number="currentOrderForTracking?.tracking || 'DHL-883921094US'"
        :carrier="currentOrderForTracking?.carrier || 'DHL Express'"
        @close="showTrackingModal = false"
        @send-to-chat="(msg) => addToast('物流轨迹动态已推入聊天流', 'success')"
      />

      <!-- 会话团队转派弹窗 -->
      <SessionTransferModal
        :show="showTransferModal"
        :customer-name="currentChatDetail.customer?.full_name"
        @close="showTransferModal = false"
        @transfer="(target) => addToast(`会话已成功转派给: ${target}`, 'success')"
      />

      <!-- 全局 Toast 提示容器 -->
      <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'px-3.5 py-2 rounded-xl bg-[#141B2E]/95 backdrop-blur-md border shadow-2xl text-xs text-slate-100 flex items-center gap-2.5 transition-all duration-300 pointer-events-auto transform animate-in fade-in slide-in-from-top-2',
            t.type === 'success'
              ? 'border-emerald-500/40 text-emerald-300'
              : t.type === 'error'
              ? 'border-rose-500/40 text-rose-300'
              : 'border-blue-500/40 text-blue-300',
          ]"
        >
          <span class="font-medium text-slate-100">{{ t.text }}</span>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
:deep(.content) {
  padding: 0 !important;
  height: 100vh !important;
  height: 100dvh !important;
  overflow: hidden !important;
}
</style>
