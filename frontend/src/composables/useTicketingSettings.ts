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

import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ticketService } from '@/services/tickets'
import type { TicketSettings } from '@/types/ticket'

export function useTicketingSettings() {
  const settings = ref<TicketSettings | null>(null)
  const isLoading = ref(true)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const planGated = ref(false)
  let loadVersion = 0
  let mutationVersion = 0

  async function load() {
    const version = ++loadVersion
    const mutationAtStart = mutationVersion
    isLoading.value = true
    try {
      const next = await ticketService.getSettings()
      if (version !== loadVersion || mutationAtStart !== mutationVersion) return
      settings.value = next
      error.value = null
      planGated.value = false
    } catch (e: any) {
      if (version !== loadVersion) return
      planGated.value = /plan/i.test(e?.message || '')
      error.value = e?.message || 'Failed to load ticketing settings'
    } finally {
      if (version === loadVersion) isLoading.value = false
    }
  }

  async function save(patch: Partial<TicketSettings>) {
    if (!settings.value || isSaving.value) return
    const mutation = ++mutationVersion
    isSaving.value = true
    const previous = { ...settings.value }
    Object.assign(settings.value, patch)
    try {
      const next = await ticketService.updateSettings(patch)
      if (mutation === mutationVersion) {
        settings.value = next
        error.value = null
        toast.success('Ticketing settings saved')
      }
    } catch (e: any) {
      if (mutation === mutationVersion) {
        settings.value = previous
        toast.error(e?.message || 'Failed to save ticketing settings')
      }
    } finally {
      if (mutation === mutationVersion) isSaving.value = false
    }
  }

  onMounted(load)

  return { settings, isLoading, isSaving, error, planGated, load, save }
}
