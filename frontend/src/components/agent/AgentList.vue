<!--
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
-->

<script setup lang="ts">
import type { Agent } from '@/types/agent';
import type { Widget } from '@/types/widget';
import { resolveUploadUrl } from '@/config/api'
import { resolveOrbStyle } from '@/utils/orb'
import { useAgentStorage, useSubscriptionStorage } from '@/utils/storage'
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { agentService } from '@/services/agent'
import { permissionChecks } from '@/utils/permissions'
import AgentDetail from './AgentDetail.vue'
import CreateAgentModal from './CreateAgentModal.vue'
import AgentTestChatModal from './AgentTestChatModal.vue'
import { widgetService } from '@/services/widget'
import { storeService } from '@/services/store'
import { toast } from 'vue-sonner'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'
import { buildWidgetEmbed } from '@/utils/widgetEmbed'
import { useOnboardingState } from '@/composables/useOnboardingState'
import { userService } from '@/services/user'
import { copyTextToClipboard } from '@/utils/clipboard'

const agentStorage = useAgentStorage()
const subscriptionStorage = useSubscriptionStorage()
const { hasEnterpriseModule } = useEnterpriseFeatures()

const agents = ref<Agent[]>([])
const selectedAgent = ref<Agent | null>(null)
const testingAgent = ref<Agent | null>(null)
const showCreateModal = ref(false)
const showUpgradeModal = ref(false)
const widgetLoadingMap = ref<Record<string, boolean>>({})
const widgetMap = ref<Record<string, Widget | null>>({})
const searchQuery = ref('')
const statusFilter = ref<'all' | 'online' | 'offline'>('all')

const activeWidgetModalAgent = ref<Agent | null>(null)
const activeWidgetModalCode = ref('')
const activeWidgetModalIframeUrl = ref('')

// Per-card kebab menu
const openMenuId = ref<string | null>(null)
const togglingActiveId = ref<string | null>(null)

const toggleMenu = (agentId: string) => {
    openMenuId.value = openMenuId.value === agentId ? null : agentId
}
const closeMenu = () => { openMenuId.value = null }

const toggleAgentActive = async (agent: Agent) => {
    if (togglingActiveId.value) return
    closeMenu()
    togglingActiveId.value = agent.id
    try {
        const updated = await agentService.updateAgent(agent.id, { is_active: !agent.is_active })
        const idx = agents.value.findIndex(a => a.id === agent.id)
        if (idx !== -1) agents.value[idx] = updated
        toast.success(updated.is_active ? '已设为在线运行' : '已设为离线')
    } catch (err) {
        console.error('Failed to toggle agent status:', err)
        toast.error('更新智能体状态失败')
    } finally {
        togglingActiveId.value = null
    }
}

const copyAgentId = async (agent: Agent) => {
    closeMenu()
    try {
        if (await copyTextToClipboard(agent.id)) {
            toast.success('智能体 ID 已复制')
        } else {
            toast.error('复制失败，请手动选择')
        }
    } catch (err) {
        console.error('Failed to copy agent ID:', err)
        toast.error('复制智能体 ID 失败')
    }
}

const copyText = async (text: string) => {
    if (await copyTextToClipboard(text)) {
        toast.success('已复制到剪贴板')
    } else {
        toast.error('复制失败，请手动选择')
    }
}

const emit = defineEmits<{
    (e: 'toggle-fullscreen', isFullscreen: boolean): void
    (e: 'resume-onboarding'): void
}>()

// Resume-setup banner
const onboarding = useOnboardingState()
const orgId = userService.getCurrentUser()?.organization_id || ''
const onboardingRecord = ref(onboarding.get(orgId))
const showResumeBanner = computed(() => onboarding.hasUnfinishedRun(orgId) && !bannerDismissed.value)
const bannerDismissed = ref(false)
const checklistProgress = computed(() => {
    const done = onboardingRecord.value.completedSteps.length
    return `已完成 ${done} / ${onboarding.ONBOARDING_STEPS.length} 项配置`
})
const dismissBanner = () => {
    onboarding.skip(orgId)
    bannerDismissed.value = true
}

