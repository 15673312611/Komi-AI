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
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { Agent } from '@/types/agent'
import { widgetService } from '@/services/widget'
import { knowledgeService } from '@/services/knowledge'
import { useOnboardingTestChat } from '@/composables/useOnboardingTestChat'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitize'
import { resolveOrbStyle } from '@/utils/orb'
import { resolveUploadUrl } from '@/config/api'

const props = defineProps<{
  agent: Agent
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  messages,
  loading,
  connecting,
  connectionError,
  start,
  send,
  cleanup,
} = useOnboardingTestChat()

const input = ref('')
const setupError = ref('')
const scrollEl = ref<HTMLElement | null>(null)
const widgetId = ref<string | null>(null)

// Knowledge indexing status check
const knowledgeProcessing = ref(false)
let knowledgePoll: ReturnType<typeof setInterval> | null = null

const checkKnowledgeStatus = async () => {
  try {
    const data = await knowledgeService.getAgentQueueItems(props.agent.id)
    const items = (data?.queue_items ?? []) as Array<{ status: string }>
    const pending = items.filter(i => i.status === 'pending' || i.status === 'processing').length
    knowledgeProcessing.value = pending > 0
  } catch (err) {
    console.error('Failed to check knowledge status:', err)
  }
}

const ensureWidgetAndStart = async () => {
  setupError.value = ''
  try {
    let wid: string | null = null
    try {
      const widgets = await widgetService.getWidgetsByAgent(props.agent.id)
      if (widgets && widgets.length > 0) {
        wid = widgets[0].id
      }
    } catch (lookupErr) {
      console.warn('Could not lookup existing widget by agent, creating one:', lookupErr)
    }

    if (!wid) {
      const created = await widgetService.createWidget({
        name: `${props.agent.name} Test Widget`,
        agent_id: props.agent.id,
      })
      wid = created.id
    }

    widgetId.value = wid
    if (widgetId.value) {
      await start(widgetId.value)
    }
  } catch (err: any) {
    console.error('Failed to ensure widget and start:', err)
    setupError.value = err?.response?.data?.detail || err?.message || '初始化测试挂件失败，请检查网络或后端服务。'
  }
}

const handleRetry = async () => {
  cleanup()
  await ensureWidgetAndStart()
}

const handleClear = async () => {
  cleanup()
  messages.value = []
  if (widgetId.value) {
    await start(widgetId.value)
  }
}

const quickQuestions = [
  '请问你们有什么优惠或促销活动？',
  '支持退换货吗？流程是怎样的？',
  '我想咨询一下发货和物流时效。',
  '如何转接人工客服？'
]

const sendQuickQuestion = (q: string) => {
  if (loading.value || connecting.value) return
  input.value = q
  handleSend()
}

const handleSend = () => {
  const text = input.value.trim()
  if (!text || loading.value) return
  send(text)
  input.value = ''
}

const formatMessage = (content: string) => sanitizeHtml(marked(content) as string)

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

watch(() => messages.value.length, scrollToBottom)
watch(loading, scrollToBottom)

onMounted(async () => {
  await ensureWidgetAndStart()
  await checkKnowledgeStatus()
  if (knowledgeProcessing.value) {
    knowledgePoll = setInterval(checkKnowledgeStatus, 5000)
  }
})

onBeforeUnmount(() => {
  cleanup()
  if (knowledgePoll) clearInterval(knowledgePoll)
})

const getOrbStyle = (agent: Agent): Record<string, string> => {
  if (agent.customization?.photo_url) return {}
  return resolveOrbStyle(agent.name, agent.customization?.customization_metadata?.orb_variant)
}
</script>

