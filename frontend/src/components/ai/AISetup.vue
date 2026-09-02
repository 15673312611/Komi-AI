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
import { useAISetup } from '@/composables/useAISetup'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'ai-setup-complete'): void
}>()

const {
  isLoading,
  error,
  providers,
  setupConfig,
  saveAISetup,
  updateAISetup,
  testAISetup,
  hasExistingConfig,
  hasConfiguredKey,
  configuredKeyMasked
} = useAISetup()

const isSavedSuccess = ref(false)
const showPassword = ref(false)
const isTesting = ref(false)
const testStatus = ref<'idle' | 'success' | 'error'>('idle')
const testLatency = ref<number | null>(null)
const testMessage = ref<string>('')

// 新增自定义模型弹窗状态
const showAddModelModal = ref(false)
const newModelInput = ref('')

// 用户在前端动态添加的模型
const userCustomModels = ref<Record<string, string[]>>({
  custom: ['gpt-5.6-sol', 'deepseek-v4-pro', 'gemini-3.7-flash', 'qwen/qwen3.8-27b'],
  openai: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'],
  deepseek: ['deepseek-v4-pro', 'deepseek-v4-flash'],
  anthropic: ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5'],
  google: ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.1-pro'],
  xai: ['grok-4.20', 'grok-4.20-reasoning', 'grok-code-fast-1'],
  groq: ['qwen/qwen3.8-27b', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'openai/gpt-oss-120b'],
  mistral: ['mistral-medium-3.5-26.04', 'mistral-large-3-25-12', 'mistral-small-4-0-26-03'],
  zhipu: ['glm-5.3', 'glm-5.3-flash', 'glm-5.2'],
  kimi: ['kimi-k3', 'kimi-k2.7-code-highspeed', 'kimi-k2.6']
})

// 快捷 Base URL 端点预设 (针对自定义/中转模式)
const baseUrlPresets = [
  { name: '硅基流动 (SiliconFlow)', url: 'https://api.siliconflow.cn/v1' },
  { name: 'DeepSeek 官方', url: 'https://api.deepseek.com/v1' },
  { name: 'OpenAI 官方', url: 'https://api.openai.com/v1' },
  { name: 'Ollama (本地)', url: 'http://localhost:11434/v1' },
  { name: 'vLLM (本地)', url: 'http://localhost:8000/v1' },
  { name: 'OneAPI / NewAPI', url: 'https://your-domain.com/v1' }
]

