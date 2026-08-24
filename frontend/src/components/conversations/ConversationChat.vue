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
import { onMounted, watch, nextTick, ref, computed, onBeforeUnmount } from 'vue'
import type { ChatDetail } from '@/types/chat'
import { useConversationChat } from '@/composables/useConversationChat'
import { useConversationFiles } from '@/composables/useConversationFiles'
import { useVisualViewport } from '@/composables/useVisualViewport'
import { useJiraTicket } from '@/composables/useJiraTicket'
import JiraTicketModal from '@/components/jira/JiraTicketModal.vue'
import TicketCreateModal from '@/components/tickets/TicketCreateModal.vue'
import CannedResponsesModal from '@/components/conversations/CannedResponsesModal.vue'
import AICopilotAssistModal from '@/components/conversations/AICopilotAssistModal.vue'
import { ticketService } from '@/services/tickets'
import { chatService } from '@/services/chat'
import { permissionChecks } from '@/utils/permissions'
import FileUpload from '@/components/common/FileUpload.vue'
import { userService } from '@/services/user'
import ChannelBadge from '@/components/common/ChannelBadge.vue'
import WhatsAppTemplatePicker from '@/components/conversations/WhatsAppTemplatePicker.vue'
import ConversationAIToggle from '@/components/conversations/ConversationAIToggle.vue'
import ConversationShopBadge from '@/components/conversations/ConversationShopBadge.vue'
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox.vue'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitize'
import type { Renderer } from 'marked'

const props = defineProps<{
  chat: ChatDetail
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'chatUpdated', data: ChatDetail): void
  (e: 'clearUnread', sessionId: string): void
  (e: 'view-product', productId: string): void
  (e: 'back'): void
  (e: 'info'): void
}>()

// Create a local ref to track the current chat state
const currentChat = ref(props.chat)

const {
  newMessage,
  messagesContainer,
  formattedMessages,
  isLoading,
  showTakeoverButton,
  showTakenOverStatus,
  isChatClosed,
  canSendMessage,
  scrollToBottom,
  sendMessage,
  handleTakeover,
  handleRouteToHuman,
  handleHandBackToAI,
  sendPrivateNote,
  isWaitingForHuman,
  handlerCaption,
  updateChat,
  replaceChatFromProps,
  handledByAI,
  endChat,
  templateCanReopen,
  clearTemplateSuggestion
} = useConversationChat(props.chat, emit)

// Modals & Chatwoot-style interactive tools
const showCannedModal = ref(false)
const showCopilotModal = ref(false)
const composerMode = ref<'reply' | 'private_note'>('reply')

// Templates are a WhatsApp-only way back into a conversation whose 24h window closed
const showTemplatePicker = ref(false)
const canUseTemplates = computed(
  () => currentChat.value.channel === 'whatsapp' && !!currentChat.value.channel_account_id
)

const handleTemplateSent = () => {
  showTemplatePicker.value = false
  clearTemplateSuggestion()
  emit('refresh')
}

// AI auto-reply toggle state
const aiAutoReply = ref(props.chat.agent?.ai_replies_enabled !== false)
const aiToggleLoading = ref(false)

const handleAIToggle = async (newValue: boolean) => {
  aiToggleLoading.value = true
  try {
    await chatService.toggleAIAutoReply(currentChat.value.session_id, newValue)
    aiAutoReply.value = newValue
  } catch (e) {
    console.error('Failed to toggle AI auto-reply:', e)
  } finally {
    aiToggleLoading.value = false
  }
}

// Add file handling functionality
const {
  fileUploadRef,
  uploadedFiles,
  handleFilesUploaded,
  handleFileUploadError,
  handleChatPaste,
  handleSendMessageWithAttachments,
  formatFileSize,
  isImageAttachment,
  getDownloadUrl,
  getImageUrl
} = useConversationFiles(currentChat, newMessage, canSendMessage, scrollToBottom)

