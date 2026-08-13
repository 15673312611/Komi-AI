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

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HandlerBadge from '@/components/conversations/HandlerBadge.vue'

const mountBadge = (props: Record<string, unknown>) =>
  mount(HandlerBadge, {
    props,
    global: { stubs: { 'font-awesome-icon': true } },
  })

describe('HandlerBadge', () => {
  it('labels an AI-handled chat', () => {
    const badge = mountBadge({ chat: { status: 'open', user_id: null } })
    expect(badge.text()).toBe('AI')
    expect(badge.find('.handler-ai').exists()).toBe(true)
  })

  it('labels a chat queued for a human', () => {
    const badge = mountBadge({ chat: { status: 'transferred', user_id: null } })
    expect(badge.text()).toBe('Waiting for human')
    expect(badge.find('.handler-waiting').exists()).toBe(true)
  })

  it('names the human holding the chat', () => {
    const badge = mountBadge({
      chat: { status: 'open', user_id: 'u1', user_name: 'Priya' },
      currentUserId: 'u2',
    })
    expect(badge.text()).toBe('Priya')
    expect(badge.find('.handler-human').exists()).toBe(true)
  })

  it('renders nothing for a closed chat, which the status pill already states', () => {
    const badge = mountBadge({ chat: { status: 'closed', user_id: 'u1' } })
    expect(badge.find('.handler-badge').exists()).toBe(false)
  })
})
