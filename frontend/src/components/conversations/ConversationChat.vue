<!--
Copyright 2024-2026 Komi AI
中栏：聊天流与工作流主屏 (ConversationChat.vue - 现代高定多维色彩体系，精准左右消息流)
-->

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox.vue'
import type { OutboundAttachment } from '@/components/conversations/ConversationReplyBox.vue'
import AICopilotAssistModal from '@/components/conversations/AICopilotAssistModal.vue'
import CannedResponsesModal from '@/components/conversations/CannedResponsesModal.vue'
import ShopifyProductPicker from '@/components/conversations/ShopifyProductPicker.vue'
import WhatsAppTemplatePicker from '@/components/conversations/WhatsAppTemplatePicker.vue'
import type { ChatDetail, Message } from '@/types/chat'
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
const chatModel = chatState.chat
watch(() => props.chat, value => { chatState.replaceChatFromProps(value || emptyChat()) })
watch(() => chatModel.value.session_id, () => {
  showAiPolishModal.value = false
  showCannedModal.value = false
  showProductPicker.value = false
  showTemplateModal.value = false
  mentionableRequest += 1
  mentionableSessionId = ''
  mentionableTeammates.value = []
})

const customerName = computed(() => chatModel.value.customer?.full_name || chatModel.value.customer?.email || '未知客户')
const customerEmail = computed(() => chatModel.value.customer?.email || '')
const customerInitial = computed(() => customerName.value.trim().slice(0, 1).toUpperCase() || '?')
const channelLabel = computed(() => {
  const channel = chatModel.value.channel || 'web'
  return channel === 'web' ? '网页挂件' : channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? '邮件' : channel[0].toUpperCase() + channel.slice(1)
})
const currentUserId = computed(() => userService.getUserId())
const canManageChat = computed(() => permissionChecks.canTakeOverChats())
const canHandBackToAI = computed(() => canManageChat.value && (chatModel.value.user_id ? String(chatModel.value.user_id) === String(currentUserId.value) : true))

const storeName = computed(() => {
  const meta = chatModel.value.customer?.meta_data
  return typeof meta?.store_name === 'string' && meta.store_name.trim() ? meta.store_name.trim() : ''
})

const currentStatus = computed<'empty' | 'ai' | 'human' | 'waiting' | 'resolved'>(() => {
  if (!chatModel.value.session_id) return 'empty'
  if (chatModel.value.status === 'closed') return 'resolved'
  if (chatModel.value.user_id) return 'human'
  if (chatModel.value.status === 'transferred' || chatModel.value.ai_auto_reply === false || chatModel.value.agent?.ai_replies_enabled === false) return 'waiting'
  return 'ai'
})

// 精准识别用户消息（左侧）与 AI / 客服回复（右侧）
const messages = computed(() => {
  return (chatModel.value.messages || []).map((m: Message) => {
    let msgType: 'customer' | 'ai' | 'agent' | 'note' | 'system' = 'ai'
    if (m.message_type === 'user' || m.message_type === 'customer') {
      msgType = 'customer'
    } else if (m.message_type === 'private_note') {
      msgType = 'note'
    } else if (m.message_type === 'agent') {
      msgType = 'agent'
    } else if (m.message_type === 'system' || m.message_type === 'form') {
      msgType = 'system'
    } else {
      msgType = 'ai'
    }

    const author = msgType === 'customer'
      ? customerName.value
      : msgType === 'agent'
      ? m.user_name || '人工客服'
      : msgType === 'note'
      ? m.user_name || '团队便签'
      : 'AI 智能体'

    return {
      id: m.id || m.client_message_id,
      client_message_id: m.client_message_id,
      type: msgType,
      author,
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      text: m.message || '',
      attachments: m.attachments || [],
    }
  })
})

const lastMsg = computed(() => {
  const list = chatModel.value.messages || []
  return list[list.length - 1]
})
const lastCustomerMsg = computed(() => {
  const list = chatModel.value.messages || []
  return list.slice().reverse().find(m => m.message_type === 'user' || m.message_type === 'customer')
})
const suggestionContextKey = computed(() => {
  const sessionId = chatModel.value.session_id
  if (!sessionId) return ''
  return `${sessionId}-${lastMsg.value?.id || ''}-${lastCustomerMsg.value?.message || ''}`
})

