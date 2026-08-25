import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { ChatDetail } from '@/types/chat'

const { updateTags, getCustomerSummary, getRecentChats } = vi.hoisted(() => ({
  updateTags: vi.fn(),
  getCustomerSummary: vi.fn(),
  getRecentChats: vi.fn(),
}))
vi.mock('@/services/chat', () => ({
  chatService: { updateTags, getCustomerSummary, getRecentChats },
}))
vi.mock('@/utils/permissions', () => ({
  permissionChecks: { canTakeOverChats: () => true },
}))
vi.mock('@/utils/chatState', () => ({
  chatHandler: () => ({ kind: 'ai', label: 'AI' }),
}))

import ChatInfoPanel from '@/components/conversations/ChatInfoPanel.vue'

const chat = (sessionId: string, tags: string[]): ChatDetail => ({
  session_id: sessionId,
  tags,
  customer: { id: `customer-${sessionId}`, email: `${sessionId}@example.com`, full_name: sessionId },
  agent: { id: 'agent-1', name: 'Support', display_name: null },
  messages: [],
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
  user_id: null,
  group_id: null,
  status: 'open',
  channel: 'web',
})

describe('ChatInfoPanel', () => {
  it('does not apply a tag save response after switching conversations', async () => {
    let resolveTags: (value: ChatDetail) => void = () => undefined
    updateTags.mockImplementation(() => new Promise(resolve => { resolveTags = resolve }))
    getCustomerSummary.mockResolvedValue({ order_count: 0, total_spend: null, currency: null, satisfaction_score: null, rating_count: 0 })
    getRecentChats.mockResolvedValue([])
    const wrapper = mount(ChatInfoPanel, {
      props: { chatInfo: chat('session-1', ['Old tag']) },
      global: { stubs: { ShopifyOrderPanel: true } },
    })

    const input = wrapper.find('input[placeholder="输入新标签按回车..."]')
    await input.setValue('Follow up')
    await input.trigger('keydown.enter')
    await vi.waitFor(() => expect(updateTags).toHaveBeenCalledWith('session-1', ['Old tag', 'Follow up']))

    await wrapper.setProps({ chatInfo: chat('session-2', ['Current tag']) })
    resolveTags({ ...chat('session-1', ['Old tag', 'Follow up']) })
    await flushPromises()

    expect(wrapper.text()).toContain('Current tag')
    expect(wrapper.text()).not.toContain('Follow up')
    expect(wrapper.emitted('chat-updated')).toBeUndefined()
  })
})
