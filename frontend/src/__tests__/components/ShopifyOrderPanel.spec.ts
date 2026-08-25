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
import ShopifyOrderPanel from '@/components/conversations/ShopifyOrderPanel.vue'

const { getShopifyOrders, getShopifyRefundPreview, refundShopifyOrder } = vi.hoisted(() => ({
  getShopifyOrders: vi.fn(),
  getShopifyRefundPreview: vi.fn(),
  refundShopifyOrder: vi.fn(),
}))
vi.mock('@/services/chat', () => ({
  chatService: {
    getShopifyOrders,
    getShopifyRefundPreview,
    refundShopifyOrder,
  },
}))

describe('ShopifyOrderPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getShopifyOrders.mockImplementation((sessionId: string) => Promise.resolve({
      orders: [{ id: `order-${sessionId}`, name: sessionId === 'session-1' ? '#1001' : '#1002', total_price: '19.99', currency: 'USD' }],
      write_orders_enabled: true,
      has_next_page: false,
    }))
    getShopifyRefundPreview.mockResolvedValue({ refundable: true, amount: '19.99', currency: 'USD' })
  })

  it('keeps state-changing Shopify actions disabled for a read-only chat user', async () => {
    const wrapper = mount(ShopifyOrderPanel, {
      props: { sessionId: 'session-1', canManageChat: false },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('#1001')
    })

    const buttons = wrapper.findAll('button')
    for (const label of ['发起退款', '改派地址', '重发凭证']) {
      const button = buttons.find(item => item.text().includes(label))
      expect(button).toBeDefined()
      expect((button!.element as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('closes a pending Shopify action when the conversation changes', async () => {
    let resolvePreview: (value: { refundable: boolean; amount: string; currency: string }) => void = () => undefined
    getShopifyRefundPreview.mockImplementation(() => new Promise(resolve => { resolvePreview = resolve }))
    const wrapper = mount(ShopifyOrderPanel, {
      props: { sessionId: 'session-1', canManageChat: true },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('#1001'))

    const refundButton = wrapper.findAll('button').find(item => item.text().includes('发起退款'))
    await refundButton!.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('正在核验可退款金额'))

    await wrapper.setProps({ sessionId: 'session-2' })
    await vi.waitFor(() => expect(wrapper.text()).toContain('#1002'))
    expect(wrapper.text()).not.toContain('确认全额退款')

    resolvePreview({ refundable: true, amount: '19.99', currency: 'USD' })
    await flushPromises()
    expect(wrapper.text()).not.toContain('确认全额退款')
  })

  it('reuses one idempotency key when retrying a failed Shopify refund', async () => {
    refundShopifyOrder
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValueOnce({ amount: '19.99', currency: 'USD' })
    const wrapper = mount(ShopifyOrderPanel, {
      props: { sessionId: 'session-1', canManageChat: true },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('#1001'))

    await wrapper.findAll('button').find(item => item.text().includes('发起退款'))?.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('将通过 Shopify 原支付方式退回'))
    const confirm = () => wrapper.findAll('button').find(item => item.text() === '确认执行')
    await confirm()?.trigger('click')
    await vi.waitFor(() => expect(refundShopifyOrder).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect((confirm()!.element as HTMLButtonElement).disabled).toBe(false))
    await confirm()?.trigger('click')
    await vi.waitFor(() => expect(refundShopifyOrder).toHaveBeenCalledTimes(2))

    expect(refundShopifyOrder.mock.calls[0][2].idempotency_key)
      .toBe(refundShopifyOrder.mock.calls[1][2].idempotency_key)
  })
})
