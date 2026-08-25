<!--
Copyright 2024-2026 ChatterMate
中栏：聊天流与工作流主屏 (ConversationChat.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox.vue'
import type { OutboundAttachment } from '@/components/conversations/ConversationReplyBox.vue'
import AICopilotAssistModal from '@/components/conversations/AICopilotAssistModal.vue'
import CannedResponsesModal from '@/components/conversations/CannedResponsesModal.vue'
import ShopifyProductPicker from '@/components/conversations/ShopifyProductPicker.vue'
import WhatsAppTemplatePicker from '@/components/conversations/WhatsAppTemplatePicker.vue'
import type { ChatDetail } from '@/types/chat'
import type { ShopifyProduct } from '@/services/chat'
import { useConversationChat } from '@/composables/useConversationChat'
import type { Teammate } from '@/services/users'
import { apiPath, resolveUploadUrl } from '@/config/api'
import { chatService } from '@/services/chat'
import { permissionChecks } from '@/utils/permissions'
import { userService } from '@/services/user'

const props = defineProps<{
  chat?: ChatDetail | null
  draft?: string
}>()

const emit = defineEmits<{
  (e: 'toggle-right-drawer'): void
  (e: 'open-transfer'): void
  (e: 'refresh'): void
  (e: 'chat-updated', chat: ChatDetail): void
  (e: 'clear-unread', sessionId: string): void
  (e: 'update:draft', text: string): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const showAiPolishModal = ref(false)
const showCannedModal = ref(false)
const showProductPicker = ref(false)
const showTemplateModal = ref(false)
const aiSuggestions = ref<string[]>([])
const aiSuggestionsLoading = ref(false)
const mentionableTeammates = ref<Teammate[]>([])
const mentionsLoading = ref(false)
let suggestionRequest = 0
let suggestionTimer: ReturnType<typeof setTimeout> | undefined
let mentionableSessionId = ''
let mentionableRequest = 0

const emptyChat = (): ChatDetail => ({ session_id: '', customer: { id: '', email: '' }, agent: { id: '', name: '', display_name: null }, messages: [], status: 'closed', channel: 'web', user_id: null, group_id: null, ai_auto_reply: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
const chatState = useConversationChat(props.chat || emptyChat(), emit as any)
const chat = chatState.chat
watch(() => props.chat, value => { if (value) chatState.replaceChatFromProps(value) }, { deep: true })
watch(() => chat.value.session_id, () => {
  showAiPolishModal.value = false
  showCannedModal.value = false
  showProductPicker.value = false
  showTemplateModal.value = false
  mentionableRequest += 1
  mentionableSessionId = ''
  mentionableTeammates.value = []
  mentionsLoading.value = false
})
const messages = computed(() => chatState.formattedMessages.value.map((msg: any) => ({
  ...msg,
  type: msg.message_type === 'user' ? 'customer' : msg.message_type === 'bot' ? 'ai' : msg.message_type === 'private_note' ? 'note' : 'agent',
  author: msg.user_name || msg.agent_name || (msg.message_type === 'bot' ? chat.value.agent.display_name || chat.value.agent.name || 'AI 客服' : '客服'),
  text: msg.message || '',
  time: new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
})))
const currentStatus = computed(() => chatState.isChatClosed.value ? 'resolved' : chatState.handledByAI.value ? 'ai' : chatState.isWaitingForHuman.value ? 'waiting' : 'human')
const canManageChat = computed(() => permissionChecks.canTakeOverChats())
const canToggleAiAutoReply = computed(() => canManageChat.value && !chatState.isChatClosed.value)
const canHandBackToAI = computed(() =>
  canManageChat.value &&
  (currentStatus.value === 'human' || currentStatus.value === 'waiting') &&
  (!chat.value.user_id || String(chat.value.user_id) === String(userService.getUserId())),
)
const customerName = computed(() => chat.value.customer?.full_name || chat.value.customer?.email || '未知客户')
const customerEmail = computed(() => chat.value.customer?.email || '')
const customerInitial = computed(() => customerName.value.trim().slice(0, 1).toUpperCase() || '?')
const channelLabel = computed(() => {
  const channel = chat.value.channel || 'web'
  return channel === 'web' ? '网页会话' : channel[0].toUpperCase() + channel.slice(1)
})
const storeName = computed(() => {
  const value = chat.value.customer?.meta_data?.store_name
  return typeof value === 'string' && value.trim() ? value.trim() : null
})
const latestCustomerMessage = computed(() => {
  const messages = chat.value.messages || []
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].message_type === 'user' && messages[index].message?.trim()) return messages[index]
  }
  return null
})
const suggestionContextKey = computed(() => {
  const message = latestCustomerMessage.value
  return message
    ? `${chat.value.session_id}:${message.id || message.client_message_id || message.created_at}:${message.message}`
    : ''
})
const loadReplySuggestions = async () => {
  const key = suggestionContextKey.value
  const sessionId = chat.value.session_id
  const request = ++suggestionRequest
  if (!key || !sessionId || chat.value.status === 'closed') {
    aiSuggestions.value = []
    aiSuggestionsLoading.value = false
    return
  }
  aiSuggestionsLoading.value = true
  try {
    const result = await chatService.getReplySuggestions(sessionId)
    if (request !== suggestionRequest || key !== suggestionContextKey.value) return
    aiSuggestions.value = result.suggestions || []
  } catch {
    if (request === suggestionRequest) aiSuggestions.value = []
  } finally {
    if (request === suggestionRequest) aiSuggestionsLoading.value = false
  }
}
watch(suggestionContextKey, () => {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  aiSuggestions.value = []
  if (!suggestionContextKey.value || chat.value.status === 'closed') {
    aiSuggestionsLoading.value = false
    return
  }
  suggestionTimer = setTimeout(() => { void loadReplySuggestions() }, 250)
}, { immediate: true })
onBeforeUnmount(() => {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  suggestionRequest += 1
})
const attachmentUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return resolveUploadUrl(url)
  if (url.startsWith('/api/v1/files/download/')) return resolveUploadUrl(url)
  const attachmentPrefix = '/uploads/chat_attachments/'
  const index = url.indexOf(attachmentPrefix)
  if (index !== -1) return apiPath(`/files/download/${url.slice(index + '/uploads/'.length)}`)
  return resolveUploadUrl(url)
}
const attachmentSize = (size: number) => size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`
const isImageAttachment = (contentType: string) => contentType.startsWith('image/')

const loadMentionableTeammates = async () => {
  const sessionId = chat.value.session_id
  if (!sessionId || mentionsLoading.value || mentionableSessionId === sessionId) return
  const request = ++mentionableRequest
  mentionsLoading.value = true
  try {
    const users = await chatService.getMentionableTeammates(sessionId)
    if (request === mentionableRequest && chat.value.session_id === sessionId) {
      mentionableTeammates.value = users
      mentionableSessionId = sessionId
    }
  } catch (err: any) {
    if (request === mentionableRequest && chat.value.session_id === sessionId) {
      mentionableTeammates.value = []
      emit('action-toast', err?.response?.data?.detail || '无法加载可提及的团队成员', 'error')
    }
  } finally {
    if (request === mentionableRequest && chat.value.session_id === sessionId) mentionsLoading.value = false
  }
}

const handleSendMessage = (
  text: string,
  isNote: boolean,
  files: OutboundAttachment[] = [],
  mentionedUsers: Teammate[] = [],
) => {
  void (isNote
    ? chatState.sendPrivateNote(text, files, mentionedUsers)
    : chatState.sendMessage(text, false, files, mentionedUsers))
}

const handleSendAndResolve = (text: string, files: OutboundAttachment[] = [], mentionedUsers: Teammate[] = []) => {
  void chatState.sendAndResolve(text, files, mentionedUsers)
}

const handleTakeover = () => void chatState.handleTakeover()

const handleHandoverAI = () => void chatState.handleHandBackToAI()

const handleResolveSession = () => void chatState.endChat(true)

const insertProduct = (product: ShopifyProduct, shopDomain?: string) => {
  const price = product.price === undefined || product.price === null || product.price === ''
    ? ''
    : ` (${product.currency || ''} ${product.price}${product.price_max && String(product.price_max) !== String(product.price) ? ` - ${product.price_max}` : ''}`.trimEnd() + ')'
  const domain = shopDomain?.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  const url = domain && product.handle ? `https://${domain}/products/${product.handle}` : ''
  const productText = [product.title + price, url].filter(Boolean).join('\n')
  emit('update:draft', props.draft ? `${props.draft}\n${productText}` : productText)
}
</script>

