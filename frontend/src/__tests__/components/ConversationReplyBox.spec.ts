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
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox.vue'

describe('ConversationReplyBox', () => {
  it('waits for the server snapshot before changing the AI toggle', async () => {
    const wrapper = mount(ConversationReplyBox, {
      props: { aiAutoReplyEnabled: false },
    })
    const toggle = wrapper.find('input[type="checkbox"]')

    await toggle.trigger('change')

    expect(wrapper.emitted('toggle-ai-auto-reply')).toEqual([[true]])
    expect((toggle.element as HTMLInputElement).checked).toBe(false)

    await wrapper.setProps({ aiAutoReplyEnabled: true })
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
  })

  it('disables the AI toggle while its update is in progress', () => {
    const wrapper = mount(ConversationReplyBox, {
      props: { aiAutoReplyEnabled: true, aiAutoReplyLoading: true },
    })

    expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).disabled).toBe(true)
  })

  it('sends a customer reply and resolves the conversation from the split-button menu', async () => {
    const wrapper = mount(ConversationReplyBox)
    await wrapper.find('textarea').setValue('The replacement has been dispatched.')
    await wrapper.find('button[aria-label="更多发送操作"]').trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    await wrapper.find('[role="menuitem"]').trigger('click')

    expect(wrapper.emitted('send-and-resolve')).toEqual([
      ['The replacement has been dispatched.', [], []],
    ])
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('does not offer resolution while composing a private note or when disabled', async () => {
    const wrapper = mount(ConversationReplyBox)
    const noteButton = wrapper.findAll('button').find(button => button.text().includes('内部团队便签'))
    await noteButton?.trigger('click')

    expect((wrapper.find('button[aria-label="更多发送操作"]').element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.setProps({ disabled: true })
    expect((wrapper.find('button[aria-label="更多发送操作"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('inserts a selected @mention and sends its stable teammate id', async () => {
    const wrapper = mount(ConversationReplyBox, {
      props: {
        mentionableTeammates: [{ id: 'teammate-1', full_name: 'Sam Support', email: 'sam@example.com' }],
      },
    })

    const noteButton = wrapper.findAll('button').find(button => button.text().includes('内部团队便签'))
    await noteButton?.trigger('click')
    await wrapper.find('textarea').setValue('@sa')
    expect(wrapper.emitted('request-mentions')).toHaveLength(1)
    await wrapper.find('[role="option"]').trigger('click')
    await wrapper.find('textarea').setValue('@Sam Support Please check the carrier scan.')
    const sendButton = wrapper.findAll('button').find(button => button.text() === '添加便签')
    await sendButton?.trigger('click')

    expect(wrapper.emitted('send')).toEqual([
      ['@Sam Support Please check the carrier scan.', true, [], [
        { id: 'teammate-1', full_name: 'Sam Support', email: 'sam@example.com' },
      ]],
    ])
  })

  it('clears a private-note context and selected mentions when the session changes', async () => {
    const wrapper = mount(ConversationReplyBox, {
      props: {
        sessionId: 'session-1',
        mentionableTeammates: [{ id: 'teammate-1', full_name: 'Sam Support', email: 'sam@example.com' }],
      },
    })
    const noteButton = wrapper.findAll('button').find(button => button.text().includes('内部团队便签'))
    await noteButton?.trigger('click')
    await wrapper.find('textarea').setValue('@sa')
    await wrapper.find('[role="option"]').trigger('click')

    await wrapper.setProps({ sessionId: 'session-2' })
    await wrapper.find('textarea').setValue('New conversation reply')
    const sendButton = wrapper.findAll('button').find(button => button.text() === '发送')
    await sendButton?.trigger('click')

    expect(wrapper.emitted('send')).toEqual([
      ['New conversation reply', false, [], []],
    ])
  })
})
