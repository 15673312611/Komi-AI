/*
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
*/

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ConversationsView from '../../views/ConversationsView.vue'
import { createPinia, setActivePinia } from 'pinia'

const socketHandlers = vi.hoisted(() => ({
  callbacks: new Map<string, (data: any) => void>(),
}))

// Mock vue-router (component uses useRoute for deep-link query params)
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}))

// Mock the chat service
vi.mock('@/services/chat', () => ({
  chatService: {
    getRecentChats: vi.fn(),
    getChatDetail: vi.fn(),
    takeoverChat: vi.fn(),
    reassignChat: vi.fn(),
    handBackToAI: vi.fn(),
    getThreadUnreadCounts: vi.fn(),
    markChatRead: vi.fn(),
  }
}))

// Mock the components
vi.mock('@/layouts/DashboardLayout.vue', () => ({
  default: {
    name: 'DashboardLayout',
    template: '<div class="dashboard-layout"><slot /></div>'
  }
}))

vi.mock('@/components/conversations/ConversationsList.vue', () => ({
  default: {
    name: 'ConversationsList',
    template: '<div class="conversations-list"></div>',
    props: ['conversations', 'unreadCounts', 'loading', 'error', 'loadedCount', 'totalCount', 'hasMore', 'statusFilter', 'showChatInfo'],
    emits: ['refresh', 'update-filter', 'load-more', 'chat-updated', 'chat-selected', 'select-session', 'clear-unread']
  }
}))

vi.mock('@/components/conversations/ConversationChat.vue', () => ({
  default: {
    name: 'ConversationChat',
    template: '<div class="conversation-chat"></div>',
    props: ['chat', 'draft'],
    emits: ['chat-updated', 'update:draft', 'toggle-right-drawer', 'open-transfer', 'refresh', 'action-toast'],
  },
}))

vi.mock('@/components/conversations/ConversationFilters.vue', () => ({
  default: {
    name: 'ConversationFilters',
    template: '<div class="conversation-filters"></div>',
    props: ['showFilters', 'filterValues', 'users', 'agents', 'loadingUsers', 'loadingAgents'],
    emits: ['toggle', 'apply', 'clear', 'update:filterValues']
  }
}))

vi.mock('@/components/conversations/ChatInfoPanel.vue', () => ({
  default: {
    name: 'ChatInfoPanel',
    template: '<div class="chat-info-panel"></div>',
    props: ['chatInfo', 'users'],
    emits: ['close', 'refresh', 'chatUpdated', 'chatClosed', 'select-session']
  }
}))

vi.mock('@/services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn((event: string, callback: (data: any) => void) => socketHandlers.callbacks.set(event, callback)),
    off: vi.fn((event: string, callback?: (data: any) => void) => {
      if (!callback || socketHandlers.callbacks.get(event) === callback) socketHandlers.callbacks.delete(event)
    }),
    onReconnect: vi.fn(),
    offReconnect: vi.fn(),
  },
}))

vi.mock('@/components/conversations/SessionTransferModal.vue', () => ({
  default: {
    name: 'SessionTransferModal',
    template: '<div class="session-transfer-modal"></div>',
    props: ['show', 'actionLoading', 'currentUserId', 'customerName'],
    emits: ['close', 'transfer', 'hand-back-to-ai']
  }
}))

// Mock API service
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

// Mock agent service
vi.mock('@/services/agent', () => ({
  agentService: {
    getOrganizationAgents: vi.fn().mockResolvedValue([])
  }
}))

// Import the mocked modules
import { chatService } from '@/services/chat'

