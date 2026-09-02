<!--
Copyright 2024-2026 Komi AI
左栏：会话导航与卡片列表 (ConversationsList.vue - 现代高定多维色彩体系)
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Conversation } from '@/types/chat'
import { userService } from '@/services/user'
import channelsService, { type ChannelAccount } from '@/services/channels'
import storeService, { type Store } from '@/services/store'
import ConversationFilters, { type FilterValues } from '@/components/conversations/ConversationFilters.vue'
import NewWhatsAppConversation from '@/components/conversations/NewWhatsAppConversation.vue'

const props = withDefaults(defineProps<{
  activeSessionId?: string | null
  conversations?: Conversation[]
  unreadCounts?: Record<string, number>
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  error?: string
  showFilters?: boolean
  filterValues?: FilterValues
  filterUsers?: Array<{ id: string; full_name: string | null; email: string; profile_pic?: string | null; is_online?: boolean }>
  filterAgents?: Array<{ id: string; name: string; display_name: string | null }>
  loadingFilterUsers?: boolean
  loadingFilterAgents?: boolean
}>(), { activeSessionId: null, conversations: () => [], unreadCounts: () => ({}), loading: false, loadingMore: false, hasMore: false, error: '' })

const emit = defineEmits<{
  (e: 'select-session', sessionId: string): void
  (e: 'clear-unread', sessionId: string): void
  (e: 'refresh'): void
  (e: 'load-more'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
  (e: 'toggle-filters'): void
  (e: 'apply-filters', filters: FilterValues): void
  (e: 'clear-filters'): void
  (e: 'update-filter-values', filters: FilterValues): void
  (e: 'new-conversation-started', sessionId: string): void
}>()

const currentFilterTab = ref<'all' | 'ai' | 'mine' | 'queue' | 'closed'>('all')
const currentStoreFilter = ref('all')
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const showStoreDropdown = ref(false)
const showFolderDrawer = ref(false)
const activeId = ref(props.activeSessionId || '')
const showNewWhatsApp = ref(false)
const whatsappAccounts = ref<ChannelAccount[]>([])
const loadingWhatsAppAccounts = ref(false)
watch(() => props.activeSessionId, value => { activeId.value = value || '' })

type InboxStatus = 'ai' | 'mine' | 'assigned' | 'queue' | 'closed'
interface InboxConversation {
  id: string
  customerName: string
  initials: string
  avatar?: string
  email: string
  channel: string
  channelColor: string
  storeId: string
  storeName: string
  storePlatform: string
  platformBadge: string
  status: InboxStatus
  unreadCount: number
  lastTime: string
  lastMessage: string
}

const currentUserId = userService.getUserId()
const inboxConversations = ref<InboxConversation[]>([])
const statusFor = (conv: Conversation): InboxStatus => {
  if (conv.status === 'closed') return 'closed'
  if (conv.user_id && String(conv.user_id) === String(currentUserId)) return 'mine'
  if (conv.user_id) return 'assigned'
  return conv.status === 'transferred' || conv.ai_auto_reply === false || conv.agent?.ai_replies_enabled === false ? 'queue' : 'ai'
}
const safeTimeString = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const normalizeConversations = (items: Conversation[]) => items.map(conv => {
  const meta = conv.customer?.meta_data || {}
  const storeName = typeof meta.store_name === 'string' && meta.store_name.trim() ? meta.store_name.trim() : '未关联店铺'
  const customerName = conv.customer?.full_name || conv.customer?.email || '未知客户'
  const status = statusFor(conv)
  return {
    id: conv.session_id,
    customerName,
    initials: customerName.trim().slice(0, 1).toUpperCase() || '?',
    avatar: typeof meta.avatar_url === 'string' && meta.avatar_url ? meta.avatar_url : undefined,
    email: conv.customer?.email || '',
    channel: conv.channel || 'web',
    channelColor: conv.channel === 'whatsapp' ? 'bg-[#25D366] text-white' : conv.channel === 'email' ? 'bg-blue-500 text-white' : 'bg-indigo-600 text-white',
    storeId: storeName,
    storeName,
    storePlatform: conv.channel ? conv.channel[0].toUpperCase() + conv.channel.slice(1) : 'Web',
    platformBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status,
    unreadCount: props.unreadCounts?.[conv.session_id] || 0,
    lastTime: safeTimeString(conv.updated_at),
    lastMessage: conv.last_message || '（无消息内容）',
  }
})
watch(() => [props.conversations, props.unreadCounts] as const, ([items]) => {
  inboxConversations.value = normalizeConversations(items || [])
}, { immediate: true, deep: true })

const dbStores = ref<Store[]>([])
const loadDbStores = async () => {
  try {
    dbStores.value = await storeService.getStores()
  } catch (err) {
    console.error('Failed to load stores for inbox:', err)
  }
}

const stores = computed(() => {
  const storeNames = new Set<string>()
  dbStores.value.forEach(s => {
    if (s.name) storeNames.add(s.name)
  })
  inboxConversations.value.forEach(conv => {
    if (conv.storeName && conv.storeName !== '未关联店铺') {
      storeNames.add(conv.storeName)
    }
  })

  return [
    { id: 'all', name: '所有关联店铺', iconClass: 'fa-solid fa-store', badge: String(inboxConversations.value.length), color: 'text-indigo-600 bg-indigo-50 border border-indigo-200' },
    ...[...storeNames].map(name => ({
      id: name,
      name,
      iconClass: 'fa-solid fa-store',
      badge: String(inboxConversations.value.filter(conv => conv.storeId === name || conv.storeName === name).length),
      color: 'text-slate-600 bg-slate-100 border border-slate-200',
    })),
  ]
})

const selectedStoreObj = computed(() => {
  return stores.value.find((s) => s.id === currentStoreFilter.value) || stores.value[0]
})
watch(stores, value => {
  if (!value.some(store => store.id === currentStoreFilter.value)) currentStoreFilter.value = 'all'
})
const countBy = (status?: string) => status ? inboxConversations.value.filter(c => c.status === status).length : inboxConversations.value.length
const openCount = computed(() => inboxConversations.value.filter(conv => conv.status !== 'closed').length)

const filteredConversations = computed(() => {
  return inboxConversations.value.filter((conv) => {
    if (currentFilterTab.value === 'ai' && conv.status !== 'ai') return false
    if (currentFilterTab.value === 'mine' && conv.status !== 'mine') return false
    if (currentFilterTab.value === 'queue' && conv.status !== 'queue') return false
    if (currentFilterTab.value === 'closed' && conv.status !== 'closed') return false
    if (currentStoreFilter.value !== 'all' && conv.storeId !== currentStoreFilter.value) return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchName = conv.customerName.toLowerCase().includes(q)
      const matchEmail = conv.email.toLowerCase().includes(q)
      const matchMsg = conv.lastMessage.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchMsg) return false
    }

    return true
  })
})