const currentSubscription = computed(() => subscriptionStorage.getCurrentSubscription())
const planLimits = computed(() => subscriptionStorage.getPlanLimits())
const isSubscriptionActive = computed(() => subscriptionStorage.isSubscriptionActive())
const currentAgentCount = computed(() => agents.value.length)

const onlineCount = computed(() => agents.value.filter(a => a.is_active).length)
const offlineCount = computed(() => agents.value.filter(a => !a.is_active).length)
const totalKnowledgeCount = computed(() => agents.value.reduce((acc, a) => acc + (a.knowledge?.length || 0), 0))
const workflowCount = computed(() => agents.value.filter(a => a.use_workflow).length)

const filteredAgents = computed(() => {
    let list = agents.value

    if (statusFilter.value === 'online') {
        list = list.filter(a => a.is_active)
    } else if (statusFilter.value === 'offline') {
        list = list.filter(a => !a.is_active)
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter(a =>
        (a.display_name || a.name).toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
    )
})

const canManageAgents = permissionChecks.canManageAgents()

const isAgentCreationLocked = computed(() => {
    if (!hasEnterpriseModule) return false
    if (!currentSubscription.value || !isSubscriptionActive.value) return true
    const maxAgents = planLimits.value.maxAgents
    if (maxAgents === null) return false
    return currentAgentCount.value >= maxAgents
})

const closeUpgradeModal = () => { showUpgradeModal.value = false }
const handleUpgrade = () => { window.location.href = '/settings/subscription' }

const refreshAgents = async () => {
    agents.value = agentStorage.getAgents()
    await loadWidgetsForAgents()
}

const loadWidgetsForAgents = async () => {
    try {
        const [widgets, stores] = await Promise.all([
            widgetService.getWidgets(),
            storeService.getStores(),
        ])
        const wList = Array.isArray(widgets) ? widgets : []
        agents.value.forEach(agent => {
            widgetLoadingMap.value[agent.id] = false
            const widget = wList.find((w: Widget) => w.agent_id === agent.id)
            widgetMap.value[agent.id] = widget || null
        })
    } catch (error) {
        console.error('Failed to load widgets:', error)
    }
}

const copyWidgetCode = async (agent: Agent) => {
    if (widgetLoadingMap.value[agent.id]) return
    let widget = widgetMap.value[agent.id]
    const isFirstTime = !widget

    if (!widget) {
        try {
            widgetLoadingMap.value[agent.id] = true
            // 1. 真实调用后端 API 创建挂件
            widget = await widgetService.createWidget({
                name: `${agent.display_name || agent.name} 挂件`,
                agent_id: agent.id
            })
            widgetMap.value[agent.id] = widget

            // 2. 真实调用后端 API 自动在【店铺管理】中同步建立该挂件店铺
            try {
                const stores = await storeService.getStores()
                const hasStore = Array.isArray(stores) && stores.some(s => s.agent_id === agent.id && s.platform === 'web_widget')
                if (!hasStore) {
                    await storeService.createStore({
                        name: `${agent.display_name || agent.name} 挂件独立站`,
                        platform: 'web_widget',
                        agent_id: agent.id,
                        channel_type: 'web',
                        is_active: true,
                        currency: 'USD',
                        timezone: 'America/New_York',
                    })
                }
            } catch (err) {
                console.warn('Auto store creation notice:', err)
            }
        } catch (error: any) {
            console.error('Failed to create widget:', error)
            toast.error(error?.response?.data?.detail || error?.message || '创建挂件失败')
            return
        } finally {
            widgetLoadingMap.value[agent.id] = false
        }
    }

    if (widget) {
        const code = buildWidgetEmbed(widget.id, agent.require_token_auth)
        activeWidgetModalAgent.value = agent
        activeWidgetModalCode.value = code
        activeWidgetModalIframeUrl.value = `${window.location.origin}/api/v1/widgets/${widget.id}/data`
        
        await copyWidgetCodeToClipboard(widget, agent.require_token_auth)
        if (isFirstTime) {
            toast.success('挂件及店铺已同步创建成功！代码已复制到剪贴板', { duration: 3500 })
        }
    }
}

const copyWidgetCodeToClipboard = async (widget: Widget, requireTokenAuth?: boolean) => {
    const code = buildWidgetEmbed(widget.id, requireTokenAuth)
    try {
        if (await copyTextToClipboard(code)) {
            toast.success('挂件代码已复制到剪贴板', { duration: 3000 })
        } else {
            toast.error('复制挂件代码失败')
        }
    } catch (error) {
        console.error('Failed to copy widget code:', error)
        toast.error('复制挂件代码失败')
    }
}

onMounted(async () => {
    await refreshAgents()
    window.addEventListener('click', closeMenu)

    // Restore detail view
    const agentId = new URLSearchParams(window.location.search).get('agent')
    if (agentId) {
        const found = agents.value.find(a => a.id === agentId)
        if (found) selectedAgent.value = found
        else setAgentParam(null)
    }
})

onUnmounted(() => {
    window.removeEventListener('click', closeMenu)
})

const setAgentParam = (id: string | null) => {
    const url = new URL(window.location.href)
    if (id) {
        url.searchParams.set('agent', id)
    } else {
        url.searchParams.delete('agent')
        url.searchParams.delete('tab')
    }
    window.history.replaceState({}, '', url.toString())
}

const handleAgentClose = async () => {
    try {
        await agentService.getOrganizationAgents()
    } catch (e) {
        console.error('Failed to refresh agents from server:', e)
    }
    await refreshAgents()
    selectedAgent.value = null
    setAgentParam(null)
}

const handleCreateAgent = () => {
    if (isAgentCreationLocked.value) {
        if (hasEnterpriseModule) { showUpgradeModal.value = true; return }
    }
    showCreateModal.value = true
}

const handleAgentCreated = async (agent: Agent) => {
    await refreshAgents()
    showCreateModal.value = false
    selectedAgent.value = agent
    setAgentParam(agent.id)
    if (agent.use_workflow) {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', 'general')
        window.history.replaceState({}, '', url.toString())
    }
}

const handleAgentClick = (agent: Agent) => {
    selectedAgent.value = agent
    setAgentParam(agent.id)
    if (agent.use_workflow) {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', 'general')
        window.history.replaceState({}, '', url.toString())
    }
}

const getAgentPhotoUrl = (agent: Agent) => resolveUploadUrl(agent.customization?.photo_url)

const handleFullscreenToggle = (isFullscreen: boolean) => {
    emit('toggle-fullscreen', isFullscreen)
}

const getOrbStyle = (agent: Agent): Record<string, string> => {
    if (agent.customization?.photo_url) return {}
    return resolveOrbStyle(agent.name, agent.customization?.customization_metadata?.orb_variant)
}
</script>

<template>
    <div class="agent-workspace" :class="{ 'showing-detail': selectedAgent }">
        <div v-if="!selectedAgent" class="workspace-content">
            
            <!-- Guided setup banner -->
            <div v-if="showResumeBanner" class="resume-bar">
                <div class="resume-text-group">
                    <span class="resume-dot"></span>
                    <span class="resume-title">初始配置向导</span>
                    <span class="resume-progress">({{ checklistProgress }})</span>
                </div>
                <div class="resume-actions">
                    <button class="resume-dismiss-btn" @click="dismissBanner">稍后</button>
                    <button v-if="canManageAgents" class="resume-continue-btn" @click="emit('resume-onboarding')">继续配置 →</button>
                </div>
            </div>

            <!-- Page Header Strip -->
            <div class="page-header">
                <div class="header-left">
                    <h1 class="page-title">智能体概览</h1>
                    <p class="page-desc">构建并管理您的电商 AI 智能客服，实现独立站、WhatsApp 与微信全渠道自主接待。</p>
                </div>

                <div class="header-right">
                    <router-link
                        to="/settings/ai-config"
                        class="btn-secondary"
                        title="配置大语言模型与 API"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
                        </svg>
                        <span>模型配置</span>
                    </router-link>

                    <button
                        v-if="canManageAgents"
                        class="btn-primary"
                        :class="{ 'locked': isAgentCreationLocked }"
                        :disabled="isAgentCreationLocked"
                        @click="handleCreateAgent"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        <span>新建智能体</span>
                    </button>
                </div>
            </div>

            <!-- Metrics Overview Cards -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title">已发布智能体</span>
                        <span class="metric-icon-wrap emerald">
                            <span class="live-dot"></span>
                        </span>
                    </div>
                    <div class="metric-val-row">
                        <span class="metric-val">{{ onlineCount }}</span>
                        <span class="metric-total">/ {{ agents.length }} 个已启用</span>
                    </div>
                    <div class="metric-footer-text">
                        <span>全天候自动接待与意图路由</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title">挂载知识库</span>
                        <span class="metric-icon-wrap indigo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </span>
                    </div>
                    <div class="metric-val-row">
                        <span class="metric-val">{{ totalKnowledgeCount }}</span>
                        <span class="metric-total">个知识源</span>
                    </div>
                    <div class="metric-footer-text">
                        <span>为智能体提供行业问答与店铺数据</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title">自动化工作流</span>
                        <span class="metric-icon-wrap purple">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        </span>
                    </div>
                    <div class="metric-val-row">
                        <span class="metric-val">{{ workflowCount }}</span>
                        <span class="metric-total">个自动化节点</span>
                    </div>
                    <div class="metric-footer-text">
                        <span>多轮意图分支与业务动作编排</span>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title">接入多端生态</span>
                        <span class="metric-icon-wrap cyan">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </span>
                    </div>
                    <div class="metric-val-row">
                        <span class="metric-val">3</span>
                        <span class="metric-total">大多端支持</span>
                    </div>
                    <div class="metric-footer-text">
                        <span>网页挂件 · WhatsApp · 微信生态</span>
                    </div>
                </div>
            </div>

            <!-- Filter & Search Toolbar -->
            <div class="toolbar-row">
                <div class="status-tabs">
                    <button
                        class="status-tab"
                        :class="{ active: statusFilter === 'all' }"
                        @click="statusFilter = 'all'"
                    >
                        全部智能体 ({{ agents.length }})
                    </button>
                    <button
                        class="status-tab"
                        :class="{ active: statusFilter === 'online' }"
                        @click="statusFilter = 'online'"
                    >
                        已启用 ({{ onlineCount }})
                    </button>
                    <button
                        class="status-tab"
                        :class="{ active: statusFilter === 'offline' }"
                        @click="statusFilter = 'offline'"
                    >
                        已停用 ({{ offlineCount }})
                    </button>
                </div>

                <div class="search-box">
                    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="搜索智能体名称或描述..."
                        class="search-input"
                    />
                </div>
            </div>

            <!-- Agent Grid -->
            <div class="agents-grid">
                <!-- Actual Existing Agents -->
                <div
                    v-for="agent in filteredAgents"
                    :key="agent.id"
                    class="agent-card"
                    @click="handleAgentClick(agent)"
                >
                    <!-- Card Top: Avatar + Identity + Status + Kebab -->
                    <div class="card-header">
                        <div class="avatar-wrap">
                            <div class="agent-avatar" :style="getOrbStyle(agent)">
                                <img
                                    v-if="agent.customization?.photo_url"
                                    :src="getAgentPhotoUrl(agent)"
                                    :alt="agent.name"
                                />
                            </div>
                            <span class="status-indicator" :class="{ online: agent.is_active }"></span>
                        </div>

                        <div class="identity-meta">
                            <div class="name-line">
                                <h3 class="agent-name">{{ agent.display_name || agent.name }}</h3>
                                <span v-if="agent.use_workflow" class="workflow-tag">工作流</span>
                            </div>
                            <span class="agent-handle">@{{ agent.name }}</span>
                        </div>

                        <div class="menu-wrap" @click.stop>
                            <button
                                class="menu-btn"
                                :class="{ active: openMenuId === agent.id }"
                                @click.stop="toggleMenu(agent.id)"
                                title="更多操作"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                            </button>
                            <div v-if="openMenuId === agent.id" class="dropdown-panel">
                                <button class="dropdown-item" @click="closeMenu(); testingAgent = agent">测试对话</button>
                                <button class="dropdown-item" @click="closeMenu(); handleAgentClick(agent)">编辑配置</button>
                                <button class="dropdown-item" @click="closeMenu(); copyWidgetCode(agent)">{{ widgetMap[agent.id] ? '查看挂件代码' : '创建挂件 (同步店铺)' }}</button>
                                <button class="dropdown-item" @click="copyAgentId(agent)">复制 ID</button>
                                <div class="dropdown-divider"></div>
                                <button
                                    class="dropdown-item"
                                    :disabled="togglingActiveId === agent.id"
                                    @click="toggleAgentActive(agent)"
                                >
                                    {{ agent.is_active ? '设为草稿' : '发布上线' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <p class="card-desc">{{ agent.description || '全天候智能接待客户咨询，支持根据业务知识库与多分支工作流精准应答。' }}</p>

                    <!-- Meta specs chips -->
                    <div class="card-specs">
                        <span class="spec-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            Web 挂件
                        </span>
                        <span class="spec-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            {{ agent.knowledge?.length ?? 0 }} 知识源
                        </span>
                        <span class="spec-status-pill" :class="{ online: agent.is_active }">
                            <span class="status-dot-sm"></span>
                            {{ agent.is_active ? '已发布' : '草稿' }}
                        </span>
                    </div>

                    <!-- Action Footer -->
                    <div class="card-actions" @click.stop>
                        <button class="btn-card-primary" @click="testingAgent = agent">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>测试对话</span>
                        </button>
                        <button class="btn-card-secondary" @click="handleAgentClick(agent)">
                            <span>配置</span>
                        </button>
                        <button
                            class="btn-card-secondary"
                            :class="widgetMap[agent.id] ? 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200' : 'font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'"
                            :disabled="widgetLoadingMap[agent.id]"
                            @click="copyWidgetCode(agent)"
                            :title="widgetMap[agent.id] ? '查看并复制挂件代码' : '一键创建挂件并在店铺管理中同步生成店铺'"
                        >
                            <span v-if="!widgetLoadingMap[agent.id]" class="flex items-center gap-1">
                                <template v-if="!widgetMap[agent.id]">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                                    创建挂件
                                </template>
                                <template v-else>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    挂件代码
                                </template>
                            </span>
                            <span v-else>处理中...</span>
                        </button>
                    </div>
                </div>

                <!-- Create Custom Agent Card (Integrated into Grid) -->
                <div v-if="canManageAgents && !isAgentCreationLocked" class="create-slot-card" @click="handleCreateAgent">
                    <div class="create-slot-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </div>
                    <h4 class="create-slot-title">新建智能体</h4>
                    <p class="create-slot-desc">创建专属电商导购、客服或多分支工作流智能体</p>
                </div>
            </div>

            <!-- Empty Search State -->
            <div v-if="filteredAgents.length === 0 && searchQuery" class="empty-state">
                <p class="empty-title">未找到匹配的智能体</p>
                <p class="empty-desc">未找到包含 "<strong>{{ searchQuery }}</strong>" 的结果</p>
                <button class="btn-secondary" @click="searchQuery = ''">清除搜索条件</button>
            </div>
        </div>

        <AgentDetail
            v-else-if="selectedAgent"
            :agent="selectedAgent"
            @close="handleAgentClose"
            @toggle-fullscreen="handleFullscreenToggle"
        />

        <CreateAgentModal
            v-if="showCreateModal"
            @close="showCreateModal = false"
            @created="handleAgentCreated"
        />

        <AgentTestChatModal
            v-if="testingAgent"
            :agent="testingAgent"
            @close="testingAgent = null"
        />

        <!-- Upgrade Modal -->
        <div v-if="hasEnterpriseModule && showUpgradeModal" class="upgrade-modal-overlay" @click="closeUpgradeModal">
            <div class="upgrade-modal" @click.stop>
                <div class="upgrade-modal-header">
                    <h3>已达智能体数量上限</h3>
                    <button class="close-button" @click="closeUpgradeModal">×</button>
                </div>
                <div class="upgrade-modal-content">
                    <p class="upgrade-description">
                        您当前套餐的智能体配额已用满 ({{ currentAgentCount }}/{{ planLimits.maxAgents }})。
                        升级套餐以创建更多智能体并解锁更多高级特性。
                    </p>
                </div>
                <div class="upgrade-modal-footer">
                    <button class="btn-primary" @click="handleUpgrade">升级套餐</button>
                    <button class="btn-secondary" @click="closeUpgradeModal">暂不升级</button>
                </div>
            </div>
        
            <!-- Widget Code Modal Popup -->
            <div v-if="activeWidgetModalAgent" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="activeWidgetModalAgent = null">
                <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in duration-150">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                                <i class="fa-solid fa-code"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900 text-base">「{{ activeWidgetModalAgent.display_name || activeWidgetModalAgent.name }}」挂件代码</h3>
                                <p class="text-xs text-slate-500">挂件已就绪，复制代码嵌入网站即可上线</p>
                            </div>
                        </div>
                        <button class="text-slate-400 hover:text-slate-600 p-1" @click="activeWidgetModalAgent = null">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div class="mb-4">
                        <label class="text-xs font-bold text-slate-700 block mb-1.5">HTML 嵌入代码片段：</label>
                        <div class="relative bg-slate-900 rounded-xl p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto max-h-40">
                            <code>{{ activeWidgetModalCode }}</code>
                        </div>
                    </div>

                    <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-800 mb-5 flex items-start gap-2">
                        <i class="fa-solid fa-circle-info mt-0.5 text-indigo-600"></i>
                        <span>将此代码直接复制粘贴到您独立站（Shopify、WordPress 或自建站）HTML 的 <code>&lt;/body&gt;</code> 结束标签之前即可生效！</span>
                    </div>

                    <div class="flex items-center justify-end gap-3">
                        <button
                            class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                            @click="activeWidgetModalAgent = null"
                        >
                            关闭
                        </button>
                        <button
                            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 active:scale-95 transition-all"
                            @click="copyText(activeWidgetModalCode)"
                        >
                            <i class="fa-solid fa-copy"></i>
                            <span>一键复制代码</span>
                        </button>
                    </div>
                </div>
            </div>
</div>
    </div>
</template>

<style scoped>
/* ─── Workspace Container ───────────────────────────────────────── */
.agent-workspace {
    padding: 28px 36px 64px;
    max-width: 1380px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
}

.agent-workspace.showing-detail {
    padding: 0;
    max-width: none;
}

.workspace-content {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

/* ─── Resume Banner ────────────────────────────────────────────── */
.resume-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.resume-text-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.resume-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4F46E5;
}

.resume-title {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
}

.resume-progress {
    font-size: 13px;
    color: var(--muted);
}

.resume-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.resume-dismiss-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
}

.resume-dismiss-btn:hover {
    color: var(--text);
}

.resume-continue-btn {
    padding: 5px 12px;
    background: #0F172A;
    color: #FFFFFF;
    border: none;
    border-radius: var(--radius-btn);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
}

.resume-continue-btn:hover {
    background: #000000;
}

/* ─── Page Header Strip ────────────────────────────────────────── */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.page-title {
    font-family: var(--font-sans);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
    margin: 0;
    line-height: 1.2;
}

.page-desc {
    font-size: 13.5px;
    color: var(--muted);
    margin: 0;
    line-height: 1.5;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-btn);
    color: var(--text2);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    transition: all 0.15s ease;
    white-space: nowrap;
}

.btn-secondary:hover {
    background: #F8FAFC;
    border-color: var(--border-color-hover);
    color: var(--text);
}

.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #0F172A;
    color: #FFFFFF;
    border: 1px solid transparent;
    border-radius: var(--radius-btn);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease;
    white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
    background: #000000;
    transform: translateY(-0.5px);
}