<template>
  <div class="test-modal-backdrop" @click.self="emit('close')">
    <div class="test-modal-window">
      <!-- Modal Header -->
      <header class="test-modal-header">
        <div class="agent-info-head">
          <div class="agent-avatar-orb" :style="getOrbStyle(agent)">
            <img
              v-if="agent.customization?.photo_url"
              :src="resolveUploadUrl(agent.customization.photo_url)"
              :alt="agent.name"
            />
          </div>
          <div class="agent-text-head">
            <div class="agent-title-row">
              <h3 class="agent-modal-title">{{ agent.display_name || agent.name }}</h3>
              <span class="status-indicator online">
                <span class="status-dot"></span>
                {{ connecting ? '连接中' : (connectionError || setupError ? '连接异常' : '实时在线') }}
              </span>
            </div>
            <p class="agent-modal-sub">实时对话体验 Playground · 检验大模型话术与知识库问答</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-clear" @click="handleClear" title="清空对话重新开始">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <span>清空</span>
          </button>
          <button class="btn-close" @click="emit('close')" aria-label="关闭">×</button>
        </div>
      </header>

      <!-- Knowledge status notification -->
      <div v-if="knowledgeProcessing" class="kb-banner">
        <span class="kb-spinner"></span>
        <span>专属知识库正在后台同步构建索引中，当前支持基础大模型应答。</span>
      </div>

      <!-- Chat messages container -->
      <div class="test-modal-body">
        <div v-if="connecting" class="chat-state connecting">
          <span class="state-spinner"></span>
          <span>正在建立与智能体的 WebSocket 实时连接…</span>
        </div>

        <div v-else-if="setupError || connectionError" class="chat-state error">
          <div class="error-text">{{ setupError || connectionError }}</div>
          <button type="button" class="retry-link-btn" @click="handleRetry">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            重新连接
          </button>
        </div>

        <div ref="scrollEl" class="chat-scroll-area">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="msg-row"
            :class="msg.message_type === 'user' ? 'from-user' : 'from-bot'"
          >
            <div class="msg-bubble" v-html="formatMessage(msg.message || '')"></div>
          </div>

          <div v-if="loading" class="msg-row from-bot">
            <div class="msg-bubble typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick prompts -->
      <div class="quick-prompts-bar">
        <span class="quick-label">快捷测试：</span>
        <div class="quick-chips">
          <button
            v-for="q in quickQuestions"
            :key="q"
            class="quick-chip"
            :disabled="loading || connecting"
            @click="sendQuickQuestion(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- Input compose box -->
      <footer class="test-modal-footer">
        <div class="compose-input-wrap">
          <input
            v-model="input"
            class="compose-input"
            type="text"
            placeholder="输入任意客户问题，测试智能体回复..."
            :disabled="connecting || !!setupError"
            @keydown.enter.prevent="handleSend"
          />
          <button
            type="button"
            class="compose-send-btn"
            :disabled="connecting || loading || !input.trim() || !!setupError"
            @click="handleSend"
            aria-label="发送"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.test-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.test-modal-window {
  width: 100%;
  max-width: 680px;
  height: 640px;
  max-height: 90vh;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { transform: scale(0.96) translateY(8px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.test-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  background: var(--bg-card, #ffffff);
}

.agent-info-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar-orb {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.agent-avatar-orb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.agent-text-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0fdf4;
  color: #16a34a;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.agent-modal-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-muted, #64748b);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-clear:hover {
  background: var(--bg-hover, #f8fafc);
  color: var(--text-primary, #0f172a);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.15s;
}

.btn-close:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.kb-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
  padding: 8px 16px;
  font-size: 12.5px;
  color: #1d4ed8;
}

.kb-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.test-modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg-base, #f8fafc);
}

.chat-state {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.chat-state.connecting {
  color: #475569;
}

.state-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #cbd5e1;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.chat-state.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.retry-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #dc2626;
  color: white;
  border: none;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  cursor: pointer;
}

.chat-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-row {
  display: flex;
  width: 100%;
}

.msg-row.from-user {
  justify-content: flex-end;
}

.msg-row.from-bot {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
}

.msg-row.from-user .msg-bubble {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  border-bottom-right-radius: 3px;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
}

.msg-row.from-bot .msg-bubble {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.msg-bubble :deep(p) {
  margin: 0 0 6px 0;
}

.msg-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.msg-bubble :deep(ul), .msg-bubble :deep(ol) {
  margin: 4px 0 6px 18px;
  padding: 0;
}

.msg-bubble :deep(li) {
  margin-bottom: 3px;
}

.msg-bubble :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
}

.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

.quick-prompts-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  overflow-x: auto;
}

.quick-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.quick-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.quick-chip {
  white-space: nowrap;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-chip:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #c7d2fe;
  color: #4338ca;
}

.test-modal-footer {
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.compose-input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 4px 6px 4px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.compose-input-wrap:focus-within {
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.compose-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
}

.compose-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.compose-send-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.compose-send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
