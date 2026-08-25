import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ShopifyProductPicker from '@/components/conversations/ShopifyProductPicker.vue'
import { chatService } from '@/services/chat'

vi.mock('@/services/chat', () => ({
  chatService: { getShopifyProducts: vi.fn() },
}))

describe('ShopifyProductPicker', () => {
  it('ignores an old conversation product response after the active session changes', async () => {
    let resolveFirst: (value: any) => void = () => undefined
    let resolveSecond: (value: any) => void = () => undefined
    ;(chatService.getShopifyProducts as any)
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))

    const wrapper = mount(ShopifyProductPicker, {
      props: { open: true, sessionId: 'session-1' },
    })
    await wrapper.setProps({ sessionId: 'session-2' })

    resolveSecond({ status: 'ok', count: 1, shop_domain: 'new-shop.myshopify.com', products: [{ id: 'new', title: 'New product' }] })
    await vi.waitFor(() => expect(wrapper.text()).toContain('New product'))

    resolveFirst({ status: 'ok', count: 1, shop_domain: 'old-shop.myshopify.com', products: [{ id: 'old', title: 'Old product' }] })
    await flushPromises()

    expect(wrapper.text()).toContain('New product')
    expect(wrapper.text()).not.toContain('Old product')
    expect(wrapper.text()).toContain('new-shop.myshopify.com')
  })
})