.btn-primary.locked {
    background: rgba(15, 23, 42, 0.08);
    color: var(--muted);
    cursor: not-allowed;
}

/* ─── Metrics Overview Cards ───────────────────────────────────── */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.metric-card {
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metric-title {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--muted);
}

.metric-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
}

.metric-icon-wrap.emerald {
    background: rgba(16, 185, 129, 0.1);
}

.metric-icon-wrap.indigo {
    background: rgba(79, 70, 229, 0.08);
}

.metric-icon-wrap.purple {
    background: rgba(168, 85, 247, 0.08);
}

.metric-icon-wrap.cyan {
    background: rgba(6, 182, 212, 0.08);
}

.live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}

.metric-val-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.metric-val {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.03em;
    line-height: 1;
}

.metric-total {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
}

.metric-footer-text {
    font-size: 11.5px;
    color: var(--text3);
    margin-top: 2px;
}

/* ─── Toolbar Row ──────────────────────────────────────────────── */
.toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding-top: 4px;
}

.status-tabs {
    display: flex;
    gap: 4px;
    background: rgba(15, 23, 42, 0.04);
    padding: 3px;
    border-radius: 8px;
}

.status-tab {
    padding: 5px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s ease;
}

.status-tab:hover {
    color: var(--text);
}

.status-tab.active {
    color: var(--text);
    font-weight: 600;
    background: #FFFFFF;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-box {
    position: relative;
    width: 240px;
}