const loadReplySuggestions = async () => {
  const sessionId = chatModel.value.session_id
  const key = suggestionContextKey.value
  if (!sessionId || !key || chatModel.value.status === 'closed' || currentStatus.value === 'ai') {
    aiSuggestions.value = []
    aiSuggestionsLoading.value = false
    return
  }
  const request = ++suggestionRequest
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
  if (!suggestionContextKey.value || chatModel.value.status === 'closed' || currentStatus.value === 'ai') {
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
  const sessionId = chatModel.value.session_id
  if (!sessionId || mentionsLoading.value || mentionableSessionId === sessionId) return
  const request = ++mentionableRequest
  mentionsLoading.value = true
  try {
    const users = await chatService.getMentionableTeammates(sessionId)
    if (request === mentionableRequest && chatModel.value.session_id === sessionId) {
      mentionableTeammates.value = users
      mentionableSessionId = sessionId
    }
  } catch (err: any) {
    if (request === mentionableRequest && chatModel.value.session_id === sessionId) {
      mentionableTeammates.value = []
      emit('action-toast', err?.response?.data?.detail || '无法加载可提及的团队成员', 'error')
    }
  } finally {
    if (request === mentionableRequest && chatModel.value.session_id === sessionId) mentionsLoading.value = false
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

const handleReopenSession = () => void chatState.reopenChat()

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
  <main class="flex-1 flex flex-col bg-[#F8FAFC] relative overflow-hidden h-full">
    <!-- 顶部工作流状态条 -->
    <header class="h-16 px-5 bg-[#FFFFFF] border-b border-slate-200/80 flex items-center justify-between shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <!-- 客户主信息与渠道 -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-sm font-bold text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            {{ customerInitial }}
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[8px] border-2 border-white shadow-sm" v-if="chatModel.channel === 'whatsapp'">
            <i class="fa-brands fa-whatsapp"></i>
          </span>
          <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] border-2 border-white shadow-sm" v-else-if="chatModel.channel === 'email'">
            <i class="fa-regular fa-envelope"></i>
          </span>
          <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] border-2 border-white shadow-sm" v-else>
            <i class="fa-solid fa-message"></i>
          </span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-[#0F172A]">{{ customerName }}</h2>
            <span class="px-2 py-0.5 text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-md">
              {{ storeName || channelLabel }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span v-if="customerEmail" class="flex items-center gap-1 text-[11px] text-slate-500">
              <i class="fa-regular fa-envelope text-[10px] text-indigo-500"></i> {{ customerEmail }}
            </span>
            <span v-if="customerEmail" class="text-slate-300">·</span>
            <span class="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
              <i class="fa-solid fa-circle-nodes text-[10px]"></i> {{ channelLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- 实时接待状态指示灯 + 快捷操作组 -->
      <div class="flex items-center gap-3">
        <!-- 实时状态胶囊 -->
        <div
          v-if="currentStatus === 'empty'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium"
        >
          <i class="fa-solid fa-inbox text-[10px]"></i>
          <span>请选择一个会话</span>
        </div>
        <div
          v-else-if="currentStatus === 'ai'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold shadow-sm"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI 自动回复中</span>
        </div>
        <div
          v-else-if="currentStatus === 'human'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-700 text-xs font-semibold shadow-sm"
        >
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>人工接管 · {{ chatModel.user_name || '客服' }}</span>
        </div>
        <div
          v-else-if="currentStatus === 'waiting'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold shadow-sm"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>等待人工接入</span>
        </div>
        <div
          v-else
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium"
        >
          <span class="flex items-center gap-1"><i class="fa-solid fa-lock text-[10px] text-slate-400"></i>已解决归档</span>
        </div>

        <div class="h-4 w-px bg-slate-200"></div>

        <!-- 操作按钮组 -->
        <div class="flex items-center gap-2">
          <button
            v-if="chatState.showTakeoverButton.value"
            @click="handleTakeover"
            :disabled="chatState.isLoading.value"
            class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <i class="fa-solid fa-user-check text-xs"></i>
            <span>人工接管</span>
          </button>

          <button
            v-if="!chatState.showTakeoverButton.value && canHandBackToAI"
            @click="handleHandoverAI"
            :disabled="chatState.isLoading.value"
            class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="交还给 AI 自动回复"
          >
            <i class="fa-solid fa-robot text-xs text-emerald-600"></i>
            <span>转回 AI</span>
          </button>

          <button
            v-if="currentStatus === 'resolved'"
            @click="handleReopenSession"
            :disabled="chatState.isLoading.value"
            class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="重新打开并接管此会话"
          >
            <i class="fa-solid fa-arrow-rotate-left text-xs"></i>
            <span>重新打开</span>
          </button>

          <button
            v-if="chatModel.session_id && currentStatus !== 'resolved' && canManageChat"
            @click="emit('open-transfer')"
            :disabled="chatState.isLoading.value"
            class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            title="转派给特定团队成员或转入排队队列"
          >
            <i class="fa-solid fa-arrow-right-arrow-left text-xs text-indigo-500"></i>
            <span>转交团队</span>
          </button>

          <button
            v-if="chatModel.session_id && currentStatus !== 'resolved' && chatState.canSendMessage.value && canManageChat"
            @click="handleResolveSession"
            :disabled="chatState.isLoading.value"
            class="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            title="解决并关闭会话"
          >
            <i class="fa-solid fa-check text-xs text-emerald-600"></i>
            <span>解决</span>
          </button>

          <button
            @click="emit('toggle-right-drawer')"
            class="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center transition-all ml-1 shadow-sm"
            title="展开/收起右侧客户资料栏"
          >
            <i class="fa-solid fa-table-columns text-xs"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- WhatsApp 合规窗口提示条 -->
    <div v-if="chatModel.channel === 'whatsapp'" class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800 shrink-0">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
        <span><strong>WhatsApp 24小时会话窗口：</strong> 窗口关闭后，仅允许发送 Meta 已批准的模板消息。</span>
      </div>
      <button
        @click="showTemplateModal = true"
        class="px-2.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-amber-900 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm"
      >
        <i class="fa-solid fa-file-lines text-[10px]"></i> 选取官方模板
      </button>
    </div>

    <!-- 消息流区域 (Chat Space Feed) -->
    <div class="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
      <div v-if="!chatModel.session_id" class="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm">
          <i class="fa-solid fa-comments text-xl"></i>
        </div>
        <p class="text-xs text-slate-500 font-medium">请从左侧列表选择一个客户会话以开始接待</p>
      </div>

      <div
        v-else
        v-for="(msg, idx) in messages"
        :key="`msg-${msg.id || msg.client_message_id || idx}`"
        class="animate-in fade-in duration-200"
      >
        <!-- 1. 客户消息 (左侧对齐：纯净立体白卡，深灰清晰字体) -->
        <div
          v-if="msg.type === 'customer'"
          class="flex items-start gap-3 max-w-[75%]"
        >
          <div class="w-8 h-8 rounded-full shrink-0 mt-0.5 bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center shadow-sm">
            {{ customerInitial }}
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-700">{{ msg.author }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ msg.time }}</span>
            </div>
            <div class="p-3.5 rounded-2xl rounded-tl-sm bg-[#FFFFFF] border border-slate-200/90 text-[13px] text-slate-900 leading-relaxed shadow-sm">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <!-- 2. AI 智能体消息 (右侧对齐：现代皇家紫靛高定渐变气泡，白字清爽) -->
        <div
          v-else-if="msg.type === 'ai'"
          class="flex flex-col items-end max-w-[80%] ml-auto space-y-1"
        >
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200 flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-sparkles text-indigo-600 text-[9px]"></i>
              AI 智能应答
            </span>
            <span class="text-[10px] text-slate-400 font-mono">{{ msg.time }}</span>
          </div>

          <div class="p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white text-[13px] leading-relaxed shadow-md shadow-indigo-500/20">
            <div>{{ msg.text }}</div>
          </div>
        </div>

        <!-- 3. 人工客服消息 (右侧对齐：蔚蓝科技感渐变气泡) -->
        <div
          v-else-if="msg.type === 'agent'"
          class="flex flex-col items-end max-w-[80%] ml-auto space-y-1"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <i class="fa-solid fa-user-tie text-[10px]"></i>
              {{ msg.author }}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">{{ msg.time }}</span>
          </div>
          <div class="p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-sky-600 to-blue-600 text-white text-[13px] leading-relaxed shadow-md shadow-blue-500/20">
            {{ msg.text }}
          </div>
        </div>

        <!-- 4. 内部私信便签 (居中暖黄雅致便签卡) -->
        <div
          v-else-if="msg.type === 'note'"
          class="my-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 shadow-sm"
        >
          <div class="flex items-center justify-between text-amber-800 font-bold text-[11px]">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-lock text-xs text-amber-600"></i>
              <span>内部团队私信便签</span>
            </span>
            <span class="font-normal font-mono text-[10px] text-amber-700">{{ msg.author }} · {{ msg.time }}</span>
          </div>
          <p class="leading-relaxed text-amber-950 text-[12.5px]">{{ msg.text }}</p>
        </div>

        <div v-else class="my-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          <span>{{ msg.text }}</span>
        </div>

        <div v-if="msg.attachments && msg.attachments.length > 0" :class="[msg.type === 'customer' ? 'ml-11 max-w-[80%]' : 'ml-auto max-w-[80%]', 'mt-1 flex flex-wrap gap-2']">
          <a
            v-for="attachment in msg.attachments"
            :key="attachment.id || attachment.filename"
            :href="attachmentUrl(attachment.file_url)"
            target="_blank"
            rel="noreferrer"
            class="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-800 hover:border-indigo-400 shadow-sm"
          >
            <img v-if="isImageAttachment(attachment.content_type)" :src="attachmentUrl(attachment.file_url)" :alt="attachment.filename" class="h-10 w-10 rounded object-cover" />
            <i v-else class="fa-solid fa-file-lines text-slate-400"></i>
            <span class="max-w-40 truncate font-medium">{{ attachment.filename }}</span>
            <span class="text-slate-400">{{ attachmentSize(attachment.file_size) }}</span>
          </a>
        </div>
      </div>

      <!-- AI 实时思考与知识库检索动态指示器 -->
      <div
        v-if="chatState.isAiTyping.value"
        class="flex items-center gap-3 p-3 my-2 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs shadow-sm max-w-fit"
      >
        <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600">
          <i class="fa-solid fa-sparkles text-xs animate-spin" style="animation-duration: 3s;"></i>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium text-indigo-950">{{ chatState.typingMessage.value }}</span>
          <span class="flex gap-1 items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 150ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 300ms;"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- 底部回复多功能区 -->
    <ConversationReplyBox
      :session-id="chatModel.session_id"
      :draft="props.draft"
      :ai-suggestions="aiSuggestions"
      :ai-suggestions-loading="aiSuggestionsLoading"
      :ai-auto-reply-enabled="chatModel.ai_auto_reply"
      :ai-auto-reply-disabled="!canManageChat || chatModel.status === 'closed'"
      :disabled="!chatModel.session_id || chatModel.status === 'closed' || !chatState.canSendMessage.value"
      :is-resolved="chatModel.status === 'closed'"
      :allow-attachments="chatModel.agent?.allow_attachments !== false"
      :mentionable-teammates="mentionableTeammates"
      :mentions-loading="mentionsLoading"
      @send="handleSendMessage"
      @send-and-resolve="handleSendAndResolve"
      @toggle-ai-auto-reply="enabled => chatState.toggleAIAutoReply(enabled)"
      @update:draft="text => emit('update:draft', text)"
      @request-mentions="loadMentionableTeammates"
      @open-ai-polish="showAiPolishModal = true"
      @open-canned="showCannedModal = true"
      @open-product="showProductPicker = true"
      @action-toast="(msg, type) => emit('action-toast', msg, type)"
    />

    <!-- AI Copilot 润色弹窗 -->
    <AICopilotAssistModal
      :open="showAiPolishModal"
      :chat="chatModel"
      :current-draft="props.draft"
      @close="showAiPolishModal = false"
      @insert="(text: string) => emit('update:draft', text)"
    />

    <!-- 快捷话术模板库弹窗 -->
    <CannedResponsesModal
      :open="showCannedModal"
      :customer-name="customerName"
      @close="showCannedModal = false"
      @select="(text: string) => emit('update:draft', text)"
    />

    <ShopifyProductPicker
      :open="showProductPicker"
      :session-id="chatModel.session_id"
      @close="showProductPicker = false"
      @select="insertProduct"
    />

    <!-- WhatsApp 官方报备模板 -->
    <WhatsAppTemplatePicker
      v-if="showTemplateModal"
      :account-id="chatModel.channel_account_id || ''"
      :session-id="chatModel.session_id"
      @close="showTemplateModal = false"
      @sent="showTemplateModal = false; emit('action-toast', 'Meta 官方报备模板已发送', 'success')"
    />
  </main>
</template>

<style scoped>
</style>
