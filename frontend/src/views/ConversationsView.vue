<!--
Copyright 2024-2026 ChatterMate
多渠道跨境电商 AI + 人工客服三栏工作台核心视图 (ConversationsView.vue)
-->

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ConversationsList from '@/components/conversations/ConversationsList.vue'
import ConversationChat from '@/components/conversations/ConversationChat.vue'
import ChatInfoPanel from '@/components/conversations/ChatInfoPanel.vue'
import TrackingTimelineModal from '@/components/conversations/TrackingTimelineModal.vue'
import SessionTransferModal from '@/components/conversations/SessionTransferModal.vue'
import { chatService } from '@/services/chat'
import { socketService } from '@/services/socket'
import { userService } from '@/services/user'
import { listTeammates, type Teammate } from '@/services/users'
import { agentService } from '@/services/agent'
import type { FilterValues } from '@/components/conversations/ConversationFilters.vue'
import type { Conversation, ChatDetail } from '@/types/chat'
import { toast } from 'vue-sonner'

// 会话状态
const route = useRoute()
const router = useRouter()
const activeSessionId = ref<string | null>(typeof route.query.session === 'string' ? route.query.session : null)
const conversations = ref<Conversation[]>([])
const loading = ref(true)
const loadingMoreConversations = ref(false)
const hasMoreConversations = ref(false)
const error = ref('')
const showRightDrawer = ref(true)
const showTrackingModal = ref(false)
const showTransferModal = ref(false)
const currentOrderForTracking = ref<any>(null)
const currentChatDetail = ref<ChatDetail | null>(null)
const transferLoading = ref(false)
const composerDraft = ref('')
const unreadCounts = ref<Record<string, number>>({})
const processedReplyKeys = new Set<string>()
let conversationsRequest = 0
let chatDetailRequest = 0
let unreadCountsRequest = 0
let unreadCountsVersion = 0
const readRequests = new Set<string>()
const CONVERSATIONS_PAGE_SIZE = 100
const filterValues = ref<FilterValues>({
  customerEmailFilter: '',
  agentFilter: '',
  userFilter: '',
  dateFromFilter: '',
  dateToFilter: '',
})
const showFilters = ref(false)
const filterUsers = ref<Teammate[]>([])
const filterAgents = ref<Array<{ id: string; name: string; display_name: string | null }>>([])
const loadingFilterUsers = ref(false)
const loadingFilterAgents = ref(false)
let filterOptionsRequest = 0

const chatListParams = (paging: { skip?: number; limit: number }) => {
  const params: Record<string, string | number> = { ...paging }
  const values = filterValues.value
  if (values.customerEmailFilter.trim()) params.customer_email = values.customerEmailFilter.trim()
  if (values.agentFilter.trim()) params.agent_id = values.agentFilter.trim()
  if (values.userFilter.trim()) params.user_id = values.userFilter.trim()
  if (values.dateFromFilter) params.date_from = `${values.dateFromFilter}T00:00:00Z`
  if (values.dateToFilter) params.date_to = `${values.dateToFilter}T23:59:59.999Z`
  return params
}

const loadFilterOptions = async () => {
  const request = ++filterOptionsRequest
  loadingFilterUsers.value = true
  loadingFilterAgents.value = true
  const [users, agents] = await Promise.allSettled([listTeammates(), agentService.getAgentRoster()])
  if (request !== filterOptionsRequest) return
  filterUsers.value = users.status === 'fulfilled' ? users.value : []
  filterAgents.value = agents.status === 'fulfilled' ? agents.value : []
  loadingFilterUsers.value = false
  loadingFilterAgents.value = false
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
  if (showFilters.value && !filterUsers.value.length && !filterAgents.value.length) void loadFilterOptions()
}

const resetActiveSessionForFilter = () => {
  chatDetailRequest += 1
  activeSessionId.value = null
  currentChatDetail.value = null
  const query = { ...route.query }
  delete query.session
  router.replace({ query })
}

