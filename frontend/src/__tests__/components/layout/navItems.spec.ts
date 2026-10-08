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

// Drive the REAL permission checks from a cached user, rather than mocking
// permissionChecks. Nav visibility and the router now read the same map, and a
// mock of the checks cannot catch the two disagreeing — which is exactly the
// bug this suite missed: People was listed for anyone with a chat grant while
// the route required view_people, so the link bounced.
const currentUser = await vi.hoisted(async () => ({ value: null as unknown }))

vi.mock('@/services/user', () => ({
  userService: { getCurrentUser: () => currentUser.value },
}))

vi.mock('@/composables/useEnterpriseFeatures', () => ({
  useEnterpriseFeatures: () => ({ hasEnterpriseModule: false }),
}))

import { useNavItems, PRIMARY_NAV_PATHS } from '@/components/layout/navItems'
import { userWithPermissions, HUMAN_AGENT_PERMISSIONS } from '../../fixtures/permissions'

const ALL_PERMISSIONS = [
  'manage_agents', 'view_agents', 'manage_users', 'view_all_chats', 'manage_all_chats',
  'view_assigned_chats', 'manage_assigned_chats', 'view_unassigned_chats', 'view_people',
  'manage_knowledge', 'view_knowledge', 'view_analytics', 'view_tickets', 'manage_tickets',
  'manage_organization', 'view_organization', 'manage_ai_config', 'view_ai_config',
  'manage_subscription', 'view_subscription',
]

const asUser = (permissions: string[]) => {
  currentUser.value = userWithPermissions(permissions)
}

describe('useNavItems', () => {
  beforeEach(() => asUser(ALL_PERMISSIONS))

  it('splits primary (bottom-nav) and overflow (More sheet) items', () => {
    const { primaryNavItems, moreNavItems } = useNavItems()

    expect(primaryNavItems.value.map((i) => i.to)).toEqual([
      '/conversations',
      '/stores',
      '/people',
      '/ai-agents',
      '/analytics',
    ])
    const morePaths = moreNavItems.value.map((i) => i.to)
    expect(morePaths).toContain('/human-agents')
    expect(morePaths).toContain('/knowledge')
    expect(morePaths).toContain('/settings/user')
    morePaths.forEach((p) => expect(PRIMARY_NAV_PATHS).not.toContain(p))
    moreNavItems.value.forEach((i) => expect(i.section).toBeUndefined())
  })

  it('hides permission-gated items for restricted users', () => {
    asUser(['manage_agents'])

    const { primaryNavItems, moreNavItems, navItems } = useNavItems()

    const primaryPaths = primaryNavItems.value.map((i) => i.to)
    expect(primaryPaths).not.toContain('/conversations')
    expect(primaryPaths).not.toContain('/people')
    expect(primaryPaths).not.toContain('/analytics')
    expect(primaryPaths).toContain('/ai-agents')

    expect(moreNavItems.value.map((i) => i.to)).not.toContain('/human-agents')
    // User settings is always available
    expect(navItems.value.map((i) => i.to)).toContain('/settings/user')
  })

  // The product requirement, as a test: a Human Agent sees the inbox, the
  // people they talk to, and their own settings. Nothing else.
  it('shows a Human Agent exactly Inbox, People and User Settings', () => {
    asUser(HUMAN_AGENT_PERMISSIONS)

    const { navItems } = useNavItems()

    expect(navItems.value.filter((i) => i.to).map((i) => i.to)).toEqual([
      '/conversations',
      '/people',
      '/settings/user',
    ])
  })

  // A role with only view_people gets the People link; one with only a chat
  // grant does not. The nav used to gate People on chat permissions while the
  // route required view_people, so both cases were wrong in opposite ways.
  it('gates People on the same permissions as its route', () => {
    asUser(['view_people'])
    expect(useNavItems().navItems.value.map((i) => i.to)).toContain('/people')

    asUser(['view_assigned_chats'])
    expect(useNavItems().navItems.value.map((i) => i.to)).toContain('/people')

    asUser(['manage_knowledge'])
    expect(useNavItems().navItems.value.map((i) => i.to)).not.toContain('/people')
  })

  // super_admin bypasses every check on the backend; a frontend check that
  // does not bypass gives that role an almost-empty sidebar.
  it('shows everything to a super_admin', () => {
    asUser(['super_admin'])

    const paths = useNavItems().navItems.value.filter((i) => i.to).map((i) => i.to)

    expect(paths).toContain('/ai-agents')
    expect(paths).toContain('/human-agents')
    expect(paths).toContain('/knowledge')
    expect(paths).toContain('/settings/organization')
  })

  it('excludes enterprise subscription when enterprise module is absent', () => {
    const { moreNavItems } = useNavItems()
    expect(moreNavItems.value.map((i) => i.to)).not.toContain('/settings/subscription')
  })

  // Guards the whole point of the More sheet: mobile must expose exactly the
  // same destinations as the desktop sidebar, so adding a nav item can never
  // silently leave phones without it.
  it('surfaces every sidebar destination across the bottom nav and More sheet', () => {
    const { navItems, primaryNavItems, moreNavGroups } = useNavItems()

    const sidebarPaths = navItems.value.filter((i) => i.to).map((i) => i.to)
    const mobilePaths = [
      ...primaryNavItems.value.map((i) => i.to),
      ...moreNavGroups.value.flatMap((g) => g.items.map((i) => i.to)),
    ]

    expect(mobilePaths.slice().sort()).toEqual(sidebarPaths.slice().sort())
  })

  it('keeps the sidebar section headings in the More sheet', () => {
    const { moreNavGroups } = useNavItems()
    expect(moreNavGroups.value.map((g) => g.section)).toEqual(['主菜单', '系统设置'])
    // No empty groups — a section fully covered by the bottom nav is dropped
    moreNavGroups.value.forEach((g) => expect(g.items.length).toBeGreaterThan(0))
  })

  // User Settings is always visible while the Settings heading used to be
  // permission-gated separately, which orphaned the item into Main Menu.
  it('keeps always-visible settings items under Settings for restricted users', () => {
    // Knowledge, so Main Menu still has a non-primary item to group; no
    // settings grants, so Settings holds only the always-visible entry.
    asUser(['manage_knowledge'])

    const { moreNavGroups } = useNavItems()
    const settings = moreNavGroups.value.find((g) => g.section === '系统设置')

    expect(settings?.items.map((i) => i.to)).toEqual(['/settings/user'])
    expect(moreNavGroups.value.find((g) => g.section === '主菜单')?.items.map((i) => i.to))
      .not.toContain('/settings/user')
  })

  it('drops a section whose every item is permission-hidden', () => {
    asUser([])

    const { moreNavGroups, navItems } = useNavItems()

    // Only User Settings survives, so Main Menu disappears entirely
    expect(moreNavGroups.value.map((g) => g.section)).toEqual(['系统设置'])
    expect(navItems.value.filter((i) => i.section).map((i) => i.section)).toEqual(['系统设置'])
  })
})
