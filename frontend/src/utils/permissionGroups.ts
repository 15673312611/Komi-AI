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

/**
 * Permission groups, mirroring the constants in backend/app/core/auth.py.
 *
 * A leaf module on purpose: it imports nothing. The route map reads these at
 * module scope, and there is an import cycle around the router
 * (router -> routePermissions -> permissions -> services/user -> services/api
 * -> router). Reading a constant from anywhere inside that cycle at module
 * scope throws "Cannot access X before initialization" in the browser — where
 * unit tests never see it, because they mock services/user and break the loop.
 */

/**
 * The two the user form's chat-scope toggles map to. Named individually
 * because the form reads and writes them one at a time; they mirror
 * AI_QUEUE_PERMISSION / ALL_CHATS_PERMISSION in services/chat_scope_roles.py.
 */
export const AI_QUEUE_PERMISSION = 'view_unassigned_chats'
export const ALL_CHATS_PERMISSION = 'view_all_chats'

/** Seeing conversations — CHAT_VIEW_PERMISSIONS. */
export const CHAT_VIEW_PERMISSIONS = [
  ALL_CHATS_PERMISSION,
  'view_assigned_chats',
  AI_QUEUE_PERMISSION,
]

/** Acting on one: takeover, reassign, outbound — CHAT_MANAGE_PERMISSIONS. */
export const CHAT_MANAGE_PERMISSIONS = ['manage_all_chats', 'manage_assigned_chats']

/** Working the inbox at all — INBOX_PERMISSIONS. */
export const INBOX_PERMISSIONS = [...CHAT_VIEW_PERMISSIONS, ...CHAT_MANAGE_PERMISSIONS]

/** The people directory — PEOPLE_READ_PERMISSIONS. Writes match reads. */
export const PEOPLE_PERMISSIONS = ['view_people', ...INBOX_PERMISSIONS]

// The remaining view/manage pairs, named once so the route map and the
// permission checks cannot drift apart.
export const AGENT_PERMISSIONS = ['manage_agents', 'view_agents']
export const KNOWLEDGE_PERMISSIONS = ['manage_knowledge', 'view_knowledge']
export const TICKET_PERMISSIONS = ['view_tickets', 'manage_tickets']
export const ORGANIZATION_PERMISSIONS = ['manage_organization', 'view_organization']
export const AI_CONFIG_PERMISSIONS = ['manage_ai_config', 'view_ai_config']
export const SUBSCRIPTION_PERMISSIONS = ['manage_subscription', 'view_subscription']
