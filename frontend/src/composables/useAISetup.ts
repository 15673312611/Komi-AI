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

import { computed, ref, onMounted } from 'vue'
import { aiService, type AIConfig, type AITestResult } from '@/services/ai'
import type { AIProvider } from '@/types/ai'

export function useAISetup() {
  const isLoading = ref(false)
  const operationError = ref('')
  const providerError = ref('')
  const configError = ref('')
  const error = computed(() => operationError.value || providerError.value || configError.value)
  const setupConfig = ref<{
    provider: string
    model: string
    apiKey: string
    baseUrl?: string
  }>({
    provider: '',
    model: '',
    apiKey: '',
    baseUrl: '',
  })

  const hasExistingConfig = ref(false)
  const hasConfiguredKey = ref(false)
  const configuredKeyMasked = ref('')

  // Provider catalog is served by the backend (GET /ai/providers) — single source
  // of truth. Values are normalized to lowercase to match the save/load flow, which
  // upper-cases on save and lower-cases the stored model_type on load.
  const providers = ref<AIProvider[]>([])
  let providerRequest = 0
  let configRequest = 0
  let saveInFlight = false

  const apiErrorMessage = (err: unknown, fallback: string): string => {
    const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    if (typeof detail === 'string' && detail) return detail
    if (detail && typeof detail === 'object') {
      const details = (detail as { details?: unknown }).details
      const message = (detail as { error?: unknown }).error
      if (typeof details === 'string' && details) return details
      if (typeof message === 'string' && message) return message
    }
    if (err instanceof Error && err.message) return err.message
    return fallback
  }

  const loadProviders = async () => {
    const request = ++providerRequest
    try {
      const fetched = await aiService.getProviders()
      if (request !== providerRequest) return
      if (!Array.isArray(fetched)) throw new Error('Provider catalog is invalid')
      providers.value = fetched
        .filter((p) => p && typeof p.value === 'string')
        .map((p) => ({ ...p, value: p.value.toLowerCase() }))
      providerError.value = ''
    } catch (err: unknown) {
      if (request === providerRequest) {
        providerError.value = apiErrorMessage(err, 'Failed to load providers')
      }
    }
  }

  const loadExistingConfig = async () => {
    const request = ++configRequest
    try {
      isLoading.value = true
      configError.value = ''
      const config = await aiService.getOrganizationConfig()
      if (request !== configRequest) return
      if (!config || typeof config.model_type !== 'string' || typeof config.model_name !== 'string') {
        throw new Error('AI configuration is invalid')
      }
      const rawSettings = config.settings && typeof config.settings === 'object' ? config.settings : {}
      setupConfig.value = {
        provider: config.model_type.toLowerCase(),
        model: config.model_name,
        apiKey: '', // Keep empty for input unless user types a new one
        baseUrl: rawSettings.base_url || '',
      }
      hasExistingConfig.value = true
      hasConfiguredKey.value = !!config.has_api_key
      configuredKeyMasked.value = config.api_key_masked || (config.has_api_key ? '••••••••(已配置有效密钥)' : '')
      configError.value = ''
    } catch (err: unknown) {
      if (request !== configRequest) return
      const response = (err as { response?: { status?: number; data?: { detail?: unknown } } }).response
      const detail = response?.data?.detail
      const isMissing = response?.status === 404
        || (detail && typeof detail === 'object' && (detail as { error?: unknown }).error === 'AI configuration not found')
      if (!isMissing) {
        configError.value = apiErrorMessage(err, 'Failed to load configuration')
      } else {
        configError.value = ''
      }
      hasExistingConfig.value = false
      hasConfiguredKey.value = false
      configuredKeyMasked.value = ''
    } finally {
      if (request === configRequest) isLoading.value = false
    }
  }

  const saveAISetup = async (): Promise<boolean> => {
    if (saveInFlight || isLoading.value) return false
    saveInFlight = true
    try {
      operationError.value = ''
      isLoading.value = true

      if (hasExistingConfig.value) {
        return await performUpdateAISetup()
      }

      const payload: AIConfig = {
        model_type: setupConfig.value.provider.toUpperCase(),
        model_name: setupConfig.value.model,
        api_key: setupConfig.value.apiKey?.trim() || '',
        settings: setupConfig.value.baseUrl ? { base_url: setupConfig.value.baseUrl.trim() } : {},
      }

      await aiService.setupAI(payload)
      hasExistingConfig.value = true
      hasConfiguredKey.value = !!payload.api_key
      return true
    } catch (err: unknown) {
      operationError.value = apiErrorMessage(err, 'Setup failed. Please try again.')
      return false
    } finally {
      isLoading.value = false
      saveInFlight = false
    }
  }

  const updateAISetup = async (): Promise<boolean> => {
    if (saveInFlight || isLoading.value) return false
    saveInFlight = true
    try {
      operationError.value = ''
      isLoading.value = true
      return await performUpdateAISetup()
    } catch (err: unknown) {
      operationError.value = apiErrorMessage(err, 'Update failed. Please try again.')
      return false
    } finally {
      isLoading.value = false
      saveInFlight = false
    }
  }

  const performUpdateAISetup = async (): Promise<boolean> => {
      const payload: AIConfig = {
        model_type: setupConfig.value.provider.toUpperCase(),
        model_name: setupConfig.value.model,
        settings: setupConfig.value.baseUrl ? { base_url: setupConfig.value.baseUrl.trim() } : {},
      }
      // Only include api_key if the user entered a new one, so backend preserves existing encrypted key
      if (setupConfig.value.apiKey && setupConfig.value.apiKey.trim()) {
        payload.api_key = setupConfig.value.apiKey.trim()
      }
      await aiService.updateAI(payload)
      if (payload.api_key) {
        hasConfiguredKey.value = true
        configuredKeyMasked.value = '••••••••(已更新并加密)'
      }
      return true
  }

  const testAISetup = async (): Promise<AITestResult> => {
    const payload: AIConfig = {
      model_type: setupConfig.value.provider.toUpperCase(),
      model_name: setupConfig.value.model,
      settings: setupConfig.value.baseUrl ? { base_url: setupConfig.value.baseUrl.trim() } : {},
    }
    if (setupConfig.value.apiKey && setupConfig.value.apiKey.trim()) {
      payload.api_key = setupConfig.value.apiKey.trim()
    }
    return await aiService.testAI(payload)
  }

  onMounted(() => {
    loadProviders()
    loadExistingConfig()
  })

  return {
    isLoading,
    error,
    setupConfig,
    providers,
    hasExistingConfig,
    hasConfiguredKey,
    configuredKeyMasked,
    saveAISetup,
    updateAISetup,
    testAISetup,
    loadProviders,
    loadExistingConfig,
  }
}
