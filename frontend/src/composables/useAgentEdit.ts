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

import { ref } from 'vue'
import type { Agent } from '@/types/agent'
import { agentService } from '@/services/agent'
import { useAgentStorage } from '@/utils/storage'

export function useAgentEdit(agent: Agent) {
  const agentStorage = useAgentStorage()
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Basic state
  const displayName = ref<string>(agent.display_name || agent.name)
  const isActive = ref<boolean>(agent.is_active)
  const instructions = ref<string[]>(
    Array.isArray(agent.instructions) ? [...agent.instructions] : [agent.instructions || ''],
  )

  // Instructions handlers
  const addInstruction = () => {
    instructions.value.push('')
  }

  const removeInstruction = (index: number) => {
    instructions.value.splice(index, 1)
  }
  
  // Generate instructions with AI
  const generateInstructions = async (prompt: string): Promise<string[]> => {
    if (isGenerating.value || isSaving.value) return []
    try {
      isGenerating.value = true
      isLoading.value = true
      error.value = null
      
      const response = await agentService.generateInstructions(prompt, instructions.value)
      return response
    } catch (err: any) {
      if (err?.response?.status === 429) {
        error.value = err?.response?.data?.detail || '已超出请求频率限制，请稍后重试。';
      } else {
        error.value = 'AI 生成人设指令失败'
      }
      console.error('Generate instructions error:', err)
      return []
    } finally {
      isGenerating.value = false
      isLoading.value = false
    }
  }

  // Save handler
  const handleSave = async () => {
    if (isSaving.value || isGenerating.value) return null
    try {
      isSaving.value = true
      isLoading.value = true
      error.value = null

      const updatedData = {
        display_name: displayName.value,
        is_active: isActive.value,
        instructions: instructions.value.filter((i) => i.trim()),
      }

      const updatedAgent = await agentService.updateAgent(agent.id, updatedData)
      agentStorage.updateAgent(updatedAgent)

      return updatedAgent
    } catch (err) {
      error.value = '更新智能体失败'
      console.error('Save error:', err)
      throw err
    } finally {
      isSaving.value = false
      isLoading.value = false
    }
  }

  return {
    displayName,
    isActive,
    instructions,
    isLoading,
    isGenerating,
    isSaving,
    error,
    addInstruction,
    removeInstruction,
    generateInstructions,
    handleSave,
  }
}
