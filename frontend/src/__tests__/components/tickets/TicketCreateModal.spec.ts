// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { PersonListItem } from '@/types/people'

const peopleMocks = vi.hoisted(() => ({ listPeople: vi.fn() }))
const ticketMocks = vi.hoisted(() => ({ createTicket: vi.fn(), draftFromSession: vi.fn() }))
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/services/people', () => ({ peopleService: peopleMocks }))
vi.mock('@/services/tickets', () => ({ ticketService: ticketMocks }))
vi.mock('vue-sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

import TicketCreateModal from '@/components/tickets/TicketCreateModal.vue'

const person: PersonListItem = {
  id: 'person-1',
  name: 'New Customer',
  email: 'new@example.com',
  phone: null,
  is_anonymous: false,
  lead_stage: 'lead',
  qualified: false,
  source: null,
  synced: false,
}

const response = (items: PersonListItem[]) => ({ items, total: items.length, page: 1, page_size: 8 })

const mountModal = () => mount(TicketCreateModal, {
  props: { open: true },
  global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
})

describe('TicketCreateModal customer lookup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    peopleMocks.listPeople.mockResolvedValue(response([]))
    ticketMocks.draftFromSession.mockResolvedValue({ title: 'Draft', description: 'Description' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not let an older customer search overwrite a newer one', async () => {
    let resolveOld: (value: unknown) => void = () => undefined
    peopleMocks.listPeople
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce(response([person]))

    const wrapper = mountModal()
    const email = wrapper.find('input[type="email"]')
    await email.setValue('old@example.com')
    await vi.advanceTimersByTimeAsync(300)

    await email.setValue('new@example.com')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.find('#ticket-customer-suggestions option').attributes('value')).toBe('new@example.com')

    resolveOld(response([{ ...person, id: 'person-old', email: 'old@example.com', name: 'Old Customer' }]))
    await flushPromises()

    expect(wrapper.find('#ticket-customer-suggestions option').attributes('value')).toBe('new@example.com')
    wrapper.unmount()
  })

  it('rejects an invalid customer email before creating the ticket', async () => {
    const wrapper = mountModal()
    await wrapper.find('.field-input').setValue('Cannot reach checkout')
    await wrapper.find('input[type="email"]').setValue('not-an-email')
    await wrapper.find('.btn-primary').trigger('click')

    expect(ticketMocks.createTicket).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('请输入有效的客户邮箱地址')
    wrapper.unmount()
  })
})