const applyFilters = (nextFilters: FilterValues) => {
  filterValues.value = { ...nextFilters }
  showFilters.value = false
  resetActiveSessionForFilter()
  void loadConversations()
}

const clearFilters = () => {
  filterValues.value = {
    customerEmailFilter: '',
    agentFilter: '',
    userFilter: '',
    dateFromFilter: '',
    dateToFilter: '',
  }
  showFilters.value = false
  resetActiveSessionForFilter()
  void loadConversations()
}

const isPrivateMessage = (message: { message_type?: string; attributes?: Record<string, unknown> }) =>
  message.message_type === 'private_note' || message.attributes?.is_private === true

const customerVisiblePreview = (messages: ChatDetail['messages']) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (!isPrivateMessage(message) && typeof message.message === 'string' && message.message.trim()) {
      return message.message
    }
  }
  return undefined
}

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

const loadConversations = async () => {
  const request = ++conversationsRequest
  loading.value = true
  error.value = ''
  try {
    const loaded = await chatService.getRecentChats(chatListParams({ limit: CONVERSATIONS_PAGE_SIZE }))
    if (request !== conversationsRequest) return
    conversations.value = loaded
    hasMoreConversations.value = loaded.length === CONVERSATIONS_PAGE_SIZE
    if (!activeSessionId.value && conversations.value.length) activeSessionId.value = conversations.value[0].session_id
    void loadUnreadCounts()
  } catch (err: any) {
    if (request !== conversationsRequest) return
    error.value = err?.response?.data?.detail || '会话列表加载失败，请稍后重试'
    hasMoreConversations.value = false
  } finally {
    if (request === conversationsRequest) loading.value = false
  }
}

const loadMoreConversations = async () => {
  if (loading.value || loadingMoreConversations.value || !hasMoreConversations.value) return
  const skip = conversations.value.length
  const request = ++conversationsRequest
  loadingMoreConversations.value = true
  try {
    const loaded = await chatService.getRecentChats(chatListParams({ skip, limit: CONVERSATIONS_PAGE_SIZE }))
    if (request !== conversationsRequest) return
    const existingBySession = new Map(conversations.value.map(item => [item.session_id, item]))
    for (const conversation of loaded) existingBySession.set(conversation.session_id, conversation)
    conversations.value = [...existingBySession.values()]
    hasMoreConversations.value = loaded.length === CONVERSATIONS_PAGE_SIZE
    void loadUnreadCounts()
  } catch (err: any) {
    if (request !== conversationsRequest) return
    addToast(err?.response?.data?.detail || '加载更多会话失败，请稍后重试', 'error')
  } finally {
    if (request === conversationsRequest) loadingMoreConversations.value = false
  }
}

const loadUnreadCounts = async () => {
  const request = ++unreadCountsRequest
  const version = unreadCountsVersion
  try {
    const result = await chatService.getThreadUnreadCounts()
    // A realtime event or local read can happen while the REST request is in
    // flight. Never replace that newer UI state with the older response.
    if (request === unreadCountsRequest && version === unreadCountsVersion) {
      unreadCounts.value = result.counts || {}
    }
  } catch {
    // The conversation list remains usable if a transient unread-count request
    // fails; the next refresh/reconnect restores the server-backed badges.
  }
}

const markSessionRead = async (sessionId: string) => {
  if (!sessionId || readRequests.has(sessionId)) return
  readRequests.add(sessionId)
  try {
    await chatService.markChatRead(sessionId)
  } catch {
    // Restore the authoritative server value when the acknowledgement did not
    // persist. This avoids silently dropping a badge after a network failure.
    void loadUnreadCounts()
  } finally {
    readRequests.delete(sessionId)
  }
}

const loadChatDetail = async (sessionId: string) => {
  const request = ++chatDetailRequest
  try {
    const detail = await chatService.getChatDetail(sessionId)
    if (request !== chatDetailRequest || activeSessionId.value !== sessionId) return
    currentChatDetail.value = detail
  } catch (err: any) {
    if (request !== chatDetailRequest || activeSessionId.value !== sessionId) return
    toast.error('会话详情加载失败', { description: err?.response?.data?.detail || '请稍后重试' })
    currentChatDetail.value = null
  }
}

