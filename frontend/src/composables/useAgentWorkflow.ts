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

import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { workflowService } from '@/services/workflow'
import type { WorkflowResponse, WorkflowCreate } from '@/types/workflow'

export function useAgentWorkflow(agentId: string) {
  const workflow = ref<WorkflowResponse | null>(null)
  const workflowFetchLoading = ref(false)
  const workflowMutationLoading = ref(false)
  const workflowLoading = computed(
    () => workflowFetchLoading.value || workflowMutationLoading.value,
  )
  const workflowError = ref('')
  const createWorkflowLoading = ref(false)
  let workflowRequestVersion = 0
  let fetchRequestVersion = 0

  const hasWorkflow = computed(() => workflow.value !== null)

  const fetchWorkflow = async () => {
    const requestVersion = ++workflowRequestVersion
    const fetchVersion = ++fetchRequestVersion
    try {
      workflowFetchLoading.value = true
      workflowError.value = ''
      const nextWorkflow = await workflowService.getWorkflowByAgent(agentId)
      if (requestVersion === workflowRequestVersion) workflow.value = nextWorkflow
    } catch (error: any) {
      console.error('Error fetching workflow:', error)

      // Don't show error toast for 404 - it means agent doesn't have a workflow yet (normal state)
      if (requestVersion !== workflowRequestVersion) return
      if (error.response?.status !== 404) {
        workflowError.value = error.response?.data?.detail || '获取工作流失败'
        toast.error('获取工作流失败', {
          duration: 4000,
          closeButton: true
        })
      } else {
        // For 404, just log and set workflow to null
        console.log('No workflow found for agent - agent has no workflow yet')
        workflow.value = null
        workflowError.value = ''
      }
    } finally {
      if (fetchVersion === fetchRequestVersion) workflowFetchLoading.value = false
    }
  }

  const createWorkflow = async (data: Omit<WorkflowCreate, 'agent_id'>) => {
    if (workflowMutationLoading.value || workflowFetchLoading.value) return null
    const requestVersion = ++workflowRequestVersion
    try {
      workflowMutationLoading.value = true
      createWorkflowLoading.value = true
      workflowError.value = ''
      
      const workflowData: WorkflowCreate = {
        ...data,
        agent_id: agentId
      }
      
      const newWorkflow = await workflowService.createWorkflow(workflowData)
      if (requestVersion === workflowRequestVersion) workflow.value = newWorkflow
      
      toast.success('工作流创建成功', {
        duration: 4000,
        closeButton: true
      })
      
      return newWorkflow
    } catch (error: any) {
      console.error('Error creating workflow:', error)
      if (requestVersion === workflowRequestVersion) {
        workflowError.value = error.response?.data?.detail || '创建工作流失败'
        toast.error('创建工作流失败', {
          duration: 4000,
          closeButton: true
        })
      }
      throw error
    } finally {
      workflowMutationLoading.value = false
      createWorkflowLoading.value = false
    }
  }

  const updateWorkflow = async (
    workflowIdOrData: string | Partial<WorkflowCreate>,
    maybeData?: Partial<WorkflowCreate>
  ) => {
    if (workflowMutationLoading.value || workflowFetchLoading.value) return null
    const targetId = typeof workflowIdOrData === 'string' ? workflowIdOrData : (workflow.value?.id || '')
    const targetData = typeof workflowIdOrData === 'string' ? (maybeData || {}) : workflowIdOrData
    if (!targetId) {
      workflowError.value = '未找到可更新的工作流'
      toast.error('未找到可更新的工作流', { duration: 4000, closeButton: true })
      return null
    }
    const requestVersion = ++workflowRequestVersion
    try {
      workflowMutationLoading.value = true
      workflowError.value = ''

      const updatedWorkflow = await workflowService.updateWorkflow(targetId, targetData)
      if (requestVersion === workflowRequestVersion) workflow.value = updatedWorkflow
      
      toast.success('工作流更新成功', {
        duration: 4000,
        closeButton: true
      })
      
      return updatedWorkflow
    } catch (error: any) {
      console.error('Error updating workflow:', error)
      if (requestVersion === workflowRequestVersion) {
        workflowError.value = error.response?.data?.detail || '更新工作流失败'
        toast.error('更新工作流失败', {
          duration: 4000,
          closeButton: true
        })
      }
      throw error
    } finally {
      workflowMutationLoading.value = false
    }
  }

  const deleteWorkflow = async (workflowId?: string) => {
    if (workflowMutationLoading.value || workflowFetchLoading.value) return false
    const targetId = workflowId || workflow.value?.id || ''
    if (!targetId) {
      workflowError.value = '未找到可删除的工作流'
      toast.error('未找到可删除的工作流', { duration: 4000, closeButton: true })
      return false
    }
    const requestVersion = ++workflowRequestVersion
    try {
      workflowMutationLoading.value = true
      workflowError.value = ''
      await workflowService.deleteWorkflow(targetId)
      if (requestVersion === workflowRequestVersion) workflow.value = null
      
      toast.success('工作流已成功删除', {
        duration: 4000,
        closeButton: true
      })
    } catch (error: any) {
      console.error('Error deleting workflow:', error)
      if (requestVersion === workflowRequestVersion) {
        workflowError.value = error.response?.data?.detail || '删除工作流失败'
        toast.error('删除工作流失败', {
          duration: 4000,
          closeButton: true
        })
      }
      throw error
    } finally {
      workflowMutationLoading.value = false
    }
  }

  return {
    workflow,
    workflowLoading,
    workflowError,
    createWorkflowLoading,
    hasWorkflow,
    fetchWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  }
}
