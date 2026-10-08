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
import { AI_DISCLAIMER_TEXT, shouldShowAiDisclaimer } from '@/utils/aiDisclaimer'

describe('shouldShowAiDisclaimer', () => {
  it('shows the disclosure while the AI is answering', () => {
    expect(shouldShowAiDisclaimer(true, false)).toBe(true)
  })

  it('hides it once a human agent takes the conversation over', () => {
    // The replies are written by a person from here on, so the line would be untrue.
    expect(shouldShowAiDisclaimer(true, true)).toBe(false)
  })

  it('hides it when the operator turns the setting off', () => {
    expect(shouldShowAiDisclaimer(false, false)).toBe(false)
  })

  it('discloses when the setting is missing', () => {
    // A widget served before this setting existed sends no value. Absent
    // configuration must fail towards disclosing, never towards hiding.
    expect(shouldShowAiDisclaimer(undefined)).toBe(true)
    expect(shouldShowAiDisclaimer(null)).toBe(true)
  })

  it('still respects a human takeover when the setting is missing', () => {
    expect(shouldShowAiDisclaimer(undefined, true)).toBe(false)
  })
})

describe('AI_DISCLAIMER_TEXT', () => {
  it('names AI explicitly, so the disclosure is readable as one', () => {
    expect(AI_DISCLAIMER_TEXT).toContain('AI')
  })
})
