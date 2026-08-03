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

import { userService } from '@/services/user'

export function hasPermission(permission: string): boolean {
  const user = userService.getCurrentUser()
  return user?.role?.permissions?.some(p => p.name === permission) || false
}

export function hasAnyPermission(permissions: string[]): boolean {
  // super_admin holds everything — the backend's has_any_permission bypasses
  // on it, and the two layers disagreeing means a page renders then 403s.
  return hasPermission('super_admin') || permissions.some(permission => hasPermission(permission))
}

// Permission groups, mirroring the constants in backend/app/core/auth.py.
// Exported so the route map can name the same sets the API enforces.

/** Seeing conversations — CHAT_VIEW_PERMISSIONS. */
export const CHAT_VIEW_PERMISSIONS = [
  'view_all_chats',
  'view_assigned_chats',
  'view_unassigned_chats',
]

/** Acting on one: takeover, reassign, outbound — CHAT_MANAGE_PERMISSIONS. */
export const CHAT_MANAGE_PERMISSIONS = ['manage_all_chats', 'manage_assigned_chats']

/** Working the inbox at all — INBOX_PERMISSIONS. */
export const INBOX_PERMISSIONS = [...CHAT_VIEW_PERMISSIONS, ...CHAT_MANAGE_PERMISSIONS]

/** The people directory — PEOPLE_READ_PERMISSIONS. Writes match reads. */
export const PEOPLE_PERMISSIONS = ['view_people', ...INBOX_PERMISSIONS]

// The remaining view/manage pairs, named once so the route map and the checks
// below cannot drift apart.
export const AGENT_PERMISSIONS = ['manage_agents', 'view_agents']
export const KNOWLEDGE_PERMISSIONS = ['manage_knowledge', 'view_knowledge']
export const TICKET_PERMISSIONS = ['view_tickets', 'manage_tickets']
export const ORGANIZATION_PERMISSIONS = ['manage_organization', 'view_organization']
export const AI_CONFIG_PERMISSIONS = ['manage_ai_config', 'view_ai_config']
export const SUBSCRIPTION_PERMISSIONS = ['manage_subscription', 'view_subscription']

// Common permission checks.
//
// Every check goes through hasAnyPermission, never bare hasPermission: it is
// the only one that honours super_admin, and the backend's check_permissions
// bypasses on it. When the two layers disagree the page renders and then 403s.
export const permissionChecks = {
  canManageOrganization: () => hasAnyPermission(['manage_organization']),
  canViewOrganization: () => hasAnyPermission(ORGANIZATION_PERMISSIONS),
  canManageAIConfig: () => hasAnyPermission(['manage_ai_config']),
  canViewAIConfig: () => hasAnyPermission(AI_CONFIG_PERMISSIONS),
  canManageUsers: () => hasAnyPermission(['manage_users']),
  canViewAgents: () => hasAnyPermission(AGENT_PERMISSIONS),
  canManageAgents: () => hasAnyPermission(['manage_agents']),
  canViewChats: () => hasAnyPermission(CHAT_VIEW_PERMISSIONS),
  canViewPeople: () => hasAnyPermission(PEOPLE_PERMISSIONS),
  // Correcting a person or marking them a customer is inbox work, not
  // administration — PEOPLE_WRITE_PERMISSIONS equals the read set.
  canManagePeople: () => hasAnyPermission(PEOPLE_PERMISSIONS),
  canTakeOverChats: () => hasAnyPermission(CHAT_MANAGE_PERMISSIONS),
  canManageKnowledge: () => hasAnyPermission(['manage_knowledge']),
  canViewKnowledge: () => hasAnyPermission(KNOWLEDGE_PERMISSIONS),
  canViewAnalytics: () => hasAnyPermission(['view_analytics']),
  canViewTickets: () => hasAnyPermission(TICKET_PERMISSIONS),
  canManageTickets: () => hasAnyPermission(['manage_tickets']),
  canApproveTicketActions: () => hasAnyPermission(['approve_ticket_actions']),
  canViewSubscription: () => hasAnyPermission(SUBSCRIPTION_PERMISSIONS),
  canManageSubscription: () => hasAnyPermission(['manage_subscription']),
}