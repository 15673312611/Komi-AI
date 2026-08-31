<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ChatDetail } from '@/types/chat'
import { chatService } from '@/services/chat'

type CopilotMode = 'polite' | 'concise' | 'translate_en' | 'apology'

const props = withDefaults(defineProps<{
  open: boolean
  chat?: ChatDetail | null
  currentDraft?: string
}>(), { chat: null, currentDraft: '' })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insert', text: string): void
}>()

const draftText = ref('')
const result = ref('')
const error = ref('')
const loading = ref(false)
const mode = ref<CopilotMode>('polite')
let generationVersion = 0

watch([() => props.open, () => props.chat?.session_id], ([open]) => {
  generationVersion += 1
  loading.value = false
  if (!open) return
  draftText.value = props.currentDraft || ''
  result.value = ''
  error.value = ''
  mode.value = 'polite'
}, { immediate: true })
watch(() => props.currentDraft, (value) => {
  if (props.open && !loading.value) draftText.value = value || ''
})

const generate = async (nextMode: CopilotMode = mode.value) => {
  if (loading.value) return
  const text = draftText.value.trim()
  const sessionId = props.chat?.session_id
  if (!text || !sessionId) {
    error.value = !text ? '请先输入想表达的要点。' : '会话信息不可用，请刷新后重试。'
    result.value = ''
    return
  }
  const requestVersion = ++generationVersion
  const isCurrentGeneration = () =>
    requestVersion === generationVersion && props.open && props.chat?.session_id === sessionId
  mode.value = nextMode
  loading.value = true
  error.value = ''
  result.value = ''
  try {
    const response = await chatService.generateCopilotDraft(sessionId, { draft: text, mode: nextMode })
    if (!isCurrentGeneration()) return
    result.value = response.draft
  } catch (err: any) {
    if (!isCurrentGeneration()) return
    error.value = err.response?.data?.detail || 'AI Copilot 暂时不可用，请稍后重试。'
  } finally {
    if (isCurrentGeneration()) loading.value = false
  }
}

const apply = () => {
  if (!result.value) return
  emit('insert', result.value)
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="w-full max-w-lg bg-[#0F1523] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- 头部 -->
      <div class="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141B2E]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">AI 智能润色与多语言助理</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">智能改写语气、精简表达或翻译为母语级地道英文</p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- 主体 -->
      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <i class="fa-solid fa-pen-to-square text-emerald-400 text-[11px]"></i>
            <span>输入待处理草稿 / 核心要点</span>
          </label>
          <textarea
            id="copilot-draft"
            v-model="draftText"
            :disabled="loading"
            rows="3"
            placeholder="例如：给客户说明由于天气原因物流延误2天，赠送10美元优惠券表示歉意…"
            class="w-full bg-[#161E31] border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
          ></textarea>
        </div>

        <!-- 模式网格 -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">选择润色目标模式</label>
          <div class="mode-grid grid grid-cols-4 gap-2">
            <button
              type="button"
              :disabled="loading"
              @click="generate('polite')"
              :class="[
                'py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all',
                mode === 'polite' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#141B2E] border-white/[0.06] text-slate-300 hover:bg-[#1A233A]'
              ]"
            >
              <i class="fa-solid fa-heart text-xs text-pink-400"></i>
              <span>专业礼貌</span>
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="generate('concise')"
              :class="[
                'py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all',
                mode === 'concise' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#141B2E] border-white/[0.06] text-slate-300 hover:bg-[#1A233A]'
              ]"
            >
              <i class="fa-solid fa-feather-pointed text-xs text-blue-400"></i>
              <span>简洁明确</span>
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="generate('translate_en')"
              :class="[
                'py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all',
                mode === 'translate_en' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#141B2E] border-white/[0.06] text-slate-300 hover:bg-[#1A233A]'
              ]"
            >
              <i class="fa-solid fa-language text-xs text-purple-400"></i>
              <span>地道英文</span>
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="generate('apology')"
              :class="[
                'py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all',
                mode === 'apology' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#141B2E] border-white/[0.06] text-slate-300 hover:bg-[#1A233A]'
              ]"
            >
              <i class="fa-solid fa-hands-praying text-xs text-amber-400"></i>
              <span>诚恳致歉</span>
            </button>
          </div>
        </div>

        <!-- 生成结果 -->
        <div class="p-3.5 rounded-xl bg-[#141B2E] border border-white/[0.08] min-h-[100px] flex flex-col justify-between">
          <div class="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-1">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-sparkles text-xs"></i>
              <span>AI 生成结果</span>
            </span>
            <span v-if="loading" class="text-xs text-slate-400 flex items-center gap-1">
              <i class="fa-solid fa-circle-notch fa-spin text-emerald-400"></i>正在构思…
            </span>
          </div>
          <div v-if="error" class="text-xs text-rose-400 py-2">{{ error }}</div>
          <div v-else-if="result" class="text-xs text-slate-100 leading-relaxed py-1 whitespace-pre-wrap select-text">{{ result }}</div>
          <div v-else class="text-xs text-slate-500 py-3 text-center">输入要点并点击上方任一模式开始生成</div>
        </div>
      </div>

      <!-- 底部栏 -->
      <div class="px-5 py-3.5 border-t border-white/[0.08] bg-[#141B2E] flex items-center justify-between gap-2">
        <button
          type="button"
          @click="emit('close')"
          class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="loading || !result"
          @click="apply"
          class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fa-solid fa-arrow-down-to-bracket text-xs"></i>
          <span>插入回复草稿</span>
        </button>
      </div>
    </div>
  </div>
</template>
