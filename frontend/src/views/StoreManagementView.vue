<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import storeService, {
  type Store,
  type StoreOptions,
  type CreateStorePayload,
  type UpdateStorePayload,
} from '@/services/store'
import channelsService from '@/services/channels'
import { copyTextToClipboard } from '@/utils/clipboard'

const stores = ref<Store[]>([])
const options = ref<StoreOptions>({ channels: [], agents: [], shopify: [] })
const isLoading = ref(true)
const isSubmitting = ref(false)
const searchQuery = ref('')
const selectedPlatformFilter = ref<string>('all')

// Modal / Drawer state
const showModal = ref(false)
const isEditing = ref(false)
const currentStoreId = ref<string | null>(null)

// Multi-Channel tab state inside store modal (default to email, TG removed)
const channelTypeTab = ref<'email' | 'whatsapp' | 'instagram' | 'line' | 'messenger' | 'web'>('email')

// Form fields for WhatsApp
const waPhoneNumber = ref('')
const waPhoneId = ref('')
const waAccessToken = ref('')
const waWabaId = ref('')

// Form fields for Instagram
const igId = ref('')
const igAccessToken = ref('')

// Form fields for LINE
const lineChannelId = ref('')
const lineChannelSecret = ref('')
const lineAccessToken = ref('')

// Form fields for Messenger
const messengerPageId = ref('')
const messengerAccessToken = ref('')

// Form fields for Email (Default)
const storeEmailAddress = ref('')
const smtpHost = ref('')
const smtpPort = ref('587')
const smtpUsername = ref('')
const smtpPassword = ref('')
const fromEmailName = ref('')
const showSmtpAdvanced = ref(false)

// Webhook / Channel guide modal state
const showWebhookModal = ref(false)
const activeStoreForWebhook = ref<Store | null>(null)
const activeWebhookUrl = ref('')
const isLoadingWebhook = ref(false)
let dataRequestVersion = 0
let webhookRequestVersion = 0
const togglingStoreIds = ref(new Set<string>())
const deletingStoreIds = ref(new Set<string>())

// Form fields
const formData = ref<{
  name: string
  platform: string
  shop_domain: string
  agent_id: string
  knowledge_tag: string
  currency: string
  timezone: string
  is_active: boolean
}>({
  name: '',
  platform: 'shopify',
  shop_domain: '',
  agent_id: '',
  knowledge_tag: '',
  currency: 'USD',
  timezone: 'America/New_York',
  is_active: true,
})

