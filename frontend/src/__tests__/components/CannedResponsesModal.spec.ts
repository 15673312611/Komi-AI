import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/services/cannedResponses', () => ({
  cannedResponsesService: { list },
}))
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: () => ({ push: vi.fn() }) }
})

import CannedResponsesModal from '@/components/conversations/CannedResponsesModal.vue'

describe('CannedResponsesModal', () => {
  it('keeps the latest response list after the modal is closed and reopened', async () => {
    let resolveFirst: (value: any[]) => void = () => undefined
    let resolveSecond: (value: any[]) => void = () => undefined
    list
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))
    const wrapper = mount(CannedResponsesModal, { props: { open: true } })
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(1))

    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    resolveSecond([{ id: 'new', title: 'New response', category: 'General', content: 'New content' }])
    await vi.waitFor(() => expect(wrapper.text()).toContain('New response'))

    resolveFirst([{ id: 'old', title: 'Old response', category: 'General', content: 'Old content' }])
    await flushPromises()
    expect(wrapper.text()).toContain('New response')
    expect(wrapper.text()).not.toContain('Old response')
  })
})
