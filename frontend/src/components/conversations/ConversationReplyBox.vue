<!--
Copyright 2024-2026 ChatterMate
底部输入与多模式回复区 (ConversationReplyBox.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Teammate } from '@/services/users'

export interface OutboundAttachment {
  content: string
  filename: string
  content_type: string
  size: number
}

const props = defineProps<{
  aiSuggestions?: string[]
  aiSuggestionsLoading?: boolean
  aiAutoReplyEnabled?: boolean
  aiAutoReplyDisabled?: boolean
  aiAutoReplyLoading?: boolean
  disabled?: boolean
  allowAttachments?: boolean
  allowedAttachmentTypes?: string[] | null
  draft?: string
  sessionId?: string
  mentionableTeammates?: Teammate[]
  mentionsLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', text: string, isNote: boolean, files: OutboundAttachment[], mentionedUsers: Teammate[]): void
  (e: 'send-and-resolve', text: string, files: OutboundAttachment[], mentionedUsers: Teammate[]): void
  (e: 'request-mentions'): void
  (e: 'open-ai-polish'): void
  (e: 'open-canned'): void
  (e: 'open-product'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
  (e: 'toggle-ai-auto-reply', enabled: boolean): void
  (e: 'update:draft', text: string): void
}>()

const messageText = ref(props.draft || '')
const currentReplyMode = ref<'reply' | 'note'>('reply')
const aiAutoReplyEnabled = computed(() => props.aiAutoReplyEnabled ?? true)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFiles = ref<OutboundAttachment[]>([])
const showSendMenu = ref(false)
const selectedMentions = ref<Teammate[]>([])
const mentionQuery = ref('')
const mentionStart = ref<number | null>(null)
let attachmentContextVersion = 0
watch(() => props.draft, value => {
  if (typeof value === 'string' && value !== messageText.value) messageText.value = value
})
watch(() => props.sessionId, () => {
  attachmentContextVersion += 1
  messageText.value = props.draft || ''
  pendingFiles.value = []
  selectedMentions.value = []
  currentReplyMode.value = 'reply'
  showSendMenu.value = false
  mentionQuery.value = ''
  mentionStart.value = null
}, { immediate: true })

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain', csv: 'text/csv', xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
const TYPE_CATEGORIES: Record<string, string> = {
  'image/jpeg': 'images', 'image/png': 'images', 'image/gif': 'images', 'image/webp': 'images',
  'application/pdf': 'documents', 'application/msword': 'office',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'office',
  'application/vnd.ms-excel': 'office', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'office',
  'text/plain': 'text', 'text/csv': 'text',
}
const canAttach = computed(() => Boolean(props.allowAttachments) && !props.disabled)

const switchReplyMode = (mode: 'reply' | 'note') => {
  currentReplyMode.value = mode
  showSendMenu.value = false
  mentionStart.value = null
  mentionQuery.value = ''
  if (mode === 'reply') selectedMentions.value = []
}

const toggleAiAutoReply = () => {
  emit('toggle-ai-auto-reply', !aiAutoReplyEnabled.value)
}

const handleTextareaKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && mentionStart.value !== null) {
    mentionStart.value = null
    mentionQuery.value = ''
    return
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  } else if (event.key === '/' && messageText.value === '') {
    emit('open-canned')
  }
}

const handleSend = () => {
  const text = messageText.value.trim()
  if ((!text && !pendingFiles.value.length) || props.disabled) return
  emit('send', text, currentReplyMode.value === 'note', pendingFiles.value, selectedMentions.value)
  messageText.value = ''
  pendingFiles.value = []
  selectedMentions.value = []
  mentionStart.value = null
  emit('update:draft', '')
}

const handleSendAndResolve = () => {
  const text = messageText.value.trim()
  if (currentReplyMode.value !== 'reply' || (!text && !pendingFiles.value.length) || props.disabled) return
  emit('send-and-resolve', text, pendingFiles.value, selectedMentions.value)
  messageText.value = ''
  pendingFiles.value = []
  selectedMentions.value = []
  mentionStart.value = null
  showSendMenu.value = false
  emit('update:draft', '')
}

const toggleSendMenu = () => {
  if (props.disabled || currentReplyMode.value !== 'reply') return
  showSendMenu.value = !showSendMenu.value
}