.search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted2);
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 7px 12px 7px 32px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-btn);
    font-family: var(--font-sans);
    font-size: 12.5px;
    color: var(--text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
    transition: all 0.15s ease;
}

.search-input:focus {
    outline: none;
    border-color: #0F172A;
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
}

/* ─── Agents Grid ──────────────────────────────────────────────── */
.agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
}

.agent-card {
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}

.agent-card:hover {
    border-color: rgba(15, 23, 42, 0.18);
    box-shadow: 0 6px 20px -4px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
}

.card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.avatar-wrap {
    position: relative;
    flex-shrink: 0;
}

.agent-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--grad-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.agent-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.status-indicator {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--muted2);
    border: 2px solid #FFFFFF;
}

.status-indicator.online {
    background: #10B981;
}

.identity-meta {
    flex: 1;
    min-width: 0;
}

.name-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
}

.agent-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
}

.workflow-tag {
    font-size: 10px;
    font-weight: 600;
    color: #4F46E5;
    background: rgba(79, 70, 229, 0.08);
    padding: 1.5px 5px;
    border-radius: 4px;
    flex-shrink: 0;
}

.agent-handle {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--muted2);
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-wrap {
    position: relative;
}

.menu-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
}

.menu-btn:hover,
.menu-btn.active {
    background: rgba(15, 23, 42, 0.05);
    color: var(--text);
}

