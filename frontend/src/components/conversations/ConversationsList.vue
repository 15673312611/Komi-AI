<!--
Copyright 2024-2026 ChatterMate
左栏：会话导航与卡片列表 (ConversationsList.vue - 原版绿色体系 + 现代清晰背景 + 零发光干净质感)
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
const conversations = ref<InboxConversation[]>([])
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
    channelColor: conv.channel === 'whatsapp' ? 'bg-[#25D366] text-white' : conv.channel === 'email' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-white',
    storeId: storeName,
    storeName,
    storePlatform: conv.channel ? conv.channel[0].toUpperCase() + conv.channel.slice(1) : 'Web',
    platformBadge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    status,
    unreadCount: props.unreadCounts?.[conv.session_id] || 0,
    lastTime: safeTimeString(conv.updated_at),
    lastMessage: conv.last_message || '（无消息内容）',
  }
})
watch(() => [props.conversations, props.unreadCounts] as const, ([items]) => {
  conversations.value = normalizeConversations(items || [])
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
  conversations.value.forEach(conv => {
    if (conv.storeName && conv.storeName !== '未关联店铺') {
      storeNames.add(conv.storeName)
    }
  })

  return [
    { id: 'all', name: '所有关联店铺', iconClass: 'fa-solid fa-store', badge: String(conversations.value.length), color: 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/20' },
    ...[...storeNames].map(name => ({
      id: name,
      name,
      iconClass: 'fa-solid fa-store',
      badge: String(conversations.value.filter(conv => conv.storeId === name || conv.storeName === name).length),
      color: 'text-slate-300 bg-slate-500/10 border border-slate-500/20',
    })),
  ]
})

const selectedStoreObj = computed(() => {
  return stores.value.find((s) => s.id === currentStoreFilter.value) || stores.value[0]
})
watch(stores, value => {
  if (!value.some(store => store.id === currentStoreFilter.value)) currentStoreFilter.value = 'all'
})
const countBy = (status?: string) => status ? conversations.value.filter(c => c.status === status).length : conversations.value.length
const openCount = computed(() => conversations.value.filter(conv => conv.status !== 'closed').length)

const filteredConversations = computed(() => {
  return conversations.value.filter((conv) => {
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
  const target = conversations.value.find((c) => c.id === id)
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
    whatsappAccounts.value = await channelsService.listActiveWhatsAppAccounts()
  } finally {
    loadingWhatsAppAccounts.value = false
    // Wait until the account list is known. NewWhatsAppConversation uses the
    // first account as its initial template source, so mounting it with an
    // empty list would leave the template picker permanently unbound.
    showNewWhatsApp.value = true
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
  <!-- 侧边栏大容器：深邃纯净底色，无任何刺眼发光 -->
  <section class="w-[340px] bg-[#0D111A] border-r border-[#1E2638] flex flex-col shrink-0 relative z-20 select-none h-full shadow-lg">
    
    <!-- 顶部标题栏 -->
    <div class="p-3.5 border-b border-[#1E2638] flex items-center justify-between bg-[#111724]">
      <div class="flex items-center gap-2">
        <h1 class="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
          <span>会话中心</span>
          <span class="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30">
            <span class="font-mono">{{ openCount }}</span> 待办
          </span>
        </h1>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="openNewWhatsApp"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] border border-transparent hover:border-white/10 flex items-center justify-center transition-colors"
          title="发起 WhatsApp 新会话"
          aria-label="发起 WhatsApp 新会话"
        >
          <i class="fa-brands fa-whatsapp text-xs"></i>
        </button>
        <button
          @click="showFolderDrawer = !showFolderDrawer"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] border border-transparent hover:border-white/10 flex items-center justify-center transition-colors"
          title="展开/收起分组视图"
        >
          <i class="fa-solid fa-layer-group text-xs"></i>
        </button>
        <button
          @click="emit('refresh')"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-transparent hover:border-white/10 flex items-center justify-center transition-colors"
          title="刷新列表"
        >
          <i class="fa-solid fa-arrow-rotate-right text-xs"></i>
        </button>
      </div>
    </div>

    <!-- 搜索框 & 店铺筛选器 -->
    <div class="p-3 space-y-2.5 border-b border-[#1E2638] bg-[#0F1420]/80">
      <!-- 搜索框 -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索客户姓名、邮箱或消息..."
          class="w-full bg-[#151C2C] text-xs text-slate-100 placeholder-slate-500 rounded-lg pl-8 pr-9 py-2 border border-[#222E46] focus:border-emerald-500/70 focus:outline-none transition-colors"
        />
        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white/[0.07] px-1.5 py-0.5 rounded font-mono border border-white/[0.06]">⌘K</span>
      </div>

      <!-- 店铺选择器与高级筛选 -->
      <div class="flex items-center gap-2">
      <div class="relative flex-1 min-w-0">
        <button
          @click="showStoreDropdown = !showStoreDropdown"
          class="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#151C2C] hover:bg-[#1A2336] rounded-lg border border-[#222E46] hover:border-slate-600 text-xs text-slate-200 transition-colors"
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
          class="absolute left-0 right-0 top-full mt-1.5 bg-[#161E30] border border-slate-700/80 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            v-for="st in stores"
            :key="st.id"
            @click="selectStore(st.id)"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.08] cursor-pointer text-slate-200 transition-colors"
          >
            <span :class="['w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0', st.color]">
              <i :class="st.iconClass"></i>
            </span>
            <span class="flex-1 font-medium truncate">{{ st.name }}</span>
            <span class="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{{ st.badge }}</span>
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

    <!-- 零滚动 3+2 筛选矩阵 (对齐 workbench_v2.html) -->
    <div class="p-2.5 border-b border-[#1E2638] bg-[#0A0E17]/60 space-y-1.5">
      <!-- 第一行 -->
      <div class="grid grid-cols-3 gap-1.5">
        <button
          @click="selectStatus('all')"
          :class="['matrix-pill', currentFilterTab === 'all' ? 'active-pill-emerald' : '']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-inbox text-[11px]"></i> 全部</span>
          <span class="text-[10px] font-mono px-1 rounded bg-white/10 text-slate-200">{{ countBy() }}</span>
        </button>

        <button
          @click="selectStatus('ai')"
          :class="['matrix-pill', currentFilterTab === 'ai' ? 'active-pill-emerald' : '']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-robot text-[11px] text-emerald-400"></i> AI</span>
          <span class="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">{{ countBy('ai') }}</span>
        </button>

        <button
          @click="selectStatus('mine')"
          :class="['matrix-pill', currentFilterTab === 'mine' ? 'active-pill-blue' : '']"
        >
          <span class="flex items-center gap-1.5 truncate"><i class="fa-solid fa-user-check text-[11px] text-blue-400"></i> 我的</span>
          <span class="text-[10px] font-mono px-1 rounded bg-blue-500/20 text-blue-300">{{ countBy('mine') }}</span>
        </button>
      </div>

      <!-- 第二行 -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          @click="selectStatus('queue')"
          :class="['matrix-pill', currentFilterTab === 'queue' ? 'active-pill-amber' : '']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span class="truncate">待人工接入</span>
          </span>
          <span class="text-[10px] font-mono font-bold px-1.5 rounded bg-amber-500/20 text-amber-300">{{ countBy('queue') }}</span>
        </button>

        <button
          @click="selectStatus('closed')"
          :class="['matrix-pill', currentFilterTab === 'closed' ? 'active-pill-closed' : '']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-lock text-[10px] text-slate-500"></i>
            <span class="truncate">已解决关闭</span>
          </span>
          <span class="text-[10px] font-mono px-1 rounded bg-white/5 text-slate-400">{{ countBy('closed') }}</span>
        </button>
      </div>
    </div>

    <!-- 展开抽屉面板 -->
    <div
      v-if="showFolderDrawer"
      class="p-2 border-b border-[#1E2638] bg-[#141C2E] space-y-1 text-xs animate-in fade-in duration-150"
    >
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
        <span>收件箱全景视图</span>
        <span class="text-emerald-400 font-mono">{{ openCount }} 进行中</span>
      </div>
      <div @click="selectStatus('all')" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-inbox text-emerald-400"></i> 全部实时会话</span>
        <span class="font-mono text-slate-400 font-bold">{{ countBy() }}</span>
      </div>
      <div @click="selectStatus('ai')" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-robot text-emerald-400"></i> AI 智能应答中</span>
        <span class="font-mono text-emerald-400 font-bold">{{ countBy('ai') }}</span>
      </div>
      <div @click="selectStatus('mine')" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-user-check text-blue-400"></i> 分配给我的接待</span>
        <span class="font-mono text-blue-400 font-bold">{{ countBy('mine') }}</span>
      </div>
      <div @click="selectStatus('queue')" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-clock text-amber-400"></i> 待人工接入队列</span>
        <span class="font-mono text-amber-400 font-bold">{{ countBy('queue') }}</span>
      </div>
      <div @click="selectStatus('closed')" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-slate-400"></i> 已解决/历史归档</span>
        <span class="font-mono text-slate-500">{{ countBy('closed') }}</span>
      </div>
    </div>

    <!-- 会话卡片列表容器 (重点：原版绿色、清晰轮廓、零发光) -->
    <div class="flex-1 overflow-y-auto p-2 space-y-2" @scroll="handleConversationScroll">
      <div v-if="props.loading" class="py-14 text-center text-slate-500 text-xs">
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>正在加载会话…
      </div>
      <div v-else-if="props.error" class="py-10 px-4 text-center text-rose-300 text-xs">
        <p>{{ props.error }}</p>
        <button class="mt-3 px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10" @click="emit('refresh')">重试</button>
      </div>
      <div
        v-else v-for="conv in filteredConversations"
        :key="conv.id"
        @click="selectSession(conv.id)"
        :class="[
          'p-3 rounded-xl cursor-pointer relative transition-all duration-150 group',
          activeId === conv.id ? 'clean-card-active' : 'clean-card-default',
        ]"
      >
        <div class="flex items-start gap-3">
          <!-- 头像与渠道徽标 (无发光) -->
          <div class="relative shrink-0 mt-0.5">
            <img
              v-if="conv.avatar"
              :src="conv.avatar"
              :alt="conv.customerName"
              class="w-10 h-10 rounded-xl object-cover border border-white/10"
            />
            <div v-else class="w-10 h-10 rounded-xl border border-white/10 bg-slate-700 text-sm font-bold text-slate-200 flex items-center justify-center">
              {{ conv.initials }}
            </div>
            <span
              :class="[
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] border-2 border-[#161D2B]',
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
            <!-- 姓名、平台、时间 (原版原色) -->
            <div class="flex items-center justify-between leading-none">
              <div class="flex items-center gap-1.5 truncate">
                <span
                  :class="[
                    'font-bold text-xs truncate transition-colors',
                    activeId === conv.id ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-300',
                  ]"
                >
                  {{ conv.customerName }}
                </span>
                <span
                  :class="[
                    'text-[10px] px-1.5 py-0.2 rounded font-medium border truncate',
                    conv.platformBadge,
                  ]"
                >
                  {{ conv.storePlatform }}
                </span>
              </div>
              <span class="text-[11px] text-slate-400 font-mono shrink-0 ml-1">{{ conv.lastTime }}</span>
            </div>

            <!-- 消息摘要 -->
            <p
              :class="[
                'text-xs truncate mt-1 leading-snug transition-colors',
                conv.unreadCount > 0 ? 'text-slate-200 font-semibold' : 'text-slate-400',
              ]"
            >
              {{ conv.lastMessage }}
            </p>

            <!-- 底部状态徽章与未读数 (无发光) -->
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.06]">
              <div>
                <span
                  v-if="conv.status === 'ai'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>AI 处理中
                </span>
                <span
                  v-else-if="conv.status === 'queue'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-md"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>待人工接入
                </span>
                <span
                  v-else-if="conv.status === 'mine'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-md"
                >
                  <i class="fa-solid fa-user-check text-[9px]"></i>人工接管
                </span>
                <span
                  v-else-if="conv.status === 'assigned'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-md"
                >
                  <i class="fa-solid fa-user text-[9px]"></i>其他客服接待
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded-md"
                >
                  <i class="fa-solid fa-lock text-[9px]"></i>已解决关闭
                </span>
              </div>

              <!-- 纯色未读红点 (无发光) -->
              <span
                v-if="conv.unreadCount > 0"
                class="px-2 py-0.2 bg-rose-500 text-white font-black text-[10px] rounded-full"
              >
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- 激活专属原版绿色指示条 (清晰质感，零发光) -->
        <div
          v-if="activeId === conv.id"
          class="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-emerald-400 rounded-r-full"
        ></div>
      </div>

      <div
        v-if="filteredConversations.length === 0"
        class="py-14 text-center text-slate-500 text-xs"
      >
        没有匹配的会话
      </div>
      <button
        v-else-if="hasMore || loadingMore"
        type="button"
        class="w-full py-2 text-center text-[11px] text-slate-400 hover:text-emerald-300 disabled:cursor-wait disabled:opacity-60"
        :disabled="loadingMore"
        @click="requestMore"
      >
        {{ loadingMore ? '正在加载更多会话…' : '加载更多会话' }}
      </button>
    </div>

    <!-- 列表底部状态条 -->
    <div class="p-2.5 border-t border-[#1E2638] bg-[#0E1422] text-[11px] text-slate-400 flex items-center justify-between px-3">
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>会话状态</span>
      </span>
      <span class="text-slate-400 font-mono text-[10px]">{{ openCount }} 进行中</span>
    </div>
  </section>
