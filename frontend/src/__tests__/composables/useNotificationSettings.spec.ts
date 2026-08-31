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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useNotificationSettings } from '@/composables/useNotificationSettings'
import { notificationService } from '@/services/notification'

vi.mock('@/services/notification', () => ({
  notificationService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}))

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const defaults = {
  notify_new_chat: false,
  notify_chat_transfer: true,
  notify_chat_assigned: true,
}

const mountSettings = () => {
  const state: { current?: ReturnType<typeof useNotificationSettings> } = {}
  const Harness = defineComponent({
    setup: () => {
      state.current = useNotificationSettings()
      return () => null
    },
  })
  return { wrapper: mount(Harness), state: state.current! }
}

describe('useNotificationSettings', () => {
  beforeEach(() => {
    vi.mocked(notificationService.getSettings).mockResolvedValue({ ...defaults })
    vi.mocked(notificationService.updateSettings).mockReset()
  })

  it('loads the current preferences', async () => {
    const { wrapper, state } = mountSettings()
    const { settings, isLoading, load } = state
    await load()

    expect(isLoading.value).toBe(false)
    expect(settings.value).toEqual(defaults)
    wrapper.unmount()
  })

  it('applies a toggle optimistically and keeps the server response', async () => {
    vi.mocked(notificationService.updateSettings).mockResolvedValue({
      ...defaults,
      notify_new_chat: true,
    })

    const { wrapper, state } = mountSettings()
    const { settings, load, save } = state
    await load()
    await save({ notify_new_chat: true })

    expect(notificationService.updateSettings).toHaveBeenCalledWith({ notify_new_chat: true })
    expect(settings.value?.notify_new_chat).toBe(true)
    wrapper.unmount()
  })

  it('rolls the toggle back when the save fails', async () => {
    vi.mocked(notificationService.updateSettings).mockRejectedValue(new Error('nope'))

    const { wrapper, state } = mountSettings()
    const { settings, load, save } = state
    await load()
    await save({ notify_chat_transfer: false })

    expect(settings.value).toEqual(defaults)
    wrapper.unmount()
  })
})
