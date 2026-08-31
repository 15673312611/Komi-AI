import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { ChatDetail, Message } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { chatService } from '@/services/chat'
import type { Teammate } from '@/services/users'
import { userService } from '@/services/user'
import { socketService } from '@/services/socket'
import { toast } from 'vue-sonner'
import { canRequestRating, endChatMessage as endChatMessageFor } from '@/utils/endChat'
import { canTakeOverChat, chatHandler } from '@/utils/chatState'
import { routeChatToHuman } from '@/utils/chatActions'
import { permissionChecks } from '@/utils/permissions'

export interface OutboundFile {
  content: string
  filename: string
  content_type: string
  size: number
}

type ChatStatus = 'open' | 'closed' | 'transferred'

interface DeliveryErrorEvent {
  error?: string
  type?: string
  session_id?: string
  client_message_id?: string
  can_template?: boolean
}

interface SocketChatReply {
  message_id?: number
  client_message_id?: string
  message?: string
  message_type?: string
  type?: string
  session_id?: string
  created_at?: string
  user_name?: string
  agent_name?: string
  attachments?: Message['attachments']
  attributes?: Record<string, any>
  shopify_output?: Message['shopify_output']
}

const newClientMessageId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function useConversationChat(
  initialChat: ChatDetail,
  emit: {
    (event: 'refresh'): void
    (event: 'chat-updated', data: ChatDetail): void
    (event: 'clear-unread', sessionId: string): void
  }
) {
  const chat = ref<ChatDetail>(initialChat)
  const newMessage = ref('')
  const messagesContainer = ref<HTMLElement | null>(null)
  const isLoading = ref(false)
  const aiToggleLoading = ref(false)
  const pendingCloseClientMessageId = ref<string | null>(null)
  const currentUserId = userService.getUserId()
  const templateCanReopen = ref(false)
  const processedSocketMessages = new Set<string>()
  let joinedSessionId: string | null = null
  let pendingCloseTimer: ReturnType<typeof setTimeout> | undefined
  let chatContextVersion = 0

  const showTakeoverButton = computed(
    () => canTakeOverChat(chat.value) && permissionChecks.canTakeOverChats()
  )
  const handler = computed(() => chatHandler(chat.value, currentUserId))
  const handledByAI = computed(() => handler.value.kind === 'ai')
  const isWaitingForHuman = computed(() => handler.value.kind === 'waiting')
  const isChatClosed = computed(() => handler.value.kind === 'closed')
  const showTakenOverStatus = computed(
    () => handler.value.kind === 'human' && chat.value.user_id !== currentUserId
  )
  const handlerCaption = computed(() => {
    switch (handler.value.kind) {
      case 'ai': return '此会话正在由 AI 智能体自动应答'
      case 'waiting': return '会话已进入人工队列，等待客服接入'
      case 'closed': return '此会话已关闭'
      default: return `此会话由 ${handler.value.label} 负责`
    }
  })
  const canSendMessage = computed(() =>
    !showTakenOverStatus.value
  )

  const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }

  watch(() => chat.value.messages?.length, () => {
    void scrollToBottom()
    const msgs = chat.value.messages
    if (msgs && msgs[msgs.length - 1]?.message_type === 'user') templateCanReopen.value = false
  })
  watch(() => chat.value.session_id, () => { templateCanReopen.value = false })

  const clearTemplateSuggestion = () => { templateCanReopen.value = false }

  const publishChat = (nextChat: ChatDetail, clearUnread = false) => {
    chat.value = { ...nextChat, messages: [...(nextChat.messages || [])] }
    if (clearUnread) emit('clear-unread', nextChat.session_id)
    emit('chat-updated', chat.value)
    void scrollToBottom()
  }

  const updateChat = (nextChat: ChatDetail) => publishChat(nextChat, true)
  const replaceChatFromProps = (nextChat: ChatDetail) => {
    if (chat.value.session_id !== nextChat.session_id) {
      chatContextVersion += 1
      clearPendingClose()
      aiToggleLoading.value = false
    }
    chat.value = { ...nextChat, messages: [...(nextChat.messages || [])] }
  }

  const captureChatContext = () => {
    const sessionId = chat.value.session_id
    const version = chatContextVersion
    return {
      sessionId,
      isCurrent: () => chatContextVersion === version && chat.value.session_id === sessionId,
    }
  }

  const optimisticMessage = (
    text: string,
    messageType: 'agent' | 'private_note' | 'system',
    clientMessageId: string,
    timestamp: string,
    files: OutboundFile[] = [],
    attributes: Record<string, unknown> = {}
  ): Message => ({
    message: text,
    message_type: messageType,
    created_at: timestamp,
    session_id: chat.value.session_id,
    client_message_id: clientMessageId,
    user_name: userService.getUserName() || undefined,
    attributes: {
      ...attributes,
      client_message_id: clientMessageId,
      ...(messageType === 'private_note' ? { is_private: true } : {}),
    },
    ...(files.length ? {
      attachments: files.map((file, index) => ({
        id: -index - 1,
        filename: file.filename,
        file_url: '',
        content_type: file.content_type,
        file_size: file.size,
      })),
    } : {}),
  })

  const sendSocketMessage = (
    text: string,
    messageType: 'agent' | 'private_note' | 'system',
    clientMessageId: string,
    timestamp: string,
    files: OutboundFile[] = [],
    options: Record<string, unknown> = {}
  ) => {
    socketService.emit('agent_message', {
      message: text,
      session_id: chat.value.session_id,
      message_type: messageType,
      created_at: timestamp,
      client_message_id: clientMessageId,
      ...(files.length ? { files } : {}),
      ...options,
    })
  }

  const normaliseMentionedUsers = (users: Teammate[]) => {
    const seen = new Set<string>()
    return users.filter((user) => {
      if (!user?.id || seen.has(user.id)) return false
      seen.add(user.id)
      return true
    }).slice(0, 20)
  }

  const sendMessage = async (
    text = newMessage.value,
    isPrivateNote = false,
    files: OutboundFile[] = [],
    mentionedUsers: Teammate[] = [],
  ) => {
    const messageText = text.trim()
    if ((!messageText && files.length === 0) || !canSendMessage.value) return false

    const mentions = normaliseMentionedUsers(mentionedUsers)
    const clientMessageId = newClientMessageId()
    const timestamp = new Date().toISOString()
    const messageType = isPrivateNote ? 'private_note' : 'agent'

    // If chat was closed or not assigned to current user, auto-reopen and assign
    const wasClosed = isChatClosed.value
    if (wasClosed || chat.value.user_id !== currentUserId) {
      chat.value.status = 'open'
      chat.value.user_id = currentUserId
    }

    const local = optimisticMessage(messageText, messageType, clientMessageId, timestamp, files, {
      ...(isPrivateNote ? { is_private: true } : {}),
      ...(mentions.length ? {
        mentioned_users: mentions.map(user => ({ id: user.id, name: user.full_name || user.email })),
      } : {}),
    })
    chat.value = {
      ...chat.value,
      messages: [...chat.value.messages, local],
      updated_at: timestamp,
    }
    newMessage.value = ''
    emit('chat-updated', chat.value)
    void scrollToBottom()

    sendSocketMessage(messageText, messageType, clientMessageId, timestamp, files, {
      attributes: isPrivateNote ? { is_private: true } : undefined,
      ...(mentions.length ? { mentioned_user_ids: mentions.map(user => user.id) } : {}),
    })
    if (isPrivateNote) {
      toast.success('内部便签已保存', { description: '仅团队成员可见，客户不会收到此内容', duration: 3000 })
    } else if (wasClosed) {
      toast.success('已自动重新开启会话', { description: '已恢复为您的人工接待状态', duration: 3000 })
      emit('refresh')
    }
    return true
  }

  const reopenChat = async () => {
    const context = captureChatContext()
    try {
      isLoading.value = true
      const updated = await chatService.takeoverChat(context.sessionId)
      if (!context.isCurrent()) return
      publishChat(updated, true)
      toast.success('会话已重新开启', { description: '已恢复为您的人工接待会话', duration: 3000 })
      emit('refresh')
    } catch (err: any) {
      if (!context.isCurrent()) return
      toast.error('重新开启失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      if (context.isCurrent()) isLoading.value = false
    }
  }

  const clearPendingClose = () => {
    if (pendingCloseTimer) clearTimeout(pendingCloseTimer)
    pendingCloseTimer = undefined
    pendingCloseClientMessageId.value = null
    isLoading.value = false
  }

  const sendAndResolve = (
    text = newMessage.value,
    files: OutboundFile[] = [],
    mentionedUsers: Teammate[] = [],
  ) => {
    const messageText = text.trim()
    if (
      (!messageText && files.length === 0) ||
      !canSendMessage.value ||
      isLoading.value ||
      pendingCloseClientMessageId.value
    ) return false

    const context = captureChatContext()
    const clientMessageId = newClientMessageId()
    const timestamp = new Date().toISOString()
    const requestRating = canRequestRating(chat.value.channel)
    const mentions = normaliseMentionedUsers(mentionedUsers)
    const closeAttributes = {
      end_chat: true,
      request_rating: requestRating,
      end_chat_reason: 'ISSUE_RESOLVED',
      end_chat_description: 'Agent resolved the conversation with this reply',
      ...(mentions.length ? {
        mentioned_users: mentions.map(user => ({ id: user.id, name: user.full_name || user.email })),
      } : {}),
    }
    const local = optimisticMessage(messageText, 'agent', clientMessageId, timestamp, files, closeAttributes)
    chat.value = {
      ...chat.value,
      messages: [...chat.value.messages, local],
      updated_at: timestamp,
    }
    newMessage.value = ''
    pendingCloseClientMessageId.value = clientMessageId
    isLoading.value = true
    emit('chat-updated', chat.value)
    void scrollToBottom()

    sendSocketMessage(messageText, 'agent', clientMessageId, timestamp, files, {
      ...closeAttributes,
      ...(mentions.length ? { mentioned_user_ids: mentions.map(user => user.id) } : {}),
    })

    // Socket.IO events have no request acknowledgement in the existing wire
    // contract. If a proxy drops the response, use the canonical REST snapshot
    // before allowing another closing reply to be submitted.
    pendingCloseTimer = setTimeout(() => {
      void (async () => {
        if (pendingCloseClientMessageId.value !== clientMessageId || !context.isCurrent()) return
        try {
          const updated = await chatService.getChatDetail(context.sessionId)
          if (!context.isCurrent() || pendingCloseClientMessageId.value !== clientMessageId) return
          if (updated.status === 'closed') {
            clearPendingClose()
            publishChat(updated, true)
            toast.success('会话已结束', {
              description: requestRating ? '客户将收到满意度评价邀请' : '会话已归档关闭',
              duration: 3500,
            })
            emit('refresh')
            return
          }
        } catch {
          // The original message remains visibly failed below so the agent can retry.
        }
        if (!context.isCurrent() || pendingCloseClientMessageId.value !== clientMessageId) return
        markMessageUndelivered(clientMessageId)
        clearPendingClose()
        emit('chat-updated', chat.value)
        toast.error('未能确认会话已结束', { description: '请检查网络后重试', duration: 4500 })
      })()
    }, 10000)

    return true
  }

  const handleTakeover = async () => {
    const context = captureChatContext()
    try {
      isLoading.value = true
      const updated = await chatService.takeoverChat(context.sessionId)
      if (!context.isCurrent()) return
      publishChat(updated, true)
      toast.success('已接管会话', { description: '现在可以向客户发送消息', duration: 3500 })
      emit('refresh')
    } catch (err: any) {
      if (!context.isCurrent()) return
      toast.error('接管会话失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      if (context.isCurrent()) isLoading.value = false
    }
  }

  const handleRouteToHuman = async () => {
    const context = captureChatContext()
    try {
      isLoading.value = true
      const updated = await routeChatToHuman(context.sessionId)
      if (!context.isCurrent()) return
      if (updated) {
        publishChat(updated, true)
        emit('refresh')
      }
    } finally {
      if (context.isCurrent()) isLoading.value = false
    }
  }

  const handleHandBackToAI = async () => {
    const context = captureChatContext()
    try {
      isLoading.value = true
      const updated = await chatService.handBackToAI(context.sessionId)
      if (!context.isCurrent()) return
      publishChat(updated, true)
      toast.success('已交还给 AI', { description: '后续客户消息将由 AI 自动回复', duration: 3500 })
      emit('refresh')
    } catch (err: any) {
      if (!context.isCurrent()) return
      toast.error('交还 AI 失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      if (context.isCurrent()) isLoading.value = false
    }
  }

  const toggleAIAutoReply = async (enabled: boolean) => {
    const context = captureChatContext()
    try {
      aiToggleLoading.value = true
      const updated = await chatService.toggleAIAutoReply(context.sessionId, enabled)
      if (!context.isCurrent()) return
      publishChat(updated, false)
      toast.success(enabled ? '已开启 AI 自动回复' : '已暂停 AI 自动回复', { duration: 3000 })
      emit('refresh')
    } catch (err: any) {
      if (!context.isCurrent()) return
      toast.error('更新 AI 设置失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      if (context.isCurrent()) aiToggleLoading.value = false
    }
  }

  const endChat = async (requestRating = true) => {
    if (!canSendMessage.value || isLoading.value) return
    const context = captureChatContext()
    try {
      isLoading.value = true
      const askRating = requestRating && canRequestRating(chat.value.channel)
      const text = endChatMessageFor(chat.value.channel)
      const clientMessageId = newClientMessageId()
      const updated = await chatService.endChat(context.sessionId, {
        message: text,
        request_rating: askRating,
        end_chat_reason: 'ISSUE_RESOLVED',
        end_chat_description: 'Agent manually ended the chat',
        client_message_id: clientMessageId,
      })
      if (!context.isCurrent()) return
      publishChat(updated, true)
      toast.success('会话已结束', { description: askRating ? '客户将收到满意度评价邀请' : '会话已归档关闭', duration: 3500 })
      emit('refresh')
      void scrollToBottom()
    } catch (err: any) {
      if (!context.isCurrent()) return
      toast.error('结束会话失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      if (context.isCurrent()) isLoading.value = false
    }
  }

  const markMessageUndelivered = (clientMessageId?: string) => {
    const messages = chat.value.messages
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      if (message.message_type !== 'agent' || message.attributes?.delivery_status) continue
      if (clientMessageId && message.client_message_id !== clientMessageId && message.attributes?.client_message_id !== clientMessageId) continue
      message.attributes = { ...(message.attributes || {}), delivery_status: 'failed' }
      return
    }
  }

  const handleDeliveryError = (data: DeliveryErrorEvent) => {
    const isPendingCloseError = Boolean(pendingCloseClientMessageId.value) &&
      (!data?.session_id || data.session_id === chat.value.session_id)
    if (isPendingCloseError) {
      markMessageUndelivered(data.client_message_id || pendingCloseClientMessageId.value || undefined)
      clearPendingClose()
      emit('chat-updated', chat.value)
      toast.error('发送并解决会话失败', { description: data.error || '请稍后重试', duration: 6000 })
      return
    }
    if (data?.type !== 'delivery_error' || data.session_id !== chat.value.session_id) return
    markMessageUndelivered(data.client_message_id)
    if (data.can_template) templateCanReopen.value = true
    toast.error('消息未送达', { description: data.error || '客户渠道拒绝了这条消息', duration: 6000 })
  }

  const socketMessageKey = (data: SocketChatReply) => String(
    data.message_id ||
    data.client_message_id ||
    data.attributes?.client_message_id ||
    `${data.session_id}-${data.created_at}-${data.message_type || data.type || 'message'}`
  )

  const rememberSocketMessage = (key: string) => {
    if (processedSocketMessages.has(key)) return false
    processedSocketMessages.add(key)
    if (processedSocketMessages.size > 1000) {
      const first = processedSocketMessages.values().next().value
      if (first) processedSocketMessages.delete(first)
    }
    return true
  }

  const socketMessage = (data: SocketChatReply): Message => {
    const attributes = { ...(data.attributes || {}) }
    const clientMessageId = data.client_message_id || attributes.client_message_id
    if (clientMessageId) attributes.client_message_id = clientMessageId
    return {
      id: data.message_id,
      client_message_id: clientMessageId,
      message: data.message || '',
      message_type: data.message_type || (data.type === 'agent_message' ? 'agent' : data.type || 'bot'),
      created_at: data.created_at || new Date().toISOString(),
      session_id: data.session_id || chat.value.session_id,
      user_name: data.user_name,
      agent_name: data.agent_name,
      attachments: data.attachments,
      attributes,
      shopify_output: data.shopify_output || attributes.shopify_output,
    }
  }

  const existingMessageIndex = (messages: Message[], incoming: Message) => {
    if (incoming.id !== undefined && incoming.id !== null) {
      const byId = messages.findIndex(message => message.id === incoming.id)
      if (byId !== -1) return byId
    }
    const clientMessageId = incoming.client_message_id || incoming.attributes?.client_message_id
    return clientMessageId
      ? messages.findIndex(message => message.client_message_id === clientMessageId || message.attributes?.client_message_id === clientMessageId)
      : -1
  }

  const isAiTyping = ref(false)
  const typingMessage = ref('AI 智能体正在检索知识库并组织回复…')

  const handleBotTyping = (data: any) => {
    if (!data?.session_id || data.session_id === chat.value.session_id) {
      isAiTyping.value = Boolean(data?.is_typing ?? true)
      if (data?.status_text) {
        typingMessage.value = String(data.status_text)
      } else {
        typingMessage.value = 'AI 智能体正在检索知识库并组织回复…'
      }
    }
  }

  const handleChatReply = (data: SocketChatReply) => {
    if (!data?.session_id || data.session_id !== chat.value.session_id) return
    isAiTyping.value = false
    if (!rememberSocketMessage(socketMessageKey(data))) return
    const incoming = socketMessage(data)
    const messages = [...chat.value.messages]
    const existingIndex = existingMessageIndex(messages, incoming)
    if (existingIndex >= 0) messages.splice(existingIndex, 1, incoming)
    else messages.push(incoming)

    const isClosingReply = Boolean(
      pendingCloseClientMessageId.value &&
      (incoming.client_message_id || incoming.attributes?.client_message_id) === pendingCloseClientMessageId.value
    )
    if (isClosingReply) {
      const requestRating = Boolean(incoming.attributes?.request_rating)
      clearPendingClose()
      publishChat({ ...chat.value, messages, status: 'closed', updated_at: incoming.created_at }, true)
      toast.success('会话已结束', {
        description: requestRating ? '客户将收到满意度评价邀请' : '会话已归档关闭',
        duration: 3500,
      })
      emit('refresh')
      return
    }
    publishChat({ ...chat.value, messages, updated_at: incoming.created_at })
  }

  const joinChatRoom = (sessionId: string) => {
    if (!sessionId || joinedSessionId === sessionId) return
    if (joinedSessionId) socketService.emit('leave_room', { session_id: joinedSessionId })
    socketService.emit('join_room', { session_id: sessionId })
    joinedSessionId = sessionId
  }

  const setupSocketListeners = () => {
    socketService.connect()
    socketService.on('error', handleDeliveryError)
    socketService.on('chat_reply', handleChatReply)
    socketService.on('bot_typing', handleBotTyping)
    joinChatRoom(chat.value.session_id)
  }
  const cleanupSocketListeners = () => {
    socketService.off('error', handleDeliveryError)
    socketService.off('chat_reply', handleChatReply)
    socketService.off('bot_typing', handleBotTyping)
  }
  const handleSocketReconnect = () => { cleanupSocketListeners(); setupSocketListeners() }

  onMounted(() => { setupSocketListeners(); socketService.onReconnect(handleSocketReconnect) })
  onBeforeUnmount(() => {
    if (pendingCloseTimer) clearTimeout(pendingCloseTimer)
    if (joinedSessionId) socketService.emit('leave_room', { session_id: joinedSessionId })
    cleanupSocketListeners()
    socketService.offReconnect(handleSocketReconnect)
  })

  watch(() => chat.value.session_id, sessionId => joinChatRoom(sessionId))

  const safeTimeAgo = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true })
  }

  const formattedMessages = computed(() => (chat.value?.messages || []).map(message => ({
    ...message,
    timeAgo: safeTimeAgo(message.created_at),
  })))

  const sendPrivateNote = (
    noteText: string,
    files: OutboundFile[] = [],
    mentionedUsers: Teammate[] = [],
  ) => sendMessage(noteText, true, files, mentionedUsers)

  return {
    chat,
    newMessage,
    messagesContainer,
    formattedMessages,
    isLoading,
    aiToggleLoading,
    showTakeoverButton,
    showTakenOverStatus,
    isChatClosed,
    canSendMessage,
    scrollToBottom,
    sendMessage,
    sendAndResolve,
    handleTakeover,
    handleRouteToHuman,
    handleHandBackToAI,
    toggleAIAutoReply,
    sendPrivateNote,
    isWaitingForHuman,
    handlerCaption,
    updateChat,
    replaceChatFromProps,
    handledByAI,
    endChat,
    reopenChat,
    templateCanReopen,
    clearTemplateSuggestion,
    isAiTyping,
    typingMessage,
  }
}