const teammateLabel = (user: Teammate) => user.full_name?.trim() || user.email
const matchingTeammates = computed(() => {
  const needle = mentionQuery.value.trim().toLocaleLowerCase()
  return (props.mentionableTeammates || [])
    .filter(user => !selectedMentions.value.some(selected => selected.id === user.id))
    .filter(user => !needle || `${teammateLabel(user)} ${user.email}`.toLocaleLowerCase().includes(needle))
    .slice(0, 6)
})

const resetMentionIfRemoved = () => {
  selectedMentions.value = selectedMentions.value.filter(user =>
    messageText.value.includes(`@${teammateLabel(user)}`),
  )
}

const handleDraftInput = (event: Event) => {
  emit('update:draft', messageText.value)
  resetMentionIfRemoved()
  if (currentReplyMode.value !== 'note') {
    mentionStart.value = null
    mentionQuery.value = ''
    return
  }
  const cursor = (event.target as HTMLTextAreaElement).selectionStart
  const match = /@([^\s@]*)$/.exec(messageText.value.slice(0, cursor))
  if (!match) {
    mentionStart.value = null
    mentionQuery.value = ''
    return
  }
  mentionStart.value = cursor - match[0].length
  mentionQuery.value = match[1]
  emit('request-mentions')
}

const chooseMention = async (user: Teammate) => {
  const start = mentionStart.value
  if (start === null) return
  const cursor = textareaRef.value?.selectionStart ?? messageText.value.length
  const token = `@${teammateLabel(user)}`
  messageText.value = `${messageText.value.slice(0, start)}${token} ${messageText.value.slice(cursor)}`
  if (!selectedMentions.value.some(selected => selected.id === user.id)) selectedMentions.value.push(user)
  mentionStart.value = null
  mentionQuery.value = ''
  emit('update:draft', messageText.value)
  await nextTick()
  const position = start + token.length + 1
  textareaRef.value?.focus()
  textareaRef.value?.setSelectionRange(position, position)
}

const useSuggestion = (text: string) => {
  messageText.value = text
  emit('update:draft', messageText.value)
  textareaRef.value?.focus()
  emit('action-toast', '已填入输入框，按 Enter 即可直接发送', 'info')
}

const insertEmoji = (emoji: string) => {
  messageText.value += emoji
  emit('update:draft', messageText.value)
  textareaRef.value?.focus()
}

const triggerFileUpload = () => {
  if (!canAttach.value) {
    emit('action-toast', '当前 AI 客服未启用附件发送权限', 'error')
    return
  }
  fileInputRef.value?.click()
}

const fileContent = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('无法读取文件'))
  reader.onload = () => {
    const value = String(reader.result || '')
    resolve(value.includes(',') ? value.split(',')[1] : value)
  }
  reader.readAsDataURL(file)
})

const handleFilesChange = async (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  const contextVersion = attachmentContextVersion
  if (fileInputRef.value) fileInputRef.value.value = ''
  for (const file of files) {
    if (contextVersion !== attachmentContextVersion) return
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const contentType = MIME_BY_EXTENSION[extension]
    if (!contentType) {
      emit('action-toast', `${file.name} 的文件类型不受支持`, 'error')
      continue
    }
    const allowedCategories = props.allowedAttachmentTypes || []
    if (allowedCategories.length && !allowedCategories.includes(TYPE_CATEGORIES[contentType])) {
      emit('action-toast', `${file.name} 不在当前 AI 客服允许的附件类型中`, 'error')
      continue
    }
    const limit = contentType.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > limit) {
      emit('action-toast', `${file.name} 超过 ${contentType.startsWith('image/') ? '5' : '10'}MB 限制`, 'error')
      continue
    }
    if (pendingFiles.value.some(item => item.filename === file.name && item.size === file.size)) continue
    try {
      const content = await fileContent(file)
      if (contextVersion !== attachmentContextVersion) return
      pendingFiles.value.push({ content, filename: file.name, content_type: contentType, size: file.size })
    } catch {
      emit('action-toast', `${file.name} 读取失败`, 'error')
    }
  }
}

const removePendingFile = (index: number) => { pendingFiles.value.splice(index, 1) }
</script>