.dropdown-panel {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 50;
    min-width: 150px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 4px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 6.5px 10px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text2);
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s ease;
}

.dropdown-item:hover {
    background: #F1F5F9;
    color: var(--text);
}

.dropdown-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
}

.card-desc {
    font-size: 12.5px;
    color: var(--text3);
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 38px;
}

.card-specs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.spec-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    background: #F8FAFC;
    border: 1px solid var(--border-color);
    padding: 2.5px 7px;
    border-radius: 5px;
}

.spec-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    background: rgba(15, 23, 42, 0.04);
    padding: 2.5px 7px;
    border-radius: 5px;
}

.spec-status-pill.online {
    color: #059669;
    background: rgba(16, 185, 129, 0.08);
}

.status-dot-sm {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
}

.card-actions {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.btn-card-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6.5px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: #F1F5F9;
    color: #0F172A;
    transition: all 0.15s ease;
}

.btn-card-primary:hover {
    background: #0F172A;
    color: #FFFFFF;
}

.btn-card-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6.5px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border-color);
    background: #FFFFFF;
    color: var(--text2);
    transition: all 0.15s ease;
}

.btn-card-secondary:hover {
    background: #F8FAFC;
    color: var(--text);
    border-color: var(--border-color-hover);
}

/* ─── Integrated Creation & Preset Slots in Grid ───────────────── */
.create-slot-card {
    border: 1px dashed var(--border-color);
    border-radius: 14px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    background: #FAFAFC;
    cursor: pointer;
    transition: all 0.18s ease;
    min-height: 190px;
    box-sizing: border-box;
}