const selectStatus = (status: 'all' | 'ai' | 'mine' | 'queue' | 'closed') => { currentFilterTab.value = status }

const selectSession = (id: string) => {
  activeId.value = id
  const target = inboxConversations.value.find((c) => c.id === id)
  if (target) target.unreadCount = 0
  emit('clear-unread', id)
  emit('select-session', id)
}

const selectStore = (id: string) => {
  currentStoreFilter.value = id
  showStoreDropdown.value = false
  emit('action-toast', `已筛选: ${selectedStoreObj.value.name}`, 'info')
}

const openNewWhatsApp = async () => {
  if (whatsappAccounts.value.length) {
    showNewWhatsApp.value = true
    return
  }
  if (loadingWhatsAppAccounts.value) return
  loadingWhatsAppAccounts.value = true
  try {
    const accounts = await channelsService.listActiveWhatsAppAccounts()
    whatsappAccounts.value = Array.isArray(accounts) ? accounts : []
    if (!whatsappAccounts.value.length) {
      emit('action-toast', '尚未配置可用的 WhatsApp 发送账号，请先完成渠道集成。', 'error')
      return
    }
    showNewWhatsApp.value = true
  } catch (err: any) {
    emit('action-toast', err?.response?.data?.detail || '无法加载 WhatsApp 发送账号，请稍后重试。', 'error')
  } finally {
    loadingWhatsAppAccounts.value = false
  }
}

const handleWhatsAppStarted = (sessionId: string) => {
  showNewWhatsApp.value = false
  emit('new-conversation-started', sessionId)
}

const requestMore = () => {
  if (!props.loading && !props.loadingMore && props.hasMore) emit('load-more')
}

