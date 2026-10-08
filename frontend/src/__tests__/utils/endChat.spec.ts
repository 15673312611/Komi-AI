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

import { describe, expect, it } from 'vitest'
import { canRequestRating, endChatMessage, isEndChatMessage } from '@/utils/endChat'

describe('canRequestRating', () => {
  it('allows rating on widget channels', () => {
    expect(canRequestRating('web')).toBe(true)
    expect(canRequestRating('shopify')).toBe(true)
    expect(canRequestRating(undefined)).toBe(true)
  })

  it('refuses rating on external channels that cannot render it', () => {
    expect(canRequestRating('whatsapp')).toBe(false)
    expect(canRequestRating('telegram')).toBe(false)
  })
})

describe('endChatMessage', () => {
  it('only asks for a rating where one can be given', () => {
    expect(endChatMessage('web')).toContain('rating')
    expect(endChatMessage('whatsapp')).not.toContain('rating')
  })
})

describe('isEndChatMessage', () => {
  it('is true only when attributes.end_chat is set', () => {
    expect(isEndChatMessage({ attributes: { end_chat: true } })).toBe(true)
    expect(isEndChatMessage({ attributes: { end_chat: false } })).toBe(false)
    expect(isEndChatMessage({ attributes: {} })).toBe(false)
  })

  it('is false for messages with no attributes at all', () => {
    expect(isEndChatMessage({})).toBe(false)
    expect(isEndChatMessage(null)).toBe(false)
    expect(isEndChatMessage(undefined)).toBe(false)
    expect(isEndChatMessage({ attributes: null })).toBe(false)
  })

  it('ignores a real session_id — that is what caused the takeover bug', () => {
    // The takeover notice and form prompts are ordinary conversation messages
    // that carry a session_id. Treating those as end-chat closed live chats
    // the moment a human agent joined.
    const takeoverNotice = {
      message: 'Arun joined the conversation',
      message_type: 'system',
      session_id: '790b1bbc-2772-4d35-beab-68548abb08ad',
    }
    const formPrompt = {
      message_type: 'form',
      session_id: '790b1bbc-2772-4d35-beab-68548abb08ad',
    }

    expect(isEndChatMessage(takeoverNotice)).toBe(false)
    expect(isEndChatMessage(formPrompt)).toBe(false)
  })
})