.create-slot-card:hover {
    border-color: #0F172A;
    background: #FFFFFF;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.create-slot-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.create-slot-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.create-slot-desc {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
    max-width: 220px;
    line-height: 1.4;
}

.preset-slot-card {
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #FFFFFF;
    cursor: pointer;
    transition: all 0.18s ease;
    box-sizing: border-box;
}

.preset-slot-card:hover {
    border-color: rgba(15, 23, 42, 0.18);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
}

.preset-slot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preset-icon {
    font-size: 20px;
}

.preset-tag {
    font-size: 10.5px;
    font-weight: 600;
    color: #4F46E5;
    background: rgba(79, 70, 229, 0.08);
    padding: 1.5px 6px;
    border-radius: 4px;
}

.preset-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.preset-desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.45;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 35px;
}

.preset-action {
    font-size: 12px;
    font-weight: 600;
    color: #0F172A;
    margin-top: auto;
    padding-top: 8px;
}

.preset-slot-card:hover .preset-action {
    color: #4F46E5;
}

/* ─── Empty States ─────────────────────────────────────────────── */
.empty-state {
    text-align: center;
    padding: 48px 20px;
}

.empty-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 4px;
}

.empty-desc {
    font-size: 13px;
    color: var(--muted);
    margin: 0 0 16px;
}

/* ─── Upgrade Modal ────────────────────────────────────────────── */
.upgrade-modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--scrim);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.upgrade-modal {
    background: #FFFFFF;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    width: 440px;
    max-width: 90vw;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
    overflow: hidden;
}

.upgrade-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border-color);
}

.upgrade-modal-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.close-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--muted);
}

.upgrade-modal-content {
    padding: 20px;
}

.upgrade-description {
    font-size: 13px;
    color: var(--text3);
    line-height: 1.5;
    margin: 0;
}

.upgrade-modal-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    background: #F8FAFC;
}

/* ─── Responsive ───────────────────────────────────────────────── */
@media (max-width: 1200px) {
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .agent-workspace {
        padding: 16px;
    }

    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .header-right {
        width: 100%;
    }

    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .toolbar-row {
        flex-direction: column;
        align-items: stretch;
    }

    .search-box {
        width: 100%;
    }

    .agents-grid {
        grid-template-columns: 1fr;
    }

    .card-actions {
        grid-template-columns: 1fr;
    }
}
</style>
