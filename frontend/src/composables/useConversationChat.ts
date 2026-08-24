import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { ChatDetail, Message } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { chatService } from '@/services/chat'
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
    (event: 'chatUpdated', data: ChatDetail): void
    (event: 'clearUnread', sessionId: string): void
  }
) {
  const chat = ref<ChatDetail>(initialChat)
  const newMessage = ref('')
  const messagesContainer = ref<HTMLElement | null>(null)
  const isLoading = ref(false)
  const aiToggleLoading = ref(false)
  const currentUserId = userService.getUserId()
  const templateCanReopen = ref(false)

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
    !isChatClosed.value && !showTakeoverButton.value && !showTakenOverStatus.value && !handledByAI.value
  )

  const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }

  watch(() => chat.value.messages, (messages) => {
    void scrollToBottom()
    if (messages?.[messages.length - 1]?.message_type === 'user') templateCanReopen.value = false
  }, { deep: true })
  watch(() => chat.value.session_id, () => { templateCanReopen.value = false })

  const clearTemplateSuggestion = () => { templateCanReopen.value = false }

  const publishChat = (nextChat: ChatDetail, clearUnread = false) => {
    chat.value = { ...nextChat, messages: [...(nextChat.messages || [])] }
    if (clearUnread) emit('clearUnread', nextChat.session_id)
    emit('chatUpdated', chat.value)
    void scrollToBottom()
  }

  const updateChat = (nextChat: ChatDetail) => publishChat(nextChat, true)
  const replaceChatFromProps = (nextChat: ChatDetail) => {
    chat.value = { ...nextChat, messages: [...(nextChat.messages || [])] }
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

  const sendMessage = async (
    text = newMessage.value,
    isPrivateNote = false,
    files: OutboundFile[] = []
  ) => {
    const messageText = text.trim()
    if ((!messageText && files.length === 0) || !canSendMessage.value) return false

    const clientMessageId = newClientMessageId()
    const timestamp = new Date().toISOString()
    const messageType = isPrivateNote ? 'private_note' : 'agent'
    const local = optimisticMessage(messageText, messageType, clientMessageId, timestamp, files)
    chat.value = {
      ...chat.value,
      messages: [...chat.value.messages, local],
      updated_at: timestamp,
    }
    newMessage.value = ''
    emit('chatUpdated', chat.value)
    void scrollToBottom()

    sendSocketMessage(messageText, messageType, clientMessageId, timestamp, files, {
      attributes: isPrivateNote ? { is_private: true } : undefined,
    })
    if (isPrivateNote) {
      toast.success('内部便签已保存', { description: '仅团队成员可见，客户不会收到此内容', duration: 3000 })
    }
    return true
  }

  const handleTakeover = async () => {
    try {
      isLoading.value = true
      await chatService.takeoverChat(chat.value.session_id)
      toast.success('已接管会话', { description: '现在可以向客户发送消息', duration: 3500 })
      emit('refresh')
    } catch (err: any) {
      toast.error('接管会话失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      isLoading.value = false
    }
  }

  const handleRouteToHuman = async () => {
    try {
      isLoading.value = true
      const updated = await routeChatToHuman(chat.value.session_id)
      if (updated) {
        publishChat(updated, true)
        emit('refresh')
      }
    } finally {
      isLoading.value = false
    }
  }

  const handleHandBackToAI = async () => {
    try {
      isLoading.value = true
      const updated = await chatService.handBackToAI(chat.value.session_id)
      publishChat(updated, true)
      toast.success('已交还给 AI', { description: '后续客户消息将由 AI 自动回复', duration: 3500 })
      emit('refresh')
    } catch (err: any) {
      toast.error('交还 AI 失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      isLoading.value = false
    }
  }

  const toggleAIAutoReply = async (enabled: boolean) => {
    try {
      aiToggleLoading.value = true
      const updated = await chatService.toggleAIAutoReply(chat.value.session_id, enabled)
      publishChat(updated, false)
      toast.success(enabled ? '已开启 AI 自动回复' : '已暂停 AI 自动回复', { duration: 3000 })
      emit('refresh')
    } catch (err: any) {
      toast.error('更新 AI 设置失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      aiToggleLoading.value = false
    }
  }

  const endChat = async (requestRating = true) => {
    if (!canSendMessage.value || isLoading.value) return
    try {
      isLoading.value = true
      const askRating = requestRating && canRequestRating(chat.value.channel)
      const text = endChatMessageFor(chat.value.channel)
      const clientMessageId = newClientMessageId()
      const timestamp = new Date().toISOString()
      const local = optimisticMessage(text, 'system', clientMessageId, timestamp, [], {
        end_chat: true,
        request_rating: askRating,
      })
      chat.value = {
        ...chat.value,
        status: 'closed' as ChatStatus,
        messages: [...chat.value.messages, local],
        updated_at: timestamp,
      }
      emit('chatUpdated', chat.value)
      sendSocketMessage(text, 'system', clientMessageId, timestamp, [], {
        end_chat: true,
        request_rating: askRating,
        end_chat_reason: 'AGENT_REQUEST',
        end_chat_description: 'Agent manually ended the chat',
      })
      toast.success('会话已结束', { description: askRating ? '客户将收到满意度评价邀请' : '会话已归档关闭', duration: 3500 })
      emit('refresh')
      void scrollToBottom()
    } catch (err: any) {
      toast.error('结束会话失败', { description: err.response?.data?.detail || '请稍后重试', duration: 4500 })
    } finally {
      isLoading.value = false
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
    if (data?.type !== 'delivery_error' || data.session_id !== chat.value.session_id) return
    markMessageUndelivered(data.client_message_id)
    if (data.can_template) templateCanReopen.value = true
    toast.error('消息未送达', { description: data.error || '客户渠道拒绝了这条消息', duration: 6000 })
  }

  const setupSocketListeners = () => socketService.on('error', handleDeliveryError)
  const cleanupSocketListeners = () => socketService.off('error', handleDeliveryError)
  const handleSocketReconnect = () => { cleanupSocketListeners(); setupSocketListeners() }

  onMounted(() => { setupSocketListeners(); socketService.onReconnect(handleSocketReconnect) })
  onBeforeUnmount(() => { cleanupSocketListeners(); socketService.offReconnect(handleSocketReconnect) })

  const formattedMessages = computed(() => chat.value.messages.map(message => ({
    ...message,
    timeAgo: formatDistanceToNow(new Date(message.created_at), { addSuffix: true }),
  })))

  const sendPrivateNote = (noteText: string, files: OutboundFile[] = []) => sendMessage(noteText, true, files)

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
    templateCanReopen,
    clearTemplateSuggestion,
  }
}
