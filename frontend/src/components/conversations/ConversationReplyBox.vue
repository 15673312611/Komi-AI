<!--
Copyright 2024-2026 Komi AI
底部输入与多模式回复区 (ConversationReplyBox.vue - 现代高定多维色彩体系)
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
  isResolved?: boolean
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
  pendingFiles.value = []
  selectedMentions.value = []
  mentionStart.value = null
  mentionQuery.value = ''
  showSendMenu.value = false
})

const canAttach = computed(() => props.allowAttachments !== false)

const switchReplyMode = (mode: 'reply' | 'note') => {
  currentReplyMode.value = mode
  selectedMentions.value = []
  mentionStart.value = null
  mentionQuery.value = ''
  showSendMenu.value = false
  nextTick(() => textareaRef.value?.focus())
}

const toggleAiAutoReply = (event: Event) => {
  if (props.aiAutoReplyDisabled || props.aiAutoReplyLoading) return
  const checked = (event.target as HTMLInputElement).checked
  emit('toggle-ai-auto-reply', checked)
}

const handleSend = () => {
  const text = messageText.value.trim()
  const hasFiles = pendingFiles.value.length > 0
  if (!text && !hasFiles) return
  if (props.disabled) return

  const isNote = currentReplyMode.value === 'note'
  emit('send', text, isNote, pendingFiles.value, selectedMentions.value)
  messageText.value = ''
  pendingFiles.value = []
  selectedMentions.value = []
  mentionStart.value = null
  showSendMenu.value = false
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
    emit('action-toast', '当前客服未启用附件发送权限', 'error')
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

const handleTextareaKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const handleFilesChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  const contextVersion = attachmentContextVersion
  for (const file of files) {
    const contentType = file.type || 'application/octet-stream'
    const limit = contentType.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > limit) {
      emit('action-toast', `${file.name} 超过限制大小`, 'error')
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
  <footer class="bg-[#FFFFFF] border-t border-slate-200/80 flex flex-col shrink-0 select-none shadow-[0_-1px_4px_rgba(0,0,0,0.02)]">
    <!-- AI Copilot 实时推荐回复胶囊条 -->
    <div
      v-if="props.aiSuggestionsLoading || (props.aiSuggestions && props.aiSuggestions.length)"
      class="px-5 py-2.5 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border-b border-indigo-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0"
    >
      <div class="flex items-center gap-1.5 text-indigo-700 font-bold shrink-0 text-xs">
        <i class="fa-solid fa-sparkles text-indigo-600"></i>
        <span>AI 智能推荐：</span>
      </div>
      <span v-if="props.aiSuggestionsLoading" class="text-[11px] text-indigo-400 whitespace-nowrap">正在构思回复建议…</span>
      <div v-else class="flex items-center gap-2 overflow-x-auto py-0.5">
        <button
          v-for="(suggestion, idx) in props.aiSuggestions"
          :key="idx"
          @click="useSuggestion(suggestion)"
          class="px-3 py-1 rounded-lg bg-white hover:bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm font-medium hover:border-indigo-400"
        >
          <span>{{ suggestion }}</span>
          <i class="fa-solid fa-arrow-turn-up text-[10px] text-indigo-400"></i>
        </button>
      </div>
    </div>

    <!-- Dual-Tab 模式切换条 -->
    <div class="px-5 pt-2 flex items-center justify-between border-b border-slate-100">
      <div class="flex items-center gap-5">
        <button
          @click="switchReplyMode('reply')"
          :class="[
            'pb-2 font-bold text-xs flex items-center gap-1.5 transition-all border-b-2',
            currentReplyMode === 'reply'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 border-transparent hover:text-slate-700',
          ]"
        >
          <i class="fa-solid fa-reply text-xs"></i>
          <span>回复客户</span>
        </button>

        <button
          @click="switchReplyMode('note')"
          :class="[
            'pb-2 font-bold text-xs flex items-center gap-1.5 transition-all border-b-2',
            currentReplyMode === 'note'
              ? 'text-amber-700 border-amber-500'
              : 'text-slate-400 border-transparent hover:text-amber-700',
          ]"
        >
          <i class="fa-solid fa-note-sticky text-xs"></i>
          <span>内部团队便签</span>
        </button>
      </div>

      <!-- AI 自动回复 Toggle -->
      <div class="flex items-center gap-2 text-xs text-slate-500 pb-2">
        <span class="text-[11px] font-semibold flex items-center gap-1">
          <i class="fa-solid fa-robot text-indigo-500"></i>
          <span>AI 自动接管</span>
        </span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="aiAutoReplyEnabled"
            :disabled="props.aiAutoReplyDisabled || props.aiAutoReplyLoading"
            @change="toggleAiAutoReply"
            class="sr-only peer"
          />
          <div class="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
        </label>
      </div>
    </div>

    <!-- 输入框主体 -->
    <div class="p-3.5">
      <div
        :class="[
          'bg-[#FFFFFF] rounded-xl border transition-all p-3 shadow-sm',
          currentReplyMode === 'reply'
            ? 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
            : 'border-amber-300 bg-amber-50/25 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20',
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
              ? (props.isResolved ? '💬 会话已解决归档，输入新回复将自动重新打开会话... (按 Enter 发送)' : '输入回复内容... (按 Enter 发送，Shift+Enter 换行，输入 \'/\' 快捷调用话术)')
              : '输入内部便签... (仅团队成员可见；输入 \'@\' 提及团队成员)'
          "
          @keydown="handleTextareaKeydown"
          class="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 resize-none focus:outline-none font-sans leading-relaxed disabled:cursor-not-allowed disabled:opacity-50"
        ></textarea>

        <div
          v-if="mentionStart !== null"
          class="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white text-xs shadow-xl"
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
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
              @mousedown.prevent
              @click="chooseMention(user)"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{{ teammateLabel(user).slice(0, 1).toUpperCase() }}</span>
              <span class="min-w-0 flex-1 truncate font-medium">{{ teammateLabel(user) }}</span>
              <span v-if="user.full_name" class="shrink-0 truncate text-[10px] text-slate-400">{{ user.email }}</span>
            </button>
            <div v-if="!matchingTeammates.length" class="px-3 py-2 text-slate-400">没有可提及的团队成员。</div>
          </template>
        </div>

        <div v-if="pendingFiles.length" class="flex flex-wrap gap-1.5 py-2">
          <span v-for="(file, index) in pendingFiles" :key="`${file.filename}-${file.size}`" class="inline-flex max-w-full items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[10px] text-indigo-900">
            <i class="fa-solid fa-paperclip text-indigo-500"></i>
            <span class="max-w-40 truncate font-medium">{{ file.filename }}</span>
            <button type="button" class="text-indigo-400 hover:text-rose-600" :aria-label="`移除 ${file.filename}`" @click="removePendingFile(index)"><i class="fa-solid fa-xmark"></i></button>
          </span>
        </div>

        <!-- 工具栏 -->
        <div class="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
          <div class="flex items-center gap-1 text-slate-500">
            <button
              @click="triggerFileUpload"
              :disabled="!canAttach"
              class="w-7 h-7 rounded-lg hover:bg-slate-100 hover:text-indigo-600 flex items-center justify-center transition-colors"
              title="添加图片/文件/商品附件"
            >
              <i class="fa-solid fa-paperclip text-xs"></i>
            </button>
            <button
              @click="emit('open-canned')"
              class="w-7 h-7 rounded-lg hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-colors"
              title="快捷话术库 (快捷键 /)"
            >
              <i class="fa-solid fa-bolt text-xs text-amber-500"></i>
            </button>
            <button
              @click="emit('open-ai-polish')"
              class="w-7 h-7 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors"
              title="AI 智能润色/母语级翻译"
            >
              <i class="fa-solid fa-wand-magic-sparkles text-xs text-indigo-600"></i>
            </button>
            <button
              @click="emit('open-product')"
              :disabled="props.disabled"
              class="w-7 h-7 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-colors disabled:opacity-40"
              title="选择 Shopify 商品并插入回复"
            >
              <i class="fa-brands fa-shopify text-xs text-emerald-600"></i>
            </button>
            <button
              @click="insertEmoji('😊')"
              class="w-7 h-7 rounded-lg hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-colors"
              title="插入表情"
            >
              <i class="fa-regular fa-face-smile text-xs text-amber-500"></i>
            </button>
          </div>

          <!-- 发送按钮组合 -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-400 hidden sm:inline-block font-mono">Enter 发送</span>
            <div class="relative inline-flex rounded-lg shadow-sm">
              <button
                @click="handleSend"
                :disabled="props.disabled"
                :class="[
                  'px-4 py-1.5 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]',
                  currentReplyMode === 'reply'
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25',
                ]"
              >
                <span>{{ currentReplyMode === 'reply' ? '发送' : '添加便签' }}</span>
                <i class="fa-solid fa-paper-plane text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
</style>
