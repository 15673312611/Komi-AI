<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cannedResponsesService, type CannedResponse } from '@/services/cannedResponses'
import { permissionChecks } from '@/utils/permissions'

const props = withDefaults(defineProps<{
  open: boolean
  customerName?: string
  orderNumber?: string
}>(), { customerName: '', orderNumber: '' })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', text: string): void
}>()

const router = useRouter()
const query = ref('')
const category = ref('all')
const responses = ref<CannedResponse[]>([])
const loading = ref(false)
const error = ref('')
const canManageResponses = permissionChecks.canManageOrganization()
let responsesRequest = 0

const categories = computed(() => ['all', ...Array.from(new Set(responses.value.map(item => item.category)))])
const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return responses.value.filter((item) => {
    const categoryMatches = category.value === 'all' || item.category === category.value
    const textMatches = !needle || `${item.title} ${item.content} ${item.shortcut || ''}`.toLowerCase().includes(needle)
    return categoryMatches && textMatches
  })
})

const fillVariables = (item: CannedResponse) => {
  let text = item.content
  if (props.customerName) text = text.replace(/{{\s*(name|customer_name)\s*}}/gi, props.customerName)
  if (props.orderNumber) text = text.replace(/{{\s*(order|order_number)\s*}}/gi, props.orderNumber)
  return text
}

const select = (item: CannedResponse) => {
  emit('select', fillVariables(item))
  emit('close')
}

const loadResponses = async () => {
  const request = ++responsesRequest
  loading.value = true
  error.value = ''
  responses.value = []
  const isCurrentRequest = () => request === responsesRequest && props.open
  try {
    const loadedResponses = await cannedResponsesService.list()
    if (!isCurrentRequest()) return
    responses.value = loadedResponses
  } catch (err: any) {
    if (!isCurrentRequest()) return
    error.value = err?.response?.data?.detail || '快捷话术加载失败，请稍后重试。'
  } finally {
    if (isCurrentRequest()) loading.value = false
  }
}

watch(() => props.open, (open) => {
  if (!open) {
    responsesRequest += 1
    loading.value = false
    return
  }
  query.value = ''
  category.value = 'all'
  void loadResponses()
}, { immediate: true })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="w-full max-w-xl bg-[#0F1523] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- 头部 -->
      <div class="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141B2E]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">常用快捷话术库</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">选取官方与团队标准化话术模板，支持变量自动填充</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="canManageResponses"
            type="button"
            @click="router.push('/settings/canned-responses'); emit('close')"
            class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all"
          >
            <i class="fa-solid fa-gear text-[11px] mr-1"></i>管理
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      </div>

      <!-- 搜索与分类过滤 -->
      <div class="p-3.5 border-b border-white/[0.06] bg-[#0C111C] flex gap-2">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
          <input
            v-model="query"
            type="search"
            placeholder="搜索话术标题、内容或 /快捷指令…"
            class="w-full bg-[#161E31] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            autofocus
          />
        </div>
        <select
          v-model="category"
          class="bg-[#161E31] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
        >
          <option v-for="item in categories" :key="item" :value="item">{{ item === 'all' ? '全部分类' : item }}</option>
        </select>
      </div>

      <!-- 话术列表 -->
      <div class="p-3.5 space-y-2 overflow-y-auto flex-1">
        <div v-if="loading" class="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <i class="fa-solid fa-circle-notch fa-spin text-amber-400"></i>
          <span>正在加载快捷话术…</span>
        </div>
        <div v-else-if="error" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{{ error }}</span>
          <button type="button" class="underline text-amber-400 font-bold ml-2" @click="loadResponses">重试</button>
        </div>
        <template v-else>
          <div
            v-for="item in filtered"
            :key="item.id"
            @click="select(item)"
            class="p-3 rounded-xl border border-white/[0.06] bg-[#141B2E] hover:bg-[#1A233A] hover:border-amber-500/40 cursor-pointer transition-all space-y-1.5 group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <i class="fa-solid fa-comment-dots text-amber-400 text-[11px]"></i>
                {{ item.title }}
              </span>
              <div class="flex items-center gap-1.5">
                <span v-if="item.shortcut" class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">/{{ item.shortcut.replace(/^\//, '') }}</span>
                <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium">{{ item.category }}</span>
              </div>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed line-clamp-2">{{ item.content }}</p>
          </div>
          <div v-if="!filtered.length" class="p-8 text-center text-slate-500 text-xs">
            没有找到匹配的话术
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
