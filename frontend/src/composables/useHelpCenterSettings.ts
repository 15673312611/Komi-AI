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

import { computed, ref, watch, type Ref } from 'vue'
import { toast } from 'vue-sonner'

import { faqService } from '@/services/faq'
import type { HelpCenterSettings, HelpCenterSettingsUpdate } from '@/types/faq'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 800
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const MAX_FAVICON_BYTES = 1 * 1024 * 1024

/** Appearance/settings editing with debounced autosave — the design has no
 * Save button ("changes apply instantly to your published help center"). */
export function useHelpCenterSettings(settings: Ref<HelpCenterSettings | null>) {
  const saveState = ref<SaveState>('idle')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSave: HelpCenterSettingsUpdate | null = null
  let unsavedPatch: HelpCenterSettingsUpdate = {}
  let settingsWriteQueue: Promise<void> = Promise.resolve()
  let suppressWatch = false

  const brandColor = computed(() => settings.value?.brand_color || '#4338CA')

  function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
  }

  function recordPatch(payload: HelpCenterSettingsUpdate): void {
    unsavedPatch = { ...unsavedPatch, ...payload }
  }

  function applyResponse(
    updated: HelpCenterSettings,
    committedPatch?: HelpCenterSettingsUpdate,
  ): void {
    const remainingPatch = { ...unsavedPatch }
    if (committedPatch) {
      for (const key of Object.keys(committedPatch) as Array<keyof HelpCenterSettingsUpdate>) {
        // A newer edit keeps the field dirty; an unchanged field can use the
        // canonical value returned by the server.
        if (remainingPatch[key] === committedPatch[key]) delete remainingPatch[key]
      }
    }
    unsavedPatch = remainingPatch
    suppressWatch = true
    settings.value = { ...updated, ...remainingPatch }
    // Release after the watcher has seen (and ignored) this assignment.
    setTimeout(() => {
      suppressWatch = false
    }, 0)
  }

  function enqueueSettingsMutation(
    operation: () => Promise<HelpCenterSettings>,
    committedPatch?: HelpCenterSettingsUpdate,
    fallback = 'Failed to save help center settings',
  ): Promise<void> {
    const task = settingsWriteQueue.then(async () => {
      saveState.value = 'saving'
      try {
        applyResponse(await operation(), committedPatch)
        saveState.value = 'saved'
      } catch (error: unknown) {
        saveState.value = 'error'
        toast.error(errorMessage(error, fallback))
      }
    })
    // One failed request must not prevent later edits or an image operation
    // from running. The task itself handles and reports the failure.
    settingsWriteQueue = task.then(() => undefined, () => undefined)
    return task
  }

  function takePendingSave(): HelpCenterSettingsUpdate | null {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = null
    const payload = pendingSave
    pendingSave = null
    return payload
  }

  function enqueueAssetMutation(
    operation: () => Promise<HelpCenterSettings>,
    fallback: string,
  ): Promise<void> {
    const payload = takePendingSave()
    if (payload && Object.keys(payload).length) {
      // Enqueue both parts synchronously so a second asset action cannot be
      // placed between the pending settings save and the first asset action.
      void enqueueSettingsMutation(
        () => faqService.updateSettings(payload),
        payload,
      )
    }
    return enqueueSettingsMutation(operation, undefined, fallback)
  }

  /** Debounced path for text inputs (links, CTA, labels). */
  function queueSave(payload: HelpCenterSettingsUpdate): void {
    if (!Object.keys(payload).length) return
    recordPatch(payload)
    pendingSave = { ...(pendingSave || {}), ...payload }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const queued = takePendingSave()
      if (queued) {
        void enqueueSettingsMutation(
          () => faqService.updateSettings(queued),
          queued,
        )
      }
    }, AUTOSAVE_DEBOUNCE_MS)
  }

  /** Immediate path for discrete actions (swatch click, toggles, selects). */
  async function saveNow(payload: HelpCenterSettingsUpdate): Promise<void> {
    if (!Object.keys(payload).length) return
    recordPatch(payload)
    const queued = takePendingSave()
    const merged = { ...(queued || {}), ...payload }
    await enqueueSettingsMutation(
      () => faqService.updateSettings(merged),
      merged,
    )
  }

  // Deep-watch branding fields the inputs mutate in place (header_links rows).
  watch(
    () => settings.value?.header_links,
    (links, previous) => {
      if (suppressWatch || links === undefined || previous === undefined) return
      queueSave({ header_links: links })
    },
    { deep: true },
  )

  async function uploadLogo(file: File): Promise<void> {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be 2 MB or smaller')
      return
    }
    await enqueueAssetMutation(
      () => faqService.uploadLogo(file),
      'Failed to upload logo',
    )
  }

  async function removeLogo(): Promise<void> {
    await enqueueAssetMutation(
      () => faqService.removeLogo(),
      'Failed to remove logo',
    )
  }

  async function uploadFavicon(file: File): Promise<void> {
    if (file.size > MAX_FAVICON_BYTES) {
      toast.error('Favicon must be 1 MB or smaller')
      return
    }
    await enqueueAssetMutation(
      () => faqService.uploadFavicon(file),
      'Failed to upload favicon',
    )
  }

  async function removeFavicon(): Promise<void> {
    await enqueueAssetMutation(
      () => faqService.removeFavicon(),
      'Failed to remove favicon',
    )
  }

  // Domain lifecycle (explicit Verify button — never autosaved).
  const domainBusy = ref(false)

  async function setDomain(domain: string): Promise<void> {
    if (domainBusy.value) return
    domainBusy.value = true
    try {
      const result = await faqService.setDomain(domain)
      if (settings.value) settings.value = { ...settings.value, domain: result }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      domainBusy.value = false
    }
  }

  async function verifyDomain(): Promise<void> {
    if (domainBusy.value) return
    domainBusy.value = true
    try {
      const result = await faqService.verifyDomain()
      if (settings.value) settings.value = { ...settings.value, domain: result }
      if (result.domain_status === 'verified') {
        toast.success('Domain verified')
      } else {
        toast.info('Records not visible yet — DNS changes can take a few minutes to propagate')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      domainBusy.value = false
    }
  }

  async function removeDomain(): Promise<void> {
    if (domainBusy.value) return
    domainBusy.value = true
    try {
      const result = await faqService.removeDomain()
      if (settings.value) settings.value = { ...settings.value, domain: result }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      domainBusy.value = false
    }
  }

  return {
    saveState,
    brandColor,
    queueSave,
    saveNow,
    uploadLogo,
    removeLogo,
    uploadFavicon,
    removeFavicon,
    domainBusy,
    setDomain,
    verifyDomain,
    removeDomain,
  }
}
