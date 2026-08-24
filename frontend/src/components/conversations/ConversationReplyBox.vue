<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FileUpload from '@/components/common/FileUpload.vue'
import ConversationAIToggle from '@/components/conversations/ConversationAIToggle.vue'

export interface ComposerFile {
  content: string
  filename: string
  content_type: string
  size: number
}

const props = withDefaults(defineProps<{
  sessionId: string
  canSendMessage: boolean
  isChatClosed: boolean
  handledByAI: boolean
  showTakeoverButton: boolean
  handlerCaption: string
  isLoading: boolean
  aiAutoReply: boolean
  aiToggleLoading: boolean
  draft?: string
  allowAttachments?: boolean
}>(), {
  draft: '',
  allowAttachments: true,
})

const emit = defineEmits<{
  (e: 'update:draft', value: string): void
  (e: 'send', text: string, isPrivateNote: boolean, files: ComposerFile[]): void
  (e: 'takeover'): void
  (e: 'route-to-team'): void
  (e: 'hand-back-to-ai'): void
  (e: 'end-chat'): void
  (e: 'toggle-ai', enabled: boolean): void
  (e: 'open-canned'): void
  (e: 'open-copilot'): void
  (e: 'open-transfer'): void
  (e: 'action-toast', message: string, type?: 'success' | 'info' | 'error'): void
}>()

const mode = ref<'reply' | 'note'>('reply')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileUploadRef = ref<InstanceType<typeof FileUpload> | null>(null)
const selectedFiles = ref<ComposerFile[]>([])
const localDraft = ref(props.draft)

watch(() => props.draft, (value) => {
  if (value !== localDraft.value) localDraft.value = value || ''
})

const isPrivateNote = computed(() => mode.value === 'note')
const canCompose = computed(() => props.canSendMessage && !props.isChatClosed && !props.handledByAI)
const sendLabel = computed(() => isPrivateNote.value ? '保存私信便签' : '发送回复')

const updateDraft = (value: string) => {
  localDraft.value = value
  emit('update:draft', value)
}

const selectMode = (next: 'reply' | 'note') => {
  mode.value = next
  textareaRef.value?.focus()
}

const handleFilesUploaded = (files: ComposerFile[]) => {
  selectedFiles.value = files
}

const handleFileError = (message: string) => {
  emit('action-toast', message, 'error')
}

const clearFiles = () => {
  selectedFiles.value = []
  fileUploadRef.value?.clearFiles?.()
}

const send = () => {
  const text = localDraft.value.trim()
  if (!canCompose.value || (!text && selectedFiles.value.length === 0)) return
  emit('send', text, isPrivateNote.value, [...selectedFiles.value])
  updateDraft('')
  clearFiles()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === '/' && !localDraft.value && !isPrivateNote.value) {
    event.preventDefault()
    emit('open-canned')
    return
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}

const insertEmoji = (emoji: string) => {
  updateDraft(`${localDraft.value}${emoji}`)
  textareaRef.value?.focus()
}
</script>

