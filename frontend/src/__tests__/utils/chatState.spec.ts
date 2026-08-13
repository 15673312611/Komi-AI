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

import { describe, expect, it } from 'vitest'
import { canTakeOverChat, chatAssignee, chatHandler } from '@/utils/chatState'

describe('canTakeOverChat', () => {
  it('offers the claim only for an open, unclaimed chat', () => {
    expect(canTakeOverChat({ status: 'open', user_id: null })).toBe(true)
    expect(canTakeOverChat({ status: 'transferred', user_id: null })).toBe(true)
    expect(canTakeOverChat({ status: 'open', user_id: 'u1' })).toBe(false)
    expect(canTakeOverChat({ status: 'closed', user_id: null })).toBe(false)
    expect(canTakeOverChat(null)).toBe(false)
  })
})

describe('chatAssignee', () => {
  it('names the human on the chat, whatever its status', () => {
    expect(chatAssignee({ status: 'open', user_id: 'u1', user_name: 'Priya' })).toBe('Priya')
    // A finished conversation still had somebody on it — the info panel says who.
    expect(chatAssignee({ status: 'closed', user_id: 'u1', user_name: 'Priya' })).toBe('Priya')
    expect(chatAssignee({ status: 'open', user_id: 'u1' }, 'u1')).toBe('You')
  })

  it('is null while the AI has the chat', () => {
    expect(chatAssignee({ status: 'open', user_id: null })).toBeNull()
    expect(chatAssignee(null)).toBeNull()
  })
})

describe('chatHandler', () => {
  it('reads an open, unassigned chat as AI-handled', () => {
    expect(chatHandler({ status: 'open', user_id: null })).toEqual({
      kind: 'ai',
      label: 'AI',
    })
  })

  it('reads a queued chat as waiting, whether transferred or sat in a group', () => {
    expect(chatHandler({ status: 'transferred', user_id: null }).kind).toBe('waiting')
    expect(chatHandler({ status: 'open', user_id: null, group_id: 'g1' }).kind).toBe('waiting')
  })

  it('reads a human-only agent as waiting, never as AI-handled', () => {
    // The AI never answers on this agent, so an unclaimed chat of its is
    // waiting for a person from the very first message.
    const chat = { status: 'open', user_id: null, agent: { ai_replies_enabled: false } }
    expect(chatHandler(chat)).toEqual({ kind: 'waiting', label: 'Waiting for human' })
    expect(chatHandler({ ...chat, agent: { ai_replies_enabled: true } }).kind).toBe('ai')
    // Older payloads omit the flag entirely — those agents do answer.
    expect(chatHandler({ status: 'open', user_id: null, agent: {} }).kind).toBe('ai')
  })

  it('still names the human once someone picks up a human-only chat', () => {
    expect(
      chatHandler({
        status: 'open',
        user_id: 'u1',
        user_name: 'Priya',
        agent: { ai_replies_enabled: false },
      }).kind
    ).toBe('human')
  })

  it('names the human holding the chat', () => {
    expect(chatHandler({ status: 'open', user_id: 'u1', user_name: 'Priya' })).toEqual({
      kind: 'human',
      label: 'Priya',
    })
  })

  it('says "You" when the current user holds it', () => {
    expect(chatHandler({ status: 'open', user_id: 'u1', user_name: 'Priya' }, 'u1').label).toBe(
      'You'
    )
    expect(chatHandler({ status: 'open', user_id: 'u1', user_name: 'Priya' }, 'u2').label).toBe(
      'Priya'
    )
  })

  it('falls back when the assignee name is missing', () => {
    // The list API returns the id even where the join yields no name.
    expect(chatHandler({ status: 'open', user_id: 'u1' })).toEqual({
      kind: 'human',
      label: 'Another agent',
    })
  })

  it('reports closed ahead of any assignee', () => {
    expect(chatHandler({ status: 'closed', user_id: 'u1', user_name: 'Priya' }).kind).toBe('closed')
    expect(chatHandler({ status: 'closed', user_id: null }).kind).toBe('closed')
  })

  it('defaults a missing chat to AI rather than throwing', () => {
    expect(chatHandler(null).kind).toBe('ai')
    expect(chatHandler(undefined).kind).toBe('ai')
  })
})