<template>
  <footer class="bg-[#0F1523] border-t border-white/[0.08] flex flex-col shrink-0 select-none">
    <!-- AI Copilot 实时推荐回复胶囊条 (1:1 对齐) -->
    <div
      v-if="props.aiSuggestionsLoading || (props.aiSuggestions && props.aiSuggestions.length)"
      class="px-4 py-2 bg-[#0F1523] border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto text-xs shrink-0"
    >
      <div class="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0 text-xs">
        <i class="fa-solid fa-wand-magic-sparkles fa-magic text-xs"></i>
        <span>AI Copilot 推荐回复：</span>
      </div>
      <span v-if="props.aiSuggestionsLoading" class="text-[11px] text-slate-400 whitespace-nowrap">正在生成…</span>
      <div v-else class="flex items-center gap-2 overflow-x-auto py-0.5">
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
          <span>💬 回复客户</span>
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
            :disabled="props.aiAutoReplyDisabled || props.aiAutoReplyLoading"
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
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
          class="hidden"
          @change="handleFilesChange"
        />
        <textarea
          ref="textareaRef"
          v-model="messageText"
          @input="handleDraftInput"
          :disabled="props.disabled"
          rows="3"
          :placeholder="
            currentReplyMode === 'reply'
              ? '输入回复内容... (按 Enter 发送，Shift+Enter 换行，输入 \'/\' 快捷调用话术)'
              : '输入内部便签... (仅团队成员可见；输入 \'@\' 提及团队成员)'
          "
          @keydown="handleTextareaKeydown"
          class="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-none font-sans leading-relaxed disabled:cursor-not-allowed disabled:opacity-50"
        ></textarea>

        <div
          v-if="mentionStart !== null"
          class="mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#131B2E] text-xs shadow-lg"
          role="listbox"
          aria-label="可提及的团队成员"
        >
          <div v-if="props.mentionsLoading" class="px-3 py-2 text-slate-400">正在加载团队成员…</div>
          <template v-else>
            <button
              v-for="user in matchingTeammates"
              :key="user.id"
              type="button"
              role="option"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-200 transition-colors hover:bg-emerald-500/15 hover:text-emerald-200"
              @mousedown.prevent
              @click="chooseMention(user)"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-700 text-[10px] font-semibold text-slate-200">{{ teammateLabel(user).slice(0, 1).toUpperCase() }}</span>
              <span class="min-w-0 flex-1 truncate">{{ teammateLabel(user) }}</span>
              <span v-if="user.full_name" class="shrink-0 truncate text-[10px] text-slate-500">{{ user.email }}</span>
            </button>
            <div v-if="!matchingTeammates.length" class="px-3 py-2 text-slate-500">没有可提及的团队成员。</div>
          </template>
        </div>

        <div v-if="pendingFiles.length" class="flex flex-wrap gap-1.5 py-2">
          <span v-for="(file, index) in pendingFiles" :key="`${file.filename}-${file.size}`" class="inline-flex max-w-full items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-[10px] text-slate-300">
            <i class="fa-solid fa-paperclip text-slate-400"></i>
            <span class="max-w-40 truncate">{{ file.filename }}</span>
            <button type="button" class="text-slate-500 hover:text-rose-300" :aria-label="`移除 ${file.filename}`" @click="removePendingFile(index)"><i class="fa-solid fa-xmark"></i></button>
          </span>
        </div>

        <!-- 工具栏 (1:1 对齐) -->
        <div class="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.06]">
          <div class="flex items-center gap-1 text-slate-400">
            <button
              @click="triggerFileUpload"
              :disabled="!canAttach"
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
              :disabled="props.disabled"
              class="w-7 h-7 rounded hover:bg-white/5 hover:text-rose-400 flex items-center justify-center transition-colors disabled:opacity-40"
              title="选择 Shopify 商品并插入回复草稿"
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
            <div class="relative inline-flex rounded-lg shadow-sm">
              <button
                @click="handleSend"
                :disabled="props.disabled"
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
                type="button"
                @click="toggleSendMenu"
                :disabled="props.disabled || currentReplyMode === 'note'"
                :aria-expanded="showSendMenu"
                aria-haspopup="menu"
                aria-label="更多发送操作"
                :class="[
                  'px-2 py-1.5 text-xs rounded-r-lg border-l transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  currentReplyMode === 'reply'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-700/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-700/50',
                ]"
              >
                <i class="fa-solid fa-chevron-down text-[10px]"></i>
              </button>
              <div
                v-if="showSendMenu"
                role="menu"
                class="absolute right-0 bottom-full z-20 mb-2 min-w-44 overflow-hidden rounded-lg border border-white/10 bg-[#131B2E] py-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300"
                  @click="handleSendAndResolve"
                >
                  <i class="fa-solid fa-check-double text-emerald-400"></i>
                  <span>发送并解决会话</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