<template>
  <footer class="reply-box" :class="{ 'reply-box--closed': isChatClosed }">
    <div v-if="showTakeoverButton" class="takeover-hero">
      <div class="takeover-hero__copy">
        <strong>{{ handledByAI ? 'AI 正在处理此会话' : '会话等待人工接入' }}</strong>
        <span>{{ handlerCaption }}</span>
      </div>
      <div class="takeover-hero__actions">
        <button class="btn-primary" type="button" :disabled="isLoading" @click="emit('takeover')">
          <span aria-hidden="true">↗</span>
          立即人工接管
        </button>
        <button v-if="handledByAI" class="btn-secondary" type="button" :disabled="isLoading" @click="emit('route-to-team')">
          <span aria-hidden="true">⇄</span>
          转交团队
        </button>
      </div>
    </div>

    <div v-else-if="isChatClosed" class="closed-status-bar">
      <span class="status-icon" aria-hidden="true">✓</span>
      <div>
        <strong>本次客户会话已解决并归档关闭</strong>
        <span>如需继续沟通，请等待客户发起新的消息。</span>
      </div>
    </div>

    <div v-else-if="handledByAI" class="ai-status-bar">
      <span>此会话由 AI 智能体自动应答中</span>
      <button type="button" class="btn-secondary" :disabled="isLoading" @click="emit('route-to-team')">转交团队</button>
    </div>

    <div v-else class="composer-shell">
      <div class="composer-toolbar">
        <div class="mode-tabs" role="tablist" aria-label="消息类型">
          <button
            class="mode-tab-btn"
            :class="{ active: mode === 'reply' }"
            type="button"
            role="tab"
            :aria-selected="mode === 'reply'"
            @click="selectMode('reply')"
          >
            <span aria-hidden="true">↗</span> 回复客户 (Reply)
          </button>
          <button
            class="mode-tab-btn mode-tab-btn--note"
            :class="{ active: mode === 'note' }"
            type="button"
            role="tab"
            :aria-selected="mode === 'note'"
            @click="selectMode('note')"
          >
            <span aria-hidden="true">▤</span> 内部便签 (Private Note)
          </button>
        </div>
        <ConversationAIToggle
          :session-id="sessionId"
          :ai-enabled="aiAutoReply"
          :loading="aiToggleLoading"
          @toggle="(value: boolean) => emit('toggle-ai', value)"
        />
      </div>

      <div class="composer-card" :class="{ 'is-private-note': isPrivateNote, 'is-disabled': !canCompose }">
        <textarea
          ref="textareaRef"
          :value="localDraft"
          :disabled="!canCompose"
          :placeholder="isPrivateNote ? '记录团队可见的备忘便签…' : '输入回复内容…（Enter 发送，Shift+Enter 换行，输入 / 调用话术）'"
          rows="3"
          @input="updateDraft(($event.target as HTMLTextAreaElement).value)"
          @keydown="handleKeydown"
        />

        <div class="composer-actions">
          <div class="tool-actions">
            <FileUpload
              v-if="allowAttachments"
              ref="fileUploadRef"
              :max-files="3"
              @filesUploaded="handleFilesUploaded"
              @error="handleFileError"
            />
            <button type="button" class="icon-btn" title="插入快捷话术" @click="emit('open-canned')">⌁</button>
            <button type="button" class="icon-btn" title="AI Copilot 草稿" @click="emit('open-copilot')">✦</button>
            <button type="button" class="icon-btn" title="插入表情" @click="insertEmoji('🙂')">☺</button>
            <button type="button" class="icon-btn" title="转交会话" @click="emit('open-transfer')">⇄</button>
          </div>
          <div class="send-actions">
            <span class="enter-hint">Enter 发送</span>
            <button class="btn-send" type="button" :disabled="!canCompose || (!localDraft.trim() && !selectedFiles.length)" @click="send">
              <span aria-hidden="true">➤</span>
              {{ sendLabel }}
            </button>
            <button v-if="!isPrivateNote" type="button" class="end-chat-btn" :disabled="!canCompose || isLoading" title="结束并归档会话" @click="emit('end-chat')">✓</button>
          </div>
        </div>
      </div>
      <div v-if="!canCompose" class="composer-caption">{{ handlerCaption }}</div>
      <button v-if="canCompose && !handledByAI" type="button" class="hand-back-btn" @click="emit('hand-back-to-ai')">交还给 AI 自动处理</button>
    </div>
  </footer>
</template>

