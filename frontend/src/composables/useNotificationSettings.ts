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

import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { notificationService, type NotificationSettings } from '@/services/notification'

export function useNotificationSettings() {
  const settings = ref<NotificationSettings | null>(null)
  const isLoading = ref(true)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    try {
      settings.value = await notificationService.getSettings()
      error.value = null
    } catch (e: any) {
      error.value = e?.message || 'Failed to load notification settings'
    } finally {
      isLoading.value = false
    }
  }

  // Optimistic: the toggle flips immediately and reverts if the save fails,
  // so a slow round-trip never makes the switch feel unresponsive.
  async function save(patch: Partial<NotificationSettings>) {
    if (!settings.value || isSaving.value) return
    isSaving.value = true
    const previous = { ...settings.value }
    Object.assign(settings.value, patch)
    try {
      settings.value = await notificationService.updateSettings(patch)
    } catch (e: any) {
      settings.value = previous
      toast.error(e?.message || 'Failed to save notification settings')
    } finally {
      isSaving.value = false
    }
  }

  onMounted(load)

  return { settings, isLoading, isSaving, error, load, save }
}
