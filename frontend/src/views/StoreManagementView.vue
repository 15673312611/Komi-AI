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

// Email configuration fields directly inside store modal
const storeEmailAddress = ref('')
const smtpHost = ref('')
const smtpPort = ref('587')
const smtpUsername = ref('')
const smtpPassword = ref('')
const fromEmailName = ref('')
const showSmtpAdvanced = ref(false)

// Webhook helper modal state
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
  email_account_id: string
  agent_id: string
  knowledge_tag: string
  currency: string
  timezone: string
  is_active: boolean
}>({
  name: '',
  platform: 'shopify',
  shop_domain: '',
  email_account_id: '',
  agent_id: '',
  knowledge_tag: '',
  currency: 'USD',
  timezone: 'America/New_York',
  is_active: true,
})

const platformList = [
  { value: 'shopify', label: 'Shopify 独立站', icon: 'fa-brands fa-shopify', color: 'text-emerald-400' },
  { value: 'woocommerce', label: 'WooCommerce', icon: 'fa-brands fa-wordpress', color: 'text-purple-400' },
  { value: 'amazon', label: 'Amazon 亚马逊', icon: 'fa-brands fa-amazon', color: 'text-amber-400' },
  { value: 'tiktok', label: 'TikTok Shop', icon: 'fa-brands fa-tiktok', color: 'text-rose-400' },
  { value: 'email_custom', label: '独立站 / 邮箱定制', icon: 'fa-solid fa-envelope', color: 'text-blue-400' },
  { value: 'other', label: '其它平台', icon: 'fa-solid fa-store', color: 'text-slate-400' },
]

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
      storeService.getOptions()
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
      (store.email_address && store.email_address.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesPlatform =
      selectedPlatformFilter.value === 'all' || store.platform === selectedPlatformFilter.value

    return matchesSearch && matchesPlatform
  })
})

const activeCount = computed(() => stores.value.filter(s => s.is_active).length)
const channelBoundCount = computed(() => stores.value.filter(s => s.email_account_id).length)
const agentBoundCount = computed(() => stores.value.filter(s => s.agent_id).length)

