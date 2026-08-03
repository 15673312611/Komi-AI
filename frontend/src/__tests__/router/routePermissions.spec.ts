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

vi.mock('@/composables/useEnterpriseFeatures', () => ({
  useEnterpriseFeatures: () => ({ hasEnterpriseModule: false }),
}))

import { ROUTE_PERMISSIONS, canAccessPath, canAccessMatchedPaths } from '@/router/routePermissions'
import { resolveLandingRoute } from '@/router/landing'
import { useNavItems } from '@/components/layout/navItems'
import { userWithPermissions, HUMAN_AGENT_PERMISSIONS } from '../fixtures/permissions'

const asUser = (permissions: string[]) => {
  currentUser.value = userWithPermissions(permissions)
}

describe('canAccessPath', () => {
  it('allows unmapped paths — the map lists what is restricted', () => {
    asUser([])
    expect(canAccessPath('/login')).toBe(true)
    expect(canAccessPath('/widget/abc')).toBe(true)
  })

  it('never denies /403 or /settings/user, whatever the role', () => {
    asUser([])
    expect(canAccessPath('/403')).toBe(true)
    expect(canAccessPath('/settings/user')).toBe(true)
  })

  it('lets Shopify embedded routes through without a user', () => {
    currentUser.value = null
    expect(canAccessPath('/shopify/agent-management')).toBe(true)
  })

  it('honours super_admin everywhere', () => {
    asUser(['super_admin'])
    Object.keys(ROUTE_PERMISSIONS).forEach((path) => {
      expect(canAccessPath(path)).toBe(true)
    })
  })

  it('matches a parameterised route by its pattern, not its URL', () => {
    asUser(['view_tickets'])
    expect(canAccessMatchedPaths(['/tickets/:id'])).toBe(true)

    asUser(['view_people'])
    expect(canAccessMatchedPaths(['/tickets/:id'])).toBe(false)
  })
})

describe('nav and route agreement', () => {
  // The bug this suite exists for: the sidebar and the router each named their
  // own permissions, so People was listed for anyone with a chat grant while
  // the route wanted view_people — the link bounced the user to a page they
  // had no rights to either.
  it('never shows a link the router would refuse', () => {
    const roles = [
      HUMAN_AGENT_PERMISSIONS,
      ['view_people'],
      ['manage_agents'],
      ['manage_knowledge'],
      ['view_analytics'],
      ['manage_users'],
      ['super_admin'],
      [],
    ]

    roles.forEach((permissions) => {
      asUser(permissions)
      useNavItems()
        .navItems.value.filter((item) => item.to)
        .forEach((item) => {
          expect(canAccessPath(item.to as string), `${item.to} for [${permissions}]`).toBe(true)
        })
    })
  })
})

describe('the map covers the routes that need it', () => {
  // Both findings this suite was written for came from a route the map did not
  // describe: the nav offered it and the guard let it through, or vice versa.
  it('names permissions for every gated destination the sidebar can show', () => {
    asUser(['super_admin'])
    const navPaths = useNavItems()
      .navItems.value.filter((i) => i.to)
      .map((i) => i.to as string)

    const ungoverned = navPaths.filter(
      (path) => !(path in ROUTE_PERMISSIONS) && !path.startsWith('/settings/subscription'),
    )

    expect(ungoverned).toEqual([])
  })
})

describe('resolveLandingRoute', () => {
  it('sends an admin to AI Agents, unchanged', () => {
    asUser(['manage_agents'])
    expect(resolveLandingRoute()).toBe('/ai-agents')
  })

  it('sends a Human Agent to the inbox', () => {
    asUser(HUMAN_AGENT_PERMISSIONS)
    expect(resolveLandingRoute()).toBe('/conversations')
  })

  it('floors at the user\'s own settings and never returns 403', () => {
    asUser([])
    expect(resolveLandingRoute()).toBe('/settings/user')
  })

  it('only ever resolves somewhere the user can open', () => {
    const roles = [HUMAN_AGENT_PERMISSIONS, ['view_people'], ['manage_knowledge'], []]
    roles.forEach((permissions) => {
      asUser(permissions)
      const landing = resolveLandingRoute()
      expect(landing).not.toBe('/403')
      expect(canAccessPath(landing), `${landing} for [${permissions}]`).toBe(true)
    })
  })
})
