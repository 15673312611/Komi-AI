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

import { ref, onMounted } from 'vue'
import { aiService, type AIConfig, type AITestResult } from '@/services/ai'
import type { AIProvider } from '@/types/ai'

export function useAISetup() {
  const isLoading = ref(false)
  const error = ref<string>('')
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

  const loadProviders = async () => {
    try {
      const fetched = await aiService.getProviders()
      providers.value = fetched.map((p) => ({ ...p, value: p.value.toLowerCase() }))
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { detail?: { details?: string; error?: string } } } }).response?.data?.detail;
      error.value = apiError?.details || apiError?.error || 'Failed to load providers'
    }
  }

  const loadExistingConfig = async () => {
    try {
      isLoading.value = true
      error.value = ''
      const config = await aiService.getOrganizationConfig()
      const rawSettings = (config as any).settings || {}
      setupConfig.value = {
        provider: config.model_type.toLowerCase(),
        model: config.model_name,
        apiKey: '', // Keep empty for input unless user types a new one
        baseUrl: rawSettings.base_url || '',
      }
      hasExistingConfig.value = true
      hasConfiguredKey.value = !!config.has_api_key
      configuredKeyMasked.value = config.api_key_masked || (config.has_api_key ? '••••••••(已配置有效密钥)' : '')
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { detail?: { details?: string; error?: string } } } }).response;
      if (response?.status !== 404 && response?.data?.detail?.error !== 'AI configuration not found') {
        error.value = response?.data?.detail?.details || response?.data?.detail?.error || 'Failed to load configuration'
      }
      hasExistingConfig.value = false
      hasConfiguredKey.value = false
      configuredKeyMasked.value = ''
    } finally {
      isLoading.value = false
    }
  }

  const saveAISetup = async (): Promise<boolean> => {
    try {
      error.value = ''
      isLoading.value = true

      if (hasExistingConfig.value) {
        return await updateAISetup()
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
      const apiError = (err as { response?: { data?: { detail?: { details?: string; error?: string } } } }).response?.data?.detail;
      error.value = apiError?.details || apiError?.error || 'Setup failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateAISetup = async (): Promise<boolean> => {
    try {
      error.value = ''
      isLoading.value = true
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
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { detail?: { details?: string; error?: string } } } }).response?.data?.detail;
      error.value = apiError?.details || apiError?.error || 'Update failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
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
