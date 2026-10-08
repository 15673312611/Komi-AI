import { ref, computed, watch, onMounted, onBeforeUnmount, reactive } from 'vue'
import type { Conversation, ChatDetail, Message } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { chatService } from '@/services/chat'
import { socketService } from '@/services/socket'
import { userService } from '@/services/user'

interface SocketMessage {
  message?: string
  type?: string
  message_type?: string
  message_id?: number
  client_message_id?: string
  agent_name?: string
  user_name?: string
  user_id?: string
  created_at: string
  session_id: string
  attributes?: Record<string, any>
  attachments?: any[]
}

interface RoomEvent {
  type?: string
  session_id?: string
  chat?: ChatDetail
}

export function useConversationsList(props: {
  conversations: Conversation[]
  loading: boolean
  error: string
  hasMore?: boolean
  loadingMore?: boolean
}, emit: {
  (e: 'refresh'): void
  (e: 'chatUpdated', data: ChatDetail): void
  (e: 'clearUnread', sessionId: string): void
  (e: 'updateFilter', status: 'open' | 'closed'): void
  (e: 'loadMore'): void
}) {
  const selectedChat = ref<ChatDetail | null>(null)
  const selectedId = ref<string | null>(null)
  const chatLoading = ref(false)
  const currentUserId = userService.getUserId()
  const unreadMessages = reactive<Record<string, number>>({})
  const processedMessages = new Set<string>()
  let detailRequestVersion = 0

  const safeIsoTimestamp = (value: unknown): string => {
    const date = new Date(typeof value === 'string' || typeof value === 'number' ? value : NaN)
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  const messageKey = (data: SocketMessage) => String(
    data.message_id ||
    data.client_message_id ||
    data.attributes?.client_message_id ||
    `${data.session_id}-${data.created_at}-${data.message_type || data.type || 'message'}`
  )

  const rememberMessage = (key: string) => {
    if (processedMessages.has(key)) return false
    processedMessages.add(key)
    if (processedMessages.size > 1000) {
      const first = processedMessages.values().next().value
      if (first) processedMessages.delete(first)
    }
    return true
  }

  const normalizeMessage = (data: SocketMessage): Message => {
    const createdAt = safeIsoTimestamp(data.created_at)
    const messageType = data.message_type || (data.type === 'agent_message' ? 'agent' : data.type || 'bot')
    const attributes = { ...(data.attributes || {}) }
    const clientMessageId = data.client_message_id || attributes.client_message_id
    if (clientMessageId) attributes.client_message_id = clientMessageId
    const normalized: Message = {
      id: data.message_id,
      client_message_id: clientMessageId,
      message: typeof data.message === 'string' ? data.message : '',
      message_type: messageType,
      created_at: createdAt,
      session_id: data.session_id,
      attributes,
      agent_name: data.agent_name,
      user_name: data.user_name,
      attachments: data.attachments || undefined,
    }
    if (attributes.shopify_output && typeof attributes.shopify_output === 'object') {
      normalized.message_type = 'product'
      normalized.shopify_output = attributes.shopify_output
    }
    return normalized
  }

  const findExistingMessageIndex = (messages: Message[], incoming: Message) => {
    if (incoming.id !== undefined && incoming.id !== null) {
      const byId = messages.findIndex(message => message.id === incoming.id)
      if (byId !== -1) return byId
    }
    const clientId = incoming.client_message_id || incoming.attributes?.client_message_id
    if (clientId) {
      const byClientId = messages.findIndex(message =>
        message.client_message_id === clientId || message.attributes?.client_message_id === clientId
      )
      if (byClientId !== -1) return byClientId
    }
    return -1
  }

  const handleChatReply = (data: SocketMessage) => {
    if (!data || typeof data.session_id !== 'string' || !data.session_id || !data.created_at) return
    const key = messageKey(data)
    if (!rememberMessage(key)) return
    const incoming = normalizeMessage(data)
    const isOwnAgentEcho = Boolean(data.user_id && String(data.user_id) === String(currentUserId))

    if (selectedId.value !== data.session_id && !isOwnAgentEcho) {
      unreadMessages[data.session_id] = (unreadMessages[data.session_id] || 0) + 1
    }

    if (!selectedChat.value || selectedId.value !== data.session_id) return
    const messages = [...(selectedChat.value.messages || [])]
    const existingIndex = findExistingMessageIndex(messages, incoming)
    if (existingIndex >= 0) messages.splice(existingIndex, 1, incoming)
    else messages.push(incoming)
    const updatedChat: ChatDetail = {
      ...selectedChat.value,
      messages,
      updated_at: incoming.created_at,
      ai_auto_reply: selectedChat.value.ai_auto_reply,
    }
    selectedChat.value = updatedChat
    emit('chatUpdated', updatedChat)
  }

  const handleRoomEvent = (data: RoomEvent) => {
    if (data?.type !== 'conversation_updated' || !data.chat || typeof data.session_id !== 'string' || !data.session_id) return
    if (selectedId.value === data.session_id) selectedChat.value = data.chat
    emit('chatUpdated', data.chat)
  }

  const setupSocketListeners = () => {
    socketService.on('chat_reply', handleChatReply)
    socketService.on('room_event', handleRoomEvent)
  }
  const cleanupSocketListeners = () => {
    socketService.off('chat_reply', handleChatReply)
    socketService.off('room_event', handleRoomEvent)
  }
  const handleSocketReconnect = () => {
    cleanupSocketListeners()
    setupSocketListeners()
    const userId = userService.getUserId()
    if (userId) socketService.emit('join_room', { session_id: `user_${userId}` })
  }

  const loadChatDetail = async (sessionId: string, force = false) => {
    if (!force && selectedChat.value?.session_id === sessionId) return
    const requestVersion = ++detailRequestVersion
    try {
      chatLoading.value = true
      selectedId.value = sessionId
      if (selectedChat.value?.session_id !== sessionId) selectedChat.value = null
      const detail = await chatService.getChatDetail(sessionId)
      if (requestVersion !== detailRequestVersion || selectedId.value !== sessionId) return
      selectedChat.value = detail
      if (unreadMessages[sessionId]) {
        delete unreadMessages[sessionId]
        emit('clearUnread', sessionId)
      }
    } catch (err) {
      console.error('Failed to load chat:', err)
    } finally {
      if (requestVersion === detailRequestVersion) chatLoading.value = false
    }
  }

  watch(() => props.conversations, (items) => {
    if (!items.length && selectedId.value) {
      detailRequestVersion++
      selectedId.value = null
      selectedChat.value = null
      chatLoading.value = false
    }
  }, { immediate: true })

  const formattedConversations = computed(() => {
    if (!Array.isArray(props.conversations)) return []
    return props.conversations.map(conv => ({
      ...conv,
      timeAgo: (() => {
        const updatedAt = new Date(conv.updated_at)
        return Number.isNaN(updatedAt.getTime())
          ? '—'
          : formatDistanceToNow(updatedAt, { addSuffix: true })
      })(),
      message_type: conv.attributes?.message_type || 'text',
      shopify_output: conv.attributes?.shopify_output,
    }))
  })

  onMounted(() => {
    socketService.connect()
    setupSocketListeners()
    socketService.onReconnect(handleSocketReconnect)
    const userId = userService.getUserId()
    if (userId) socketService.emit('join_room', { session_id: `user_${userId}` })
  })
  onBeforeUnmount(() => {
    detailRequestVersion++
    const userId = userService.getUserId()
    if (userId) socketService.emit('leave_room', { session_id: `user_${userId}` })
    cleanupSocketListeners()
    socketService.offReconnect(handleSocketReconnect)
  })

  const clearUnread = (sessionId: string) => { delete unreadMessages[sessionId] }

  return { selectedChat, selectedId, chatLoading, formattedConversations, loadChatDetail, unreadMessages, clearUnread }
}
