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

const currentUser = await vi.hoisted(async () => ({ value: null as unknown }))

vi.mock('@/services/user', () => ({
  userService: { getCurrentUser: () => currentUser.value },
}))

import { hasPermission, hasAnyPermission, permissionChecks } from '@/utils/permissions'
import { createPermissionMocks, userWithPermissions } from '../fixtures/permissions'

describe('permission primitives', () => {
  it('is false when nobody is signed in', () => {
    currentUser.value = null
    expect(hasPermission('manage_agents')).toBe(false)
    expect(hasAnyPermission(['manage_agents'])).toBe(false)
  })

  it('is false for a user whose role carries no permissions', () => {
    currentUser.value = { id: '1', role: { id: 1, name: 'Empty' } }
    expect(hasAnyPermission(['manage_agents'])).toBe(false)
  })

  // A check that does not bypass gives super_admin an almost-empty sidebar
  // while the API happily serves every request — the two layers disagreeing is
  // exactly what produces "the page renders, then 403s".
  it('grants every check to super_admin', () => {
    currentUser.value = userWithPermissions(['super_admin'])
    Object.entries(permissionChecks).forEach(([name, check]) => {
      expect(check(), name).toBe(true)
    })
  })

  it('denies every check to a role with nothing', () => {
    currentUser.value = userWithPermissions([])
    Object.entries(permissionChecks).forEach(([name, check]) => {
      expect(check(), name).toBe(false)
    })
  })

  it('grants exactly what a Human Agent should have', () => {
    currentUser.value = userWithPermissions([
      'view_assigned_chats',
      'manage_assigned_chats',
      'view_unassigned_chats',
      'view_people',
    ])

    expect(permissionChecks.canViewChats()).toBe(true)
    expect(permissionChecks.canViewPeople()).toBe(true)
    expect(permissionChecks.canManagePeople()).toBe(true)
    expect(permissionChecks.canTakeOverChats()).toBe(true)

    expect(permissionChecks.canViewAgents()).toBe(false)
    expect(permissionChecks.canManageUsers()).toBe(false)
    expect(permissionChecks.canViewSubscription()).toBe(false)
    expect(permissionChecks.canManageKnowledge()).toBe(false)
  })
})

describe('the shared test fixture', () => {
  // Without this, a check added to the app but not to the fixture returns
  // undefined in whichever spec mocks permissions next, and that spec fails
  // somewhere unrelated and confusing.
  it('mocks every check the app defines', () => {
    expect(Object.keys(createPermissionMocks()).sort()).toEqual(Object.keys(permissionChecks).sort())
  })
})
