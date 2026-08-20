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

import { toast } from 'vue-sonner'
import { chatService } from '@/services/chat'
import type { ChatDetail } from '@/types/chat'

const TOAST_OPTIONS = { duration: 4000, closeButton: true }

/**
 * Take the AI out of a chat and queue it for the team, without claiming it.
 *
 * Shared by the chat pane and the info panel — both offer the action, and a
 * copy each is how the takeover button ended up behaving differently in the
 * two places. Returns the updated chat so the caller can refresh its own
 * state, or null when the call failed and nothing changed.
 */
export async function routeChatToHuman(sessionId: string): Promise<ChatDetail | null> {
  try {
    const updated = await chatService.routeToHuman(sessionId)
    toast.success('Chat handed to your team', {
      description: 'The AI has stopped replying. Anyone can now take it over.',
      ...TOAST_OPTIONS,
    })
    return updated
  } catch (err: any) {
    console.error('Failed to route chat to a human:', err)
    toast.error('Failed to hand this chat over', {
      description: err.response?.data?.detail || 'Please try again',
      ...TOAST_OPTIONS,
    })
    return null
  }
}
