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

import { ref } from 'vue'
import type { Agent } from '@/types/agent'
import { agentService } from '@/services/agent'

export function useAgentCreate() {
  const agentName = ref('')
  const useWorkflow = ref(false)
  const isCreating = ref(false)
  const error = ref('')

  const validateForm = () => {
    if (!agentName.value.trim()) {
      error.value = '请输入智能体名称'
      return false
    }
    return true
  }

  const createAgent = async () => {
    if (!validateForm()) return null
    if (isCreating.value) return null
    
    try {
      isCreating.value = true
      error.value = ''
      const newAgent = await agentService.createAgent({
        name: agentName.value.trim(),
        display_name: agentName.value.trim(),
        agent_type: 'custom',
        instructions: ['您好！我是您的 AI 智能客服，很高兴为您服务。请问有什么可以协助您的？'],
        is_active: true,
        use_workflow: useWorkflow.value
      })
      
      return newAgent
    } catch (err: any) {
      error.value = err.response?.data?.detail || '创建智能体失败'
      return null
    } finally {
      isCreating.value = false
    }
  }

  return {
    agentName,
    useWorkflow,
    isCreating,
    error,
    createAgent
  }
}
