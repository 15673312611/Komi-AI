<!--
Copyright 2024-2026 ChatterMate
左栏：会话导航与 3+2 零滚动状态矩阵 (ConversationsList.vue - 极曜蓝紫新美化配色)
-->

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  activeSessionId?: string
}>()

const emit = defineEmits<{
  (e: 'select-session', sessionId: string): void
  (e: 'refresh'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const currentFilterTab = ref<'all' | 'ai' | 'mine' | 'queue' | 'closed'>('all')
const currentStoreFilter = ref('all')
const searchQuery = ref('')
const showStoreDropdown = ref(false)
const showFolderDrawer = ref(false)
const activeId = ref(props.activeSessionId || 'conv-1')

// 多渠道跨境模拟会话列表
const conversations = ref([
  {
    id: 'conv-1',
    customerName: 'Jessica Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    email: 'jessica.m@outlook.com',
    channel: 'whatsapp',
    channelColor: 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    storeId: 'shopify_us',
    storeName: 'SHE-GLOW 美东站',
    storePlatform: 'Shopify',
    platformBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    status: 'ai',
    statusText: 'AI 处理中',
    unreadCount: 2,
    lastTime: '14:25',
    lastMessage: 'Can you confirm if DHL will deliver my dress before Friday evening?',
  },
  {
    id: 'conv-2',
    customerName: 'Liam Smith',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    email: 'liam.tech@gmail.com',
    channel: 'email',
    channelColor: 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    storeId: 'amazon_uk',
    storeName: 'CYBER-TECH 旗舰店',
    storePlatform: 'Amazon',
    platformBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    status: 'queue',
    statusText: '排队待接入',
    unreadCount: 1,
    lastTime: '14:18',
    lastMessage: 'The ANC wireless headphone has a crack on the right hinge. Requesting refund.',
  },
  {
    id: 'conv-3',
    customerName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    email: 'elena.r@tiktok.com',
    channel: 'tiktok',
    channelColor: 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    storeId: 'tiktok_sea',
    storeName: 'AURA 美妆东南亚',
    storePlatform: 'TikTok',
    platformBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    status: 'mine',
    statusText: '人工接管 · Alex',
    unreadCount: 0,
    lastTime: '13:50',
    lastMessage: 'Is this peptide glow serum safe for sensitive acne-prone skin?',
  },
  {
    id: 'conv-4',
    customerName: 'Maximilian Weber',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    email: 'm.weber@berlin-design.de',
    channel: 'telegram',
    channelColor: 'bg-sky-500 text-white shadow-[0_0_8px_rgba(14,165,233,0.5)]',
    storeId: 'shopify_us',
    storeName: 'SHE-GLOW 独立站',
    storePlatform: 'Shopify',
    platformBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    status: 'mine',
    statusText: '人工接管 · Sarah',
    unreadCount: 0,
    lastTime: '12:10',
    lastMessage: 'We want to place an order of 500 units for our boutique store in Munich.',
  },
  {
    id: 'conv-5',
    customerName: 'Chloe Dupont',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    email: 'chloe.dupont@paris.fr',
    channel: 'instagram',
    channelColor: 'bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]',
    storeId: 'shopify_us',
    storeName: 'SHE-GLOW 独立站',
    storePlatform: 'Shopify',
    platformBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    status: 'ai',
    statusText: 'AI 处理中',
    unreadCount: 0,
    lastTime: '11:40',
    lastMessage: 'Merci! Le code promo VIP a bien fonctionné.',
  },
  {
    id: 'conv-6',
    customerName: 'David Tanaka',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    email: 'tanaka.d@tokyo.jp',
    channel: 'livechat',
    channelColor: 'bg-teal-500 text-white shadow-[0_0_8px_rgba(20,184,166,0.5)]',
    storeId: 'shopify_us',
    storeName: 'SHE-GLOW 独立站',
    storePlatform: 'Shopify',
    platformBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    status: 'closed',
    statusText: '已解决关闭',
    unreadCount: 0,
    lastTime: '昨天',
    lastMessage: 'ありがとうございます！注文が完了しました。',
  },
])

const stores = [
  { id: 'all', name: '全部跨境店铺 (All Stores)', iconClass: 'fa-solid fa-store', badge: '28', color: 'text-emerald-400 bg-emerald-500/20' },
  { id: 'shopify_us', name: 'SHE-GLOW 女装美东站 (Shopify)', iconClass: 'fa-brands fa-shopify', badge: 'Shopify', color: 'text-indigo-400 bg-indigo-500/20' },
  { id: 'amazon_uk', name: 'CYBER-TECH 数码旗舰 (Amazon UK)', iconClass: 'fa-brands fa-amazon', badge: 'Amazon', color: 'text-amber-400 bg-amber-500/20' },
  { id: 'tiktok_sea', name: 'AURA 美妆个护 (TikTok SEA)', iconClass: 'fa-brands fa-tiktok', badge: 'TikTok', color: 'text-cyan-400 bg-cyan-500/20' },
]

const selectedStoreObj = computed(() => {
  return stores.find((s) => s.id === currentStoreFilter.value) || stores[0]
})

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

const selectSession = (id: string) => {
  activeId.value = id
  const target = conversations.value.find((c) => c.id === id)
  if (target) target.unreadCount = 0
  emit('select-session', id)
}

const selectStore = (id: string) => {
  currentStoreFilter.value = id
  showStoreDropdown.value = false
  emit('action-toast', `已筛选: ${selectedStoreObj.value.name}`, 'info')
}
</script>

<template>
  <section class="w-[340px] bg-[#0A0E17] border-r border-slate-800/80 flex flex-col shrink-0 relative z-20 select-none h-full shadow-2xl">
    <!-- 顶部标题与快速操作 -->
    <div class="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#0E1422]/90">
      <div class="flex items-center gap-2">
        <h1 class="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <span>会话中心</span>
          <span class="px-2 py-0.5 text-[11px] font-bold bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/25 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            <span class="font-mono">28</span> 待办
          </span>
        </h1>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="showFolderDrawer = !showFolderDrawer"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/5 flex items-center justify-center transition-colors"
          title="展开/收起 Intercom 风格大收件箱分组"
        >
          <i class="fa-solid fa-layer-group text-xs"></i>
        </button>
        <button
          @click="emit('refresh')"
          class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 flex items-center justify-center transition-colors"
          title="刷新列表"
        >
          <i class="fa-solid fa-arrow-rotate-right fa-rotate text-xs"></i>
        </button>
      </div>
    </div>

    <!-- 搜索框 & 店铺筛选器 -->
    <div class="p-3 space-y-2 border-b border-slate-800/80 bg-[#0A0E17]/80">
      <!-- 搜索框 -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索客户姓名、邮箱、消息、订单号..."
          class="w-full bg-[#111726] text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-8 py-2 border border-slate-700/60 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
        />
        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white/5 px-1 py-0.5 rounded font-mono">⌘K</span>
      </div>

      <!-- 店铺下拉选择器 -->
      <div class="relative">
        <button
          @click="showStoreDropdown = !showStoreDropdown"
          class="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#111726]/90 hover:bg-white/[0.04] rounded-lg border border-slate-700/60 text-xs text-slate-300 transition-colors shadow-sm"
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
          class="absolute left-0 right-0 top-full mt-1 bg-[#131B2E] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            v-for="st in stores"
            :key="st.id"
            @click="selectStore(st.id)"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200 transition-colors"
          >
            <span :class="['w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0', st.color]">
              <i :class="st.iconClass"></i>
            </span>
            <span class="flex-1 font-medium truncate">{{ st.name }}</span>
            <span class="text-[10px] text-slate-400 font-mono px-1 rounded bg-white/5">{{ st.badge }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 零滚动紧凑自适应状态矩阵 (大厂 3+2 零横向溢出) -->
    <div class="p-2.5 border-b border-slate-800/80 bg-[#080B11]/50 space-y-1.5">
      <!-- 第一行：3个常用状态 (全部 · AI · 我的) -->
      <div class="grid grid-cols-3 gap-1.5">
        <button
          @click="currentFilterTab = 'all'"
          :class="['grid-pill', currentFilterTab === 'all' ? 'active' : '']"
        >
          <span class="flex items-center gap-1 truncate"><i class="fa-solid fa-inbox text-[11px]"></i> 全部</span>
          <span class="text-[10px] font-mono px-1 rounded bg-white/10 text-slate-200">28</span>
        </button>

        <button
          @click="currentFilterTab = 'ai'"
          :class="['grid-pill', currentFilterTab === 'ai' ? 'active-indigo' : '']"
        >
          <span class="flex items-center gap-1 truncate"><i class="fa-solid fa-robot text-[11px] text-indigo-400"></i> AI</span>
          <span class="text-[10px] font-mono px-1 rounded bg-indigo-500/15 text-indigo-300">14</span>
        </button>

        <button
          @click="currentFilterTab = 'mine'"
          :class="['grid-pill', currentFilterTab === 'mine' ? 'active-blue' : '']"
        >
          <span class="flex items-center gap-1 truncate"><i class="fa-solid fa-user-check text-[11px] text-blue-400"></i> 我的</span>
          <span class="text-[10px] font-mono px-1 rounded bg-blue-500/15 text-blue-300">6</span>
        </button>
      </div>

      <!-- 第二行：2个关键工作流状态 (待人工接入 · 已关闭) -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          @click="currentFilterTab = 'queue'"
          :class="['grid-pill', currentFilterTab === 'queue' ? 'active-amber' : '']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <span class="w-2 h-2 rounded-full bg-amber-400 pulse-subtle shrink-0"></span>
            <span class="truncate">⏳ 待人工接入</span>
          </span>
          <span class="text-[10px] font-mono font-bold px-1.5 rounded bg-amber-500/20 text-amber-300">5</span>
        </button>

        <button
          @click="currentFilterTab = 'closed'"
          :class="['grid-pill', currentFilterTab === 'closed' ? 'active-closed' : '']"
        >
          <span class="flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-lock text-[10px] text-slate-500"></i>
            <span class="truncate">🔒 已解决关闭</span>
          </span>
          <span class="text-[10px] font-mono px-1 rounded bg-white/5 text-slate-400">3</span>
        </button>
      </div>
    </div>

    <!-- Intercom 风格全景视图折叠树面板 -->
    <div
      v-if="showFolderDrawer"
      class="p-2 border-b border-slate-800/80 bg-[#111726]/95 space-y-1 text-xs animate-in fade-in duration-150 shadow-lg"
    >
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
        <span>收件箱视图 (Inbox Views)</span>
        <span class="text-indigo-400 font-mono">SLA 正常</span>
      </div>
      <div @click="currentFilterTab = 'all'" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-inbox text-indigo-400"></i> 全部实时会话</span>
        <span class="font-mono text-slate-400 font-bold">28</span>
      </div>
      <div @click="currentFilterTab = 'ai'" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-robot text-indigo-400"></i> 🤖 AI 智能应答中</span>
        <span class="font-mono text-indigo-300 font-bold">14</span>
      </div>
      <div @click="currentFilterTab = 'mine'" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-user-check text-blue-400"></i> 👤 分配给我的接待</span>
        <span class="font-mono text-blue-300 font-bold">6</span>
      </div>
      <div @click="currentFilterTab = 'queue'" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-clock text-amber-400"></i> ⏳ 排队等待人工接入</span>
        <span class="font-mono text-amber-300 font-bold pulse-subtle">5</span>
      </div>
      <div @click="currentFilterTab = 'closed'" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-200">
        <span class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-slate-400"></i> 🔒 已解决/历史归档</span>
        <span class="font-mono text-slate-500">3</span>
      </div>
    </div>

    <!-- 会话卡片列表容器 (全新美化卡片样式) -->
    <div class="flex-1 overflow-y-auto divide-y divide-slate-800/30 p-2 space-y-1.5">
      <div
        v-for="conv in filteredConversations"
        :key="conv.id"
        @click="selectSession(conv.id)"
        :class="[
          'p-3 rounded-xl cursor-pointer relative transition-all duration-200 group',
          activeId === conv.id ? 'conv-card-active' : 'conv-card-default',
        ]"
      >
        <div class="flex items-start gap-3">
          <!-- 头像与渠道角标 -->
          <div class="relative shrink-0 mt-0.5">
            <img
              :src="conv.avatar"
              :alt="conv.customerName"
              class="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shadow-md group-hover:ring-indigo-500/40 transition-all"
            />
            <span
              :class="[
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] border-2 border-[#0A0E17]',
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

          <!-- 会话主体信息 -->
          <div class="flex-1 min-w-0">
            <!-- 姓名、平台、时间 -->
            <div class="flex items-center justify-between leading-none">
              <div class="flex items-center gap-1.5 truncate">
                <span
                  :class="[
                    'font-bold text-xs truncate transition-colors',
                    activeId === conv.id ? 'text-indigo-200' : 'text-slate-100 group-hover:text-indigo-300',
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
              <span class="text-[10px] text-slate-400 font-mono shrink-0 ml-1">{{ conv.lastTime }}</span>
            </div>

            <!-- 消息摘要 -->
            <p
              :class="[
                'text-xs truncate mt-1 leading-snug transition-colors',
                conv.unreadCount > 0 ? 'text-slate-200 font-medium' : 'text-slate-400',
              ]"
            >
              {{ conv.lastMessage }}
            </p>

            <!-- 底部状态与未读数 -->
            <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-white/[0.04]">
              <div>
                <span
                  v-if="conv.status === 'ai'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-subtle"></span>AI 处理中
                </span>
                <span
                  v-else-if="conv.status === 'queue'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-full"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-subtle"></span>待人工接入
                </span>
                <span
                  v-else-if="conv.status === 'mine'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-full"
                >
                  👤 人工接管
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-medium bg-slate-800/70 text-slate-400 border border-white/5 rounded-full"
                >
                  🔒 已解决关闭
                </span>
              </div>
              <span
                v-if="conv.unreadCount > 0"
                class="px-2 py-0.2 bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 text-white font-extrabold text-[10px] rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              >
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- 激活专属炫彩蓝紫流光指示条 -->
        <div
          v-if="activeId === conv.id"
          class="absolute left-0 top-2 bottom-2 w-[3.5px] bg-gradient-to-b from-indigo-400 via-purple-400 to-blue-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
        ></div>
      </div>

      <div
        v-if="filteredConversations.length === 0"
        class="py-12 text-center text-slate-500 text-xs"
      >
        没有匹配的会话
      </div>
    </div>

    <!-- 列表底部状态 -->
    <div class="p-2.5 border-t border-slate-800/80 bg-[#080B11]/80 text-[11px] text-slate-400 flex items-center justify-between px-3">
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] pulse-subtle"></span>
        <span>AI 智能接待引擎运行中</span>
      </span>
      <span class="text-indigo-300/80 font-mono text-[10px]">0.6s 极速应答</span>
    </div>
  </section>
