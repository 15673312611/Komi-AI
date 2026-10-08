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

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { HelpCenterSettings } from '@/types/faq'

const mocks = vi.hoisted(() => ({
  updateSettings: vi.fn(),
  uploadLogo: vi.fn(),
  removeLogo: vi.fn(),
  uploadFavicon: vi.fn(),
  removeFavicon: vi.fn(),
  setDomain: vi.fn(),
  verifyDomain: vi.fn(),
  removeDomain: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/services/faq', () => ({ faqService: mocks }))
vi.mock('vue-sonner', () => ({ toast: { error: mocks.error } }))

import { useHelpCenterSettings } from '@/composables/useHelpCenterSettings'

const baseSettings: HelpCenterSettings = {
  enabled: true,
  slug: 'support',
  title: 'Support',
  description: null,
  logo_url: null,
  favicon_url: null,
  brand_color: '#4338CA',
  header_links: [],
  cta_text: 'Open app',
  cta_url: 'https://app.example.com',
  cta_enabled: true,
  auto_generate: false,
  agent_id: null,
  ai_search_enabled: true,
  chat_widget_enabled: true,
  live_url: 'https://support.example.com',
  published_count: 0,
  plan_allowed: true,
  agents: [],
  domain: null,
}

const responseFor = (patch: Partial<HelpCenterSettings> = {}): HelpCenterSettings => ({
  ...baseSettings,
  ...patch,
})

describe('useHelpCenterSettings write coordination', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    mocks.updateSettings.mockImplementation(async (patch) => responseFor(patch))
    mocks.uploadLogo.mockResolvedValue(responseFor({ logo_url: '/logo.png' }))
    mocks.removeLogo.mockResolvedValue(responseFor())
    mocks.uploadFavicon.mockResolvedValue(responseFor({ favicon_url: '/favicon.png' }))
    mocks.removeFavicon.mockResolvedValue(responseFor())
  })

  it('merges multiple debounced fields into one request', async () => {
    vi.useFakeTimers()
    const state = useHelpCenterSettings(ref(baseSettings))

    state.queueSave({ cta_text: 'Contact us' })
    state.queueSave({ cta_url: 'https://example.com/contact' })
    await vi.advanceTimersByTimeAsync(800)

    expect(mocks.updateSettings).toHaveBeenCalledTimes(1)
    expect(mocks.updateSettings).toHaveBeenCalledWith({
      cta_text: 'Contact us',
      cta_url: 'https://example.com/contact',
    })
  })

  it('flushes pending text edits before an immediate setting change', async () => {
    vi.useFakeTimers()
    const state = useHelpCenterSettings(ref(baseSettings))

    state.queueSave({ cta_text: 'Contact us' })
    await state.saveNow({ cta_enabled: false })

    expect(mocks.updateSettings).toHaveBeenCalledTimes(1)
    expect(mocks.updateSettings).toHaveBeenCalledWith({
      cta_text: 'Contact us',
      cta_enabled: false,
    })
  })

  it('keeps asset actions in the order they were invoked', async () => {
    const calls: string[] = []
    mocks.uploadLogo.mockImplementation(async () => {
      calls.push('upload-logo')
      return responseFor({ logo_url: '/logo.png' })
    })
    mocks.removeLogo.mockImplementation(async () => {
      calls.push('remove-logo')
      return responseFor()
    })
    const state = useHelpCenterSettings(ref(baseSettings))
    const file = new File(['image'], 'logo.png', { type: 'image/png' })

    await Promise.all([state.uploadLogo(file), state.removeLogo()])

    expect(calls).toEqual(['upload-logo', 'remove-logo'])
  })
})
