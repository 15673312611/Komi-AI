/*
Copyright 2024-2026 Komi AI

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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Role, User } from '@/types/user'

const listRoles = vi.fn()

vi.mock('@/services/roles', () => ({
  listRoles: () => listRoles(),
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const UserForm = (await import('@/components/human-agent/UserForm.vue')).default

const permission = (name: string) => ({ id: 1, name, description: name })

const AGENT_ROLE = {
  id: '10',
  name: 'Agent',
  permissions: [
    'view_assigned_chats',
    'manage_assigned_chats',
    'view_unassigned_chats',
    'view_people',
  ].map(permission),
} as unknown as Role

const ASSIGNED_ONLY_ROLE = {
  id: '11',
  name: 'Assigned only',
  permissions: ['view_assigned_chats', 'manage_assigned_chats'].map(permission),
} as unknown as Role

const OWNER_ROLE = {
  id: '12',
  name: 'Owner',
  permissions: [permission('super_admin')],
} as unknown as Role

const mountForm = async (user?: User | null) => {
  const wrapper = mount(UserForm, { props: { user } })
  await flushPromises()
  return wrapper
}

const scopeBoxes = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('input[type="checkbox"]').slice(0, 2)

describe('UserForm – chat scope toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listRoles.mockResolvedValue([AGENT_ROLE, ASSIGNED_ONLY_ROLE, OWNER_ROLE])
  })

  it('reflects the selected role rather than a fixed default', async () => {
    const wrapper = await mountForm()
    await wrapper.find('#role').setValue('10')
    await flushPromises()

    const [aiChats, orgChats] = scopeBoxes(wrapper)
    // The seeded Agent role grants the AI queue and nothing org-wide, which is
    // the product default: ticked, and unticked.
    expect((aiChats.element as HTMLInputElement).checked).toBe(true)
    expect((orgChats.element as HTMLInputElement).checked).toBe(false)
  })

  it('unticks the AI queue for a role that does not grant it', async () => {
    const wrapper = await mountForm()
    await wrapper.find('#role').setValue('11')
    await flushPromises()

    expect((scopeBoxes(wrapper)[0].element as HTMLInputElement).checked).toBe(false)
  })

  it('submits the scope alongside the role', async () => {
    const wrapper = await mountForm()
    await wrapper.find('#role').setValue('10')
    await flushPromises()
    await scopeBoxes(wrapper)[1].setValue(true)

    await wrapper.find('#fullName').setValue('New Agent')
    await wrapper.find('#email').setValue('new@test.com')
    await wrapper.find('#password').setValue('Str0ng!Passw0rd')
    await wrapper.find('#password').trigger('input')
    await wrapper.find('#confirmPassword').setValue('Str0ng!Passw0rd')
    await wrapper.find('form').trigger('submit')

    const [[payload]] = wrapper.emitted('submit') as [Record<string, unknown>][]
    expect(payload).toMatchObject({
      role_id: 10,
      see_all_ai_chats: true,
      see_all_org_chats: true,
    })
  })

  it('unticks both for a role that grants nothing', async () => {
    const EMPTY_ROLE = { id: '13', name: 'Empty', permissions: [] } as unknown as Role
    listRoles.mockResolvedValue([AGENT_ROLE, EMPTY_ROLE])

    const wrapper = await mountForm()
    await wrapper.find('#role').setValue('10')
    await flushPromises()
    expect((scopeBoxes(wrapper)[0].element as HTMLInputElement).checked).toBe(true)

    await wrapper.find('#role').setValue('13')
    await flushPromises()

    const [aiChats, orgChats] = scopeBoxes(wrapper)
    expect((aiChats.element as HTMLInputElement).checked).toBe(false)
    expect((orgChats.element as HTMLInputElement).checked).toBe(false)
  })

  it('hides the toggles for a super_admin role, where they grant nothing', async () => {
    const wrapper = await mountForm()
    await wrapper.find('#role').setValue('12')
    await flushPromises()

    // Only the "Active User" box is left.
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(1)
  })

  it('opens an existing agent on the scope their role already grants', async () => {
    const wrapper = await mountForm({
      id: 'u1',
      full_name: 'Existing',
      email: 'existing@test.com',
      role: ASSIGNED_ONLY_ROLE,
    } as unknown as User)

    const [aiChats, orgChats] = scopeBoxes(wrapper)
    expect((aiChats.element as HTMLInputElement).checked).toBe(false)
    expect((orgChats.element as HTMLInputElement).checked).toBe(false)
  })
})