<style scoped>
.reply-box { flex: 0 0 auto; border-top: 1px solid var(--o08); background: var(--bg2); padding: 12px 16px calc(12px + var(--safe-bottom, 0px)); color: var(--text); }
.composer-shell { display: flex; flex-direction: column; gap: 7px; }
.composer-toolbar, .composer-actions, .send-actions, .tool-actions, .mode-tabs, .takeover-hero__actions, .closed-status-bar, .ai-status-bar { display: flex; align-items: center; }
.composer-toolbar { justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--o08); padding-bottom: 7px; }
.mode-tabs { gap: 4px; min-width: 0; }
.mode-tab-btn { border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); padding: 7px 8px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.mode-tab-btn.active { color: var(--c-teal); border-bottom-color: var(--c-teal); }
.mode-tab-btn--note.active { color: var(--warning); border-bottom-color: var(--warning); }
.composer-card { border: 1px solid var(--o12); border-radius: 10px; background: var(--bg); padding: 10px; transition: border-color .15s ease; }
.composer-card:focus-within { border-color: var(--teal-border); }
.composer-card.is-private-note { border-color: color-mix(in srgb, var(--warning) 55%, transparent); background: color-mix(in srgb, var(--warning) 5%, var(--bg)); }
.composer-card.is-disabled { opacity: .7; }
.composer-card textarea { width: 100%; resize: vertical; min-height: 68px; max-height: 220px; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 13px; line-height: 1.55; }
.composer-card textarea::placeholder { color: var(--text-placeholder, var(--muted)); }
.composer-actions { justify-content: space-between; gap: 10px; border-top: 1px solid var(--o08); padding-top: 8px; }
.tool-actions { gap: 4px; min-width: 0; }
.icon-btn, .end-chat-btn { width: 30px; height: 30px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--muted); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; }
.icon-btn:hover, .end-chat-btn:hover { background: var(--o08); color: var(--text); }
.send-actions { gap: 6px; }
.enter-hint { color: var(--muted); font-size: 10px; white-space: nowrap; }
.btn-send, .btn-primary, .btn-secondary { min-height: 34px; border-radius: 7px; padding: 0 12px; border: 1px solid transparent; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
.btn-send, .btn-primary { background: var(--accent-solid); color: var(--on-accent-solid); }
.btn-send:disabled, .btn-primary:disabled, .btn-secondary:disabled, .end-chat-btn:disabled { opacity: .55; cursor: not-allowed; }
.btn-secondary { background: var(--o06); border-color: var(--o12); color: var(--text); }
.btn-secondary:hover:not(:disabled) { background: var(--o10); }
.end-chat-btn { color: var(--c-danger); border-color: color-mix(in srgb, var(--c-danger) 35%, transparent); }
.composer-caption, .hand-back-btn { color: var(--muted); font-size: 11px; text-align: center; }
.hand-back-btn { border: 0; background: transparent; color: var(--c-teal); cursor: pointer; align-self: center; }
.takeover-hero { border: 1px solid var(--teal-border); border-radius: 10px; padding: 13px; background: var(--teal-bg-10); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.takeover-hero__copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.takeover-hero__copy strong { font-size: 13px; }
.takeover-hero__copy span { color: var(--muted); font-size: 11px; }
.takeover-hero__actions { gap: 7px; flex-wrap: wrap; justify-content: flex-end; }
.closed-status-bar { gap: 10px; padding: 12px; border-radius: 10px; background: var(--o05); color: var(--muted); }
.closed-status-bar strong, .closed-status-bar span { display: block; }
.closed-status-bar strong { color: var(--text); font-size: 12px; margin-bottom: 3px; }
.closed-status-bar span { font-size: 11px; }
.status-icon { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--o10); color: var(--muted); }
.ai-status-bar { justify-content: space-between; gap: 10px; padding: 11px 12px; border-radius: 10px; background: var(--teal-bg-10); border: 1px solid var(--teal-border); color: var(--text); font-size: 12px; }
@media (max-width: 600px) { .reply-box { padding-inline: 10px; } .composer-toolbar { align-items: flex-start; flex-direction: column; } .composer-actions { align-items: flex-end; } .enter-hint { display: none; } .takeover-hero { align-items: stretch; flex-direction: column; } .takeover-hero__actions { justify-content: stretch; } .takeover-hero__actions > * { flex: 1; } }
</style>
