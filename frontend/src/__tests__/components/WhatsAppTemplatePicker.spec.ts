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

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WhatsAppTemplatePicker from '@/components/conversations/WhatsAppTemplatePicker.vue'

const sendWhatsAppTemplate = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@/services/channels', () => ({
  default: { sendWhatsAppTemplate },
}))

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('WhatsAppTemplatePicker', () => {
  beforeEach(() => {
    sendWhatsAppTemplate.mockReset()
    sendWhatsAppTemplate.mockResolvedValue({})
  })

  it('closes after a template is successfully sent to prevent a duplicate send', async () => {
    const wrapper = mount(WhatsAppTemplatePicker, {
      props: { accountId: 'account-1', sessionId: 'session-1' },
      global: {
        stubs: {
          'font-awesome-icon': true,
          BaseModal: { template: '<section><slot /><slot name="actions" /></section>' },
          WhatsAppTemplateSelect: {
            name: 'WhatsAppTemplateSelect',
            props: ['selection', 'accountId'],
            emits: ['update:selection'],
            template: '<div />',
          },
        },
      },
    })
    await wrapper.findComponent({ name: 'WhatsAppTemplateSelect' }).vm.$emit('update:selection', {
      complete: true,
      template: { name: 'order_update', language: 'en_US' },
      components: [{ type: 'body', parameters: [] }],
    })

    const sendButton = wrapper.findAll('button').find(button => button.text().includes('立即发送模板消息'))
    await sendButton?.trigger('click')
    await vi.waitFor(() => expect(sendWhatsAppTemplate).toHaveBeenCalledWith('account-1', expect.objectContaining({
      session_id: 'session-1',
      template_name: 'order_update',
      language: 'en_US',
      components: [{ type: 'body', parameters: [] }],
      idempotency_key: expect.any(String),
    })))

    expect(wrapper.emitted('sent')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not close or report success in a new conversation after an old send settles', async () => {
    let resolveSend: () => void = () => undefined
    sendWhatsAppTemplate.mockImplementation(() => new Promise<void>(resolve => { resolveSend = resolve }))
    const wrapper = mount(WhatsAppTemplatePicker, {
      props: { accountId: 'account-1', sessionId: 'session-1' },
      global: {
        stubs: {
          'font-awesome-icon': true,
          BaseModal: { template: '<section><slot /><slot name="actions" /></section>' },
          WhatsAppTemplateSelect: {
            name: 'WhatsAppTemplateSelect',
            props: ['selection', 'accountId'],
            emits: ['update:selection'],
            template: '<div />',
          },
        },
      },
    })
    await wrapper.findComponent({ name: 'WhatsAppTemplateSelect' }).vm.$emit('update:selection', {
      complete: true,
      template: { name: 'order_update', language: 'en_US' },
    })
    await wrapper.findAll('button').find(button => button.text().includes('立即发送模板消息'))?.trigger('click')
    await vi.waitFor(() => expect(sendWhatsAppTemplate).toHaveBeenCalledTimes(1))

    await wrapper.setProps({ sessionId: 'session-2' })
    resolveSend()
    await flushPromises()

    expect(wrapper.emitted('sent')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
