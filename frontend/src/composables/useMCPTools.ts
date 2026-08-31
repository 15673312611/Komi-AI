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

import { ref, reactive } from 'vue'
import { mcpService } from '@/services/mcp'
import type { MCPTool, MCPToolCreate, MCPToolUpdate, MCPToolTestResult, MCPTransportType } from '@/types/mcp'
import { toast } from 'vue-sonner'

export function useMCPTools(agentId: string) {
  // State
  const agentMCPTools = ref<MCPTool[]>([])
  const availableMCPTools = ref<MCPTool[]>([])
  const isLoading = ref(false)
  const isLoadingAvailable = ref(false)
  const error = ref<string | null>(null)
  const showCreateModal = ref(false)
  const showLinkModal = ref(false)
  const showDeleteConfirm = ref(false)
  const deleteTargetId = ref<number | null>(null)
  const actionBusy = ref<string | null>(null)
  let agentToolsRequestVersion = 0
  let availableToolsRequestVersion = 0

  // Form state for creating MCP tools
  const createForm = reactive<MCPToolCreate>({
    name: '',
    description: '',
    transport_type: 'stdio' as MCPTransportType,
    enabled: true,
    command: '',
    args: [],
    env_vars: {},
    url: '',
    headers: {},
    timeout: 30,
    sse_read_timeout: 60,
    terminate_on_close: true
  })

  // Transport type options
  const transportTypes = [
    { value: 'stdio', label: 'STDIO 进程', description: '标准输入输出进程间通信 (本地命令)' },
    { value: 'sse', label: 'Server-Sent Events (SSE)', description: 'HTTP 流式持久连接通信' },
    { value: 'http', label: 'HTTP / Webhook', description: '基于标准 HTTP 请求与响应通信' }
  ]

  // Common MCP tool presets
  const mcpPresets = [
    {
      name: '文件系统 (File System)',
      description: '读取与管理本地文件及目录',
      transport_type: 'stdio' as MCPTransportType,
      command: 'npx',
      args: ['-y','@modelcontextprotocol/server-filesystem'],
      env_vars: { ALLOWED_DIRECTORIES: '/path/to/allowed/directory' }
    },
    {
      name: '实时天气 (Weather)',
      description: '查询全球城市实时天气与预报',
      transport_type: 'stdio' as MCPTransportType,
      command: 'uvx',
      args: ["--from", "git+https://github.com/adhikasp/mcp-weather.git", "mcp-weather"],
      env_vars: { ACCUWEATHER_API_KEY: 'your-api-key' }
    }
  ]

  // Fetch agent's MCP tools
  const fetchAgentMCPTools = async () => {
    const requestVersion = ++agentToolsRequestVersion
    isLoading.value = true
    error.value = null
    
    try {
      const response = await mcpService.getAgentMCPTools(agentId)
      if (requestVersion === agentToolsRequestVersion) {
        agentMCPTools.value = Array.isArray(response?.mcp_tools) ? response.mcp_tools : []
      }
    } catch (err: any) {
      if (requestVersion === agentToolsRequestVersion) {
        error.value = err.response?.data?.detail || '获取 MCP 工具列表失败'
      }
      console.error('Error fetching agent MCP tools:', err)
    } finally {
      if (requestVersion === agentToolsRequestVersion) isLoading.value = false
    }
  }

  // Fetch available MCP tools for linking
  const fetchAvailableMCPTools = async () => {
    const requestVersion = ++availableToolsRequestVersion
    isLoadingAvailable.value = true
    
    try {
      const tools = await mcpService.getOrganizationMCPTools(true)
      if (requestVersion === availableToolsRequestVersion) {
        availableMCPTools.value = Array.isArray(tools) ? tools : []
      }
    } catch (err: any) {
      console.error('Error fetching available MCP tools:', err)
      toast.error('获取可用 MCP 工具列表失败')
    } finally {
      if (requestVersion === availableToolsRequestVersion) isLoadingAvailable.value = false
    }
  }

  // Create a new MCP tool
  const createMCPTool = async () => {
    if (actionBusy.value) return false
    actionBusy.value = 'create'
    try {
      const newTool = await mcpService.createMCPTool(createForm)
      if (!newTool || typeof newTool.id !== 'number') throw new Error('Invalid MCP tool response')
      
      // Add to agent immediately
      await mcpService.addMCPToolToAgent(newTool.id, agentId)
      
      // Refresh agent tools
      await fetchAgentMCPTools()
      
      // Reset form and close modal
      resetCreateForm()
      showCreateModal.value = false
      
      toast.success('MCP 工具创建并关联成功')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '创建 MCP 工具失败'
      toast.error(errorMessage)
      throw err
    } finally {
      actionBusy.value = null
    }
  }

  // Link existing MCP tool to agent
  const linkMCPTool = async (toolId: number) => {
    if (actionBusy.value || isToolLinked(toolId)) return false
    actionBusy.value = `link:${toolId}`
    try {
      await mcpService.addMCPToolToAgent(toolId, agentId)
      await fetchAgentMCPTools()
      toast.success('MCP 工具关联成功')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '关联 MCP 工具失败'
      toast.error(errorMessage)
      return false
    } finally {
      actionBusy.value = null
    }
  }

  // Unlink MCP tool from agent
  const unlinkMCPTool = async (toolId: number) => {
    if (actionBusy.value || !isToolLinked(toolId)) return false
    actionBusy.value = `unlink:${toolId}`
    try {
      await mcpService.removeMCPToolFromAgent(toolId, agentId)
      await fetchAgentMCPTools()
      toast.success('已取消 MCP 工具关联')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '取消关联 MCP 工具失败'
      toast.error(errorMessage)
      return false
    } finally {
      actionBusy.value = null
    }
  }

  // Delete MCP tool
  const deleteMCPTool = async () => {
    if (deleteTargetId.value === null || actionBusy.value) return false
    const targetId = deleteTargetId.value
    actionBusy.value = `delete:${targetId}`
    
    try {
      await mcpService.deleteMCPTool(targetId)
      await fetchAgentMCPTools()
      cancelDelete()
      toast.success('MCP 工具已成功删除')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '删除 MCP 工具失败'
      toast.error(errorMessage)
      return false
    } finally {
      actionBusy.value = null
    }
  }

  // Connection test results, per tool id. A tool that saves fine can still be
  // dead at runtime (missing npx, bad key, unreachable server) — the Test
  // button surfaces that instead of a silent 0-tool run.
  const testResults = ref<Record<number, MCPToolTestResult>>({})
  const testingToolId = ref<number | null>(null)

  const testMCPTool = async (toolId: number) => {
    if (actionBusy.value || testingToolId.value !== null) return false
    actionBusy.value = `test:${toolId}`
    testingToolId.value = toolId
    try {
      const result = await mcpService.testMCPTool(toolId)
      testResults.value = {
        ...testResults.value,
        [toolId]: {
          success: Boolean(result?.success),
          functions: Array.isArray(result?.functions) ? result.functions : [],
          error: typeof result?.error === 'string' ? result.error : null,
        }
      }
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to test MCP tool'
      testResults.value = { ...testResults.value, [toolId]: { success: false, functions: [], error: errorMessage } }
      return false
    } finally {
      testingToolId.value = null
      actionBusy.value = null
    }
  }

  // Apply preset to form
  const applyPreset = (preset: typeof mcpPresets[0]) => {
    Object.assign(createForm, {
      ...preset,
      enabled: true
    })
  }

  // Reset create form
  const resetCreateForm = () => {
    Object.assign(createForm, {
      name: '',
      description: '',
      transport_type: 'stdio' as MCPTransportType,
      enabled: true,
      command: '',
      args: [],
      env_vars: {},
      url: '',
      headers: {},
      timeout: 30,
      sse_read_timeout: 60,
      terminate_on_close: true
    })
  }

  // Confirm delete
  const confirmDelete = (toolId: number) => {
    deleteTargetId.value = toolId
    showDeleteConfirm.value = true
  }

  // Cancel delete
  const cancelDelete = () => {
    deleteTargetId.value = null
    showDeleteConfirm.value = false
  }

  // Add argument to args array
  const addArg = (arg: string) => {
    if (arg.trim()) {
      createForm.args = [...(createForm.args || []), arg.trim()]
    }
  }

  // Remove argument from args array
  const removeArg = (index: number) => {
    createForm.args = createForm.args?.filter((_, i) => i !== index) || []
  }

  // Add environment variable
  const addEnvVar = (key: string, value: string) => {
    if (key.trim() && value.trim()) {
      createForm.env_vars = {
        ...createForm.env_vars,
        [key.trim()]: value.trim()
      }
    }
  }

  // Remove environment variable
  const removeEnvVar = (key: string) => {
    const newEnvVars = { ...createForm.env_vars }
    delete newEnvVars[key]
    createForm.env_vars = newEnvVars
  }

  // Add header
  const addHeader = (key: string, value: string) => {
    if (key.trim() && value.trim()) {
      createForm.headers = {
        ...createForm.headers,
        [key.trim()]: value.trim()
      }
    }
  }

  // Remove header
  const removeHeader = (key: string) => {
    const newHeaders = { ...createForm.headers }
    delete newHeaders[key]
    createForm.headers = newHeaders
  }

  // Check if tool is linked to agent
  const isToolLinked = (toolId: number): boolean => {
    return agentMCPTools.value.some(tool => tool.id === toolId)
  }

  // Get transport type display info
  const getTransportTypeInfo = (type: MCPTransportType) => {
    return transportTypes.find(t => t.value === type) || transportTypes[0]
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    // State
    agentMCPTools,
    availableMCPTools,
    isLoading,
    isLoadingAvailable,
    error,
    actionBusy,
    showCreateModal,
    showLinkModal,
    showDeleteConfirm,
    createForm,
    transportTypes,
    mcpPresets,

    // Methods
    fetchAgentMCPTools,
    fetchAvailableMCPTools,
    createMCPTool,
    linkMCPTool,
    unlinkMCPTool,
    deleteMCPTool,
    testMCPTool,
    testResults,
    testingToolId,
    applyPreset,
    resetCreateForm,
    confirmDelete,
    cancelDelete,
    addArg,
    removeArg,
    addEnvVar,
    removeEnvVar,
    addHeader,
    removeHeader,
    isToolLinked,
    getTransportTypeInfo,
    formatDate
  }
}
