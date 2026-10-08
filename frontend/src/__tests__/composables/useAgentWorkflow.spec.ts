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

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkflowResponse } from '@/types/workflow'

const mocks = vi.hoisted(() => ({
  getWorkflowByAgent: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/services/workflow', () => ({ workflowService: mocks }))
vi.mock('vue-sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }))

import { useAgentWorkflow } from '@/composables/useAgentWorkflow'

const workflow: WorkflowResponse = {
  id: 'workflow-1',
  name: 'Support flow',
  description: 'Routes support requests',
  agent_id: 'agent-1',
  organization_id: 'org-1',
  status: 'draft',
  created_at: '2026-08-25T00:00:00.000Z',
  updated_at: '2026-08-25T00:00:00.000Z',
}

describe('useAgentWorkflow request coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getWorkflowByAgent.mockResolvedValue(workflow)
    mocks.createWorkflow.mockResolvedValue(workflow)
    mocks.updateWorkflow.mockResolvedValue(workflow)
    mocks.deleteWorkflow.mockResolvedValue(undefined)
  })

  it('does not let an older fetch overwrite the newest workflow', async () => {
    let resolveFirst: (value: WorkflowResponse) => void = () => undefined
    mocks.getWorkflowByAgent
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockResolvedValueOnce({ ...workflow, id: 'workflow-new' })
    const state = useAgentWorkflow('agent-1')

    const first = state.fetchWorkflow()
    const second = state.fetchWorkflow()
    await second
    resolveFirst({ ...workflow, id: 'workflow-old' })
    await first

    expect(state.workflow.value?.id).toBe('workflow-new')
    expect(state.workflowLoading.value).toBe(false)
  })

  it('ignores a duplicate create while the first create is pending', async () => {
    let resolveCreate: (value: WorkflowResponse) => void = () => undefined
    mocks.createWorkflow.mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))
    const state = useAgentWorkflow('agent-1')

    const first = state.createWorkflow({ name: 'Support flow' })
    const duplicate = await state.createWorkflow({ name: 'Duplicate flow' })

    expect(duplicate).toBeNull()
    expect(mocks.createWorkflow).toHaveBeenCalledOnce()
    resolveCreate(workflow)
    await expect(first).resolves.toEqual(workflow)
    expect(state.createWorkflowLoading.value).toBe(false)
  })
})
