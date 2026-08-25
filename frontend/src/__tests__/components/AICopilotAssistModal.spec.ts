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

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AICopilotAssistModal from '@/components/conversations/AICopilotAssistModal.vue'
import { chatService } from '@/services/chat'

vi.mock('@/services/chat', () => ({
  chatService: { generateCopilotDraft: vi.fn() },
}))

describe('AICopilotAssistModal', () => {
  it('does not start a second draft request while the first is pending', async () => {
    let resolveDraft: (value: { draft: string }) => void = () => undefined
    ;(chatService.generateCopilotDraft as any).mockImplementation(() => new Promise(resolve => {
      resolveDraft = resolve
    }))
    const wrapper = mount(AICopilotAssistModal, {
      props: {
        open: true,
        chat: { session_id: 'session-1' },
        currentDraft: 'Please confirm the delivery address.',
      },
    })

    await wrapper.findAll('.mode-grid button')[0].trigger('click')
    await wrapper.findAll('.mode-grid button')[1].trigger('click')

    expect(chatService.generateCopilotDraft).toHaveBeenCalledTimes(1)
    expect((wrapper.find('#copilot-draft').element as HTMLTextAreaElement).disabled).toBe(true)

    resolveDraft({ draft: 'Could you please confirm the delivery address?' })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Could you please confirm the delivery address?')
    })
  })

  it('does not let an old conversation generation replace the current conversation draft', async () => {
    let resolveFirst: (value: { draft: string }) => void = () => undefined
    let resolveSecond: (value: { draft: string }) => void = () => undefined
    ;(chatService.generateCopilotDraft as any)
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))

    const wrapper = mount(AICopilotAssistModal, {
      props: {
        open: true,
        chat: { session_id: 'session-1' },
        currentDraft: 'First conversation',
      },
    })
    await wrapper.findAll('.mode-grid button')[0].trigger('click')

    await wrapper.setProps({ chat: { session_id: 'session-2' }, currentDraft: 'Second conversation' })
    await wrapper.findAll('.mode-grid button')[1].trigger('click')

    resolveSecond({ draft: 'Second result' })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Second result'))

    resolveFirst({ draft: 'First result' })
    await vi.waitFor(() => expect(wrapper.text()).not.toContain('First result'))
    expect(wrapper.text()).toContain('Second result')
  })
})