</template>

<style scoped>
/* 默认未选中卡片 - 深曜透光晶体质感 */
.conv-card-default {
  background: rgba(17, 23, 38, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
.conv-card-default:hover {
  background: rgba(26, 35, 58, 0.65);
  border-color: rgba(99, 102, 241, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px -3px rgba(0, 0, 0, 0.4);
}

/* 激活高定卡片 - 宇宙星曜深蓝紫炫光 */
.conv-card-active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(99, 102, 241, 0.45);
  border-top: 1px solid rgba(165, 180, 252, 0.6);
  box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 3+2 紧凑胶囊按钮 */
.grid-pill {
  padding: 6px 8px;
  border-radius: 8px;
  background: #111726;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}
.grid-pill:hover {
  color: #fff;
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(255, 255, 255, 0.08);
}
.grid-pill.active {
  background: #151d30;
  border-color: #6366f1;
  color: #a5b4fc;
  box-shadow: 0 0 12px -2px rgba(99, 102, 241, 0.4);
}
.grid-pill.active-indigo {
  background: #151d30;
  border-color: #6366f1;
  color: #a5b4fc;
  box-shadow: 0 0 12px -2px rgba(99, 102, 241, 0.4);
}
.grid-pill.active-amber {
  background: #151d30;
  border-color: #f59e0b;
  color: #fbbf24;
  box-shadow: 0 0 12px -2px rgba(245, 158, 11, 0.35);
}
.grid-pill.active-blue {
  background: #151d30;
  border-color: #3b82f6;
  color: #60a5fa;
  box-shadow: 0 0 12px -2px rgba(59, 130, 246, 0.35);
}
.grid-pill.active-closed {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #f8fafc;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.04); }
}
.pulse-subtle {
  animation: pulse-subtle 3s infinite ease-in-out;
}
</style>