const handleSelectSession = (sessionId: string) => {
  activeSessionId.value = sessionId
  composerDraft.value = ''
  clearUnread(sessionId)
  router.replace({ query: { ...route.query, session: sessionId } })
  void loadChatDetail(sessionId)
}

const handleNewConversationStarted = async (sessionId: string) => {
  await loadConversations()
  handleSelectSession(sessionId)
}

const handleOpenTracking = (order: any) => {
  currentOrderForTracking.value = order
  showTrackingModal.value = true
}

const handleTransfer = async (targetUserId: string, note: string) => {
  if (!activeSessionId.value) return
  transferLoading.value = true
  try {
    const updated = await chatService.reassignChat(activeSessionId.value, targetUserId, note)
    updateFromChat(updated)
    showTransferModal.value = false
    await loadConversations()
    addToast('会话已成功转派', 'success')
  } catch (err: any) {
    addToast(err?.response?.data?.detail || '转派失败，请稍后重试', 'error')
  } finally { transferLoading.value = false }
}

const handleHandBackToAI = async () => {
  if (!activeSessionId.value || transferLoading.value) return
  transferLoading.value = true
  try {
    const updated = await chatService.handBackToAI(activeSessionId.value)
    updateFromChat(updated)
    showTransferModal.value = false
    await loadConversations()
    addToast('会话已交还给 AI 自动回复', 'success')
  } catch (err: any) {
    addToast(err?.response?.data?.detail || '交还 AI 失败，请稍后重试', 'error')
  } finally {
    transferLoading.value = false
  }
}

const updateFromChat = (chat: ChatDetail) => {
  if (chat.session_id === activeSessionId.value) {
    // A canonical realtime snapshot is newer than any pending REST detail
    // request. Invalidate that request so it cannot roll back a transfer,
    // tag change, or newly received message after it resolves.
    chatDetailRequest += 1
    currentChatDetail.value = chat
  }
  const index = conversations.value.findIndex(item => item.session_id === chat.session_id)
  if (index >= 0) {
    const lastMessage = customerVisiblePreview(chat.messages)
    conversations.value[index] = {
      ...conversations.value[index], status: chat.status, user_id: chat.user_id, user_name: chat.user_name,
      updated_at: chat.updated_at, message_count: chat.messages.length,
      last_message: lastMessage || conversations.value[index].last_message,
    }
    conversations.value.sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at))
  } else {
    // A reassignment can make an existing thread visible to this inbox. Fetch
    // the scoped list rather than inventing incomplete customer/agent fields.
    void loadConversations()
  }
}

const handleRoomEvent = (event: any) => {
  if (event?.type === 'conversation_removed' && typeof event.session_id === 'string') {
    const removedSessionId = event.session_id
    const nextConversations = conversations.value.filter(item => item.session_id !== removedSessionId)
    if (nextConversations.length === conversations.value.length) return
    conversations.value = nextConversations
    unreadCountsVersion += 1
    if (unreadCounts.value[removedSessionId]) {
      const nextUnread = { ...unreadCounts.value }
      delete nextUnread[removedSessionId]
      unreadCounts.value = nextUnread
    }
    if (activeSessionId.value === removedSessionId) {
      // The server has revoked visibility (usually a reassignment). Invalidate
      // an in-flight detail request before clearing the data it could restore.
      chatDetailRequest += 1
      currentChatDetail.value = null
      const nextSessionId = nextConversations[0]?.session_id || null
      activeSessionId.value = nextSessionId
      const query = { ...route.query }
      if (nextSessionId) query.session = nextSessionId
      else delete query.session
      router.replace({ query })
      if (nextSessionId) void loadChatDetail(nextSessionId)
    }
    return
  }
  if (event?.type !== 'conversation_updated' || !event.chat) return
  const index = conversations.value.findIndex(item => item.session_id === event.chat.session_id)
  if (index >= 0 && event.chat.session_id !== activeSessionId.value) {
    const priorCount = conversations.value[index].message_count || 0
    const newMessages = (event.chat.messages || []).slice(priorCount)
    const newCustomerMessages = newMessages.filter((message: any) => message.message_type === 'user').length
    if (newCustomerMessages) {
      unreadCountsVersion += 1
      unreadCounts.value = {
        ...unreadCounts.value,
        [event.chat.session_id]: (unreadCounts.value[event.chat.session_id] || 0) + newCustomerMessages,
      }
    }
  }
  updateFromChat(event.chat)
}

