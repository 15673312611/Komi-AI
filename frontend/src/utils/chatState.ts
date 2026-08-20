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

interface TakeoverCandidate {
  status?: string | null
  user_id?: string | null
}

/**
 * Whether a chat is claimable: still open, and nobody holds it.
 *
 * Covers both an AI-handled conversation (status open, no user) and one the AI
 * has queued for a human (status transferred). Single source of truth — the
 * chat pane and the info panel each carried their own version, and the pane's
 * narrower one meant the only way to claim an AI chat was via the info panel.
 *
 * Mirrors the backend guard: takeover_session refuses once user_id is set, so
 * offering the action for a chat another agent holds would only ever fail.
 */
export function canTakeOverChat(chat?: TakeoverCandidate | null): boolean {
  if (!chat) return false
  return chat.status !== 'closed' && !chat.user_id
}

/** Who is currently answering the customer. */
export type ChatHandlerKind = 'ai' | 'waiting' | 'human' | 'closed'

export interface ChatHandler {
  kind: ChatHandlerKind
  label: string
}

export interface HandlerCandidate extends TakeoverCandidate {
  user_name?: string | null
  group_id?: string | null
  agent?: { ai_replies_enabled?: boolean } | null
}

/** Every label the handler can carry, in one place — no per-surface strings. */
const HANDLER_LABELS = {
  ai: 'AI',
  waiting: 'Waiting for human',
  closed: 'Closed',
  you: 'You',
  someone: 'Another agent',
} as const

/**
 * The human holding the chat, named for display, or null while the AI has it.
 *
 * Independent of open/closed: a finished conversation still had somebody on it,
 * which is what the info panel's "Assigned to" reports.
 */
export function chatAssignee(
  chat?: HandlerCandidate | null,
  currentUserId?: string | null
): string | null {
  if (!chat?.user_id) return null
  if (currentUserId && chat.user_id === currentUserId) return HANDLER_LABELS.you
  return chat.user_name || HANDLER_LABELS.someone
}

/**
 * Derive who is handling a chat, for both the inbox list and the chat pane.
 *
 * Mirrors the server-side guards: `user_id` set means a human owns the chat and
 * the AI never runs; `transferred` with no assignee means it is queued for a
 * human; an agent with AI switched off is waiting for one from the first
 * message; anything else open is still the AI's. Keeping that derivation here
 * means the list badge, the chat header and the info panel cannot drift apart
 * the way their three hand-rolled copies did.
 *
 * A missing chat reads as AI-handled, which is what an unclaimed session is.
 */
export function chatHandler(
  chat?: HandlerCandidate | null,
  currentUserId?: string | null
): ChatHandler {
  if (chat?.status === 'closed') {
    return { kind: 'closed', label: HANDLER_LABELS.closed }
  }

  const assignee = chatAssignee(chat, currentUserId)
  if (assignee) return { kind: 'human', label: assignee }

  // Queued for people: the AI handed it over, it sits in a group's queue, or
  // the agent never answers with AI at all. Nobody has claimed it yet, so no
  // reply is coming until someone does.
  if (
    chat &&
    (chat.status === 'transferred' ||
      chat.group_id ||
      chat.agent?.ai_replies_enabled === false)
  ) {
    return { kind: 'waiting', label: HANDLER_LABELS.waiting }
  }

  return { kind: 'ai', label: HANDLER_LABELS.ai }
}
