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

import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Agent, AgentUpdate } from '@/types/agent'
import { agentService } from '@/services/agent'

export function useAgentAdvanced(agent: Ref<Agent>) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasUnsavedChanges = ref(false)
  
  // Rate limiting settings - local state
  const localSettings = ref({
    enableRateLimiting: agent.value.enable_rate_limiting || false,
    overallLimitPerIp: String(agent.value.overall_limit_per_ip || 100),
    requestsPerSec: String(agent.value.requests_per_sec || 1)
  })

  const isRateLimitValid = computed(() => {
    const overallLimit = Number.parseInt(localSettings.value.overallLimitPerIp, 10)
    const requestsPerSec = Number.parseInt(localSettings.value.requestsPerSec, 10)
    return Number.isInteger(overallLimit) && overallLimit >= 10 && overallLimit <= 1000 &&
      Number.isInteger(requestsPerSec) && requestsPerSec >= 1 && requestsPerSec <= 10
  })
  
  // Watch for changes in the agent object to update local state
  watch(() => agent.value, (newAgent) => {
    // An update from another card must not discard values the user is still
    // editing in the rate-limit form.
    if (hasUnsavedChanges.value || isLoading.value) return
    localSettings.value = {
      enableRateLimiting: newAgent.enable_rate_limiting || false,
      overallLimitPerIp: String(newAgent.overall_limit_per_ip || 100),
      requestsPerSec: String(newAgent.requests_per_sec || 1)
    }
    hasUnsavedChanges.value = false
  })
  
  // Tooltip content
  const rateLimitTooltipContent = () => {
    return `开启后：\n• 限制单 IP 地址的访问频率\n• 防止恶意滥用与刷量\n• 精细化流量管控\n• 保护 API 算力资源安全`
  }

  const dailyLimitTooltipContent = () => {
    return `单个 IP 地址每日允许的最大请求次数。\n推荐设置：通常业务场景设为 100-500 次。`
  }

  const requestsPerSecTooltipContent = () => {
    return `单个 IP 每秒允许的最大请求数。\n建议设为 1-10 之间的整数以保证稳定性。`
  }
  
  // Toggle rate limiting with API call
  const toggleRateLimiting = async () => {
    if (isLoading.value) return null
    try {
      isLoading.value = true
      error.value = null
      
      const updatedData: AgentUpdate = {
        enable_rate_limiting: !localSettings.value.enableRateLimiting,
        // When enabling, set default values
        ...((!localSettings.value.enableRateLimiting) && {
          overall_limit_per_ip: 100,
          requests_per_sec: 1
        })
      }
      
      const updatedAgent = await agentService.updateAgent(agent.value.id, updatedData)
      
      // Update the agent reference and local settings with the new data
      agent.value = { ...agent.value, ...updatedAgent }
      localSettings.value = {
        enableRateLimiting: updatedAgent.enable_rate_limiting,
        overallLimitPerIp: String(updatedAgent.overall_limit_per_ip ?? 100),
        requestsPerSec: String(updatedAgent.requests_per_sec ?? 1)
      }
      hasUnsavedChanges.value = false
      
      return updatedAgent
    } catch (err) {
      error.value = '更新频率限制设置失败'
      console.error('Toggle rate limiting error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // Update local rate limit values
  const updateLocalValue = (type: 'overallLimitPerIp' | 'requestsPerSec', value: string) => {
    // Keep the input editable while rejecting non-numeric values. The save
    // button is disabled until both fields are within the API's bounds.
    if (value.trim() === '') {
      value = ''
    } else {
      const numValue = Number.parseInt(value, 10)
      if (!Number.isFinite(numValue)) {
        value = ''
      } else if (type === 'requestsPerSec') {
        value = String(Math.min(10, Math.max(1, numValue)))
      } else {
        value = String(Math.min(1000, Math.max(10, numValue)))
      }
    }
    
    localSettings.value = {
      ...localSettings.value,
      [type]: value
    }
    hasUnsavedChanges.value = true
  }
  
  // Save rate limit settings
  const saveRateLimitSettings = async () => {
    if (isLoading.value || !isRateLimitValid.value) {
      if (!isRateLimitValid.value) error.value = '请输入有效的频率限制数值'
      return null
    }
    try {
      isLoading.value = true
      error.value = null
      
      const updatedData: AgentUpdate = {
        overall_limit_per_ip: Number.parseInt(localSettings.value.overallLimitPerIp, 10),
        requests_per_sec: Number.parseInt(localSettings.value.requestsPerSec, 10)
      }
      
      const updatedAgent = await agentService.updateAgent(agent.value.id, updatedData)
      
      // Update the agent reference and local settings with the new data
      agent.value = { ...agent.value, ...updatedAgent }
      localSettings.value = {
        ...localSettings.value,
        overallLimitPerIp: String(updatedAgent.overall_limit_per_ip ?? 100),
        requestsPerSec: String(updatedAgent.requests_per_sec ?? 1)
      }
      hasUnsavedChanges.value = false
      
      return updatedAgent
    } catch (err) {
      error.value = '保存频率限制设置失败'
      console.error('Update rate limit settings error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    localSettings,
    isRateLimitValid,
    isLoading,
    error,
    hasUnsavedChanges,
    rateLimitTooltipContent,
    dailyLimitTooltipContent,
    requestsPerSecTooltipContent,
    toggleRateLimiting,
    updateLocalValue,
    saveRateLimitSettings
  }
}