</template>

<style scoped>
/* 默认未选中卡片：清晰分明的炭曜灰底色 + 明显立体的边框轮廓 (零发光) */
.clean-card-default {
  background: #161D2B;
  border: 1px solid #28344B;
  border-top: 1px solid #364665;
}
.clean-card-default:hover {
  background: #1B2436;
  border-color: #3B4B6E;
  border-top-color: #4D628F;
}

/* 激活选中卡片：原版经典绿意 + 清晰绿色立体轮廓 (零发光) */
.clean-card-active {
  background: #152227;
  border: 1px solid #10b981;
  border-top: 1px solid #34d399;
}

/* 3+2 紧凑胶囊按钮 (清晰轮廓，零发光) */
.matrix-pill {
  padding: 6px 8px;
  border-radius: 8px;
  background: #151C2C;
  border: 1px solid #28344B;
  border-top: 1px solid #364665;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}
.matrix-pill:hover {
  color: #fff;
  background: #1B2436;
  border-color: #3B4B6E;
}
.matrix-pill.active-pill-emerald {
  background: #152227;
  border-color: #10b981;
  color: #34d399;
}
.matrix-pill.active-pill-blue {
  background: #151D2E;
  border-color: #3b82f6;
  color: #60a5fa;
}
.matrix-pill.active-pill-amber {
  background: #241D17;
  border-color: #f59e0b;
  color: #fbbf24;
}
.matrix-pill.active-pill-closed {
  background: #1E2533;
  border-color: #475569;
  color: #f8fafc;
}
</style>