// Add Jira ticket functionality
const {
  jiraConnected,
  checkJiraStatus
} = useJiraTicket()

const showJiraTicketModal = ref(false)
const ticketSummary = ref('')
const showTicketModal = ref(false)
const canUseNativeTickets = permissionChecks.canManageTickets()
const linkedTicketId = ref<string | null>(null)
const showTicketMenu = ref(false)

async function refreshLinkedTicket() {
  if (!canUseNativeTickets || !currentChat.value?.session_id) return
  const ticket = await ticketService.getTicketBySession(currentChat.value.session_id)
  linkedTicketId.value = ticket?.id || null
}

// Add marked configuration
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  breaks: true
})

const renderer = new marked.Renderer() as Renderer
renderer.link = function({ href, title, text }) {
  if (!href) return text || ''
  const link = `<a href="${href}"${title ? ` title="${title}"` : ''}>${text}</a>`
  return link.replace(/^<a /, '<a target="_blank" rel="nofollow" ')
}
marked.use({ renderer })

const renderMarkdown = (text: string) => {
  return sanitizeHtml(marked.parse(text, { async: false }) as string)
}

const canCreateTicket = computed(() => {
  return canSendMessage.value && 
         !isChatClosed.value && 
         currentChat.value.user_id === userService.getUserId()
})

const handleCreateTicket = async () => {
  const lastMessages = formattedMessages.value.slice(-3)
  const summary = lastMessages.map(m => m.message).join(' ').substring(0, 100) + '...'
  ticketSummary.value = summary
  showJiraTicketModal.value = true
}

const handleTicketCreated = (ticketKey: string) => {
  newMessage.value = `Jira ticket created: ${ticketKey}`
  showJiraTicketModal.value = false
}

const replyBoxRef = ref<InstanceType<typeof ConversationReplyBox> | null>(null)

// Store name inference
const storeName = computed(() => {
  const meta = currentChat.value?.customer?.meta_data
  if (meta && typeof meta === 'object' && 'store_name' in meta) {
    return String(meta.store_name)
  }
  const idx = (currentChat.value?.session_id || '').charCodeAt(0) % 3
  return ['爆款女装旗舰店', '极客数码潮品店', '美妆护肤海外店'][idx]
})

// Canned & Copilot insertion
const handleInsertCannedText = (text: string) => {
  newMessage.value = text
  replyBoxRef.value?.insertText(text)
}

const handleInsertCopilotText = (text: string) => {
  newMessage.value = text
  replyBoxRef.value?.insertText(text)
}

const handleSendMessageText = (text: string) => {
  newMessage.value = text
  handleSendMessageWithAttachments()
}

useVisualViewport(() => scrollToBottom())

watch(() => props.chat, (newChat) => {
  if (newChat) {
    currentChat.value = newChat
    replaceChatFromProps(newChat)
  }
}, { immediate: true })

onMounted(async () => {
  scrollToBottom()
  await checkJiraStatus()
  await refreshLinkedTicket()
})

watch(() => currentChat.value?.session_id, () => refreshLinkedTicket())
</script>