// 官方主流服务商元数据 (纯矢量 SVG + 精确技术参数)
const providerBrandMap: Record<string, {
  name: string
  spec: string
  fixedEndpoint?: string
  docUrl?: string
  docTitle?: string
  tag?: string
  svgIcon: string
}> = {
  custom: {
    name: '自定义中转 / 本地网关',
    spec: 'OneAPI / NewAPI / 硅基流动 / Ollama / vLLM',
    docUrl: '',
    tag: 'OpenAI 协议',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`
  },
  deepseek: {
    name: 'DeepSeek (深度求索)',
    spec: 'DeepSeek-V4 Pro / DeepSeek-V4 Flash',
    fixedEndpoint: 'https://api.deepseek.com/v1',
    docUrl: 'https://platform.deepseek.com/api_keys',
    docTitle: 'DeepSeek 开放平台',
    tag: '深度推理/高性价比',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0z"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`
  },
  openai: {
    name: 'OpenAI',
    spec: 'GPT-5.6 / GPT-4.5 / GPT-4o / o1 / o3-mini',
    fixedEndpoint: 'https://api.openai.com/v1',
    docUrl: 'https://platform.openai.com/api-keys',
    docTitle: 'OpenAI 官方后台',
    tag: '全球标杆',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>`
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    spec: 'Claude Opus 5 / Sonnet 5 / Fable 5',
    fixedEndpoint: 'https://api.anthropic.com/v1',
    docUrl: 'https://console.anthropic.com/settings/keys',
    docTitle: 'Anthropic Console',
    tag: '代码与长文本',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13.8 3h3.5L24 21h-3.6l-1.6-4.3h-6.2L11 21H7.4L13.8 3zm2.5 10.9l-2-5.4-2 5.4h4zM4.6 21H1L7.4 3h3.6L4.6 21z"/></svg>`
  },
  google: {
    name: 'Google Gemini',
    spec: 'Gemini 3.7 Flash / 3.6 Flash / 3.1 Pro',
    fixedEndpoint: 'https://generativelanguage.googleapis.com',
    docUrl: 'https://aistudio.google.com/app/apikey',
    docTitle: 'Google AI Studio',
    tag: '超长上下文/多模态',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="none"/><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>`
  },
  zhipu: {
    name: '智谱 AI (GLM)',
    spec: 'GLM-4-Plus / GLM-4-Air / GLM-4-Flash',
    fixedEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    docUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    docTitle: '智谱开放平台',
    tag: '国产高可用',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14L7 20h12"/><path d="M5 12h7"/></svg>`
  },
  kimi: {
    name: 'Kimi (月之暗面)',
    spec: 'Moonshot v1 / Kimi K2 系列',
    fixedEndpoint: 'https://api.moonshot.cn/v1',
    docUrl: 'https://platform.moonshot.cn/console/api-keys',
    docTitle: 'Moonshot 开放平台',
    tag: '超长记忆',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16M4 12l9-8v16l7-6"/></svg>`
  },
  xai: {
    name: 'xAI (Grok)',
    spec: 'Grok 4.20 / Reasoning / Code Fast',
    fixedEndpoint: 'https://api.x.ai/v1',
    docUrl: 'https://console.x.ai',
    docTitle: 'xAI Console',
    tag: '实时联网',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  },
  groq: {
    name: 'Groq',
    spec: 'Qwen 3.8 / Llama 4 / GPT-OSS 120B',
    fixedEndpoint: 'https://api.groq.com/openai/v1',
    docUrl: 'https://console.groq.com/keys',
    docTitle: 'Groq Cloud',
    tag: '极致推理速度',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>`
  },
  mistral: {
    name: 'Mistral AI',
    spec: 'Mistral Medium 3.5 / Large 3 / Small 4',
    fixedEndpoint: 'https://api.mistral.ai/v1',
    docUrl: 'https://console.mistral.ai/api-keys',
    docTitle: 'Mistral Console',
    tag: '欧洲开源标杆',
    svgIcon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="9.5" y="9.5" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="16" y="16" width="5" height="5"/></svg>`
  }
}

// 侧边栏/分类列表 (首项固定为自定义第三方代理)
const fullProviderList = computed(() => {
  const list = [
    {
      value: 'custom',
      label: '自定义 / 第三方代理 (OpenAI 协议)',
      isCustom: true
    }
  ]
  providers.value.forEach(p => {
    list.push({
      value: p.value,
      label: p.label,
      isCustom: false
    })
  })
  return list
})

const isCustomSelected = computed(() => {
  return setupConfig.value.provider === 'custom' || (setupConfig.value.provider === 'openai' && !!setupConfig.value.baseUrl)
})

const currentActiveProvider = computed(() => {
  if (isCustomSelected.value) return 'custom'
  return setupConfig.value.provider || 'custom'
})

// 汇总当前可选的模型列表
const availableModelList = computed(() => {
  const provKey = currentActiveProvider.value
  const result: { value: string; label: string; isCustom?: boolean }[] = []

  if (provKey !== 'custom') {
    const matched = providers.value.find(p => p.value === provKey)
    if (matched && matched.models) {
      matched.models.forEach(m => result.push({ value: m.value, label: m.label, isCustom: false }))
    }
  }

  // 附加动态新增的模型
  const extra = userCustomModels.value[provKey] || []
  extra.forEach(m => {
    if (!result.some(r => r.value === m)) {
      result.push({ value: m, label: m, isCustom: true })
    }
  })

  return result
})

const selectProvider = (val: string) => {
  if (val === 'custom') {
    setupConfig.value.provider = 'openai'
    if (!setupConfig.value.baseUrl) {
      setupConfig.value.baseUrl = 'https://api.openai.com/v1'
    }
  } else {
    setupConfig.value.provider = val
    setupConfig.value.baseUrl = ''
  }

  const models = availableModelList.value
  if (models.length > 0) {
    setupConfig.value.model = models[0].value
  } else {
    setupConfig.value.model = 'gpt-5.6-sol'
  }
}