<template>
  <main class="flex-1 flex flex-col bg-[#080B11] relative overflow-hidden h-full">
    <!-- 顶部工作流状态条 (Workflow Header - 1:1 h-16 对齐) -->
    <header class="h-16 px-4 bg-[#0F1523]/90 border-b border-white/[0.08] flex items-center justify-between shrink-0 crystal-panel z-10 shadow-sm">
      <!-- 客户主信息与渠道 -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-10 h-10 rounded-xl border border-white/10 bg-slate-700 text-sm font-bold text-slate-100 flex items-center justify-center shadow-md">
            {{ customerInitial }}
          </div>
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm">
            <i v-if="chat.channel === 'whatsapp'" class="fa-brands fa-whatsapp"></i>
            <i v-else-if="chat.channel === 'email'" class="fa-regular fa-envelope"></i>
            <i v-else class="fa-solid fa-comments"></i>
          </span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-100">{{ customerName }}</h2>
            <span class="px-1.5 py-0.2 text-[10px] font-medium bg-white/5 text-slate-300 border border-white/10 rounded">
              {{ storeName || channelLabel }}
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span v-if="customerEmail" class="flex items-center gap-1 text-[11px]">
              <i class="fa-regular fa-envelope text-[10px]"></i> {{ customerEmail }}
            </span>
            <span v-if="customerEmail" class="text-slate-600">·</span>
            <span class="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <i class="fa-solid fa-message text-[10px]"></i> {{ channelLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- 实时接待状态指示灯 + 快捷操作组 -->
      <div class="flex items-center gap-2.5">
        <!-- 实时状态胶囊 -->
        <div
          v-if="currentStatus === 'ai'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 pulse-subtle"></span>
          <span>AI 自动回复</span>
        </div>
        <div
          v-else-if="currentStatus === 'human'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-[0_0_12px_rgba(59,130,246,0.25)]"
        >
          <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>人工接管 · {{ chat.user_name || '客服' }}</span>
        </div>
        <div
          v-else-if="currentStatus === 'waiting'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold"
        >
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>等待人工接入</span>
        </div>
        <div
          v-else
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/40 border border-white/10 text-slate-400 text-xs font-semibold"
        >
          <span>🔒 已解决归档</span>
        </div>

        <div class="h-5 w-px bg-white/10"></div>

        <!-- 操作按钮组 -->
        <div class="flex items-center gap-1.5">
          <button
            v-if="chatState.showTakeoverButton.value"
            @click="handleTakeover"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all"
          >
            <i class="fa-solid fa-user-check text-xs"></i>
            <span>人工接管</span>
          </button>

          <button
            v-else-if="canHandBackToAI"
            @click="handleHandoverAI"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <i class="fa-solid fa-robot text-xs"></i>
            <span>转回 AI</span>
          </button>

          <button
            v-if="currentStatus !== 'resolved' && canManageChat"
            @click="emit('open-transfer')"
            class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
            title="转交给售后/物流专员"
          >
            <i class="fa-solid fa-arrow-right-arrow-left fa-exchange-alt text-xs"></i>
            <span>转交</span>
          </button>

          <button
            v-if="currentStatus !== 'resolved' && chatState.canSendMessage.value && canManageChat"
            @click="handleResolveSession"
            class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
            title="解决并关闭会话"
          >
            <i class="fa-solid fa-check-double text-xs"></i>
            <span>解决</span>
          </button>

          <button
            @click="emit('toggle-right-drawer')"
            class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center transition-all ml-1"
            title="展开/收起右侧栏"
          >
            <i class="fa-solid fa-table-columns fa-columns text-xs"></i>
          </button>
        </div>

      </div>
    </header>

    <!-- WhatsApp 合规窗口提示条 -->
    <div v-if="chat.channel === 'whatsapp'" class="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300 shrink-0">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation fa-exclamation-triangle text-amber-400"></i>
        <span><strong>WhatsApp 24小时会话窗口：</strong> 窗口关闭后，仅允许发送 Meta 已批准的模板消息。</span>
      </div>
      <button
        @click="showTemplateModal = true"
        class="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-200 text-[11px] font-medium transition-colors flex items-center gap-1"
      >
        <i class="fa-solid fa-file-lines fa-file-alt text-[10px]"></i> 选取官方模板
      </button>
    </div>

    <!-- 消息流区域 (Chat Space Feed) -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 chat-space-bg">
      <div class="flex items-center justify-center my-1">
        <div class="px-3.5 py-1 rounded-full bg-[#0F1523] border border-white/10 text-[11px] text-slate-400 flex items-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-lock text-emerald-400 text-xs"></i>
          <span>会话渠道：{{ channelLabel }}<template v-if="storeName"> · 所属店铺：{{ storeName }}</template></span>
        </div>
      </div>

      <div
        v-for="(msg, idx) in messages"
        :key="msg.id || msg.client_message_id || `${msg.created_at}-${idx}`"
        class="animate-in fade-in duration-200"
      >
        <!-- 客户消息 -->
        <div
          v-if="msg.type === 'customer'"
          class="flex items-start gap-3 max-w-[80%]"
        >
          <div class="w-9 h-9 rounded-xl shrink-0 mt-0.5 border border-white/10 bg-slate-700 text-xs font-bold text-slate-100 flex items-center justify-center shadow-sm">
            {{ customerInitial }}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-300">{{ msg.author }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
            </div>
            <div class="p-3 rounded-2xl rounded-tl-sm bg-[#131B2E] border border-white/10 text-xs text-slate-100 leading-relaxed shadow-sm">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <!-- AI 应答卡片 -->
        <div
          v-else-if="msg.type === 'ai'"
          class="flex flex-col items-end max-w-[85%] ml-auto space-y-1.5"
        >
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <i class="fa-solid fa-bolt text-emerald-400 text-[10px]"></i>
              AI 回复
            </span>
            <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
          </div>

          <div class="ai-crystal-bubble p-3.5 rounded-2xl rounded-tr-sm text-xs text-slate-100 leading-relaxed shadow-md">
            <div>{{ msg.text }}</div>
          </div>
        </div>

        <!-- 客服坐席消息 -->
        <div
          v-else-if="msg.type === 'agent'"
          class="flex flex-col items-end max-w-[80%] ml-auto space-y-1"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-blue-400">{{ msg.author }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
          </div>
          <div class="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs leading-relaxed shadow-[0_0_16px_rgba(59,130,246,0.4)]">
            {{ msg.text }}
          </div>
        </div>

        <!-- 内部私信便签 -->
        <div
          v-else-if="msg.type === 'note'"
          class="my-2 p-3 rounded-xl note-crystal-bubble text-xs text-amber-200 space-y-1 shadow-sm"
        >
          <div class="flex items-center justify-between text-amber-400 font-bold text-[11px]">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-lock text-xs"></i>
              <span>内部团队私信便签</span>
            </span>
            <span class="font-normal font-mono text-[10px]">{{ msg.author }} · {{ msg.time }}</span>
          </div>
          <p class="leading-relaxed text-amber-100/90">{{ msg.text }}</p>
        </div>

        <div v-if="msg.attachments?.length" :class="[msg.type === 'customer' ? 'ml-12 max-w-[80%]' : 'ml-auto max-w-[80%]', 'mt-1 flex flex-wrap gap-2']">
          <a
            v-for="attachment in msg.attachments"
            :key="attachment.id || attachment.filename"
            :href="attachmentUrl(attachment.file_url)"
            target="_blank"
            rel="noreferrer"
            class="flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-[#131B2E] p-1.5 text-[11px] text-slate-200 hover:border-emerald-500/40"
          >
            <img v-if="isImageAttachment(attachment.content_type)" :src="attachmentUrl(attachment.file_url)" :alt="attachment.filename" class="h-10 w-10 rounded object-cover" />
            <i v-else class="fa-solid fa-file-lines text-slate-400"></i>
            <span class="max-w-44 truncate">{{ attachment.filename }}</span>
            <span class="text-slate-500">{{ attachmentSize(attachment.file_size) }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- 底部回复多功能区 -->
    <ConversationReplyBox
      :session-id="chat.session_id"
      :draft="props.draft"
      :ai-suggestions="aiSuggestions"
      :ai-suggestions-loading="aiSuggestionsLoading"
      :ai-auto-reply-enabled="chat.ai_auto_reply"
      :ai-auto-reply-disabled="!canToggleAiAutoReply"
      :ai-auto-reply-loading="chatState.aiToggleLoading.value"
      :disabled="!chatState.canSendMessage.value || chatState.isLoading.value"
      :allow-attachments="chat.agent.allow_attachments"
      :allowed-attachment-types="chat.agent.allowed_attachment_types"
      :mentionable-teammates="mentionableTeammates"
      :mentions-loading="mentionsLoading"
      @send="handleSendMessage"
      @send-and-resolve="handleSendAndResolve"
      @request-mentions="loadMentionableTeammates"
      @update:draft="(text: string) => emit('update:draft', text)"
      @toggle-ai-auto-reply="(enabled: boolean) => canToggleAiAutoReply && chatState.toggleAIAutoReply(enabled)"
      @open-ai-polish="showAiPolishModal = true"
      @open-canned="showCannedModal = true"
      @open-product="showProductPicker = true"
      @action-toast="(msg, type) => emit('action-toast', msg, type)"
    />

    <!-- AI Copilot 智能改写润色弹窗 -->
    <AICopilotAssistModal
      :open="showAiPolishModal"
      :chat="chat"
      :current-draft="props.draft"
      @close="showAiPolishModal = false"
      @insert="(text: string) => emit('update:draft', text)"
    />

    <!-- 快捷话术库弹窗 -->
    <CannedResponsesModal
      :open="showCannedModal"
      :customer-name="customerName"
      @close="showCannedModal = false"
      @select="(text: string) => emit('update:draft', text)"
    />

    <ShopifyProductPicker
      :open="showProductPicker"
      :session-id="chat.session_id"
      @close="showProductPicker = false"
      @select="insertProduct"
    />

    <!-- WhatsApp 官方报备模板 -->
    <WhatsAppTemplatePicker
      v-if="showTemplateModal"
      :account-id="chat.channel_account_id || ''"
      :session-id="chat.session_id"
      @close="showTemplateModal = false"
      @sent="showTemplateModal = false; emit('action-toast', 'Meta 官方报备模板已发送', 'success')"
    />
  </main>
</template>

<style scoped>
.crystal-panel {
  background: rgba(15, 21, 35, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.ai-crystal-bubble {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.2) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-top: 1px solid rgba(52, 211, 153, 0.5);
  box-shadow: 0 4px 20px -4px rgba(16, 185, 129, 0.15);
}

.note-crystal-bubble {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(217, 119, 6, 0.05) 100%);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-top: 1px solid rgba(251, 191, 36, 0.5);
}

.chat-space-bg {
  background-color: #080B11;
  background-image: 
    radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.03) 0px, transparent 60%),
    radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.02) 0px, transparent 50%);
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.04); }
}
.pulse-subtle {
  animation: pulse-subtle 3s infinite ease-in-out;
}
</style>