const clearUnread = (sessionId: string) => {
  unreadCountsVersion += 1
  if (unreadCounts.value[sessionId]) {
    const next = { ...unreadCounts.value }
    delete next[sessionId]
    unreadCounts.value = next
  }
  void markSessionRead(sessionId)
}

const handleConversationRead = (event: any) => {
  const sessionId = typeof event?.session_id === 'string' ? event.session_id : ''
  if (!sessionId || !unreadCounts.value[sessionId]) return
  unreadCountsVersion += 1
  const next = { ...unreadCounts.value }
  delete next[sessionId]
  unreadCounts.value = next
}

const rememberReply = (event: any) => {
  const key = String(
    event?.message_id || event?.client_message_id || event?.attributes?.client_message_id ||
    `${event?.session_id}-${event?.created_at || event?.timestamp}-${event?.message_type || event?.type}`,
  )
  if (processedReplyKeys.has(key)) return false
  processedReplyKeys.add(key)
  if (processedReplyKeys.size > 1000) {
    const first = processedReplyKeys.values().next().value
    if (first) processedReplyKeys.delete(first)
  }
  return true
}

const handleChatReply = (event: any) => {
  const sessionId = typeof event?.session_id === 'string' ? event.session_id : ''
  const createdAt = event?.created_at || event?.timestamp
  if (!sessionId || !createdAt || !rememberReply(event)) return

  const index = conversations.value.findIndex(item => item.session_id === sessionId)
  if (index < 0) {
    // User-room delivery can expose a newly assigned thread before the next
    // list refresh. Let the scoped REST endpoint establish its full shape.
    void loadConversations()
    return
  }
  const messageType = event.message_type || event.type || ''
  const isPrivate = messageType === 'private_note' || event.attributes?.is_private === true
  const isCustomerMessage = messageType === 'user' || messageType === 'user_message'
  const isOwnMessage = Boolean(event.user_id && String(event.user_id) === String(userService.getUserId()))
  if (sessionId !== activeSessionId.value && isCustomerMessage && !isOwnMessage) {
    unreadCountsVersion += 1
    unreadCounts.value = {
      ...unreadCounts.value,
      [sessionId]: (unreadCounts.value[sessionId] || 0) + 1,
    }
  }

  const updated = {
    ...conversations.value[index],
    updated_at: createdAt,
    last_message: !isPrivate && typeof event.message === 'string' && event.message.trim()
      ? event.message
      : conversations.value[index].last_message,
    message_count: Math.max(0, conversations.value[index].message_count + 1),
  }
  conversations.value.splice(index, 1)
  conversations.value.unshift(updated)
}

const joinUserRoom = () => {
  const userId = userService.getUserId()
  if (userId) socketService.emit('join_room', { session_id: `user_${userId}` })
}
const handleSocketReconnect = () => {
  joinUserRoom()
  void loadUnreadCounts()
}