// 快速应用 Base URL 预设
const applyBaseUrlPreset = (url: string) => {
  setupConfig.value.baseUrl = url
}

// 从剪贴板粘贴 API Key
const handlePasteApiKey = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      setupConfig.value.apiKey = text.trim()
    }
  } catch (err) {
    console.warn('Clipboard read failed:', err)
  }
}

// 快速新增模型
const handleAddNewModel = () => {
  const trimmed = newModelInput.value.trim()
  if (!trimmed) return
  const provKey = currentActiveProvider.value
  if (!userCustomModels.value[provKey]) {
    userCustomModels.value[provKey] = []
  }
  if (!userCustomModels.value[provKey].includes(trimmed)) {
    userCustomModels.value[provKey].unshift(trimmed)
  }
  setupConfig.value.model = trimmed
  newModelInput.value = ''
  showAddModelModal.value = false
}

// 真实接口握手测试
const testConnection = async () => {
  if (!setupConfig.value.apiKey && !hasConfiguredKey.value) {
    testStatus.value = 'error'
    testMessage.value = '请先输入 API Key 才能进行握手测试'
    return
  }
  isTesting.value = true
  testStatus.value = 'idle'
  testMessage.value = ''
  const start = performance.now()

  try {
    const res = await testAISetup()
    if (res.success) {
      testLatency.value = res.latency_ms || Math.round(performance.now() - start)
      testStatus.value = 'success'
      testMessage.value = res.message || `握手成功 · 响应延迟 ${testLatency.value}ms`
    } else {
      testStatus.value = 'error'
      testMessage.value = res.error || '连接失败，请检查 API Key、Base URL 或模型名称'
    }
  } catch (err: any) {
    testStatus.value = 'error'
    testMessage.value = err?.response?.data?.detail || err?.message || '连接超时或握手失败'
  } finally {
    isTesting.value = false
  }
}

const handleSubmit = async () => {
  try {
    let success = false
    if (hasExistingConfig.value) {
      success = await updateAISetup()
    } else {
      success = await saveAISetup()
    }

    if (success) {
      isSavedSuccess.value = true
      setTimeout(() => { isSavedSuccess.value = false }, 4000)
      emit('ai-setup-complete')
    }
  } catch (err) {
    console.error('Save AI config failed:', err)
  }
}
</script>

