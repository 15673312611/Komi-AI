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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  // Never resolves — stands in for getSWRegistration()'s 8s timeout when no
  // service worker is ready.
  getSWRegistration: vi.fn(() => new Promise<undefined>(() => {})),
  isSupported: vi.fn().mockResolvedValue(true),
  clearFCMToken: vi.fn(),
}))

vi.mock('@/pwa/register', () => ({
  getSWRegistration: mocks.getSWRegistration,
  isShopifyEmbedded: () => false,
}))
vi.mock('firebase/messaging', () => ({
  isSupported: mocks.isSupported,
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(),
  deleteToken: vi.fn().mockResolvedValue(true),
  onMessage: vi.fn(),
}))
vi.mock('@/services/user', () => ({
  userService: { clearFCMToken: mocks.clearFCMToken, updateFCMToken: vi.fn() },
}))

describe('unregisterFCMToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted' },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('gives up rather than holding logout open on a stalled service worker', async () => {
    // Regression: logout awaits this, and getSWRegistration only settles after
    // an 8s timeout when no worker is ready — so signing out appeared to hang.
    // A browser with no ready worker cannot display a push anyway, and the row
    // is pruned server-side on its next failed send.
    const { unregisterFCMToken } = await import('@/services/firebase')

    vi.useFakeTimers()
    let settled = false
    const pending = unregisterFCMToken().then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(2999)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(settled).toBe(true)
  })

  it('does nothing when notification permission was never granted', async () => {
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default' },
      configurable: true,
    })
    const { unregisterFCMToken } = await import('@/services/firebase')

    await unregisterFCMToken()

    expect(mocks.getSWRegistration).not.toHaveBeenCalled()
    expect(mocks.clearFCMToken).not.toHaveBeenCalled()
  })
})