const platformList = [
  { value: 'web_widget', label: '独立站网页挂件', icon: 'fa-solid fa-comments', color: 'text-violet-800 bg-violet-50 border-violet-200' },
  { value: 'shopify', label: 'Shopify 独立站', icon: 'fa-brands fa-shopify', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { value: 'woocommerce', label: 'WooCommerce', icon: 'fa-brands fa-wordpress', color: 'text-purple-800 bg-purple-50 border-purple-200' },
  { value: 'amazon', label: 'Amazon 亚马逊', icon: 'fa-brands fa-amazon', color: 'text-amber-900 bg-amber-50 border-amber-200' },
  { value: 'tiktok', label: 'TikTok Shop', icon: 'fa-brands fa-tiktok', color: 'text-rose-800 bg-rose-50 border-rose-200' },
  { value: 'email_custom', label: '自建站 / 定制站', icon: 'fa-solid fa-store', color: 'text-blue-800 bg-blue-50 border-blue-200' },
  { value: 'other', label: '其它平台', icon: 'fa-solid fa-cube', color: 'text-slate-700 bg-slate-100 border-slate-200' },
]

const channelTypeList = [
  { value: 'email', label: '专属客服邮箱', icon: 'fa-solid fa-envelope', color: 'text-blue-600', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
  { value: 'whatsapp', label: 'WhatsApp 商业号', icon: 'fa-brands fa-whatsapp', color: 'text-emerald-600', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { value: 'instagram', label: 'Instagram Direct', icon: 'fa-brands fa-instagram', color: 'text-pink-600', activeClass: 'border-pink-500 bg-pink-50 text-pink-700' },
  { value: 'line', label: 'LINE Official', icon: 'fa-brands fa-line', color: 'text-green-600', activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'messenger', label: 'Messenger', icon: 'fa-brands fa-facebook-messenger', color: 'text-indigo-600', activeClass: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
] as const

const currencyList = [
  { code: 'USD', label: 'USD ($) - 美元' },
  { code: 'EUR', label: 'EUR (€) - 欧元' },
  { code: 'GBP', label: 'GBP (£) - 英镑' },
  { code: 'JPY', label: 'JPY (¥) - 日元' },
  { code: 'CAD', label: 'CAD ($) - 加元' },
  { code: 'AUD', label: 'AUD ($) - 澳元' },
  { code: 'CNY', label: 'CNY (¥) - 人民币' },
]

const timezoneList = [
  { value: 'America/New_York', label: '美东时间 (EST/EDT) - 纽约' },
  { value: 'America/Los_Angeles', label: '美西时间 (PST/PDT) - 洛杉矶' },
  { value: 'Europe/London', label: '伦敦时间 (GMT/BST)' },
  { value: 'Europe/Berlin', label: '中欧时间 (CET/CEST) - 柏林/巴黎' },
  { value: 'Asia/Shanghai', label: '北京时间 (CST) - 上海/香港' },
  { value: 'Asia/Tokyo', label: '日本时间 (JST) - 东京' },
]

const loadData = async () => {
  const requestVersion = ++dataRequestVersion
  try {
    isLoading.value = true
    const [storeList, opts] = await Promise.all([
      storeService.getStores(),
      storeService.getOptions(),
    ])
    if (requestVersion !== dataRequestVersion) return
    stores.value = storeList || []
    options.value = {
      channels: opts?.channels || [],
      agents: opts?.agents || [],
      shopify: opts?.shopify || [],
    }
  } catch (error: any) {
    console.error('Failed to load stores:', error)
    toast.error('加载店铺列表失败，请刷新重试')
  } finally {
    if (requestVersion === dataRequestVersion) isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  dataRequestVersion += 1
  webhookRequestVersion += 1
})

const filteredStores = computed(() => {
  return stores.value.filter(store => {
    const matchesSearch =
      !searchQuery.value ||
      store.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (store.shop_domain && store.shop_domain.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (store.email_address && store.email_address.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (store.channel_display_name && store.channel_display_name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (store.channel_external_id && store.channel_external_id.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesPlatform =
      selectedPlatformFilter.value === 'all' || store.platform === selectedPlatformFilter.value

    return matchesSearch && matchesPlatform
  })
})

const activeCount = computed(() => stores.value.filter(s => s.is_active).length)
const channelBoundCount = computed(() => stores.value.filter(s => s.email_account_id || s.channel_account_id).length)
const agentBoundCount = computed(() => stores.value.filter(s => s.agent_id).length)

const openCreateModal = () => {
  isEditing.value = false
  currentStoreId.value = null
  channelTypeTab.value = 'email' // Default to email

  // Reset fields
  waPhoneNumber.value = ''
  waPhoneId.value = ''
  waAccessToken.value = ''
  waWabaId.value = ''

  igId.value = ''
  igAccessToken.value = ''

  lineChannelId.value = ''
  lineChannelSecret.value = ''
  lineAccessToken.value = ''

  messengerPageId.value = ''
  messengerAccessToken.value = ''

  showSmtpAdvanced.value = false
  storeEmailAddress.value = ''
  smtpHost.value = ''
  smtpPort.value = '587'
  smtpUsername.value = ''
  smtpPassword.value = ''
  fromEmailName.value = ''

  formData.value = {
    name: '',
    platform: 'shopify',
    shop_domain: options.value.shopify.length > 0 ? options.value.shopify[0].shop_domain : '',
    agent_id: options.value.agents.length > 0 ? options.value.agents[0].id : '',
    knowledge_tag: '',
    currency: 'USD',
    timezone: 'America/New_York',
    is_active: true,
  }
  showModal.value = true
}

const openEditModal = (store: Store) => {
  isEditing.value = true
  currentStoreId.value = store.id
  
  if (store.channel_type) {
    channelTypeTab.value = (store.channel_type as any) || 'email'
  } else if (store.email_address) {
    channelTypeTab.value = 'email'
    storeEmailAddress.value = store.email_address || ''
  } else {
    channelTypeTab.value = 'email'
  }

  showSmtpAdvanced.value = false
  storeEmailAddress.value = store.email_address || store.email_display_name || ''
  smtpHost.value = ''
  smtpPort.value = '587'
  smtpUsername.value = ''
  smtpPassword.value = ''
  fromEmailName.value = ''

  formData.value = {
    name: store.name,
    platform: store.platform,
    shop_domain: store.shop_domain || '',
    agent_id: store.agent_id || '',
    knowledge_tag: store.knowledge_tag || '',
    currency: store.currency || 'USD',
    timezone: store.timezone || 'America/New_York',
    is_active: store.is_active,
  }
  showModal.value = true
}

const handleSaveStore = async () => {
  if (isSubmitting.value) return
  if (!formData.value.name.trim()) {
    toast.error('请输入店铺名称')
    return
  }

  try {
    isSubmitting.value = true

    let directChannelType: string = channelTypeTab.value
    let directChannelConfig: Record<string, any> = {}

    // Build config directly if provided
    if (channelTypeTab.value === 'email') {
      const emailAddr = storeEmailAddress.value.trim().toLowerCase()
      if (emailAddr) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr)) {
          toast.error('请输入有效的客服邮箱地址 (如: support@yourstore.com)')
          isSubmitting.value = false
          return
        }
        directChannelConfig = {
          email: emailAddr,
          inbound_address: emailAddr,
          display_name: emailAddr,
        }
      } else {
        // No email configured yet - store can still be created directly!
        directChannelType = ''
      }
      if (smtpHost.value.trim()) {
        if (!smtpUsername.value.trim() || !smtpPassword.value) {
          toast.error('配置了 SMTP 服务器时，用户名与密码为必填项')
          isSubmitting.value = false
          return
        }
        directChannelConfig.smtp_host = smtpHost.value.trim()
        directChannelConfig.smtp_port = Number(smtpPort.value.trim()) || 587
        directChannelConfig.smtp_username = smtpUsername.value.trim()
        directChannelConfig.smtp_password = smtpPassword.value
        if (fromEmailName.value.trim()) {
          directChannelConfig.from_email = fromEmailName.value.trim()
        }
      }
    } else if (channelTypeTab.value === 'whatsapp') {
      if (!waPhoneId.value.trim() || !waAccessToken.value.trim()) {
        toast.error('请填写 WhatsApp 电话号码 ID 与 Access Token')
        isSubmitting.value = false
        return
      }
      directChannelConfig = {
        phone_number_id: waPhoneId.value.trim(),
        access_token: waAccessToken.value.trim(),
        waba_id: waWabaId.value.trim() || undefined,
        display_name: waPhoneNumber.value.trim() || (formData.value.name.trim() + ' (WhatsApp)'),
      }
    } else if (channelTypeTab.value === 'instagram') {
      if (!igId.value.trim() || !igAccessToken.value.trim()) {
        toast.error('请填写 Instagram 账号 ID 与 Page Access Token')
        isSubmitting.value = false
        return
      }
      directChannelConfig = {
        ig_id: igId.value.trim(),
        page_access_token: igAccessToken.value.trim(),
        display_name: formData.value.name.trim() + ' (Instagram)',
      }
    } else if (channelTypeTab.value === 'line') {
      if (!lineChannelId.value.trim() || !lineAccessToken.value.trim()) {
        toast.error('请填写 LINE Channel ID 与 Access Token')
        isSubmitting.value = false
        return
      }
      directChannelConfig = {
        channel_id: lineChannelId.value.trim(),
        channel_secret: lineChannelSecret.value.trim(),
        channel_access_token: lineAccessToken.value.trim(),
        display_name: formData.value.name.trim() + ' (LINE)',
      }
    } else if (channelTypeTab.value === 'messenger') {
      if (!messengerPageId.value.trim() || !messengerAccessToken.value.trim()) {
        toast.error('请填写 Messenger Page ID 与 Access Token')
        isSubmitting.value = false
        return
      }
      directChannelConfig = {
        page_id: messengerPageId.value.trim(),
        page_access_token: messengerAccessToken.value.trim(),
        display_name: formData.value.name.trim() + ' (Messenger)',
      }
    }


    const payload: CreateStorePayload = {
      name: formData.value.name.trim(),
      platform: formData.value.platform,
      shop_domain: formData.value.shop_domain.trim() || undefined,
      channel_type: directChannelType,
      channel_config: directChannelConfig,
      agent_id: formData.value.agent_id || undefined,
      knowledge_tag: formData.value.knowledge_tag.trim() || undefined,
      currency: formData.value.currency,
      timezone: formData.value.timezone,
      is_active: formData.value.is_active,
    }

    if (isEditing.value && currentStoreId.value) {
      await storeService.updateStore(currentStoreId.value, payload as UpdateStorePayload)
      toast.success('店铺及专属渠道配置已成功更新！')
    } else {
      await storeService.createStore(payload)
      toast.success(`店铺「${payload.name}」已创建，专属渠道已就绪！`)
    }

    showModal.value = false
    await loadData()
  } catch (error: any) {
    console.error('Failed to save store:', error)
    toast.error(error?.response?.data?.detail || error?.message || '保存店铺失败')
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleStatus = async (store: Store) => {
  if (togglingStoreIds.value.has(store.id)) return
  togglingStoreIds.value.add(store.id)
  try {
    const nextState = !store.is_active
    await storeService.updateStore(store.id, { is_active: nextState })
    store.is_active = nextState
    toast.success(`店铺已${nextState ? '启用' : '停用'}`)
  } catch (error: any) {
    console.error('Failed to toggle store status:', error)
    toast.error('修改店铺状态失败')
  } finally {
    togglingStoreIds.value.delete(store.id)
  }
}

const handleDeleteStore = async (store: Store) => {
  if (deletingStoreIds.value.has(store.id)) return
  if (!confirm(`确定要删除店铺「${store.name}」吗？\n删除后该店铺绑定的专属渠道将被解绑。`)) {
    return
  }

  deletingStoreIds.value.add(store.id)
  try {
    await storeService.deleteStore(store.id)
    toast.success('店铺删除成功')
    await loadData()
  } catch (error: any) {
    console.error('Failed to delete store:', error)
    toast.error('删除店铺失败')
  } finally {
    deletingStoreIds.value.delete(store.id)
  }
}

const openWebhookModal = async (store: Store) => {
  const requestVersion = ++webhookRequestVersion
  activeStoreForWebhook.value = store
  showWebhookModal.value = true
  activeWebhookUrl.value = ''
  isLoadingWebhook.value = true

  const boundId = store.channel_account_id || store.email_account_id
  try {
    if (boundId) {
      const url = await channelsService.getEmailWebhookUrl(boundId)
      if (requestVersion === webhookRequestVersion && activeStoreForWebhook.value?.id === store.id) {
        activeWebhookUrl.value = url
      }
    } else {
      activeWebhookUrl.value = ''
    }
  } catch (err: any) {
    console.error('Failed to get webhook url:', err)
    if (requestVersion === webhookRequestVersion && activeStoreForWebhook.value?.id === store.id) {
      activeWebhookUrl.value = `${window.location.origin}/api/v1/webhooks/email/${boundId || ''}`
    }
  } finally {
    if (requestVersion === webhookRequestVersion && activeStoreForWebhook.value?.id === store.id) {
      isLoadingWebhook.value = false
    }
  }
}

const closeWebhookModal = () => {
  webhookRequestVersion += 1
  showWebhookModal.value = false
  activeStoreForWebhook.value = null
  activeWebhookUrl.value = ''
  isLoadingWebhook.value = false
}

const copyToClipboard = async (text: string, label = '内容') => {
  if (!text) return
  try {
    if (await copyTextToClipboard(text)) {
      toast.success(`${label}已复制到剪贴板！`)
    } else {
      toast.error('复制失败，请手动选择并复制内容')
    }
  } catch (error) {
    console.error(`Failed to copy ${label}:`, error)
    toast.error('复制失败，请手动选择并复制内容')
  }
}

const getPlatformBadge = (platform: string) => {
  const item = platformList.find(p => p.value === platform)
  return item || { label: platform, icon: 'fa-solid fa-store', color: 'text-slate-300 bg-slate-100 border-slate-200' }
}

const getChannelBadge = (channelType?: string) => {
  switch (channelType?.toLowerCase()) {
    case 'whatsapp':
      return {
        label: 'WhatsApp 专线',
        icon: 'fa-brands fa-whatsapp',
        iconColor: 'text-emerald-600',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      }
    case 'instagram':
      return {
        label: 'Instagram Direct',
        icon: 'fa-brands fa-instagram',
        iconColor: 'text-pink-600',
        badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
        dotClass: 'bg-pink-500',
      }
    case 'line':
      return {
        label: 'LINE Official',
        icon: 'fa-brands fa-line',
        iconColor: 'text-green-600',
        badgeClass: 'bg-green-50 text-green-700 border-green-200',
        dotClass: 'bg-green-500',
      }
    case 'messenger':
      return {
        label: 'Messenger',
        icon: 'fa-brands fa-facebook-messenger',
        iconColor: 'text-indigo-600',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
      }
    case 'web':
      return {
        label: '独立站挂件',
        icon: 'fa-solid fa-comments',
        iconColor: 'text-violet-600',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        dotClass: 'bg-violet-500',
      }
    case 'email':
    default:
      return {
        label: '专属客服邮箱',
        icon: 'fa-solid fa-envelope',
        iconColor: 'text-blue-600',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      }
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="store-view-container">
      <!-- Header Banner -->
      <div class="view-header">
        <div class="header-left">
          <div class="header-badge">
            <i class="fa-solid fa-store"></i>
            <span>电商多店铺中心</span>
          </div>
          <h1 class="page-title">店铺管理</h1>
          <p class="page-desc">
            以店铺为中心统一管理多平台网店与自建站。每个店铺可独立配置客服邮箱、WhatsApp、Instagram、LINE、Messenger 或独立站挂件，并指定专属 AI 智能体接待！
          </p>
        </div>
        <div class="header-actions flex items-center gap-3">
          <a
            href="/channel_simulator.html"
            target="_blank"
            class="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 border border-indigo-200 shadow-sm transition-all"
          >
            <i class="fa-solid fa-flask-vial text-indigo-600"></i>
            <span>全渠道沙盒模拟器</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
          </a>
          <button class="create-btn" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            <span>新建店铺</span>
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-indigo-50 text-indigo-600 border border-indigo-200">
            <i class="fa-solid fa-shop"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">全部店铺</span>
            <span class="stat-value">{{ stores.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600 border border-emerald-200">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">运作中店铺</span>
            <span class="stat-value">{{ activeCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue-50 text-blue-600 border border-blue-200">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">已绑定买家渠道</span>
            <span class="stat-value">{{ channelBoundCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-purple-50 text-purple-600 border border-purple-200">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">已分配 AI 接管</span>
            <span class="stat-value">{{ agentBoundCount }}</span>
          </div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="toolbar-card">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索店铺名称、官网域名、渠道账号或专属邮箱..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="filter-group">
          <label class="filter-label">平台分类：</label>
          <div class="filter-pills">
            <button
              class="pill-btn"
              :class="{ active: selectedPlatformFilter === 'all' }"
              @click="selectedPlatformFilter = 'all'"
            >
              全部 ({{ stores.length }})
            </button>
            <button
              v-for="p in platformList"
              :key="p.value"
              class="pill-btn"
              :class="{ active: selectedPlatformFilter === p.value }"
              @click="selectedPlatformFilter = p.value"
            >
              <i :class="p.icon"></i>
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载店铺数据...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredStores.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-store-slash"></i>
        </div>
        <h3>暂无匹配的店铺</h3>
        <p v-if="searchQuery || selectedPlatformFilter !== 'all'">
          没有找到符合筛选条件的店铺，请尝试重置搜索或筛选。
        </p>
        <p v-else>
          您尚未添加任何店铺，点击下方按钮一站式接入您的网店与专属客服渠道。
        </p>
        <button v-if="!searchQuery && selectedPlatformFilter === 'all'" class="create-btn" @click="openCreateModal">
          <i class="fa-solid fa-plus"></i>
          <span>新建第一个店铺</span>
        </button>
      </div>

      <!-- Stores Grid -->
      <div v-else class="stores-grid">
        <div
          v-for="store in filteredStores"
          :key="store.id"
          class="store-card"
          :class="{ 'inactive': !store.is_active }"
        >
          <!-- Card Header -->
          <div class="card-top">
            <div class="platform-badge" :class="getPlatformBadge(store.platform).color">
              <i :class="getPlatformBadge(store.platform).icon"></i>
              <span>{{ getPlatformBadge(store.platform).label }}</span>
            </div>
            <div class="status-toggle">
              <button
                class="status-btn"
                :class="store.is_active ? 'active' : 'inactive'"
                @click="handleToggleStatus(store)"
                :disabled="togglingStoreIds.has(store.id)"
                :title="store.is_active ? '点击停用店铺' : '点击启用店铺'"
              >
                <span class="status-dot"></span>
                <span>{{ store.is_active ? '运作中' : '已停用' }}</span>
              </button>
            </div>
          </div>

          <!-- Store Title & Domain -->
          <div class="store-main">
            <h3 class="store-name" :title="store.name">{{ store.name }}</h3>
            <div v-if="store.shop_domain" class="store-domain">
              <i class="fa-solid fa-link"></i>
              <span class="domain-text">{{ store.shop_domain }}</span>
              <a
                :href="store.shop_domain.startsWith('http') ? store.shop_domain : 'https://' + store.shop_domain"
                target="_blank"
                rel="noreferrer"
                class="open-link"
                title="在新标签页中打开店铺网址"
              >
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
            <div v-else class="store-domain muted">
              <i class="fa-solid fa-globe"></i>
              <span>未设置独立站网址</span>
            </div>
          </div>

          <!-- Bindings Meta -->
          <div class="binding-section">
            <!-- Channel Binding -->
            <div class="binding-item">
              <div class="binding-icon" :class="getChannelBadge(store.channel_type).badgeClass">
                <i :class="getChannelBadge(store.channel_type).icon"></i>
              </div>
              <div class="binding-info flex-1">
                <div class="flex items-center justify-between">
                  <span class="binding-title">{{ getChannelBadge(store.channel_type).label }}</span>
                  <button
                    v-if="store.email_account_id || store.channel_account_id"
                    class="webhook-pill-btn"
                    @click="openWebhookModal(store)"
                    title="查看该渠道的 Webhook 回调指引"
                  >
                    <i class="fa-solid fa-satellite-dish"></i>
                    <span>接入信息</span>
                  </button>
                </div>
                <span v-if="store.channel_display_name || store.channel_external_id || store.email_display_name || store.email_address" class="binding-val font-bold" :class="getChannelBadge(store.channel_type).iconColor">
                  {{ store.channel_display_name || store.channel_external_id || store.email_display_name || store.email_address }}
                </span>
                <div v-else class="flex items-center gap-2">
                  <span class="binding-val unassigned">未绑定专属渠道</span>
                  <button class="quick-bind-btn" @click="openEditModal(store)">+ 去配置</button>
                </div>
              </div>
            </div>

            <!-- AI Agent Binding -->
            <div class="binding-item">
              <div class="binding-icon text-indigo-600 bg-indigo-50 border border-indigo-100">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div class="binding-info flex-1">
                <span class="binding-title">负责 AI 智能体</span>
                <span v-if="store.agent_name || store.agent_display_name" class="binding-val text-indigo-700 font-bold">
                  {{ store.agent_display_name || store.agent_name }}
                </span>
                <div v-else class="flex items-center gap-2">
                  <span class="binding-val unassigned">未指定智能体</span>
                  <button class="quick-bind-btn" @click="openEditModal(store)">+ 去指定</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Metadata & Actions -->
          <div class="card-footer">
            <div class="footer-pills">
              <span class="meta-pill" title="结算币种">
                <i class="fa-solid fa-coins"></i>
                {{ store.currency }}
              </span>
              <span v-if="store.knowledge_tag" class="meta-pill" title="知识库标签">
                <i class="fa-solid fa-book-bookmark"></i>
                {{ store.knowledge_tag }}
              </span>
            </div>

            <div class="card-actions">
              <button class="action-btn edit" @click="openEditModal(store)" title="编辑店铺配置">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>编辑</span>
              </button>
              <button
                class="action-btn delete"
                @click="handleDeleteStore(store)"
                :disabled="deletingStoreIds.has(store.id)"
                title="删除店铺"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal Drawer -->
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon">
                <i class="fa-solid fa-store"></i>
              </div>
              <div>
                <h2>{{ isEditing ? '编辑店铺配置' : '新建电商店铺' }}</h2>
                <p class="modal-subtitle">一站式配置店铺基础信息、专属联络渠道（客服邮箱/WhatsApp/IG/LINE）与 AI 智能体</p>
              </div>
            </div>
            <button class="modal-close" @click="showModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Basic Info Section -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fa-solid fa-circle-info"></i>
                <span>1. 店铺基础信息</span>
              </h3>

              <div class="form-grid">
                <div class="form-item full">
                  <label class="form-label required">店铺名称</label>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="如：欧美品牌旗舰店、日本自营美妆站、TikTok UK 小店"
                    class="form-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label required">电商平台类型</label>
                  <select v-model="formData.platform" class="form-select">
                    <option v-for="p in platformList" :key="p.value" :value="p.value">
                      {{ p.label }}
                    </option>
                  </select>
                </div>

                <div class="form-item">
                  <label class="form-label">独立站域名 / 店铺网址（可选）</label>
                  <input
                    v-model="formData.shop_domain"
                    type="text"
                    placeholder="店铺官网地址，如：mybrand.com 或 brand.myshopify.com"
                    class="form-input"
                  />
                </div>

                <div class="form-item">
                  <label class="form-label">主营结算币种</label>
                  <select v-model="formData.currency" class="form-select">
                    <option v-for="c in currencyList" :key="c.code" :value="c.code">
                      {{ c.label }}
                    </option>
                  </select>
                </div>

                <div class="form-item">
                  <label class="form-label">营业主时区</label>
                  <select v-model="formData.timezone" class="form-select">
                    <option v-for="t in timezoneList" :key="t.value" :value="t.value">
                      {{ t.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Dynamic Multi-Channel Section -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fa-solid fa-satellite-dish text-[#C9F24E]"></i>
                <span>2. 配置专属买家联络渠道</span>
              </h3>
              <p class="section-desc">
                选择承接该店铺买家咨询的渠道（默认客服邮箱，也可切换 WhatsApp、Instagram 等）。买家发送消息后系统将自动归集为此店铺并调用专属 AI 答复。
              </p>

              <!-- Channel Type Tabs -->
              <div class="channel-tabs-container">
                <button
                  v-for="ct in channelTypeList"
                  :key="ct.value"
                  type="button"
                  class="channel-tab-pill"
                  :class="channelTypeTab === ct.value ? ct.activeClass : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
                  @click="channelTypeTab = ct.value"
                >
                  <i :class="ct.icon" class="text-base"></i>
                  <span>{{ ct.label }}</span>
                </button>
              </div>

              <!-- Dynamic Inline Channel Form -->
              <div class="channel-form-box mt-3">
                <!-- Email (Default) -->
                <div v-if="channelTypeTab === 'email'" class="space-y-3">
                  <div class="form-grid">
                    <div class="form-item full">
                      <label class="form-label required">专属客服接收邮箱地址</label>
                      <input
                        v-model="storeEmailAddress"
                        type="email"
                        placeholder="如：support@yourstore.com 或 service@brand.com"
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      class="smtp-toggle-btn"
                      @click="showSmtpAdvanced = !showSmtpAdvanced"
                    >
                      <i :class="showSmtpAdvanced ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                      <span>{{ showSmtpAdvanced ? '收起 SMTP 外发服务器配置' : '+ 配置自备 SMTP 发信服务器（选填）' }}</span>
                    </button>

                    <div v-if="showSmtpAdvanced" class="smtp-fields-box mt-2">
                      <div class="form-grid">
                        <div class="form-item">
                          <label class="form-label">SMTP 主机地址</label>
                          <input
                            v-model="smtpHost"
                            type="text"
                            placeholder="如：smtp.sendgrid.net 或 smtp.office365.com"
                            class="form-input"
                          />
                        </div>
                        <div class="form-item">
                          <label class="form-label">SMTP 端口</label>
                          <input
                            v-model="smtpPort"
                            type="text"
                            placeholder="587 或 465"
                            class="form-input"
                          />
                        </div>
                        <div class="form-item">
                          <label class="form-label">SMTP 用户名 / API Key</label>
                          <input
                            v-model="smtpUsername"
                            type="text"
                            placeholder="apikey 或 登录邮箱"
                            class="form-input"
                          />
                        </div>
                        <div class="form-item">
                          <label class="form-label">SMTP 密码 / 密钥</label>
                          <input
                            v-model="smtpPassword"
                            type="password"
                            placeholder="••••••••••••"
                            class="form-input"
                          />
                        </div>
                        <div class="form-item full">
                          <label class="form-label">发件人别名 (选填)</label>
                          <input
                            v-model="fromEmailName"
                            type="text"
                            placeholder="如：Brand Support <support@yourstore.com>"
                            class="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- WhatsApp -->
                <div v-else-if="channelTypeTab === 'whatsapp'" class="form-grid">
                  <div class="form-item full">
                    <label class="form-label required">WhatsApp 商业号码备注 / 专线名称</label>
                    <input
                      v-model="waPhoneNumber"
                      type="text"
                      placeholder="如：美东独立站专属客服 (+1 555-892-3401)"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label required">电话号码 ID (Phone Number ID)</label>
                    <input
                      v-model="waPhoneId"
                      type="text"
                      placeholder="从 Meta 开发者后台复制的数字 ID"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label required">永久访问令牌 (Access Token)</label>
                    <input
                      v-model="waAccessToken"
                      type="password"
                      placeholder="EAAG..."
                      class="form-input"
                    />
                  </div>
                  <div class="form-item full">
                    <label class="form-label">WABA ID 商业账号 ID（选填）</label>
                    <input
                      v-model="waWabaId"
                      type="text"
                      placeholder="选填，用于自动订阅 Webhook"
                      class="form-input"
                    />
                  </div>
                </div>

                <!-- Instagram -->
                <div v-else-if="channelTypeTab === 'instagram'" class="form-grid">
                  <div class="form-item full">
                    <label class="form-label required">Instagram 账号 ID / 主页 ID</label>
                    <input
                      v-model="igId"
                      type="text"
                      placeholder="如：@komi_official_us 或 Instagram 数字 ID"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item full">
                    <label class="form-label required">关联主页访问令牌 (Page Access Token)</label>
                    <input
                      v-model="igAccessToken"
                      type="password"
                      placeholder="EAAG..."
                      class="form-input"
                    />
                  </div>
                </div>

                <!-- LINE -->
                <div v-else-if="channelTypeTab === 'line'" class="form-grid">
                  <div class="form-item">
                    <label class="form-label required">LINE Channel ID</label>
                    <input
                      v-model="lineChannelId"
                      type="text"
                      placeholder="从 LINE Developers 复制 Channel ID"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label required">LINE Channel Secret</label>
                    <input
                      v-model="lineChannelSecret"
                      type="password"
                      placeholder="Channel Secret"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item full">
                    <label class="form-label required">Channel Access Token</label>
                    <input
                      v-model="lineAccessToken"
                      type="password"
                      placeholder="Channel Access Token (Long-lived)"
                      class="form-input"
                    />
                  </div>
                </div>

                <!-- Messenger -->
                <div v-else-if="channelTypeTab === 'messenger'" class="form-grid">
                  <div class="form-item">
                    <label class="form-label required">公共主页 ID (Page ID)</label>
                    <input
                      v-model="messengerPageId"
                      type="text"
                      placeholder="1234567890"
                      class="form-input"
                    />
                  </div>
                  <div class="form-item">
                    <label class="form-label required">主页访问令牌 (Page Access Token)</label>
                    <input
                      v-model="messengerAccessToken"
                      type="password"
                      placeholder="EAAG..."
                      class="form-input"
                    />
                  </div>
                </div>


              </div>
            </div>

            <!-- AI Agent & Knowledge Binding -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fa-solid fa-brain text-[#C9F24E]"></i>
                <span>3. AI 智能体与知识库接管</span>
              </h3>
              <p class="section-desc">
                指定负责该店铺的 AI 客服智能体，自动解答商品规格、查询订单与处理售后咨询。
              </p>

              <div v-if="options.agents.length === 0" class="channel-empty-box">
                <div class="flex items-start gap-2.5">
                  <i class="fa-solid fa-robot text-[#C9F24E] mt-0.5 text-sm"></i>
                  <div>
                    <p class="text-xs font-semibold text-[#C9F24E]">尚未创建任何 AI 智能体</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">创建专属 AI 智能体后可 24/7 全天候自动解答该店铺买家的售后咨询。</p>
                  </div>
                </div>
                <router-link to="/ai-agents" class="channel-jump-btn">
                  前往创建智能体 ➔
                </router-link>
              </div>

              <div v-else class="form-grid">
                <div class="form-item">
                  <label class="form-label">负责 AI 智能体</label>
                  <select v-model="formData.agent_id" class="form-select">
                    <option value="">（不分配 AI，仅人工接待）</option>
                    <option
                      v-for="ag in options.agents"
                      :key="ag.id"
                      :value="ag.id"
                    >
                      {{ ag.display_name || ag.name }} {{ ag.is_active ? '（已启用）' : '（未启用）' }}
                    </option>
                  </select>
                  <div class="field-hint-flex">
                    <router-link to="/ai-agents" class="jump-link">
                      + 管理/创建智能体 ➔
                    </router-link>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-label">专属知识库分组 / 标签</label>
                  <input
                    v-model="formData.knowledge_tag"
                    type="text"
                    placeholder="如：北美站政策、日本售后规则"
                    class="form-input"
                  />
                  <span class="field-hint">AI 优先检索挂载了此标签的知识库文档</span>
                </div>
              </div>
            </div>

            <!-- Status Switch -->
            <div class="form-section">
              <div class="switch-row">
                <div>
                  <span class="switch-title">启用此店铺</span>
                  <p class="switch-desc">停用后将暂停此店铺的会话归集与 AI 自动应答</p>
                </div>
                <label class="toggle-switch">
                  <input v-model="formData.is_active" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showModal = false" :disabled="isSubmitting">
              取消
            </button>
            <button class="btn-save" @click="handleSaveStore" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isSubmitting ? '正在保存...' : isEditing ? '保存修改' : '确认创建店铺' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Webhook Guide Modal -->
      <div v-if="showWebhookModal && activeStoreForWebhook" class="modal-backdrop" @click.self="closeWebhookModal">
        <div class="modal-card !max-w-2xl">
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="modal-icon bg-indigo-50 text-indigo-600">
                <i class="fa-solid fa-satellite-dish"></i>
              </div>
              <div>
                <h2>「{{ activeStoreForWebhook.name }}」专属渠道接入配置</h2>
                <p class="modal-subtitle">绑定渠道：{{ activeStoreForWebhook.channel_display_name || activeStoreForWebhook.email_address || activeStoreForWebhook.name }}</p>
              </div>
            </div>
            <button class="modal-close" @click="closeWebhookModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body space-y-4">
            <div class="webhook-display-box">
              <label class="text-xs font-semibold text-slate-700 block mb-1.5">
                专属 Webhook 回调 URL（安全验证 Token）
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  readonly
                  :value="isLoadingWebhook ? '正在获取安全 Webhook 链接...' : activeWebhookUrl"
                  class="form-input flex-1 !font-mono !text-xs !bg-slate-50 !text-indigo-700 !border-slate-300"
                />
                <button
                  class="copy-btn"
                  :disabled="isLoadingWebhook || !activeWebhookUrl"
                  @click="copyToClipboard(activeWebhookUrl, '专属 Webhook URL')"
                >
                  <i class="fa-solid fa-copy"></i>
                  <span>复制</span>
                </button>
              </div>
              <p class="text-[11.5px] text-slate-500 mt-2">
                提示：复制此完整 URL 粘贴至您的平台 Webhook 设置中，或在配套的 <code class="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">channel_simulator.html</code> 中直接模拟买家发信测试！
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeWebhookModal">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.store-view-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: inherit;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 13.5px;
  color: #64748B;
  margin: 0;
  max-width: 680px;
  line-height: 1.5;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #0F172A;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
}

.create-btn:hover {
  background: #1E293B;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-meta {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12.5px;
  color: #64748B;
  font-weight: 500;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.2;
}

/* Toolbar */
.toolbar-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 420px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 13.5px;
}

.search-input {
  width: 100%;
  padding: 9px 36px 9px 36px;
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 13.5px;
  color: #0F172A;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  background: #FFFFFF;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748B;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.pill-btn.active {
  background: #0F172A;
  border-color: #0F172A;
  color: #FFFFFF;
}

/* Loading & Empty */
.loading-state, .empty-state {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 42px;
  color: #94A3B8;
  margin-bottom: 14px;
}

.empty-state h3 {
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 6px 0;
}

.empty-state p {
  font-size: 13.5px;
  color: #64748B;
  max-width: 460px;
  margin: 0 auto 20px auto;
}

/* Grid & Cards */
.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.store-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.store-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.store-card.inactive {
  opacity: 0.65;
  background: #FAFAFA;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.status-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.status-btn.active {
  background: #ECFDF5;
  color: #059669;
  border-color: #A7F3D0;
}

.status-btn.inactive {
  background: #F1F5F9;
  color: #64748B;
  border-color: #CBD5E1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.store-main {
  margin-bottom: 16px;
}

.store-name {
  font-size: 17px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-domain {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #475569;
}

.store-domain.muted {
  color: #94A3B8;
}

.domain-text {
  font-family: monospace;
  font-size: 12px;
}

.open-link {
  color: #6366F1;
  font-size: 11px;
}

/* Binding section */
.binding-section {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.binding-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.binding-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.binding-title {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
}

.binding-val {
  font-size: 12.5px;
  color: #1E293B;
  display: block;
}

.binding-val.unassigned {
  color: #94A3B8;
  font-style: italic;
}

.quick-bind-btn {
  padding: 1px 6px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: #4F46E5;
  cursor: pointer;
}

.webhook-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.webhook-pill-btn:hover {
  background: #F1F5F9;
  color: #0F172A;
}

/* Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #F1F5F9;
}

.footer-pills {
  display: flex;
  gap: 6px;
}

.meta-pill {
  padding: 3px 8px;
  background: #F1F5F9;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.action-btn.edit {
  background: #F8FAFC;
  border-color: #E2E8F0;
  color: #334155;
}

.action-btn.edit:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.action-btn.delete {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.action-btn.delete:hover {
  background: #FEE2E2;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #F1F5F9;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.modal-title-group h2 {
  font-size: 18px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 2px 0;
}

.modal-subtitle {
  font-size: 12.5px;
  color: #64748B;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-desc {
  font-size: 12px;
  color: #64748B;
  margin: 0 0 14px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: #EF4444;
}

.form-input, .form-select {
  width: 100%;
  padding: 9px 12px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 13px;
  color: #0F172A;
  outline: none;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-hint {
  font-size: 11px;
  color: #64748B;
  margin-top: 4px;
  display: block;
}

.channel-tabs-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.channel-tab-pill {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  border: 1px solid #CBD5E1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.channel-form-box {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 14px;
}

.widget-intro-card {
  padding: 14px;
  background: #F5F3FF;
  border: 1px dashed #DDD6FE;
  border-radius: 8px;
}

.smtp-toggle-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #4F46E5;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.smtp-fields-box {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
}

.jump-link {
  font-size: 11.5px;
  font-weight: 600;
  color: #4F46E5;
  text-decoration: none;
}

.field-hint-flex {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.channel-empty-box {
  background: #FFFFFF;
  border: 1px dashed #CBD5E1;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.channel-jump-btn {
  font-size: 11.5px;
  font-weight: 700;
  color: #4F46E5;
  text-decoration: none;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-title {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
}

.switch-desc {
  font-size: 11.5px;
  color: #64748B;
  margin: 2px 0 0 0;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #CBD5E1;
  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 9999px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

input:checked + .slider {
  background-color: #0F172A;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 9px 16px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  padding: 9px 20px;
  background: #0F172A;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  padding: 8px 14px;
  background: #0F172A;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