const openCreateModal = () => {
  isEditing.value = false
  currentStoreId.value = null
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
    email_account_id: '',
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
    email_account_id: store.email_account_id || '',
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

  const emailAddr = storeEmailAddress.value.trim().toLowerCase()
  if (!emailAddr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr)) {
    toast.error('请输入此店铺的专属客服接收邮箱 (如: support@yourstore.com)')
    return
  }

  try {
    isSubmitting.value = true

    // 1. Direct inline email creation / update
    const emailPayload: any = {
      inbound_address: emailAddr,
      display_name: emailAddr,
    }
    if (smtpHost.value.trim()) {
      if (!smtpUsername.value.trim() || !smtpPassword.value) {
        toast.error('配置了 SMTP 服务器时，用户名与密码为必填项')
        return
      }
      const smtpPortNumber = Number(smtpPort.value.trim())
      if (!Number.isInteger(smtpPortNumber) || smtpPortNumber < 1 || smtpPortNumber > 65535) {
        toast.error('请输入有效的 SMTP 端口（1-65535）')
        return
      }
      emailPayload.smtp_host = smtpHost.value.trim()
      emailPayload.smtp_port = smtpPortNumber
      emailPayload.smtp_username = smtpUsername.value.trim()
      emailPayload.smtp_password = smtpPassword.value
      if (fromEmailName.value.trim()) {
        emailPayload.from_email = fromEmailName.value.trim()
      }
    }

    // Connect / ensure email channel
    const channelAccount = await channelsService.connectEmail(emailPayload)
    const boundEmailAccountId = channelAccount.id

    const payload: CreateStorePayload = {
      name: formData.value.name.trim(),
      platform: formData.value.platform,
      shop_domain: formData.value.shop_domain.trim() || undefined,
      email_account_id: boundEmailAccountId,
      agent_id: formData.value.agent_id || undefined,
      knowledge_tag: formData.value.knowledge_tag.trim() || undefined,
      currency: formData.value.currency,
      timezone: formData.value.timezone,
      is_active: formData.value.is_active,
    }

    if (isEditing.value && currentStoreId.value) {
      await storeService.updateStore(currentStoreId.value, payload as UpdateStorePayload)
      toast.success('店铺及专属邮箱配置已更新！')
    } else {
      await storeService.createStore(payload)
      toast.success(`店铺创建成功！已绑定专属邮箱 ${emailAddr}`)
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
  if (!confirm(`确定要删除店铺「${store.name}」吗？\n删除后该店铺绑定的邮箱渠道将被解绑。`)) {
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

  try {
    if (store.email_account_id) {
      const url = await channelsService.getEmailWebhookUrl(store.email_account_id)
      if (requestVersion === webhookRequestVersion && activeStoreForWebhook.value?.id === store.id) {
        activeWebhookUrl.value = url
      }
    } else {
      activeWebhookUrl.value = ''
    }
  } catch (err: any) {
    console.error('Failed to get webhook url:', err)
    if (requestVersion === webhookRequestVersion && activeStoreForWebhook.value?.id === store.id) {
      activeWebhookUrl.value = `${window.location.origin}/api/v1/webhooks/email/${store.email_account_id || ''}`
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
  return item || { label: platform, icon: 'fa-solid fa-store', color: 'text-slate-300' }
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
            统一管理您的多平台网店与独立站。直接在店铺中配置专属客服邮箱与 AI 智能体，实现店铺会话物理隔离与自动化应答。
          </p>
        </div>
        <div class="header-actions">
          <button class="create-btn" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            <span>新建店铺</span>
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <i class="fa-solid fa-shop"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">全部店铺</span>
            <span class="stat-value">{{ stores.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-lime-500/10 text-[#C9F24E] border border-lime-500/20">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">运作中店铺</span>
            <span class="stat-value">{{ activeCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <i class="fa-solid fa-envelope"></i>
          </div>
          <div class="stat-meta">
            <span class="stat-label">已绑定专属邮箱</span>
            <span class="stat-value">{{ channelBoundCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper bg-purple-500/10 text-purple-400 border border-purple-500/20">
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
            placeholder="搜索店铺名称、官网域名或专属邮箱..."
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
          您尚未添加任何店铺，点击下方按钮一站式接入您的网店与专属客服邮箱。
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
            <!-- Email Channel Binding -->
            <div class="binding-item">
              <div class="binding-icon text-blue-400 bg-blue-500/10">
                <i class="fa-solid fa-envelope"></i>
              </div>
              <div class="binding-info flex-1">
                <div class="flex items-center justify-between">
                  <span class="binding-title">专属客服邮箱</span>
                  <button
                    v-if="store.email_account_id"
                    class="webhook-pill-btn"
                    @click="openWebhookModal(store)"
                    title="查看该邮箱的收件 Webhook 配置与指引"
                  >
                    <i class="fa-solid fa-satellite-dish"></i>
                    <span>收件配置</span>
                  </button>
                </div>
                <span v-if="store.email_address || store.email_display_name" class="binding-val text-blue-300">
                  {{ store.email_display_name || store.email_address }}
                </span>
                <div v-else class="flex items-center gap-2">
                  <span class="binding-val unassigned">未配置专属邮箱</span>
                  <button class="quick-bind-btn" @click="openEditModal(store)">+ 去配置</button>
                </div>
              </div>
            </div>

            <!-- AI Agent Binding -->
            <div class="binding-item">
              <div class="binding-icon text-[#C9F24E] bg-lime-500/10">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div class="binding-info flex-1">
                <span class="binding-title">负责 AI 智能体</span>
                <span v-if="store.agent_name || store.agent_display_name" class="binding-val text-[#C9F24E]">
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
                <p class="modal-subtitle">直接配置店铺基本信息、专属客服邮箱与负责的 AI 智能体</p>
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
                    placeholder="如：欧美品牌旗舰店、日本自营站、TikTok UK 小店"
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

            <!-- Exclusive Email Direct Config Section -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fa-solid fa-envelope-open-text text-blue-400"></i>
                <span>2. 专属客服邮箱配置（1:1 独立归属）</span>
              </h3>
              <p class="section-desc">
                直接填写该店铺专用的客服邮箱。买家发往此邮箱的所有邮件，系统将精准归集为此店铺并调用专属 AI 答复。
              </p>

              <div class="inline-email-card">
                <div class="form-grid">
                  <div class="form-item full">
                    <label class="form-label required">专属客服接收邮箱地址</label>
                    <input
                      v-model="storeEmailAddress"
                      type="email"
                      placeholder="如：support@yourstore.com 或 service@brand.com"
                      class="form-input"
                    />
                    <span class="field-hint">
                      买家发送咨询邮件的目标邮箱。创建后系统将自动生成该邮箱的专用收件 Webhook URL。
                    </span>
                  </div>
                </div>

                <!-- Toggle SMTP Config -->
                <div class="mt-2">
                  <button
                    type="button"
                    class="smtp-toggle-btn"
                    @click="showSmtpAdvanced = !showSmtpAdvanced"
                  >
                    <i :class="showSmtpAdvanced ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                    <span>{{ showSmtpAdvanced ? '收起 SMTP 外发服务器配置' : '+ 配置自备 SMTP 发信服务器（选填，留空默认使用系统外发）' }}</span>
                  </button>

                  <div v-if="showSmtpAdvanced" class="smtp-fields-box">
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
              <div class="modal-icon bg-blue-500/10 text-blue-400">
                <i class="fa-solid fa-satellite-dish"></i>
              </div>
              <div>
                <h2>「{{ activeStoreForWebhook.name }}」专属收件 Webhook 配置</h2>
                <p class="modal-subtitle">专属客服邮箱：{{ activeStoreForWebhook.email_address || activeStoreForWebhook.email_display_name }}</p>
              </div>
            </div>
            <button class="modal-close" @click="closeWebhookModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body space-y-4">
            <div class="webhook-display-box">
              <label class="text-xs font-semibold text-slate-300 block mb-1.5">
                专属 HTTP Webhook 收件回调 URL（包含完整安全验证 Token）
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  readonly
                  :value="isLoadingWebhook ? '正在获取安全 Webhook 链接...' : activeWebhookUrl"
                  class="form-input flex-1 !font-mono !text-xs !bg-slate-900 !text-lime-400"
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
              <p class="text-[11.5px] text-slate-400 mt-2">
                提示：复制此完整 URL 粘贴至您的邮件服务商收件回调中，或粘贴到系统配套的 <code class="text-blue-300">email_tester.html</code> 中即可直接模拟买家发信测试！
              </p>
            </div>

            <div class="guide-steps-card">
              <h4 class="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <i class="fa-solid fa-lightbulb text-amber-400"></i>
                <span>如何配置邮件自动入站转发？（支持主流服务商）</span>
              </h4>
              <ul class="text-xs text-slate-400 space-y-2.5 leading-relaxed pl-4 list-disc">
                <li>
                  <strong class="text-slate-200">本地与仿真测试（最快）</strong>：直接打开项目根目录下的 <code class="text-lime-300">email_tester.html</code>，在顶部粘贴上述完整 Webhook URL，点击【发送邮件】即可在会话收件箱中看到 AI 智能体的秒级响应！
                </li>
                <li>
                  <strong class="text-slate-200">Cloudflare Email Routing（完全免费）</strong>：在 Cloudflare 域名控制台开启 Email Routing，将 <code class="text-blue-300">{{ activeStoreForWebhook.email_address }}</code> 绑定至 Cloudflare Worker 并转发至上方 Webhook。
                </li>
                <li>
                  <strong class="text-slate-200">SendGrid Inbound Parse</strong>：在 SendGrid 添加 Host & Inbound Parse Webhook，填入上方 URL。
                </li>
                <li>
                  <strong class="text-slate-200">Mailgun Routes / Postmark</strong>：在 Routes 中配置 Forward to HTTP endpoint 并填入上方 URL。
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-save" @click="closeWebhookModal">
              完成并关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.store-view-container {
  padding: 24px 32px;
  max-width: 1440px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
  color: var(--text, #F5F6F8);
}

/* Header */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(201, 242, 78, 0.12);
  border: 1px solid rgba(201, 242, 78, 0.25);
  color: var(--accent-ink, #C9F24E);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 13.5px;
  color: var(--muted, #94A3B8);
  max-width: 720px;
  line-height: 1.6;
  margin: 0;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-ink, #C9F24E);
  color: #0b0f14;
  font-weight: 700;
  font-size: 13.5px;
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(201, 242, 78, 0.2);
}

.create-btn:hover {
  background: #d8fa67;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(201, 242, 78, 0.35);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg2, #131922);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-meta {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: var(--muted, #94A3B8);
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

/* Search & Toolbar */
.toolbar-card {
  background: var(--bg2, #131922);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted, #64748B);
  font-size: 14px;
}

.search-input {
  width: 100%;
  background: var(--bg1, #0B0F14);
  border: 1px solid var(--o12, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  padding: 10px 38px;
  font-size: 13.5px;
  color: #fff;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-ink, #C9F24E);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--muted, #64748B);
  cursor: pointer;
  padding: 4px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 12.5px;
  color: var(--muted, #94A3B8);
  font-weight: 500;
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg1, #0B0F14);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  color: var(--muted, #94A3B8);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
}

.pill-btn.active {
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink, #C9F24E);
  border-color: rgba(201, 242, 78, 0.35);
  font-weight: 600;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  background: var(--bg2, #131922);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(201, 242, 78, 0.2);
  border-top-color: var(--accent-ink, #C9F24E);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--muted, #64748B);
  margin-bottom: 6px;
}

.empty-state h3 {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.empty-state p {
  font-size: 13.5px;
  color: var(--muted, #94A3B8);
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
}

/* Stores Grid */
.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.store-card {
  background: var(--bg2, #131922);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.store-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
}

.store-card.inactive {
  opacity: 0.7;
  border-color: rgba(255, 255, 255, 0.04);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s;
}

.status-btn .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-btn.active {
  color: #34D399;
  border-color: rgba(52, 211, 153, 0.3);
  background: rgba(52, 211, 153, 0.08);
}

.status-btn.active .status-dot {
  background: #34D399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.8);
}

.status-btn.inactive {
  color: #94A3B8;
  border-color: rgba(148, 163, 184, 0.2);
  background: rgba(148, 163, 184, 0.05);
}

.status-btn.inactive .status-dot {
  background: #94A3B8;
}

.store-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.store-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-domain {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #38BDF8;
}

.store-domain.muted {
  color: #64748B;
}

.domain-text {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.open-link {
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.open-link:hover {
  opacity: 1;
}

/* Bindings Section */
.binding-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg1, #0B0F14);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  padding: 12px;
}

.binding-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.binding-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.binding-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.binding-title {
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
}

.binding-val {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.binding-val.unassigned {
  color: #64748B;
  font-weight: 400;
}

.quick-bind-btn {
  background: transparent;
  border: none;
  color: var(--accent-ink, #C9F24E);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.quick-bind-btn:hover {
  text-decoration: underline;
}

.webhook-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38BDF8;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.webhook-pill-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38BDF8;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--o08, rgba(255, 255, 255, 0.06));
  padding-top: 12px;
  margin-top: auto;
}

.footer-pills {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--muted, #94A3B8);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 7px;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  color: var(--muted, #94A3B8);
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
  border-color: rgba(239, 68, 68, 0.3);
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.modal-card {
  background: var(--bg2, #131922);
  border: 1px solid var(--o12, rgba(255, 255, 255, 0.12));
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  animation: modalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink, #C9F24E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-subtitle {
  font-size: 12.5px;
  color: var(--muted, #94A3B8);
  margin: 2px 0 0 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--muted, #64748B);
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s;
}

.modal-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Styles */
.form-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.section-desc {
  font-size: 12px;
  color: var(--muted, #94A3B8);
  margin: 0 0 14px 0;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full {
  grid-column: span 2;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #CBD5E1;
}

.form-label.required::after {
  content: ' *';
  color: #F87171;
}

.form-input, .form-select {
  background: var(--bg1, #0B0F14);
  border: 1px solid var(--o12, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  color: #fff;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--accent-ink, #C9F24E);
  box-shadow: 0 0 0 2px rgba(201, 242, 78, 0.15);
}

.field-hint {
  font-size: 11px;
  color: var(--muted, #64748B);
  line-height: 1.4;
}

.field-hint-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--muted, #64748B);
  margin-top: 4px;
}

.jump-link {
  color: var(--accent-ink, #C9F24E);
  text-decoration: none;
  font-weight: 500;
}

.jump-link:hover {
  text-decoration: underline;
}

/* Email Card */
.inline-email-card {
  background: var(--bg1, #0B0F14);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.smtp-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #38BDF8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.smtp-toggle-btn:hover {
  text-decoration: underline;
}

.smtp-fields-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 14px;
  margin-top: 10px;
}

/* Channel Empty Box */
.channel-empty-box {
  background: rgba(245, 158, 11, 0.06);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.channel-jump-btn {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #FCD34D;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.15s;
}

.channel-jump-btn:hover {
  background: rgba(245, 158, 11, 0.25);
  border-color: #FCD34D;
}

/* Switch */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg1, #0B0F14);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
}

.switch-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #fff;
}

.switch-desc {
  font-size: 11.5px;
  color: var(--muted, #64748B);
  margin: 2px 0 0 0;
}

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
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #334155;
  transition: .2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10B981;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Buttons */
.btn-cancel {
  background: transparent;
  border: 1px solid var(--o12, rgba(255, 255, 255, 0.12));
  color: var(--muted, #94A3B8);
  font-size: 13px;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-ink, #C9F24E);
  color: #0b0f14;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save:hover {
  background: #d8fa67;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Webhook Modal Display */
.webhook-display-box {
  background: var(--bg1, #0B0F14);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 14px;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(201, 242, 78, 0.15);
  border: 1px solid rgba(201, 242, 78, 0.35);
  color: var(--accent-ink, #C9F24E);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: var(--accent-ink, #C9F24E);
  color: #0b0f14;
}

.guide-steps-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--o08, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  padding: 16px;
}
</style>