const handleConversationScroll = (event: Event) => {
  const element = event.target as HTMLElement
  if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) requestMore()
}

const focusSearch = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', focusSearch)
  loadDbStores()
})
onBeforeUnmount(() => window.removeEventListener('keydown', focusSearch))
</script>

<template>
  <section class="w-[330px] bg-[#FFFFFF] border-r border-slate-200/80 flex flex-col shrink-0 relative z-20 select-none h-full shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
    
    <!-- 顶部标题栏 -->
    <div class="p-3.5 border-b border-slate-100 flex items-center justify-between bg-[#FFFFFF]">
      <div class="flex items-center gap-2">
        <h1 class="text-sm font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
          <span>会话中心</span>
          <span class="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/70 shadow-sm">
            <span class="font-mono">{{ openCount }}</span> 待办
          </span>
        </h1>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="openNewWhatsApp"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors"
          title="发起 WhatsApp 新会话"
          aria-label="发起 WhatsApp 新会话"
        >
          <i class="fa-brands fa-whatsapp text-xs"></i>
        </button>
        <button
          @click="showFolderDrawer = !showFolderDrawer"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
          title="展开/收起分组视图"
        >
          <i class="fa-solid fa-layer-group text-xs"></i>
        </button>
        <button
          @click="emit('refresh')"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
          title="刷新列表"
        >
          <i class="fa-solid fa-arrow-rotate-right text-xs"></i>
        </button>
      </div>
    </div>

    <!-- 搜索框 & 店铺筛选器 -->
    <div class="p-3 space-y-2 border-b border-slate-100 bg-[#FAFAFC]">
      <!-- 搜索框 -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索客户姓名、邮箱或消息..."
          class="w-full bg-[#FFFFFF] text-xs text-[#0F172A] placeholder-slate-400 rounded-lg pl-8 pr-9 py-2 border border-slate-200/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-sm"
        />
        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono border border-slate-200">⌘K</span>
      </div>

      <!-- 店铺选择器与高级筛选 -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 min-w-0">
          <button
            @click="showStoreDropdown = !showStoreDropdown"
            class="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-[#0F172A] transition-colors shadow-sm"
          >
            <div class="flex items-center gap-2 truncate">
              <span :class="['w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0', selectedStoreObj.color]">
                <i :class="selectedStoreObj.iconClass"></i>
              </span>
              <span class="font-medium truncate text-xs">{{ selectedStoreObj.name }}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
          </button>

          <!-- 下拉菜单 -->
          <div
            v-if="showStoreDropdown"
            class="absolute left-0 right-0 top-full mt-1 bg-[#FFFFFF] border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1"
          >
            <div
              v-for="st in stores"
              :key="st.id"
              @click="selectStore(st.id)"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-[#0F172A] transition-colors"
            >
              <span :class="['w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0', st.color]">
                <i :class="st.iconClass"></i>
              </span>
              <span class="flex-1 font-medium truncate">{{ st.name }}</span>
              <span class="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-100">{{ st.badge }}</span>
            </div>
          </div>
        </div>

        <ConversationFilters
          :show-filters="props.showFilters || false"
          :filter-values="props.filterValues || { customerEmailFilter: '', agentFilter: '', userFilter: '', dateFromFilter: '', dateToFilter: '' }"
          :users="props.filterUsers || []"
          :agents="props.filterAgents || []"
          :loading-users="props.loadingFilterUsers"
          :loading-agents="props.loadingFilterAgents"
          @toggle="emit('toggle-filters')"
          @apply="emit('apply-filters', $event)"
          @clear="emit('clear-filters')"
          @update:filter-values="emit('update-filter-values', $event)"
        />
      </div>
    </div>

    <NewWhatsAppConversation
      v-if="showNewWhatsApp"
      :accounts="whatsappAccounts"
      @close="showNewWhatsApp = false"
      @started="handleWhatsAppStarted"
    />

    <!-- 筛选状态矩阵胶囊 -->
    <div class="p-2.5 border-b border-slate-100 bg-[#FAFAFC] space-y-1.5">
      <div class="grid grid-cols-3 gap-1.5">
        <button
          @click="selectStatus('all')"
          :class="['matrix-pill', currentFilterTab === 'all' ? 'active-all' : '']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-inbox text-[11px] text-slate-500"></i> 全部</span>
          <span class="pill-count">{{ countBy() }}</span>
        </button>

        <button
          @click="selectStatus('ai')"
          :class="['matrix-pill', currentFilterTab === 'ai' ? 'active-ai' : 'bg-emerald-50/50 text-emerald-800 border-emerald-200/70']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-robot text-[11px] text-emerald-600"></i> AI</span>
          <span class="pill-count bg-emerald-100 text-emerald-800">{{ countBy('ai') }}</span>
        </button>

        <button
          @click="selectStatus('mine')"
          :class="['matrix-pill', currentFilterTab === 'mine' ? 'active-mine' : 'bg-blue-50/50 text-blue-800 border-blue-200/70']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-user-check text-[11px] text-blue-600"></i> 我的</span>
          <span class="pill-count bg-blue-100 text-blue-800">{{ countBy('mine') }}</span>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-1.5">
        <button
          @click="selectStatus('queue')"
          :class="['matrix-pill', currentFilterTab === 'queue' ? 'active-queue' : 'bg-amber-50/50 text-amber-800 border-amber-200/70']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span class="truncate">待人工接入</span>
          </span>
          <span class="pill-count bg-amber-100 text-amber-800">{{ countBy('queue') }}</span>
        </button>

        <button
          @click="selectStatus('closed')"
          :class="['matrix-pill', currentFilterTab === 'closed' ? 'active-closed' : '']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-lock text-[10px] text-slate-400"></i>
            <span class="truncate">已关闭</span>
          </span>
          <span class="pill-count">{{ countBy('closed') }}</span>
        </button>
      </div>
    </div>

    <!-- 会话卡片列表容器 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#F8FAFC]" @scroll="handleConversationScroll">
      <div v-if="props.loading" class="py-14 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-spinner fa-spin mr-2 text-indigo-500"></i>正在加载会话…
      </div>
      <div v-else-if="props.error" class="py-10 px-4 text-center text-rose-500 text-xs">
        <p>{{ props.error }}</p>
        <button class="mt-3 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-medium" @click="emit('refresh')">重试</button>
      </div>
      <div
        v-else v-for="conv in filteredConversations"
        :key="conv.id"
        @click="selectSession(conv.id)"
        :class="[
          'p-3 rounded-xl cursor-pointer relative transition-all duration-150 group',
          activeId === conv.id ? 'conv-card-active' : 'conv-card-default',
        ]"
      >
        <div class="flex items-start gap-2.5">
          <!-- 头像与渠道徽标 -->
          <div class="relative shrink-0 mt-0.5">
            <img
              v-if="conv.avatar"
              :src="conv.avatar"
              :alt="conv.customerName"
              class="w-9 h-9 rounded-full object-cover border border-indigo-200"
            />
            <div v-else class="w-9 h-9 rounded-full border border-indigo-200 bg-gradient-to-tr from-indigo-100 to-purple-100 text-xs font-bold text-indigo-700 flex items-center justify-center shadow-sm">
              {{ conv.initials }}
            </div>
            <span
              :class="[
                'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-sm',
                conv.channelColor,
              ]"
            >
              <i v-if="conv.channel === 'whatsapp'" class="fa-brands fa-whatsapp"></i>
              <i v-else-if="conv.channel === 'email'" class="fa-regular fa-envelope"></i>
              <i v-else-if="conv.channel === 'shopify'" class="fa-brands fa-shopify"></i>
              <i v-else-if="conv.channel === 'amazon'" class="fa-brands fa-amazon"></i>
              <i v-else-if="conv.channel === 'tiktok'" class="fa-brands fa-tiktok"></i>
              <i v-else-if="conv.channel === 'telegram'" class="fa-brands fa-telegram"></i>
              <i v-else-if="conv.channel === 'instagram'" class="fa-brands fa-instagram"></i>
              <i v-else class="fa-solid fa-comments"></i>
            </span>
          </div>

          <!-- 卡片主体信息 -->
          <div class="flex-1 min-w-0">
            <!-- 姓名、平台、时间 -->
            <div class="flex items-center justify-between leading-tight">
              <div class="flex items-center gap-1.5 truncate">
                <span
                  class="font-bold text-xs truncate text-[#0F172A]"
                >
                  {{ conv.customerName }}
                </span>
                <span
                  class="text-[9.5px] px-1.5 py-0.2 rounded font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate"
                >
                  {{ conv.storePlatform }}
                </span>
              </div>
              <span class="text-[10.5px] text-slate-400 font-mono shrink-0 ml-1">{{ conv.lastTime }}</span>
            </div>

            <!-- 消息摘要 -->
            <p
              :class="[
                'text-[11.5px] truncate mt-1 leading-snug transition-colors',
                conv.unreadCount > 0 ? 'text-indigo-900 font-bold' : 'text-slate-500',
              ]"
            >
              {{ conv.lastMessage }}
            </p>

            <!-- 底部状态徽章与未读数 -->
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
              <div>
                <span
                  v-if="conv.status === 'ai'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>AI 处理中
                </span>
                <span
                  v-else-if="conv.status === 'queue'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>待人工接入
                </span>
                <span
                  v-else-if="conv.status === 'mine'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md"
                >
                  <i class="fa-solid fa-user-check text-[8px]"></i>人工接管
                </span>
                <span
                  v-else-if="conv.status === 'assigned'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md"
                >
                  <i class="fa-solid fa-user text-[8px]"></i>团队接待
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 rounded-md"
                >
                  <i class="fa-solid fa-lock text-[8px]"></i>已关闭
                </span>
              </div>

              <!-- 未读红点 -->
              <span
                v-if="conv.unreadCount > 0"
                class="px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[9px] rounded-full shadow-sm"
              >
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- 激活专属高光指示条 -->
        <div
          v-if="activeId === conv.id"
          class="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] bg-indigo-600 rounded-r-full shadow-sm"
        ></div>
      </div>

      <div
        v-if="filteredConversations.length === 0"
        class="py-14 text-center text-slate-400 text-xs"
      >
        没有匹配的会话
      </div>
      <button
        v-else-if="hasMore || loadingMore"
        type="button"
        class="w-full py-2 text-center text-[11px] text-indigo-600 hover:text-indigo-800 disabled:cursor-wait disabled:opacity-60 font-semibold"
        :disabled="loadingMore"
        @click="requestMore"
      >
        {{ loadingMore ? '正在加载更多会话…' : '加载更多会话' }}
      </button>
    </div>

    <!-- 列表底部状态条 -->
    <div class="p-2.5 border-t border-slate-100 bg-[#FFFFFF] text-[11px] text-slate-500 flex items-center justify-between px-3">
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span class="font-medium text-slate-700">会话中心</span>
      </span>
      <span class="text-indigo-600 font-mono text-[10px] font-bold">{{ openCount }} 进行中</span>
    </div>
  </section>
