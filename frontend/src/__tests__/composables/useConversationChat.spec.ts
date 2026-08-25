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

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import type { ChatDetail } from '@/types/chat'

const socketHandlers = vi.hoisted(() => new Map<string, (data: any) => void>())
const socketEmit = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const { getChatDetail, takeoverChat } = vi.hoisted(() => ({
  getChatDetail: vi.fn(),
  takeoverChat: vi.fn(),
}))

vi.mock('@/services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    emit: socketEmit,
    on: vi.fn((event: string, callback: (data: any) => void) => socketHandlers.set(event, callback)),
    off: vi.fn((event: string, callback?: (data: any) => void) => {
      if (!callback || socketHandlers.get(event) === callback) socketHandlers.delete(event)
    }),
    onReconnect: vi.fn(),
    offReconnect: vi.fn(),
  },
}))

vi.mock('@/services/user', () => ({
  userService: {
    getUserId: () => 'agent-user-1',
    getUserName: () => 'Agent One',
  },
}))

vi.mock('@/services/chat', () => ({
  chatService: { getChatDetail, takeoverChat },
}))

vi.mock('vue-sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))
vi.mock('@/utils/permissions', () => ({ permissionChecks: { canTakeOverChats: () => true } }))
vi.mock('@/utils/chatActions', () => ({ routeChatToHuman: vi.fn() }))

import { useConversationChat } from '@/composables/useConversationChat'

const makeChat = (sessionId = 'session-1'): ChatDetail => ({
  session_id: sessionId,
  customer: { id: `customer-${sessionId}`, email: `${sessionId}@example.com` },
  agent: { id: 'agent-1', name: 'Support', display_name: null },
  messages: [],
  status: 'open',
  channel: 'web',
  user_id: 'agent-user-1',
  group_id: null,
  ai_auto_reply: false,
  created_at: '2026-08-25T00:00:00.000Z',
  updated_at: '2026-08-25T00:00:00.000Z',
})

describe('useConversationChat sendAndResolve', () => {
  beforeEach(() => {
    socketHandlers.clear()
    socketEmit.mockClear()
    toastSuccess.mockClear()
    toastError.mockClear()
    getChatDetail.mockReset()
    takeoverChat.mockReset()
  })

  it('uses one atomic agent_message, locks the composer, and reconciles the closing reply', () => {
    const refresh = vi.fn()
    const chatUpdated = vi.fn()
    const composableEmit = ((event: string, data?: unknown) => {
      if (event === 'refresh') refresh()
      if (event === 'chatUpdated') chatUpdated(data)
    }) as any
    const state: { current?: ReturnType<typeof useConversationChat> } = {}
    const Harness = defineComponent({
      setup: () => {
        state.current = useConversationChat(makeChat(), composableEmit)
        return () => null
      },
    })
    const wrapper = mount(Harness)
    const chat = state.current!

    expect(chat.sendAndResolve('Your replacement is on the way.')).toBe(true)
    expect(chat.isLoading.value).toBe(true)
    expect(chat.sendAndResolve('Duplicate request')).toBe(false)

    const [event, payload] = socketEmit.mock.calls.find(([name]) => name === 'agent_message')
    expect(event).toBe('agent_message')
    expect(payload).toMatchObject({
      message: 'Your replacement is on the way.',
      session_id: 'session-1',
      message_type: 'agent',
      end_chat: true,
      request_rating: true,
      end_chat_reason: 'ISSUE_RESOLVED',
    })
    expect(payload.client_message_id).toEqual(expect.any(String))
    expect(chat.chat.value.messages[0].attributes).toMatchObject({
      end_chat: true,
      client_message_id: payload.client_message_id,
    })

    socketHandlers.get('chat_reply')?.({
      message_id: 42,
      client_message_id: payload.client_message_id,
      message: payload.message,
      message_type: 'agent',
      session_id: 'session-1',
      created_at: '2026-08-25T00:01:00.000Z',
      attributes: {
        client_message_id: payload.client_message_id,
        end_chat: true,
        request_rating: true,
      },
    })

    expect(chat.isLoading.value).toBe(false)
    expect(chat.chat.value.status).toBe('closed')
    expect(chat.chat.value.messages).toHaveLength(1)
    expect(chat.chat.value.messages[0].id).toBe(42)
    expect(refresh).toHaveBeenCalledOnce()
    expect(toastSuccess).toHaveBeenCalledWith('会话已结束', expect.any(Object))

    wrapper.unmount()
  })

  it('unlocks and marks the optimistic reply failed when the server rejects the close', () => {
    const state: { current?: ReturnType<typeof useConversationChat> } = {}
    const Harness = defineComponent({
      setup: () => {
        state.current = useConversationChat(makeChat(), (() => undefined) as any)
        return () => null
      },
    })
    const wrapper = mount(Harness)
    const chat = state.current!

    expect(chat.sendAndResolve('I will close this request now.')).toBe(true)
    const [, payload] = socketEmit.mock.calls.find(([name]) => name === 'agent_message')

    socketHandlers.get('error')?.({
      type: 'message_error',
      session_id: 'session-1',
      client_message_id: payload.client_message_id,
      error: 'This chat is already closed.',
    })

    expect(chat.isLoading.value).toBe(false)
    expect(chat.chat.value.messages[0].attributes?.delivery_status).toBe('failed')
    expect(toastError).toHaveBeenCalledWith('发送并解决会话失败', expect.any(Object))

    wrapper.unmount()
  })

  it('sends selected teammate ids only with an internal note', async () => {
    const state: { current?: ReturnType<typeof useConversationChat> } = {}
    const Harness = defineComponent({
      setup: () => {
        state.current = useConversationChat(makeChat(), (() => undefined) as any)
        return () => null
      },
    })
    const wrapper = mount(Harness)
    const chat = state.current!

    await expect(chat.sendPrivateNote('Please verify the refund policy.', [], [{
      id: 'teammate-1', full_name: 'Sam Support', email: 'sam@example.com',
    }])).resolves.toBe(true)

    const [, payload] = socketEmit.mock.calls.find(([name]) => name === 'agent_message')
    expect(payload).toMatchObject({
      message_type: 'private_note',
      mentioned_user_ids: ['teammate-1'],
    })
    expect(chat.chat.value.messages[0].attributes?.mentioned_users).toEqual([
      { id: 'teammate-1', name: 'Sam Support' },
    ])

    wrapper.unmount()
  })

  it('does not let an old takeover response overwrite a newly selected conversation', async () => {
    let resolveTakeover: (value: ChatDetail) => void = () => undefined
    takeoverChat.mockImplementation(() => new Promise(resolve => { resolveTakeover = resolve }))
    const emitted: Array<[string, unknown]> = []
    const state: { current?: ReturnType<typeof useConversationChat> } = {}
    const Harness = defineComponent({
      setup: () => {
        state.current = useConversationChat(makeChat('session-1'), ((event: string, data?: unknown) => {
          emitted.push([event, data])
        }) as any)
        return () => null
      },
    })
    const wrapper = mount(Harness)
    const chat = state.current!

    const pending = chat.handleTakeover()
    await vi.waitFor(() => expect(takeoverChat).toHaveBeenCalledWith('session-1'))
    chat.replaceChatFromProps(makeChat('session-2'))
    resolveTakeover({ ...makeChat('session-1'), user_id: 'agent-user-1' })
    await pending

    expect(chat.chat.value.session_id).toBe('session-2')
    expect(chat.isLoading.value).toBe(false)
    expect(emitted).toEqual([])
    wrapper.unmount()
  })

  it('publishes snapshots through the chat-updated event consumed by the workspace', () => {
    const emitted: Array<[string, unknown]> = []
    const state: { current?: ReturnType<typeof useConversationChat> } = {}
    const Harness = defineComponent({
      setup: () => {
        state.current = useConversationChat(makeChat(), ((event: string, data?: unknown) => {
          emitted.push([event, data])
        }) as any)
        return () => null
      },
    })
    const wrapper = mount(Harness)
    const chat = state.current!
    const updated = { ...makeChat(), status: 'closed' as const }

    chat.updateChat(updated)

    expect(emitted).toEqual([
      ['clear-unread', 'session-1'],
      ['chat-updated', updated],
    ])
    wrapper.unmount()
  })
})
