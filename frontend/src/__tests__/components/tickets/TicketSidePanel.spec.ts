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

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/composables/useUsers', () => ({
  useUsers: () => ({ users: { value: [] }, fetchUsers: vi.fn().mockResolvedValue([]) }),
}))

import TicketSidePanel from '../../../components/tickets/TicketSidePanel.vue'
import type { Ticket } from '../../../types/ticket'

const baseTicket = {
  id: 't1',
  ticket_number: 12,
  display_number: 'TKT-12',
  organization_id: 'org1',
  title: 'Refund never arrived',
  status: 'closed',
  priority: 'medium',
  source: 'chat_ai',
  reopened_count: 0,
} as Ticket

const createWrapper = (ticket: Partial<Ticket> = {}, linkedSessionIds: string[] = ['s1']) =>
  mount(TicketSidePanel, {
    props: {
      ticket: { ...baseTicket, ...ticket } as Ticket,
      linkedSessionIds,
      canManage: false,
    },
    global: { stubs: { 'font-awesome-icon': true } },
  })

const csatCard = (wrapper: ReturnType<typeof createWrapper>) =>
  wrapper.findAll('.panel-card').find((card) => card.find('.card-label').text().includes('CSAT'))!

describe('TicketSidePanel CSAT card', () => {
  it('shows the score once the customer has rated', () => {
    const card = csatCard(
      createWrapper({
        csat_requested_at: '2026-07-20T10:00:00Z',
        csat_responded_at: '2026-07-20T11:00:00Z',
        csat_score: 4,
      }),
    )
    expect(card.text()).toContain('4/5')
    expect(card.findAll('.csat-stars font-awesome-icon-stub')).toHaveLength(5)
    expect(card.text()).toContain('客户已在关联会话中完成评分')
  })

  it('shows pending while the ask is out', () => {
    const card = csatCard(createWrapper({ csat_requested_at: '2026-07-20T10:00:00Z' }))
    expect(card.text()).toContain('等待评价')
    expect(card.find('.csat-stars').exists()).toBe(false)
  })

  it('goes back to pending when a reopened ticket is asked again', () => {
    const card = csatCard(
      createWrapper({
        csat_score: 2,
        csat_responded_at: '2026-07-20T11:00:00Z',
        csat_requested_at: '2026-07-21T09:00:00Z',
      }),
    )
    expect(card.text()).toContain('等待评价')
    expect(card.text()).not.toContain('2/5')
  })

  it('shows not requested before close', () => {
    const card = csatCard(createWrapper())
    expect(card.text()).toContain('未发起评价')
    expect(card.text()).toContain('工单关闭时将自动向关联会话发起满意度评价')
  })

  it('explains why a ticket with no conversation is never asked', () => {
    const card = csatCard(createWrapper({}, []))
    expect(card.text()).toContain('未关联客服会话，因此不采集该工单的 CSAT 评价')
  })
})