describe('ConversationsView', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    socketHandlers.callbacks.clear()
    ;(chatService.getThreadUnreadCounts as any).mockResolvedValue({ counts: {} })
    ;(chatService.markChatRead as any).mockResolvedValue({ session_id: 'session', last_read_at: '2026-08-25T00:00:00Z' })
  })

  it('renders properly', () => {
    wrapper = mount(ConversationsView)
    expect(wrapper.find('.conversations-list').exists()).toBe(true)
  })

  it('shows loading state initially', () => {
    wrapper = mount(ConversationsView)
    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    expect(conversationsList.props('loading')).toBe(true)
  })

  it('loads conversations on mount', async () => {
    const mockConversations = [
      { id: '1', title: 'Chat 1' },
      { id: '2', title: 'Chat 2' }
    ]
    
    ;(chatService.getRecentChats as any).mockResolvedValue(mockConversations)
    
    wrapper = mount(ConversationsView)
    
    // Wait for the mounted hook and async operations to complete
    await vi.waitFor(async () => {
      await nextTick()
      const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
      return conversationsList.props('loading') === false
    })
    
    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    expect(chatService.getRecentChats).toHaveBeenCalledWith({ limit: 100 })
    expect(conversationsList.props('conversations')).toEqual(mockConversations)
    expect(conversationsList.props('loading')).toBe(false)
  })

  it('handles loading error', async () => {
    const errorMessage = '会话列表加载失败，请稍后重试'
    ;(chatService.getRecentChats as any).mockRejectedValue(new Error('API Error'))
    
    wrapper = mount(ConversationsView)
    
    // Wait for the mounted hook and async operations to complete
    await vi.waitFor(async () => {
      await nextTick()
      const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
      return conversationsList.props('loading') === false
    })
    
    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    expect(conversationsList.props('error')).toBe(errorMessage)
    expect(conversationsList.props('loading')).toBe(false)
  })

  it('refreshes conversations when refresh event is emitted', async () => {
    const mockConversations = [
      { id: '1', title: 'Chat 1' },
      { id: '2', title: 'Chat 2' }
    ]
    
    ;(chatService.getRecentChats as any).mockResolvedValue(mockConversations)
    
    wrapper = mount(ConversationsView)
    await vi.waitFor(async () => {
      await nextTick()
      const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
      return conversationsList.props('loading') === false
    })
    
    // Clear the first call to getRecentChats from mounted
    vi.clearAllMocks()
    
    // Trigger refresh
    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    await conversationsList.vm.$emit('refresh')
    
    // Wait for the refresh to complete
    await vi.waitFor(async () => {
      await nextTick()
      return chatService.getRecentChats.mock.calls.length > 0
    })
    
    expect(chatService.getRecentChats).toHaveBeenCalled()
  })

  it('loads and appends the next inbox page without duplicating existing sessions', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      session_id: `session-${index + 1}`,
      customer: { id: `customer-${index + 1}`, email: `customer-${index + 1}@example.com` },
      agent: { id: 'agent-1', name: 'Support', display_name: null },
      status: 'open', channel: 'web', user_id: null,
      updated_at: '2026-08-25T00:00:00Z', message_count: 1,
    }))
    const nextPage = [{
      session_id: 'session-101', customer: { id: 'customer-101', email: 'customer-101@example.com' },
      agent: { id: 'agent-1', name: 'Support', display_name: null },
      status: 'open', channel: 'web', user_id: null,
      updated_at: '2026-08-24T00:00:00Z', message_count: 1,
    }]
    ;(chatService.getRecentChats as any)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(nextPage)

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ConversationsList' }).props('hasMore')).toBe(true))
    await wrapper.findComponent({ name: 'ConversationsList' }).vm.$emit('load-more')
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ConversationsList' }).props('conversations')).toHaveLength(101))

    expect(chatService.getRecentChats).toHaveBeenNthCalledWith(1, { limit: 100 })
    expect(chatService.getRecentChats).toHaveBeenNthCalledWith(2, { skip: 100, limit: 100 })
    expect(wrapper.findComponent({ name: 'ConversationsList' }).props('hasMore')).toBe(false)
  })

  it('closes the transfer dialog when the agent switches to another conversation', async () => {
    const conversations = ['session-1', 'session-2'].map((sessionId) => ({
      session_id: sessionId,
      customer: { id: `customer-${sessionId}`, email: `${sessionId}@example.com` },
      agent: { id: 'agent-1', name: 'Support', display_name: null },
      status: 'open', channel: 'web', user_id: null,
      updated_at: '2026-08-25T00:00:00Z', message_count: 1,
    }))
    ;(chatService.getRecentChats as any).mockResolvedValue(conversations)

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ConversationsList' }).props('loading')).toBe(false))
    await wrapper.findComponent({ name: 'ConversationChat' }).vm.$emit('open-transfer')
    await nextTick()
    expect(wrapper.findComponent({ name: 'SessionTransferModal' }).props('show')).toBe(true)

    await wrapper.findComponent({ name: 'ConversationsList' }).vm.$emit('select-session', 'session-2')
    await nextTick()
    expect(wrapper.findComponent({ name: 'SessionTransferModal' }).props('show')).toBe(false)
  })

  it('hands a session back to AI from the transfer dialog', async () => {
    const conversation = {
      session_id: 'session-1',
      customer: { id: 'customer-1', email: 'customer@example.com', full_name: 'Customer' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null },
      status: 'open',
      channel: 'web',
      user_id: 'agent-user',
      user_name: 'Assigned agent',
      updated_at: '2026-08-25T00:00:00Z',
      message_count: 1,
      last_message: 'Please help',
    }
    const updated = {
      ...conversation,
      user_id: null,
      user_name: null,
      ai_auto_reply: true,
      messages: [],
    }
    ;(chatService.getRecentChats as any).mockResolvedValue([conversation])
    ;(chatService.getChatDetail as any).mockResolvedValue(updated)
    ;(chatService.handBackToAI as any).mockResolvedValue(updated)

    wrapper = mount(ConversationsView)
    await vi.waitFor(async () => {
      await nextTick()
      return (chatService.getChatDetail as any).mock.calls.length > 0
    })

    const transferModal = wrapper.findComponent({ name: 'SessionTransferModal' })
    await transferModal.vm.$emit('hand-back-to-ai')

    await vi.waitFor(() => {
      expect(chatService.handBackToAI).toHaveBeenCalledWith('session-1')
    })
    expect(transferModal.props('show')).toBe(false)
  })

  it('opens an accessible historical conversation from the info panel', async () => {
    const conversations = [
      { session_id: 'session-1', updated_at: '2026-08-25T00:00:00Z' },
      { session_id: 'session-2', updated_at: '2026-08-24T00:00:00Z' },
    ]
    ;(chatService.getRecentChats as any).mockResolvedValue(conversations)
    ;(chatService.getChatDetail as any).mockResolvedValue({
      session_id: 'session-1',
      customer: { id: 'customer-1', email: 'customer@example.com' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null },
      messages: [], status: 'open', channel: 'web', user_id: null,
      created_at: '2026-08-25T00:00:00Z', updated_at: '2026-08-25T00:00:00Z',
    })

    wrapper = mount(ConversationsView)
    await vi.waitFor(async () => {
      await nextTick()
      return (chatService.getChatDetail as any).mock.calls.length > 0
    })

    const infoPanel = wrapper.findComponent({ name: 'ChatInfoPanel' })
    await infoPanel.vm.$emit('select-session', 'session-2')

    await vi.waitFor(() => {
      expect(chatService.getChatDetail).toHaveBeenCalledWith('session-2')
    })
  })

  it('loads persistent unread counts and synchronizes a read acknowledgement across tabs', async () => {
    const sessionA = {
      session_id: 'session-a', customer: { id: 'customer-a', email: 'a@example.com' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null }, messages: [],
      status: 'open', channel: 'web', user_id: null, group_id: null,
      created_at: '2026-08-25T00:00:00Z', updated_at: '2026-08-25T00:00:00Z',
      message_count: 0, last_message: '',
    }
    const sessionB = {
      ...sessionA,
      session_id: 'session-b',
      customer: { id: 'customer-b', email: 'b@example.com' },
      updated_at: '2026-08-25T00:01:00Z',
    }
    ;(chatService.getRecentChats as any).mockResolvedValue([sessionA, sessionB])
    ;(chatService.getChatDetail as any).mockResolvedValue(sessionA)
    ;(chatService.getThreadUnreadCounts as any)
      .mockResolvedValueOnce({ counts: { 'session-a': 2, 'session-b': 3 } })
      .mockResolvedValueOnce({ counts: { 'session-b': 3 } })

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => {
      expect((wrapper.findComponent({ name: 'ConversationsList' }).props('unreadCounts') as any)).toEqual({ 'session-b': 3 })
    })
    expect(chatService.markChatRead).toHaveBeenCalledWith('session-a')

    socketHandlers.callbacks.get('conversation_read')?.({ session_id: 'session-b' })
    await nextTick()
    expect(wrapper.findComponent({ name: 'ConversationsList' }).props('unreadCounts')).toEqual({})
  })

  it('keeps the current conversation detail when an older request resolves last', async () => {
    let resolveSessionA: (chat: any) => void
    let resolveSessionB: (chat: any) => void
    const sessionADetail = {
      session_id: 'session-a', customer: { id: 'customer-a', email: 'a@example.com' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null }, messages: [],
      status: 'open', channel: 'web', user_id: null, group_id: null,
      created_at: '2026-08-25T00:00:00Z', updated_at: '2026-08-25T00:00:00Z',
    }
    const sessionBDetail = {
      ...sessionADetail,
      session_id: 'session-b',
      customer: { id: 'customer-b', email: 'b@example.com' },
      updated_at: '2026-08-25T00:01:00Z',
    }
    ;(chatService.getRecentChats as any).mockResolvedValue([
      { ...sessionADetail, updated_at: sessionADetail.updated_at, message_count: 0, last_message: '' },
      { ...sessionBDetail, updated_at: sessionBDetail.updated_at, message_count: 0, last_message: '' },
    ])
    ;(chatService.getChatDetail as any).mockImplementation((sessionId: string) => new Promise(resolve => {
      if (sessionId === 'session-a') resolveSessionA = resolve
      if (sessionId === 'session-b') resolveSessionB = resolve
    }))

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => expect(chatService.getChatDetail).toHaveBeenCalledWith('session-a'))

    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    await conversationsList.vm.$emit('select-session', 'session-b')
    await vi.waitFor(() => expect(chatService.getChatDetail).toHaveBeenCalledWith('session-b'))

    resolveSessionB!(sessionBDetail)
    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'ConversationChat' }).props('chat')).toEqual(sessionBDetail)
    })

    resolveSessionA!(sessionADetail)
    await nextTick()
    expect(wrapper.findComponent({ name: 'ConversationChat' }).props('chat')).toEqual(sessionBDetail)
  })

  it('does not replace a list preview with a private realtime note', async () => {
    const conversation = {
      session_id: 'session-1',
      customer: { id: 'customer-1', email: 'customer@example.com', full_name: 'Customer' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null },
      status: 'open', channel: 'web', user_id: 'agent-user', user_name: 'Assigned agent',
      updated_at: '2026-08-25T00:00:00Z', message_count: 1, last_message: 'Customer-visible message',
    }
    ;(chatService.getRecentChats as any).mockResolvedValue([conversation])
    ;(chatService.getChatDetail as any).mockResolvedValue({
      ...conversation,
      messages: [{ message: 'Customer-visible message', message_type: 'user', created_at: conversation.updated_at }],
      created_at: conversation.updated_at,
    })

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => {
      expect(socketHandlers.callbacks.get('chat_reply')).toBeTypeOf('function')
    })

    socketHandlers.callbacks.get('chat_reply')?.({
      session_id: 'session-1', message_id: 2, message: 'Internal escalation details',
      message_type: 'private_note', created_at: '2026-08-25T00:05:00Z', attributes: { is_private: true },
    })
    await nextTick()

    const conversationsList = wrapper.findComponent({ name: 'ConversationsList' })
    expect((conversationsList.props('conversations') as any[])[0].last_message).toBe('Customer-visible message')
  })

  it('removes a conversation and clears its detail when realtime permissions revoke access', async () => {
    const conversation = {
      session_id: 'session-1',
      customer: { id: 'customer-1', email: 'customer@example.com' },
      agent: { id: 'agent-1', name: 'Support agent', display_name: null },
      messages: [], status: 'open', channel: 'web', user_id: null, group_id: null,
      created_at: '2026-08-25T00:00:00Z', updated_at: '2026-08-25T00:00:00Z',
      message_count: 0, last_message: '',
    }
    ;(chatService.getRecentChats as any).mockResolvedValue([conversation])
    ;(chatService.getChatDetail as any).mockResolvedValue(conversation)

    wrapper = mount(ConversationsView)
    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'ConversationChat' }).props('chat')).toEqual(conversation)
      expect(socketHandlers.callbacks.get('room_event')).toBeTypeOf('function')
    })

    socketHandlers.callbacks.get('room_event')?.({ type: 'conversation_removed', session_id: 'session-1' })
    await nextTick()

    expect(wrapper.findComponent({ name: 'ConversationsList' }).props('conversations')).toEqual([])
    expect(wrapper.findComponent({ name: 'ConversationChat' }).props('chat')).toBeNull()
  })
})
