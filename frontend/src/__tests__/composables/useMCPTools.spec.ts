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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMCPTools } from '@/composables/useMCPTools'
import { mcpService } from '@/services/mcp'

vi.mock('@/services/mcp', () => ({
  mcpService: {
    testMCPTool: vi.fn(),
  },
}))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe('useMCPTools connection test', () => {
  beforeEach(() => {
    vi.mocked(mcpService.testMCPTool).mockReset()
  })

  it('stores the probe result per tool id', async () => {
    vi.mocked(mcpService.testMCPTool).mockResolvedValue({
      success: true,
      functions: ['search', 'get_index'],
      error: null,
    })
    const { testMCPTool, testResults, testingToolId } = useMCPTools('agent1')

    await testMCPTool(7)

    expect(testResults.value[7]).toEqual({
      success: true,
      functions: ['search', 'get_index'],
      error: null,
    })
    expect(testingToolId.value).toBeNull()
  })

  it('turns a request failure into a failed result for the tool', async () => {
    vi.mocked(mcpService.testMCPTool).mockRejectedValue({
      response: { data: { detail: 'MCP tool not found' } },
    })
    const { testMCPTool, testResults, testingToolId } = useMCPTools('agent1')

    await testMCPTool(9)

    expect(testResults.value[9]).toEqual({
      success: false,
      functions: [],
      error: 'MCP tool not found',
    })
    expect(testingToolId.value).toBeNull()
  })

  it('marks the tool as testing while the probe runs', async () => {
    let resolveProbe: (v: any) => void = () => {}
    vi.mocked(mcpService.testMCPTool).mockReturnValue(
      new Promise((resolve) => {
        resolveProbe = resolve
      }),
    )
    const { testMCPTool, testingToolId } = useMCPTools('agent1')

    const probe = testMCPTool(3)
    expect(testingToolId.value).toBe(3)
    resolveProbe({ success: true, functions: [], error: null })
    await probe
    expect(testingToolId.value).toBeNull()
  })
})