<template>
  <div class="ai-studio-container">
    <!-- 顶部状态看板与标题栏 -->
    <header class="studio-header">
      <div class="header-left">
        <div class="brand-badge">
          <span class="pulse-indicator"></span>
          <span>AI 推理引擎中枢</span>
        </div>
        <h1 class="main-title">大模型引擎配置</h1>
        <p class="subtitle">
          统一管理全局 AI 智能体的底层推理大脑。支持主流大模型厂商官方专线与任意兼容 OpenAI 协议的自定义中转代理或本地私有化网关。
        </p>
      </div>

      <div class="header-right">
        <div class="engine-status-card" :class="{ online: hasExistingConfig }">
          <div class="status-top">
            <span class="status-dot"></span>
            <span class="status-text">{{ hasExistingConfig ? '引擎已激活运行' : '待配置 · 暂未接入' }}</span>
          </div>
          <div class="status-meta" v-if="hasExistingConfig">
            <span class="meta-provider">{{ (setupConfig.baseUrl ? '自定义代理' : (providerBrandMap[setupConfig.provider]?.name || setupConfig.provider)) }}</span>
            <span class="meta-sep">/</span>
            <code class="meta-model">{{ setupConfig.model || 'DEFAULT' }}</code>
          </div>
        </div>
      </div>
    </header>

    <!-- 成功与错误反馈通知 -->
    <transition name="fade">
      <div v-if="isSavedSuccess" class="studio-alert success">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>大模型配置已成功保存并立即热生效！所有智能体已同步接入新模型中枢。</span>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="error" class="studio-alert error">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ error }}</span>
      </div>
    </transition>

    <!-- 主配置表单卡片 -->
    <form @submit.prevent="handleSubmit" class="main-card">
      
      <!-- 步骤 1：服务商与接入协议选择 -->
      <section class="config-section">
        <div class="section-head">
          <div class="step-num">1</div>
          <div class="step-titles">
            <h3>选择模型服务商与接入协议</h3>
            <p>选择官方直连专线或任意兼容 OpenAI 标准格式的第三方代理中转</p>
          </div>
        </div>

        <div class="provider-grid">
          <div
            v-for="p in fullProviderList"
            :key="p.value"
            class="provider-card"
            :class="{
              active: p.isCustom ? isCustomSelected : (setupConfig.provider === p.value && !setupConfig.baseUrl),
              'custom-highlight': p.isCustom
            }"
            @click="selectProvider(p.value)"
          >
            <div class="card-header-row">
              <div class="provider-icon-wrapper" v-html="providerBrandMap[p.value]?.svgIcon"></div>
              <span v-if="providerBrandMap[p.value]?.tag" class="provider-tag">
                {{ providerBrandMap[p.value]?.tag }}
              </span>
            </div>
            
            <div class="provider-card-body">
              <div class="provider-name">{{ providerBrandMap[p.value]?.name || p.label }}</div>
              <div class="provider-spec">{{ providerBrandMap[p.value]?.spec }}</div>
            </div>

            <div class="provider-card-check">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        </div>
      </section>

      <!-- 步骤 2：端点与认证凭据 -->
      <section class="config-section">
        <div class="section-head">
          <div class="step-num">2</div>
          <div class="step-titles">
            <h3>接口调用端点与认证凭据 (API Credentials)</h3>
            <p>配置模型请求接口基础地址与通信 Access Token 密钥</p>
          </div>
        </div>

        <div class="fields-container">
          <!-- 端点 Base URL -->
          <div class="field-item">
            <div class="field-label-row">
              <label for="baseUrl" class="field-label">接口调用端点 (Base URL)</label>
              <span v-if="isCustomSelected" class="mode-badge custom">
                ⚡ 自定义代理模式 (可编辑)
              </span>
              <span v-else class="mode-badge official">
                🔒 官方高可用专线直连
              </span>
            </div>

            <!-- 自定义模式 -->
            <div v-if="isCustomSelected" class="custom-endpoint-group">
              <div class="input-shell">
                <span class="shell-prefix">REST POST</span>
                <input
                  id="baseUrl"
                  type="text"
                  v-model="setupConfig.baseUrl"
                  required
                  class="shell-input font-mono"
                  placeholder="https://api.siliconflow.cn/v1"
                />
              </div>

              <!-- 快捷预设标签 -->
              <div class="presets-row">
                <span class="presets-title">快速填充预设：</span>
                <button
                  v-for="preset in baseUrlPresets"
                  :key="preset.name"
                  type="button"
                  class="preset-chip"
                  @click="applyBaseUrlPreset(preset.url)"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- 官方直连模式 -->
            <div v-else class="locked-endpoint-shell">
              <div class="locked-left">
                <span class="locked-tag">官方直连路由</span>
                <span class="locked-url font-mono">{{ providerBrandMap[setupConfig.provider]?.fixedEndpoint || 'https://api.openai.com/v1' }}</span>
              </div>
              <a
                v-if="providerBrandMap[setupConfig.provider]?.docUrl"
                :href="providerBrandMap[setupConfig.provider]?.docUrl"
                target="_blank"
                rel="noopener"
                class="official-doc-link"
              >
                前往 {{ providerBrandMap[setupConfig.provider]?.docTitle || '官方控制台' }} 获取 API Key ↗
              </a>
            </div>
          </div>

          <!-- API Key 输入框 -->
          <div class="field-item">
            <div class="field-label-row">
              <label for="apiKey" class="field-label">认证密钥 (API Key)</label>
              <span class="security-tag">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                AES-256 GCM 硬件级加密存储
              </span>
            </div>

            <div class="input-shell">
              <span class="shell-prefix">Bearer</span>
              <input
                id="apiKey"
                :type="showPassword ? 'text' : 'password'"
                v-model="setupConfig.apiKey"
                :required="!hasConfiguredKey"
                class="shell-input font-mono"
                :placeholder="hasConfiguredKey ? '•••••••• 已配置加密密钥 (若无需修改请留空)' : 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
              />
              
              <div class="shell-actions">
                <button
                  type="button"
                  class="shell-btn"
                  @click="handlePasteApiKey"
                  title="从剪贴板快速粘贴"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  <span>粘贴</span>
                </button>
                <button
                  type="button"
                  class="shell-btn"
                  @click="showPassword = !showPassword"
                  :title="showPassword ? '隐藏密钥' : '显示密钥'"
                >
                  <svg v-if="!showPassword" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
            </div>

            <!-- 已配置密钥提示 -->
            <div v-if="hasConfiguredKey && !setupConfig.apiKey" class="key-status-hint">
              <span class="key-shield">🛡️ {{ configuredKeyMasked || '已配置有效密钥' }}</span>
              <span class="key-tip">（若不修改密钥可直接点击保存；如需更换，直接输入新 Key 即可）</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 步骤 3：模型选择与动态架构 -->
      <section class="config-section">
        <div class="section-head">
          <div class="step-num">03</div>
          <div class="step-titles">
            <div class="title-with-action">
              <h2 class="step-title">模型架构与算力规格</h2>
              <button
                type="button"
                class="add-model-trigger"
                @click="showAddModelModal = true"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>新增自定义模型</span>
              </button>
            </div>
            <p class="step-desc">选择或输入该服务商下您希望调用的具体模型标识符。</p>
          </div>
        </div>

        <div class="models-grid">
          <div
            v-for="m in availableModelList"
            :key="m.value"
            class="model-pill"
            :class="{
              active: setupConfig.model === m.value,
              'custom-model': m.isCustom
            }"
            @click="setupConfig.model = m.value"
          >
            <div class="pill-radio">
              <span class="pill-dot"></span>
            </div>
            <div class="pill-info">
              <div class="pill-code font-mono">{{ m.value }}</div>
              <div class="pill-desc">{{ m.label }}</div>
            </div>
            <span v-if="m.isCustom" class="pill-custom-badge">自定义</span>
          </div>
        </div>

        <div class="active-summary-bar">
          <span class="summary-title">当前锁定调用的模型标识：</span>
          <code class="summary-model-name font-mono">{{ setupConfig.model || '尚未选择模型' }}</code>
        </div>
      </section>

      <!-- 底部操作底栏 -->
      <footer class="console-footer">
        <div class="footer-actions-left">
          <button
            type="button"
            class="ping-test-btn"
            :disabled="isTesting || (!setupConfig.apiKey && !hasConfiguredKey)"
            @click="testConnection"
          >
            <span v-if="isTesting" class="ping-spinner"></span>
            <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>{{ isTesting ? '正在探测接口连通性...' : '一键探测连通性' }}</span>
          </button>

          <div v-if="testStatus === 'success'" class="ping-result ok">
            <span class="ping-indicator-dot"></span>
            <span>{{ testMessage }}</span>
          </div>
          <div v-else-if="testStatus === 'error'" class="ping-result err">
            <span class="ping-indicator-dot err"></span>
            <span>{{ testMessage }}</span>
          </div>
        </div>

        <div class="footer-actions-right">
          <button
            type="submit"
            class="primary-save-btn"
            :disabled="isLoading || !setupConfig.model || (!setupConfig.apiKey && !hasConfiguredKey)"
          >
            <span v-if="isLoading" class="save-spinner"></span>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>{{ isLoading ? '正在保存中...' : (hasExistingConfig ? '保存并应用模型配置' : '立即部署并启用大模型') }}</span>
          </button>
        </div>
      </footer>
    </form>

    <!-- 弹窗：新增模型代码 -->
    <transition name="modal-fade">
      <div v-if="showAddModelModal" class="modal-overlay" @click.self="showAddModelModal = false">
        <div class="modal-dialog">
          <div class="modal-dialog-header">
            <div class="modal-title-wrap">
              <div class="modal-icon-badge">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <h4>新增大模型标识代码 (Model ID)</h4>
            </div>
            <button type="button" class="modal-close" @click="showAddModelModal = false">✕</button>
          </div>

          <div class="modal-dialog-body">
            <label class="modal-label">模型代码标识 (Model Identifier)</label>
            <input
              type="text"
              v-model="newModelInput"
              class="modal-input font-mono"
              placeholder="例如: qwen2.5:72b, deepseek-ai/DeepSeek-V3, claude-3-7-sonnet"
              @keydown.enter.prevent="handleAddNewModel"
              autofocus
            />
            <p class="modal-hint">
              请确保输入的模型代码与对应代理平台或中转网关完全一致。添加后将立即加入可选模型列表。
            </p>
          </div>

          <div class="modal-dialog-footer">
            <button type="button" class="btn-ghost" @click="showAddModelModal = false">取消</button>
            <button type="button" class="btn-confirm" :disabled="!newModelInput.trim()" @click="handleAddNewModel">
              确认添加并选中
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ai-studio-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 4px 0 40px;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: var(--text, #F5F6F8);
}