<template>
  <div class="chat-layout">
    <!-- Top Action & Info Bar -->
    <header class="chat-header">
      <button class="back-btn" aria-label="Back to conversations" @click="emit('back')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>

      <div class="user-info">
        <div class="user-info-top">
          <h2>{{ chat.customer.full_name || chat.customer.email }}</h2>
          <ConversationShopBadge :storeName="storeName" size="xs" />
          <ChannelBadge :channel="chat.channel" />
        </div>

        <!-- Chat Handler Status Indicators -->
        <div class="chat-status-container">
          <div v-if="handledByAI" class="status-chip chip-ai" title="AI 正在自动应答客户问题">
            <span class="chip-dot"></span>
            <span>AI 自动应答中</span>
          </div>
          <div v-else-if="isWaitingForHuman" class="status-chip chip-waiting" title="客户排队等待人工客服介入">
            <span class="chip-dot"></span>
            <span>等待人工接管</span>
          </div>
          <div v-else-if="!isChatClosed" class="status-chip chip-human" title="当前由人工客服负责沟通">
            <span class="chip-dot"></span>
            <span>人工接管: {{ chat.user_name || '客服' }}</span>
          </div>
          <div v-else class="status-chip chip-closed">
            <span class="chip-dot"></span>
            <span>会话已解决/已关闭</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Controls (Chatwoot-Style) -->
      <div class="header-actions">
        <!-- One-Click Takeover / Handback Buttons -->
        <button 
          v-if="showTakeoverButton" 
          class="action-pill-btn btn-takeover" 
          :disabled="isLoading" 
          @click="handleTakeover"
          title="立即接管此会话，AI 将暂停回复"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h11m0 0l-4-4m4 4l-4 4"/><path d="M5 5v14"/></svg>
          <span>人工接管</span>
        </button>

        <button 
          v-if="!handledByAI && !isChatClosed && canSendMessage" 
          class="action-pill-btn btn-handback" 
          :disabled="isLoading" 
          @click="handleHandBackToAI"
          title="将对话交还给 AI 智能体继续自动处理"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 1 8 8v12H4V10a8 8 0 0 1 8-8z"/><path d="M9 13h6"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>
          <span>转回 AI</span>
        </button>

        <!-- Route to team -->
        <button
          v-if="handledByAI && !isChatClosed"
          class="action-pill-btn btn-team"
          :disabled="isLoading"
          @click="handleRouteToHuman"
          title="停止 AI 并放入团队待处理队列"
        >
          <font-awesome-icon icon="fa-solid fa-user-group" />
          <span>转交团队</span>
        </button>

        <!-- Resolve / End Chat -->
        <button 
          v-if="!isChatClosed" 
          class="action-pill-btn btn-resolve" 
          :disabled="isLoading" 
          @click="endChat(true)"
          title="标记此对话已解决并结束会话"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>解决会话</span>
        </button>

        <!-- AI Auto-Reply Toggle -->
        <ConversationAIToggle
          v-if="!isChatClosed"
          :session-id="currentChat.session_id"
          :ai-enabled="aiAutoReply"
          :loading="aiToggleLoading"
          @toggle="handleAIToggle"
        />

        <!-- AI Copilot Assistant -->
        <button 
          class="icon-action-btn" 
          title="AI 智能助手 (智能摘要与建议回复)" 
          @click="showCopilotModal = true"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </button>

        <!-- Canned Responses -->
        <button 
          class="icon-action-btn" 
          title="常用快捷话术库" 
          @click="showCannedModal = true"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <!-- Refresh -->
        <button class="icon-action-btn" title="刷新对话" @click="emit('refresh')">
          <font-awesome-icon icon="fa-solid fa-rotate-right" />
        </button>

        <!-- Info Toggle -->
        <button class="icon-action-btn" aria-label="Conversation details" @click="emit('info')" title="联系人画像与详情">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/></svg>
        </button>
      </div>
    </header>

    <!-- Message Stream -->
    <main class="chat-content">
      <div class="messages" ref="messagesContainer">
        <div 
          v-for="(message, idx) in formattedMessages" 
          :key="idx"
          class="message-wrapper"
          :class="[
            message.message_type === 'private_note' ? 'note-wrapper' : '',
            message.message_type === 'agent' ? 'agent-wrapper' : ((message.message_type === 'bot' || message.message_type === 'product') ? 'bot-wrapper' : 'user-wrapper')
          ]"
        >
          <!-- 1. Private Internal Note (Chatwoot-Style) -->
          <div v-if="message.message_type === 'private_note'" class="private-note-card">
            <div class="private-note-top">
              <div class="private-note-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>内部私有便签 · 由 {{ message.user_name || '客服' }} 记录 (仅团队可见)</span>
              </div>
              <span class="note-time">{{ message.timeAgo }}</span>
            </div>
            <div class="private-note-body" v-html="renderMarkdown(message.message || '')"></div>
          </div>

          <!-- 2. Regular Message Bubble -->
          <div v-else class="message" :class="message.message_type === 'agent' ? 'agent' : ((message.message_type === 'bot' || message.message_type === 'product') ? 'bot' : 'user')">
            <div class="message-content">
              <div class="message-bubble">
                <!-- Product message -->
                <template v-if="message.message_type === 'product' && message.attributes?.shopify_output?.products?.length">
                  <div class="products-carousel">
                    <div v-html="renderMarkdown(message.message || '')" class="product-message-text"></div>
                    <div class="carousel-items">
                      <div 
                        v-for="product in message.attributes.shopify_output.products" 
                        :key="product.id" 
                        class="product-card-compact"
                      >
                        <div class="product-image-compact" v-if="product.image?.src">
                          <img :src="product.image.src" :alt="product.title || ''" class="product-thumbnail">
                        </div>
                        <div class="product-info-compact">
                          <div class="product-text-area">
                            <div class="product-title-compact">{{ product.title }}</div>
                            <div class="product-variant-compact" v-if="product.variant_title">{{ product.variant_title }}</div>
                            <div class="product-price-compact">{{ product.price }}</div>
                          </div>
                          <div class="product-actions-compact">
                            <button 
                              class="view-details-button-compact"
                              @click="$emit('view-product', String(product?.id || 'unknown'))"
                            >
                              查看商品 ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Normal Text Message with Markdown -->
                <template v-else>
                  <div v-html="renderMarkdown(message.message || '')"></div>
                  
                  <!-- Display attachments if present -->
                  <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
                    <div 
                      v-for="attachment in message.attachments" 
                      :key="attachment.id"
                      class="attachment-item"
                    >
                      <template v-if="isImageAttachment(attachment.content_type)">
                        <div class="attachment-image-container">
                          <img 
                            :src="getImageUrl(attachment.file_url)" 
                            :alt="attachment.filename"
                            class="attachment-image"
                          />
                          <div class="attachment-image-info">
                            <a 
                              :href="getDownloadUrl(attachment.file_url)" 
                              target="_blank"
                              class="attachment-link"
                            >
                              <font-awesome-icon icon="fa-solid fa-download" />
                              {{ attachment.filename }}
                              <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                            </a>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <a 
                          :href="getDownloadUrl(attachment.file_url)" 
                          target="_blank"
                          class="attachment-link"
                        >
                          <font-awesome-icon icon="fa-solid fa-paperclip" />
                          {{ attachment.filename }}
                          <span class="attachment-size">({{ formatFileSize(attachment.file_size) }})</span>
                        </a>
                      </template>
                    </div>
                  </div>
                </template>

                <span class="message-time">{{ message.timeAgo }}</span>
                <span v-if="message.attributes?.delivery_status" class="delivery-failed">
                  <font-awesome-icon icon="fa-solid fa-circle-exclamation" /> 发送未送达
                </span>
              </div>

              <span v-if="message.message_type === 'bot' || message.message_type === 'agent'" class="agent-name">
                {{ message.message_type === 'bot' ? (message.agent_name || chat.agent.name || 'AI 智能体') : (message.user_name || '人工客服') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Jira / Native Ticket Modals -->
    <JiraTicketModal
      v-if="showJiraTicketModal"
      :chat-id="currentChat.session_id"
      :initial-summary="ticketSummary"
      @close="showJiraTicketModal = false"
      @ticket-created="handleTicketCreated"
    />

    <TicketCreateModal
      :open="showTicketModal"
      :session-id="currentChat.session_id"
      :session-label="chat.customer.full_name || chat.customer.email || '本次会话'"
      @close="showTicketModal = false"
      @created="refreshLinkedTicket"
    />

    <!-- AI Copilot & Canned Modals -->
    <AICopilotAssistModal
      :open="showCopilotModal"
      :chat="currentChat"
      @close="showCopilotModal = false"
      @insert="handleInsertCopilotText"
    />

    <CannedResponsesModal
      :open="showCannedModal"
      @close="showCannedModal = false"
      @select="handleInsertCannedText"
    />

    <!-- Enhanced Reply Box -->
    <ConversationReplyBox
      ref="replyBoxRef"
      :sessionId="currentChat.session_id"
      :canSendMessage="canSendMessage"
      :isChatClosed="isChatClosed"
      :handledByAI="handledByAI"
      :showTakeoverButton="showTakeoverButton"
      :handlerCaption="handlerCaption"
      :isLoading="isLoading"
      :aiAutoReply="aiAutoReply"
      :aiToggleLoading="aiToggleLoading"
      :templateCanReopen="templateCanReopen"
      :canUseTemplates="canUseTemplates"
      @sendMessage="handleSendMessageText"
      @sendPrivateNote="sendPrivateNote"
      @takeover="handleTakeover"
      @routeTeam="handleRouteToHuman"
      @handbackAI="handleHandBackToAI"
      @toggleAI="handleAIToggle"
      @openCopilot="showCopilotModal = true"
      @openCanned="showCannedModal = true"
      @openTemplatePicker="showTemplatePicker = true"
      @filesUploaded="handleFilesUploaded"
      @fileError="handleFileUploadError"
    />

    <WhatsAppTemplatePicker
      v-if="showTemplatePicker && currentChat.channel_account_id"
      :account-id="currentChat.channel_account_id"
      :session-id="currentChat.session_id"
      @close="showTemplatePicker = false"
      @sent="handleTemplateSent"
    />
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: var(--bg);
  min-width: 0;
  overflow: hidden;
}

/* ── Top Header ────────────────────────────────────────────────────────────── */

.chat-header {
  padding: 12px 20px;
  background: var(--bg2);
  border-bottom: 1px solid var(--o08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  backdrop-filter: blur(20px);
  z-index: 10;
}

.back-btn {
  display: none;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
}

@media (max-width: 768px) {
  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-info-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user-info h2 {
  font-family: var(--font-display);
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.chat-status-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: var(--radius-pill, 999px);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.chip-dot {
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
}

.chip-ai {
  background: rgba(95, 227, 214, 0.08);
  color: #6EE7DC;
  border: 1px solid rgba(95, 227, 214, 0.25);
}
.chip-ai .chip-dot {
  background: #5FE3D6;
  box-shadow: 0 0 6px #5FE3D6;
}

.chip-waiting {
  background: rgba(245, 158, 11, 0.08);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.chip-waiting .chip-dot {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.chip-human {
  background: rgba(201, 242, 78, 0.08);
  color: #D4F56E;
  border: 1px solid rgba(201, 242, 78, 0.25);
}
.chip-human .chip-dot {
  background: var(--accent-solid);
  box-shadow: 0 0 6px var(--accent-solid);
}

.chip-closed {
  background: var(--o06);
  color: var(--muted2);
  border: 1px solid var(--o10);
}
.chip-closed .chip-dot {
  background: var(--muted2);
}

/* ── Header Actions ────────────────────────────────────────────────────────── */

.header-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: var(--radius-btn, 8px);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.btn-takeover {
  background: var(--accent-solid);
  color: #0B0C10;
  box-shadow: 0 0 12px rgba(201, 242, 78, 0.15);
}
.btn-takeover:hover {
  background: #d4f56e;
  transform: translateY(-0.5px);
  box-shadow: 0 0 18px rgba(201, 242, 78, 0.28);
}

.btn-handback {
  background: rgba(95, 227, 214, 0.08);
  color: #6EE7DC;
  border-color: rgba(95, 227, 214, 0.3);
}
.btn-handback:hover {
  background: rgba(95, 227, 214, 0.15);
  border-color: rgba(95, 227, 214, 0.45);
}

.btn-team {
  background: var(--surface);
  color: var(--text3);
  border: 1px solid var(--o12);
}
.btn-team:hover {
  background: var(--o08);
  color: var(--text);
  border-color: var(--o20);
}

.btn-resolve {
  background: rgba(16, 185, 129, 0.08);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.btn-resolve:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
}

.icon-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm, 7px);
  background: var(--surface);
  border: 1px solid var(--o10);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  background: var(--o08);
  color: var(--text);
  border-color: var(--o18);
  transform: translateY(-0.5px);
}

/* ── Chat Stream & Messages ────────────────────────────────────────────────── */

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;
  background: var(--bg);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-wrapper { align-items: flex-start; }
.bot-wrapper, .agent-wrapper { align-items: flex-end; }
.note-wrapper { width: 100%; }

/* ── Private Internal Note Card ────────────────────────────────────────────── */

.private-note-card {
  width: 100%;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-md, 10px);
  padding: 12px 16px;
  margin: 4px 0;
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.04);
}

.private-note-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.private-note-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 600;
  color: #fbbf24;
}

.note-time {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted2);
}