</template>

<style scoped>
/* 默认未选中卡片 */
.conv-card-default {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.conv-card-default:hover {
  background: #FFFFFF;
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.06);
}

/* 激活选中卡片 */
.conv-card-active {
  background: linear-gradient(90deg, rgba(238, 242, 255, 0.7) 0%, #FFFFFF 100%);
  border: 1.5px solid #6366F1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
}

/* 状态矩阵胶囊按钮 */
.matrix-pill {
  padding: 5px 8px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 600;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}
.matrix-pill:hover {
  color: #0F172A;
  transform: translateY(-0.5px);
}

.pill-count {
  font-size: 10px;
  font-family: monospace;
  padding: 1px 4px;
  border-radius: 4px;
  background: #F1F5F9;
  color: #475569;
}

.active-all {
  background: #0F172A !important;
  border-color: #0F172A !important;
  color: #FFFFFF !important;
}
.active-all .pill-count {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}
.active-all i {
  color: #FFFFFF !important;
}

.active-ai {
  background: #059669 !important;
  border-color: #059669 !important;
  color: #FFFFFF !important;
}
.active-ai .pill-count {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}
.active-ai i {
  color: #FFFFFF !important;
}

.active-mine {
  background: #2563EB !important;
  border-color: #2563EB !important;
  color: #FFFFFF !important;
}
.active-mine .pill-count {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}
.active-mine i {
  color: #FFFFFF !important;
}

.active-queue {
  background: #D97706 !important;
  border-color: #D97706 !important;
  color: #FFFFFF !important;
}
.active-queue .pill-count {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}
.active-queue span {
  color: #FFFFFF !important;
}

.active-closed {
  background: #475569 !important;
  border-color: #475569 !important;
  color: #FFFFFF !important;
}
.active-closed .pill-count {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}
.active-closed i {
  color: #FFFFFF !important;
}
</style>
