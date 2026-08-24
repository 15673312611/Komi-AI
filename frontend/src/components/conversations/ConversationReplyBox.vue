<!--
Copyright 2024-2026 ChatterMate
底部输入与多模式回复区 (ConversationReplyBox.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  aiSuggestions?: string[]
}>()

const emit = defineEmits<{
  (e: 'send', text: string, isNote: boolean): void
  (e: 'open-ai-polish'): void
  (e: 'open-canned'): void
  (e: 'open-product'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const messageText = ref('')
const currentReplyMode = ref<'reply' | 'note'>('reply')
const aiAutoReplyEnabled = ref(true)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const switchReplyMode = (mode: 'reply' | 'note') => {
  currentReplyMode.value = mode
}

const toggleAiAutoReply = () => {
  aiAutoReplyEnabled.value = !aiAutoReplyEnabled.value
  emit(
    'action-toast',
    aiAutoReplyEnabled.value ? 'AI 自动回复接管已启用' : 'AI 自动回复已暂停，进入纯人工接待',
    aiAutoReplyEnabled.value ? 'success' : 'info'
  )
}

const handleTextareaKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  } else if (event.key === '/' && messageText.value === '') {
    emit('open-canned')
  }
}

const handleSend = () => {
  const text = messageText.value.trim()
  if (!text) return
  emit('send', text, currentReplyMode.value === 'note')
  messageText.value = ''
}

const useSuggestion = (text: string) => {
  messageText.value = text
  textareaRef.value?.focus()
  emit('action-toast', '已填入输入框，按 Enter 即可直接发送', 'info')
}

const insertEmoji = (emoji: string) => {
  messageText.value += emoji
  textareaRef.value?.focus()
}

const triggerFileUpload = () => {
  emit('action-toast', '已打开跨境附件/截图上传通道', 'info')
}
</script>

<template>
  <footer class="bg-[#0F1523] border-t border-white/[0.08] flex flex-col shrink-0 select-none">
    <!-- AI Copilot 实时推荐回复胶囊条 (1:1 对齐) -->
    <div
      v-if="props.aiSuggestions && props.aiSuggestions.length"
      class="px-4 py-2 bg-[#0F1523] border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto text-xs shrink-0"
    >
      <div class="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0 text-xs">
        <i class="fa-solid fa-wand-magic-sparkles fa-magic text-xs"></i>
        <span>AI Copilot 推荐回复：</span>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto py-0.5">
        <button
          v-for="(suggestion, idx) in props.aiSuggestions"
          :key="idx"
          @click="useSuggestion(suggestion)"
          class="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs whitespace-nowrap transition-all flex items-center gap-1 shadow-sm"
        >
          <span>{{ suggestion }}</span>
          <i class="fa-solid fa-bolt text-[10px]"></i>
        </button>
      </div>
    </div>

    <!-- Dual-Tab 模式切换条 (1:1 对齐) -->
    <div class="px-4 pt-2 flex items-center justify-between border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <button
          @click="switchReplyMode('reply')"
          :class="[
            'px-3.5 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-1.5 transition-all',
            currentReplyMode === 'reply'
              ? 'text-emerald-400 bg-emerald-500/10 border-t-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-200',
          ]"
        >
          <i class="fa-solid fa-reply text-xs"></i>
          <span>💬 回复客户 (Reply)</span>
        </button>

        <button
          @click="switchReplyMode('note')"
          :class="[
            'px-3.5 py-1.5 rounded-t-lg font-semibold text-xs flex items-center gap-1.5 transition-all',
            currentReplyMode === 'note'
              ? 'text-amber-300 bg-amber-500/10 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/5',
          ]"
        >
          <i class="fa-solid fa-note-sticky fa-sticky-note text-xs"></i>
          <span>📝 内部团队便签 (Private Note)</span>
        </button>
      </div>

      <!-- AI 自动回复 Toggle -->
      <div class="flex items-center gap-2 text-xs text-slate-400 pb-1">
        <span class="text-[11px] font-medium">🤖 AI 自动回复接管</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="aiAutoReplyEnabled"
            @change="toggleAiAutoReply"
            class="sr-only peer"
          />
          <div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>

    <!-- 输入框主体 -->
    <div class="p-3">
      <div
        :class="[
          'bg-[#080B11] rounded-xl border transition-all p-2.5 shadow-inner',
          currentReplyMode === 'reply'
            ? 'border-white/10 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30'
            : 'border-amber-500/40 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30',
        ]"
      >
        <textarea
          ref="textareaRef"
          v-model="messageText"
          rows="3"
          :placeholder="
            currentReplyMode === 'reply'
              ? '输入回复内容... (按 Enter 发送，Shift+Enter 换行，输入 \'/\' 快捷调用话术，输入 \'@\' 提及团队成员)'
              : '输入内部便签... (仅团队成员可见，不发送给客户)'
          "
          @keydown="handleTextareaKeydown"
          class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-none font-sans leading-relaxed"
        ></textarea>

        <!-- 工具栏 (1:1 对齐) -->
        <div class="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.06]">
          <div class="flex items-center gap-1 text-slate-400">
            <button
              @click="triggerFileUpload"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-slate-200 flex items-center justify-center transition-colors"
              title="添加图片/文件/商品附件"
            >
              <i class="fa-solid fa-paperclip text-xs"></i>
            </button>
            <button
              @click="emit('open-canned')"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-amber-400 flex items-center justify-center transition-colors"
              title="常用快捷话术库 (快捷键 /)"
            >
              <i class="fa-solid fa-bolt text-xs text-amber-400"></i>
            </button>
            <button
              @click="emit('open-ai-polish')"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-emerald-300 flex items-center justify-center transition-colors"
              title="AI 智能润色/多语言母语级翻译"
            >
              <i class="fa-solid fa-wand-sparkles fa-magic text-xs text-emerald-400"></i>
            </button>
            <button
              @click="emit('open-product')"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-rose-400 flex items-center justify-center transition-colors"
              title="发送 Shopify 商品卡片"
            >
              <i class="fa-brands fa-shopify text-xs text-rose-400"></i>
            </button>
            <button
              @click="insertEmoji('😊')"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-slate-200 flex items-center justify-center transition-colors"
              title="插入表情"
            >
              <i class="fa-regular fa-face-smile text-xs"></i>
            </button>
          </div>

          <!-- 发送按钮组合 -->
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500 hidden sm:inline-block">Enter 发送</span>
            <div class="inline-flex rounded-lg shadow-sm">
              <button
                @click="handleSend"
                :class="[
                  'px-4 py-1.5 font-bold text-xs rounded-l-lg flex items-center gap-1.5 transition-all',
                  currentReplyMode === 'reply'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
                ]"
              >
                <i class="fa-solid fa-paper-plane text-xs"></i>
                <span>{{ currentReplyMode === 'reply' ? '发送' : '添加便签' }}</span>
              </button>
              <button
                :class="[
                  'px-2 py-1.5 text-xs rounded-r-lg border-l transition-colors',
                  currentReplyMode === 'reply'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-700/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-700/50',
                ]"
              >
                <i class="fa-solid fa-chevron-down text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