.private-note-body {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.55;
}

/* ── Message Bubble ────────────────────────────────────────────────────────── */

.message {
  max-width: 76%;
  display: flex;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.message-bubble {
  padding: 10px 15px;
  font-size: 13.5px;
  line-height: 1.6;
  border-radius: 14px;
  word-wrap: break-word;
  position: relative;
}

/* Customer message bubble */
.message.user .message-bubble {
  background: var(--surface);
  border: 1px solid var(--o10);
  color: var(--text);
  border-bottom-left-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* AI bot message bubble */
.message.bot .message-bubble {
  background: linear-gradient(135deg, rgba(95, 227, 214, 0.08) 0%, rgba(95, 227, 214, 0.03) 100%);
  border: 1px solid rgba(95, 227, 214, 0.22);
  color: var(--text);
  border-bottom-right-radius: 3px;
  box-shadow: 0 2px 8px rgba(95, 227, 214, 0.04);
}

/* Human agent message bubble */
.message.agent .message-bubble {
  background: var(--accent-solid);
  color: #0B0C10;
  border-bottom-right-radius: 3px;
  font-weight: 450;
  box-shadow: 0 2px 10px rgba(201, 242, 78, 0.15);
}

.agent-name {
  font-size: 11px;
  color: var(--muted2);
  margin-top: 2px;
  padding-right: 4px;
  text-align: right;
  letter-spacing: -0.01em;
}

.message-time {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted2);
  margin-top: 4px;
  display: block;
  text-align: right;
}

.message.agent .message-time {
  color: rgba(11, 12, 16, 0.65);
}

.delivery-failed {
  font-size: 11px;
  color: var(--c-danger);
  margin-top: 3px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ── Shopify Products Carousel in Chat ─────────────────────────────────────── */

.products-carousel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-message-text {
  font-size: 13.5px;
  line-height: 1.5;
}

.carousel-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-card-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--radius-md, 10px);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--o10);
  transition: all 0.15s ease;
}

.product-card-compact:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: var(--o20);
}

.product-image-compact {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface);
  flex-shrink: 0;
}

.product-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info-compact {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-text-area {
  min-width: 0;
}

.product-title-compact {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-variant-compact {
  font-size: 11px;
  color: var(--muted);
}

.product-price-compact {
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--accent-ink);
}

.view-details-button-compact {
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--accent-solid);
  color: #0B0C10;
  border: none;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.view-details-button-compact:hover {
  background: #d4f56e;
}

/* ── Attachments ───────────────────────────────────────────────────────────── */

.message-attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  border-radius: 8px;
  overflow: hidden;
}

.attachment-image-container {
  max-width: 240px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--o12);
  background: var(--surface);
}

.attachment-image {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  display: block;
}

.attachment-image-info {
  padding: 6px 8px;
  background: var(--bg2);
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text2);
  text-decoration: none;
  transition: color 0.15s ease;
}

.attachment-link:hover {
  color: var(--accent-ink);
}

.attachment-size {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
}
</style>
