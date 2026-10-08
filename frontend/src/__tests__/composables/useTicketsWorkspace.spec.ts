// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  listTickets: vi.fn(),
  getStats: vi.fn(),
  replace: vi.fn(),
  useTicketSocket: vi.fn(),
}))

vi.mock('@/services/tickets', () => ({ ticketService: mocks }))
vi.mock('@/composables/useTicketSocket', () => ({ useTicketSocket: mocks.useTicketSocket }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: mocks.replace }),
}))

import { useTicketsWorkspace } from '@/composables/useTicketsWorkspace'

const ticket = {
  id: 'ticket-1',
  ticket_number: 1,
  display_number: 'TKT-1',
  title: 'Refund issue',
  status: 'open',
  priority: 'medium',
  assignee_user_id: null,
  assignee_name: null,
  ai_state: 'investigating',
} as const

const mountState = () => {
  const state: { current?: ReturnType<typeof useTicketsWorkspace> } = {}
  const Harness = defineComponent({
    setup: () => {
      state.current = useTicketsWorkspace()
      return () => null
    },
  })
  return { wrapper: mount(Harness), state: state.current! }
}

describe('useTicketsWorkspace resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.replace.mockResolvedValue(undefined)
    mocks.listTickets.mockResolvedValue({ tickets: [ticket], pagination: { page: 1, total_pages: 1 } })
    mocks.getStats.mockResolvedValue({ open: 1, awaiting_approval: 0, breaching: 0 })
  })

  it('keeps the ticket list usable when the auxiliary stats request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.getStats.mockRejectedValue(new Error('stats temporarily unavailable'))

    const { wrapper, state } = mountState()
    await flushPromises()

    expect(state.tickets.value).toEqual([ticket])
    expect(state.stats.value).toBeNull()
    expect(state.error.value).toBeNull()
    expect(state.phase.value).toBe('populated')
    expect(state.isLoading.value).toBe(false)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
    wrapper.unmount()
  })
})