/* 顶部状态栏 */
.studio-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--accent-bg-08, rgba(201, 242, 78, 0.08));
  border: 1px solid var(--accent-border, rgba(201, 242, 78, 0.25));
  color: var(--accent-ink, #C9F24E);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-ink, #C9F24E);
  box-shadow: 0 0 8px var(--accent-ink, #C9F24E);
}

.main-title {
  font-family: var(--font-display, inherit);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text, #F5F6F8);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 13.5px;
  color: var(--muted, #9CA3B0);
  margin: 0;
  max-width: 720px;
  line-height: 1.55;
}

/* 状态看板卡片 */
.engine-status-card {
  background: var(--surface, #13151C);
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  padding: 12px 18px;
  min-width: 230px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
}

.status-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted, #9CA3B0);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--muted2, #7A8190);
}

.engine-status-card.online {
  border-color: var(--accent-border, rgba(201, 242, 78, 0.3));
  background: linear-gradient(145deg, var(--accent-bg-06, rgba(201, 242, 78, 0.05)), var(--surface, #13151C));
}

.engine-status-card.online .status-dot {
  background: var(--accent-ink, #C9F24E);
  box-shadow: 0 0 10px var(--accent-ink, #C9F24E);
}

.engine-status-card.online .status-text {
  color: var(--accent-ink, #C9F24E);
}

.status-meta {
  font-size: 11.5px;
  color: var(--muted, #9CA3B0);
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-provider {
  font-weight: 600;
  color: var(--text2, #E7EAF0);
}

.meta-sep {
  opacity: 0.3;
}

.meta-model {
  font-family: var(--font-mono, monospace);
  color: var(--accent-ink, #C9F24E);
  font-weight: 600;
}

/* 提示通知栏 */
.studio-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 20px;
  animation: fadeIn 0.25s ease-out;
}

.studio-alert.success {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.studio-alert.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* 主卡片容器 */
.main-card {
  background: var(--surface, #13151C);
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 配置分段 */
.config-section {
  padding: 24px 28px;
  border-bottom: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
}

.section-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.step-num {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 800;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--accent-bg-12, rgba(201, 242, 78, 0.12));
  color: var(--accent-ink, #C9F24E);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-titles {
  flex: 1;
}

.title-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.step-titles h3 {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text, #F5F6F8);
  margin: 0 0 3px;
}

.step-titles p {
  font-size: 12.5px;
  color: var(--muted, #9CA3B0);
  margin: 0;
}

/* 服务商网格 */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}

.provider-card {
  background: var(--bg, #0B0C10);
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 11px;
  padding: 13px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.provider-card:hover {
  border-color: var(--o20, rgba(255, 255, 255, 0.2));
  transform: translateY(-1px);
  background: var(--bg2, #0E0F14);
}

.provider-card.active {
  border-color: var(--accent-ink, #C9F24E);
  background: linear-gradient(180deg, var(--accent-bg-08, rgba(201, 242, 78, 0.08)), var(--bg, #0B0C10));
  box-shadow: 0 0 16px rgba(201, 242, 78, 0.1);
}

.provider-card.custom-highlight.active {
  border-color: #38bdf8;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.1), var(--bg, #0B0C10));
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.12);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.provider-icon-wrapper {
  color: var(--text, #F5F6F8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-card.active .provider-icon-wrapper {
  color: var(--accent-ink, #C9F24E);
}

.provider-card.custom-highlight.active .provider-icon-wrapper {
  color: #38bdf8;
}

.provider-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--o06, rgba(255, 255, 255, 0.06));
  color: var(--muted, #9CA3B0);
}

.provider-card.active .provider-tag {
  background: var(--accent-bg-12, rgba(201, 242, 78, 0.12));
  color: var(--accent-ink, #C9F24E);
}

.provider-card.custom-highlight.active .provider-tag {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.provider-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text, #F5F6F8);
}

.provider-spec {
  font-size: 11px;
  color: var(--muted2, #7A8190);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-card-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-ink, #C9F24E);
  color: #0B0C10;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: all 0.15s ease;
}

.provider-card.active .provider-card-check {
  opacity: 1;
  transform: scale(1);
}

.provider-card.custom-highlight.active .provider-card-check {
  background: #38bdf8;
}

/* 字段区域 */
.fields-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2, #E7EAF0);
}

.mode-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.mode-badge.custom {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
}

.mode-badge.official {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.25);
  color: #c084fc;
}

.security-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #34d399;
  background: rgba(16, 185, 129, 0.08);
  padding: 2px 7px;
  border-radius: 4px;
}

/* 输入框 Shell */
.input-shell {
  display: flex;
  align-items: center;
  background: var(--bg, #0B0C10);
  border: 1px solid var(--o14, rgba(255, 255, 255, 0.14));
  border-radius: 9px;
  transition: all 0.15s ease;
  overflow: hidden;
}

.input-shell:focus-within {
  border-color: var(--accent-ink, #C9F24E);
  box-shadow: 0 0 0 3px var(--accent-bg-12, rgba(201, 242, 78, 0.12));
}

.shell-prefix {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted, #9CA3B0);
  padding: 0 12px;
  border-right: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  user-select: none;
}

.shell-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 12px 14px;
  font-size: 13.5px;
  color: var(--text, #F5F6F8);
  min-width: 0;
}

.shell-input::placeholder {
  color: var(--muted2, #7A8190);
  opacity: 0.6;
}

.shell-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 8px;
}

.shell-btn {
  background: var(--o06, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--muted, #9CA3B0);
  padding: 5px 8px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.shell-btn:hover {
  background: var(--o12, rgba(255, 255, 255, 0.12));
  color: var(--text, #F5F6F8);
}

.key-status-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  font-size: 12px;
}

.key-shield {
  color: #34d399;
  font-weight: 600;
}

.key-tip {
  color: var(--muted, #9CA3B0);
  font-size: 11px;
}

/* 官方直连只读横条 */
.locked-endpoint-shell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 9px;
  padding: 11px 16px;
}

.locked-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.locked-tag {
  font-size: 10px;
  font-weight: 700;
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  padding: 2px 6px;
  border-radius: 4px;
}

.locked-url {
  font-size: 13px;
  color: var(--muted, #9CA3B0);
}

.official-doc-link {
  font-size: 12px;
  color: var(--accent-ink, #C9F24E);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s;
}

.official-doc-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}

/* 预设行 */
.presets-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.presets-title {
  font-size: 11.5px;
  color: var(--muted2, #7A8190);
}

.preset-chip {
  background: var(--o04, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 5px;
  color: var(--muted, #9CA3B0);
  font-size: 11px;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: var(--accent-bg-08, rgba(201, 242, 78, 0.08));
  border-color: var(--accent-border, rgba(201, 242, 78, 0.3));
  color: var(--accent-ink, #C9F24E);
}

/* 模型选择 */
.add-model-trigger {
  background: var(--accent-bg-08, rgba(201, 242, 78, 0.08));
  border: 1px solid var(--accent-border, rgba(201, 242, 78, 0.25));
  color: var(--accent-ink, #C9F24E);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-model-trigger:hover {
  background: var(--accent-bg-12, rgba(201, 242, 78, 0.15));
  border-color: var(--accent-ink, #C9F24E);
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 8px;
}

.model-pill {
  background: var(--bg, #0B0C10);
  border: 1px solid var(--o10, rgba(255, 255, 255, 0.1));
  border-radius: 9px;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: all 0.15s ease;
}

.model-pill:hover {
  border-color: var(--o20, rgba(255, 255, 255, 0.2));
  background: var(--bg2, #0E0F14);
}

.model-pill.selected {
  border-color: var(--accent-ink, #C9F24E);
  background: var(--accent-bg-06, rgba(201, 242, 78, 0.06));
  box-shadow: 0 0 0 1px var(--accent-ink, #C9F24E);
}

.pill-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--o20, rgba(255, 255, 255, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.model-pill.selected .pill-radio {
  border-color: var(--accent-ink, #C9F24E);
  background: var(--accent-ink, #C9F24E);
}

.pill-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #0B0C10;
}

.pill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pill-code {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text, #F5F6F8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-desc {
  font-size: 11px;
  color: var(--muted2, #7A8190);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-custom-badge {
  font-size: 9.5px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.active-summary-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--o08, rgba(255, 255, 255, 0.08));
  font-size: 12px;
  color: var(--muted, #9CA3B0);
}

.summary-model-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--accent-ink, #C9F24E);
  background: var(--accent-bg-08, rgba(201, 242, 78, 0.08));
  padding: 2px 8px;
  border-radius: 4px;
}

/* 底部操作栏 */
.console-footer {
  padding: 18px 28px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-actions-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ping-test-btn {
  background: var(--o06, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--o14, rgba(255, 255, 255, 0.14));
  border-radius: 8px;
  color: var(--text2, #E7EAF0);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ping-test-btn:hover:not(:disabled) {
  background: var(--o12, rgba(255, 255, 255, 0.12));
  border-color: var(--o25, rgba(255, 255, 255, 0.25));
}

.ping-test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ping-result {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
}

.ping-result.ok {
  color: #34d399;
}

.ping-result.err {
  color: #f87171;
}

.ping-indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px #34d399;
}

.ping-indicator-dot.err {
  background: #f87171;
  box-shadow: 0 0 6px #f87171;
}

.primary-save-btn {
  background: var(--accent-solid, #C9F24E);
  color: var(--on-accent-solid, #0B0C10);
  border: none;
  border-radius: 8px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(201, 242, 78, 0.25);
}

.primary-save-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(201, 242, 78, 0.35);
}

.primary-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 旋转加载动画 */
.ping-spinner, .save-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 7, 10, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-dialog {
  background: var(--surface, #13151C);
  border: 1px solid var(--o14, rgba(255, 255, 255, 0.14));
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-dialog-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--accent-bg-12, rgba(201, 242, 78, 0.12));
  color: var(--accent-ink, #C9F24E);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title-wrap h4 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--muted, #9CA3B0);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

.modal-dialog-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text2, #E7EAF0);
}

.modal-input {
  background: var(--bg, #0B0C10);
  border: 1px solid var(--o14, rgba(255, 255, 255, 0.14));
  border-radius: 8px;
  padding: 11px 14px;
  color: var(--text, #F5F6F8);
  font-size: 13.5px;
  outline: none;
}

.modal-input:focus {
  border-color: var(--accent-ink, #C9F24E);
  box-shadow: 0 0 0 3px var(--accent-bg-12, rgba(201, 242, 78, 0.12));
}

.modal-hint {
  font-size: 11.5px;
  color: var(--muted2, #7A8190);
  line-height: 1.5;
  margin: 0;
}

.modal-dialog-footer {
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--o12, rgba(255, 255, 255, 0.12));
  border-radius: 7px;
  color: var(--muted, #9CA3B0);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm {
  background: var(--accent-solid, #C9F24E);
  color: var(--on-accent-solid, #0B0C10);
  border: none;
  border-radius: 7px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式断点适配 */
@media (max-width: 840px) {
  .studio-header {
    flex-direction: column;
  }
  .engine-status-card {
    width: 100%;
  }
  .config-section {
    padding: 18px 16px;
  }
  .console-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .footer-actions-left, .footer-actions-right {
    width: 100%;
    justify-content: space-between;
  }
  .primary-save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
