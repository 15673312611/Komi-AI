import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import SessionTransferModal from '@/components/conversations/SessionTransferModal.vue'

const { listTeammates } = vi.hoisted(() => ({ listTeammates: vi.fn() }))
vi.mock('@/services/users', () => ({ listTeammates }))

describe('SessionTransferModal', () => {
  it('keeps the latest teammate request when the modal is closed and reopened', async () => {
    let resolveFirst: (value: any) => void = () => undefined
    let resolveSecond: (value: any) => void = () => undefined
    listTeammates
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve }))

    const wrapper = mount(SessionTransferModal, {
      props: { show: true, currentUserId: 'current-user' },
    })
    await vi.waitFor(() => expect(listTeammates).toHaveBeenCalledTimes(1))
    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true })
    await vi.waitFor(() => expect(listTeammates).toHaveBeenCalledTimes(2))

    resolveSecond([{ id: 'new-user', full_name: 'New teammate', email: 'new@example.com' }])
    await vi.waitFor(() => expect(wrapper.text()).toContain('New teammate'))

    resolveFirst([{ id: 'old-user', full_name: 'Old teammate', email: 'old@example.com' }])
    await flushPromises()

    expect(wrapper.text()).toContain('New teammate')
    expect(wrapper.text()).not.toContain('Old teammate')
  })
})
