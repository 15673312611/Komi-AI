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

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConversationsList from '@/components/conversations/ConversationsList.vue'

vi.mock('@/services/user', () => ({
  userService: { getUserId: () => 'agent-1' },
}))

describe('ConversationsList', () => {
  afterEach(() => document.body.replaceChildren())

  it('focuses the inbox search field with Ctrl+K', async () => {
    const wrapper = mount(ConversationsList, {
      attachTo: document.body,
      props: {
        conversations: [{
          session_id: 'session-1',
          customer: { id: 'customer-1', email: 'customer@example.com', full_name: 'Customer' },
          agent: { id: 'agent-1', name: 'Support agent', display_name: null },
          status: 'open', channel: 'web', user_id: null,
          updated_at: '2026-08-25T00:00:00Z', message_count: 1,
        }],
      },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('input[type="text"]').element)
    wrapper.unmount()
  })
})