onMounted(async () => {
  await loadConversations()
  if (activeSessionId.value) {
    await loadChatDetail(activeSessionId.value)
    clearUnread(activeSessionId.value)
    void loadUnreadCounts()
  }
  socketService.connect()
  socketService.on('room_event', handleRoomEvent)
  socketService.on('chat_reply', handleChatReply)
  socketService.on('conversation_read', handleConversationRead)
  socketService.onReconnect(handleSocketReconnect)
  joinUserRoom()
})
onBeforeUnmount(() => {
  const userId = userService.getUserId()
  if (userId) socketService.emit('leave_room', { session_id: `user_${userId}` })
  socketService.off('room_event', handleRoomEvent)
  socketService.off('chat_reply', handleChatReply)
  socketService.off('conversation_read', handleConversationRead)
  socketService.offReconnect(handleSocketReconnect)
})
watch(() => route.query.session, value => {
  const id = typeof value === 'string' ? value : null
  if (id && id !== activeSessionId.value) { activeSessionId.value = id; void loadChatDetail(id) }
})
watch(activeSessionId, () => {
  // Drafts and action dialogs always belong to exactly one thread. Keeping
  // them open across navigation could apply an old order or transfer intent to
  // the newly selected customer.
  composerDraft.value = ''
  showTrackingModal.value = false
  currentOrderForTracking.value = null
  showTransferModal.value = false
})
</script>

<template>
  <DashboardLayout :hide-header="true">
    <div class="h-full w-full bg-[#080B11] text-slate-100 antialiased overflow-hidden flex select-none font-sans relative">
      <!-- 1. 会话导航栏：3+2 零横向滚动状态矩阵 (320px) -->
      <ConversationsList
        :active-session-id="activeSessionId"
        :conversations="conversations"
        :unread-counts="unreadCounts"
        :loading="loading"
        :loading-more="loadingMoreConversations"
        :has-more="hasMoreConversations"
        :error="error"
        :show-filters="showFilters"
        :filter-values="filterValues"
        :filter-users="filterUsers"
        :filter-agents="filterAgents"
        :loading-filter-users="loadingFilterUsers"
        :loading-filter-agents="loadingFilterAgents"
        @select-session="handleSelectSession"
        @clear-unread="clearUnread"
        @refresh="loadConversations"
        @load-more="loadMoreConversations"
        @toggle-filters="toggleFilters"
        @apply-filters="applyFilters"
        @clear-filters="clearFilters"
        @update-filter-values="filterValues = $event"
        @new-conversation-started="handleNewConversationStarted"
        @action-toast="addToast"
      />

      <!-- 2. 中栏：聊天流与多模式回复区 (Flex-1 大气主屏) -->
      <ConversationChat
        :chat="currentChatDetail"
        :draft="composerDraft"
        @chat-updated="updateFromChat"
        @clear-unread="clearUnread"
        @update:draft="composerDraft = $event"
        @toggle-right-drawer="showRightDrawer = !showRightDrawer"
        @open-transfer="showTransferModal = true"
        @refresh="loadConversations"
        @action-toast="addToast"
      />

      <!-- 3. 右栏：客户 360° 画像与 Shopify 订单上下文 (340px 豪华面板) -->
      <ChatInfoPanel
        v-if="showRightDrawer"
        :chat-info="currentChatDetail"
        @chat-updated="updateFromChat"
        @open-tracking="handleOpenTracking"
        @open-transfer="showTransferModal = true"
        @select-session="handleSelectSession"
        @action-toast="addToast"
      />

      <!-- 物流全球实时轨迹弹窗 -->
      <TrackingTimelineModal
        :show="showTrackingModal"
        :order="currentOrderForTracking"
        @close="showTrackingModal = false"
        @send-to-chat="(msg: string) => { composerDraft = msg; addToast('物流信息已插入回复草稿', 'success') }"
        @action-toast="addToast"
      />

      <!-- 会话团队转派弹窗 -->
      <SessionTransferModal
        :show="showTransferModal"
        :action-loading="transferLoading"
        :current-user-id="currentChatDetail?.user_id"
        :customer-name="currentChatDetail?.customer?.full_name"
        @close="showTransferModal = false"
        @transfer="handleTransfer"
        @hand-back-to-ai="handleHandBackToAI"
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
