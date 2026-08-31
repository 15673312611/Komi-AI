<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { listTeammates, type Teammate } from '@/services/users'

const props = withDefaults(defineProps<{
  show: boolean
  currentUserId?: string | null
  customerName?: string | null
  actionLoading?: boolean
}>(), { currentUserId: null, customerName: '', actionLoading: false })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'transfer', targetUserId: string, note: string): void
  (e: 'route-to-queue'): void
  (e: 'hand-back-to-ai'): void
}>()

const teammates = ref<Teammate[]>([])
const selectedTarget = ref('')
const note = ref('')
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
let teammatesRequestVersion = 0

const loadTeammates = async () => {
  const requestVersion = ++teammatesRequestVersion
  const currentUserId = props.currentUserId
  loading.value = true
  error.value = ''
  teammates.value = []
  selectedTarget.value = ''
  const isCurrentRequest = () =>
    requestVersion === teammatesRequestVersion && props.show && props.currentUserId === currentUserId

  try {
    const loadedTeammates = await listTeammates()
    if (!isCurrentRequest()) return
    teammates.value = (loadedTeammates || []).filter(user => user.id !== currentUserId)
    if (!selectedTarget.value || !teammates.value.some(user => user.id === selectedTarget.value)) {
      selectedTarget.value = teammates.value[0]?.id || ''
    }
  } catch (err: any) {
    if (!isCurrentRequest()) return
    error.value = err.response?.data?.detail || '无法加载团队成员，请刷新后重试。'
  } finally {
    if (isCurrentRequest()) loading.value = false
  }
}

const filteredTeammates = computed(() => {
  if (!searchQuery.value.trim()) return teammates.value
  const q = searchQuery.value.toLowerCase().trim()
  return teammates.value.filter(u =>
    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q))
  )
})

watch(() => [props.show, props.currentUserId], ([show]) => {
  if (!show) {
    teammatesRequestVersion += 1
    loading.value = false
    searchQuery.value = ''
    return
  }
  note.value = ''
  searchQuery.value = ''
  void loadTeammates()
}, { immediate: true })

const confirm = () => {
  if (!selectedTarget.value || props.actionLoading) return
  emit('transfer', selectedTarget.value, note.value.trim())
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="w-full max-w-lg bg-[#0F1523] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- 头部 -->
      <div class="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141B2E]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>转交会话 / 团队分配</span>
              <span v-if="customerName" class="text-xs font-normal text-slate-400 font-sans">({{ customerName }})</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">将当前会话转派给特定团队成员或转入公共排队队列</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- 主体内容 -->
      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <!-- 成员选择 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <i class="fa-solid fa-user-group text-blue-400 text-[11px]"></i>
              <span>选择接收成员</span>
            </label>
            <span v-if="teammates.length" class="text-[10px] text-slate-500">{{ teammates.length }} 位可用成员</span>
          </div>

          <div v-if="loading" class="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <i class="fa-solid fa-circle-notch fa-spin text-blue-400"></i>
            <span>正在加载团队成员…</span>
          </div>

          <div v-else-if="error" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {{ error }}
          </div>

          <div v-else-if="!teammates.length" class="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-slate-400 text-xs">
            暂无其他可用团队成员
          </div>

          <div v-else class="space-y-2">
            <!-- 搜索框 -->
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索成员姓名或邮箱…"
                class="w-full bg-[#161E31] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <!-- 成员单选列表 -->
            <div class="max-h-44 overflow-y-auto space-y-1 pr-1">
              <div
                v-for="user in filteredTeammates"
                :key="user.id"
                @click="selectedTarget = user.id"
                :class="[
                  'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                  selectedTarget === user.id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                    : 'bg-[#141B2E] border-white/[0.06] hover:bg-[#1A233A] text-slate-300'
                ]"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-slate-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {{ (user.full_name || user.email || '?').slice(0, 1).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
                      <span>{{ user.full_name || user.email }}</span>
                      <span v-if="user.is_online" class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="在线"></span>
                    </div>
                    <div v-if="user.full_name" class="text-[10px] text-slate-500 truncate">{{ user.email }}</div>
                  </div>
                </div>

                <div class="shrink-0 ml-2">
                  <div :class="['w-4 h-4 rounded-full border flex items-center justify-center', selectedTarget === user.id ? 'border-blue-400 bg-blue-500' : 'border-slate-600 bg-transparent']">
                    <i v-if="selectedTarget === user.id" class="fa-solid fa-check text-[9px] text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 交接便签 -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <i class="fa-solid fa-note-sticky text-amber-400 text-[11px]"></i>
            <span>交接备注（可选，内部便签仅团队可见）</span>
          </label>
          <textarea
            v-model="note"
            rows="2"
            :disabled="actionLoading"
            placeholder="例如：客户需要确认加急物流单号与退货单据，已完成初步核对…"
            class="w-full bg-[#161E31] border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none font-sans"
          ></textarea>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="px-5 py-3.5 border-t border-white/[0.08] bg-[#141B2E] flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="actionLoading"
            @click="emit('hand-back-to-ai')"
            class="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="交还给 AI 自动回复"
          >
            <i class="fa-solid fa-robot text-xs"></i>
            <span>转给 AI</span>
          </button>

          <button
            type="button"
            :disabled="actionLoading"
            @click="emit('route-to-queue')"
            class="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="转入公共人工接入队列"
          >
            <i class="fa-solid fa-clock text-xs"></i>
            <span>转入队列</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="actionLoading"
            @click="emit('close')"
            class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all"
          >
            取消
          </button>
          <button
            type="button"
            :disabled="loading || !selectedTarget || actionLoading"
            @click="confirm"
            class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="actionLoading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            <i v-else class="fa-solid fa-check text-xs"></i>
            <span>{{ actionLoading ? '正在转派…' : '确认转交' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

