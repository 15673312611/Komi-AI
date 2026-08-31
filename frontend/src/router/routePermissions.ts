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

// Groups from the leaf module, not from permissions.ts: this map is built at
// module scope, and permissions.ts sits inside the router import cycle.
import {
  AGENT_PERMISSIONS,
  AI_CONFIG_PERMISSIONS,
  CHAT_VIEW_PERMISSIONS,
  KNOWLEDGE_PERMISSIONS,
  ORGANIZATION_PERMISSIONS,
  PEOPLE_PERMISSIONS,
  TICKET_PERMISSIONS,
} from '@/utils/permissionGroups'
// Only ever called at runtime, so a partially-initialised module is harmless.
import { hasAnyPermission } from '@/utils/permissions'

/**
 * The one place a route's required permissions are written down.
 *
 * Both the router guard and the sidebar (navItems `show`) read this.
 * An empty array means "any authenticated user".
 */
export const ROUTE_PERMISSIONS: Record<string, readonly string[]> = {
  '/ai-agents': AGENT_PERMISSIONS,
  '/analytics': ['view_analytics'],
  '/knowledge': KNOWLEDGE_PERMISSIONS,
  '/faq': ['manage_knowledge'],
  '/tickets': TICKET_PERMISSIONS,
  '/tickets/:id': TICKET_PERMISSIONS,
  '/settings/ticketing': ['manage_organization'],
  '/conversations': CHAT_VIEW_PERMISSIONS,
  // Store Management can create, edit, disable and delete tenant-wide
  // integrations, so it belongs to organization administration rather than
  // inbox access.
  '/stores': ORGANIZATION_PERMISSIONS,
  '/people': PEOPLE_PERMISSIONS,
  '/human-agents': ['manage_users'],
  '/settings/organization': ORGANIZATION_PERMISSIONS,
  '/settings/ai-config': AI_CONFIG_PERMISSIONS,
  '/settings/canned-responses': ['manage_organization'],
  '/settings/integrations': ['manage_organization'],
  '/settings/widget-apps': ['manage_organization'],
  '/settings/user': [],
  '/403': [],
}

/**
 * True if the current user holds at least one permission needed to visit `path`.
 * Unlisted paths (login, setup, 404) are permitted unconditionally here; their
 * gate is `requiresAuth` in the router definition.
 */
export function canAccessPath(path: string): boolean {
  const required = ROUTE_PERMISSIONS[path]
  if (!required || required.length === 0) return true
  return hasAnyPermission([...required])
}

/**
 * Guard helper: match against the router's matched route records (which include
 * parameterised forms like `/tickets/:id`), taking the union of required
 * permissions from every matched segment.
 */
export function canAccessMatchedPaths(paths: string[]): boolean {
  const required = paths.flatMap((p) => ROUTE_PERMISSIONS[p] || [])
  if (required.length === 0) return true
  return hasAnyPermission([...required])
}
