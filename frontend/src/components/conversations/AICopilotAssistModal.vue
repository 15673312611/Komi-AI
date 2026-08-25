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
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="copilot-title">
      <header class="modal-header">
        <div>
          <h2 id="copilot-title">AI Copilot</h2>
          <p>仅生成草稿，不会自动发送，也不会修改会话记录。</p>
        </div>
        <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
      </header>
      <div class="modal-body">
        <label class="field-label" for="copilot-draft">待处理草稿</label>
        <textarea id="copilot-draft" v-model="draftText" :disabled="loading" rows="4" placeholder="输入事实、语气和你希望表达的要点…" />
        <div class="mode-grid" role="radiogroup" aria-label="Copilot 模式">
          <button type="button" :disabled="loading" :class="{ active: mode === 'polite' }" @click="generate('polite')">专业礼貌</button>
          <button type="button" :disabled="loading" :class="{ active: mode === 'concise' }" @click="generate('concise')">简洁明确</button>
          <button type="button" :disabled="loading" :class="{ active: mode === 'translate_en' }" @click="generate('translate_en')">自然英文</button>
          <button type="button" :disabled="loading" :class="{ active: mode === 'apology' }" @click="generate('apology')">诚恳致歉</button>
        </div>
        <div class="result-box" :class="{ error }">
          <div class="result-heading"><span>生成结果</span><span v-if="loading" class="spinner" aria-label="生成中" /></div>
          <p v-if="loading" class="muted">正在根据客户可见的会话内容生成草稿…</p>
          <p v-else-if="error" class="error-text">{{ error }}</p>
          <p v-else-if="result" class="result-text">{{ result }}</p>
          <p v-else class="muted">选择一种模式开始生成。</p>
        </div>
      </div>
      <footer class="modal-footer">
        <button type="button" class="btn-secondary" @click="emit('close')">取消</button>
        <button type="button" class="btn-primary" :disabled="loading || !result" @click="apply">插入草稿</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.68); }
.modal { width: min(560px, 100%); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--o12); border-radius: 10px; background: var(--bg2); color: var(--text); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
.modal-header, .modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.modal-footer { justify-content: flex-end; border-top: 1px solid var(--o08); border-bottom: 0; }
.modal-header h2 { margin: 0; font-size: 16px; }
.modal-header p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 22px; cursor: pointer; }
.icon-button:hover { background: var(--o08); color: var(--text); }
.modal-body { padding: 16px; overflow-y: auto; display: grid; gap: 9px; }
.field-label { font-size: 12px; font-weight: 600; }
textarea { width: 100%; resize: vertical; border: 1px solid var(--o12); border-radius: 7px; background: var(--bg); color: var(--text); padding: 10px; outline: none; font: inherit; font-size: 13px; line-height: 1.5; }
textarea:focus { border-color: var(--teal-border); }
.mode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.mode-grid button { min-height: 34px; border: 1px solid var(--o10); border-radius: 7px; background: transparent; color: var(--muted); font-size: 11px; cursor: pointer; }
.mode-grid button.active, .mode-grid button:hover { color: var(--text); border-color: var(--teal-border); background: var(--teal-bg-10); }
.mode-grid button:disabled, textarea:disabled { cursor: not-allowed; opacity: .6; }
.result-box { min-height: 120px; border: 1px solid var(--teal-border); border-radius: 8px; padding: 12px; background: var(--teal-bg-10); }
.result-box.error { border-color: color-mix(in srgb, var(--c-danger) 50%, transparent); background: color-mix(in srgb, var(--c-danger) 7%, var(--bg)); }
.result-heading { display: flex; align-items: center; justify-content: space-between; color: var(--c-teal); font-size: 11px; font-weight: 600; }
.result-text, .error-text, .muted { margin: 10px 0 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.error-text { color: var(--c-danger); }
.muted { color: var(--muted); }
.spinner { width: 13px; height: 13px; border: 2px solid var(--o12); border-top-color: var(--c-teal); border-radius: 50%; animation: spin .7s linear infinite; }
.btn-primary, .btn-secondary { min-height: 34px; padding: 0 13px; border: 1px solid transparent; border-radius: 7px; font-size: 12px; cursor: pointer; }
.btn-primary { background: var(--accent-solid); color: var(--on-accent-solid); }
.btn-secondary { background: var(--o06); border-color: var(--o12); color: var(--text); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) { .mode-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
