<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { cannedResponsesService, type CannedResponse, type CannedResponseInput } from '@/services/cannedResponses'
import { toast } from 'vue-sonner'

const responses = ref<CannedResponse[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const editingId = ref<string | null>(null)
const form = ref<CannedResponseInput>({ category: '', title: '', shortcut: '', content: '' })

const resetForm = () => {
  editingId.value = null
  form.value = { category: '', title: '', shortcut: '', content: '' }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    responses.value = await cannedResponsesService.list()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || '快捷话术加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const edit = (response: CannedResponse) => {
  editingId.value = response.id
  form.value = {
    category: response.category,
    title: response.title,
    shortcut: response.shortcut || '',
    content: response.content,
  }
}

const save = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const payload = { ...form.value, shortcut: form.value.shortcut?.trim() || null }
    const saved = editingId.value
      ? await cannedResponsesService.update(editingId.value, payload)
      : await cannedResponsesService.create(payload)
    const index = responses.value.findIndex(item => item.id === saved.id)
    if (index >= 0) responses.value.splice(index, 1, saved)
    else responses.value.push(saved)
    resetForm()
    toast.success('快捷话术已保存')
  } catch (err: any) {
    toast.error('保存失败', { description: err?.response?.data?.detail || '请检查内容后重试。' })
  } finally {
    saving.value = false
  }
}

const remove = async (response: CannedResponse) => {
  if (!window.confirm(`删除“${response.title}”？`)) return
  try {
    await cannedResponsesService.remove(response.id)
    responses.value = responses.value.filter(item => item.id !== response.id)
    if (editingId.value === response.id) resetForm()
    toast.success('快捷话术已删除')
  } catch (err: any) {
    toast.error('删除失败', { description: err?.response?.data?.detail || '请稍后重试。' })
  }
}

onMounted(load)
</script>

<template>
  <DashboardLayout>
    <main class="page-shell">
      <header class="page-header">
        <div>
          <h1>快捷话术</h1>
          <p>用于会话回复区的团队共享模板。</p>
        </div>
        <button type="button" class="secondary-button" @click="load" :disabled="loading">刷新</button>
      </header>

      <div class="workspace">
        <section class="response-list" aria-label="快捷话术列表">
          <div v-if="loading" class="empty-state">正在加载…</div>
          <div v-else-if="error" class="empty-state error-state">{{ error }}<button type="button" class="link-button" @click="load">重试</button></div>
          <div v-else-if="!responses.length" class="empty-state">暂未配置快捷话术。</div>
          <article v-for="response in responses" v-else :key="response.id" class="response-row">
            <div class="response-content">
              <div class="response-heading">
                <strong>{{ response.title }}</strong>
                <span class="category-chip">{{ response.category }}</span>
                <code v-if="response.shortcut">{{ response.shortcut }}</code>
              </div>
              <p>{{ response.content }}</p>
            </div>
            <div class="row-actions">
              <button type="button" class="icon-button" aria-label="编辑话术" title="编辑" @click="edit(response)"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="icon-button danger" aria-label="删除话术" title="删除" @click="remove(response)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </article>
        </section>

        <aside class="editor-panel">
          <h2>{{ editingId ? '编辑话术' : '新建话术' }}</h2>
          <label>标题<input v-model="form.title" maxlength="120" placeholder="例如：物流核实说明" /></label>
          <label>分类<input v-model="form.category" maxlength="64" placeholder="例如：物流" /></label>
          <label>快捷指令<input v-model="form.shortcut" maxlength="40" placeholder="例如：/shipping" /></label>
          <label>内容<textarea v-model="form.content" rows="8" maxlength="8000" placeholder="可使用 {{customer_name}} 与 {{order_number}} 变量。" /></label>
          <div class="editor-actions">
            <button type="button" class="secondary-button" :disabled="saving" @click="resetForm">取消</button>
            <button type="button" class="primary-button" :disabled="saving || !form.title.trim() || !form.category.trim() || !form.content.trim()" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
          </div>
        </aside>
      </div>
    </main>
  </DashboardLayout>
</template>

<style scoped>
.page-shell { height: 100%; overflow: auto; padding: 28px; color: var(--text); background: var(--bg); }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid var(--o08); }
.page-header h1 { margin: 0; font-size: 22px; }
.page-header p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: 24px; padding-top: 24px; }
.response-list { min-width: 0; }
.response-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--o08); }
.response-content { min-width: 0; }
.response-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.response-heading strong { font-size: 14px; }
.category-chip, code { padding: 2px 6px; border-radius: 5px; background: var(--o06); border: 1px solid var(--o10); color: var(--muted); font-size: 10px; }
.response-content p { margin: 8px 0 0; color: var(--text2); font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.row-actions { display: flex; gap: 5px; flex-shrink: 0; }
.icon-button { width: 32px; height: 32px; border: 1px solid var(--o10); border-radius: 6px; background: var(--surface); color: var(--muted); cursor: pointer; }
.icon-button:hover { color: var(--text); background: var(--o08); }
.icon-button.danger:hover { color: var(--c-danger); }
.editor-panel { position: sticky; top: 0; align-self: start; display: grid; gap: 11px; padding: 18px; border: 1px solid var(--o10); border-radius: 8px; background: var(--bg2); }
.editor-panel h2 { margin: 0 0 4px; font-size: 15px; }
label { display: grid; gap: 6px; color: var(--text2); font-size: 12px; font-weight: 600; }
input, textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--o12); border-radius: 6px; padding: 9px 10px; background: var(--bg); color: var(--text); font: inherit; font-size: 13px; }
textarea { resize: vertical; line-height: 1.5; }
input:focus, textarea:focus { outline: none; border-color: var(--teal-border); }
.editor-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 5px; }
.primary-button, .secondary-button { min-height: 34px; border: 1px solid transparent; border-radius: 6px; padding: 0 12px; cursor: pointer; font-size: 12px; }
.primary-button { background: var(--accent-solid); color: var(--on-accent-solid); }
.secondary-button { background: var(--o06); border-color: var(--o12); color: var(--text); }
button:disabled { opacity: .55; cursor: not-allowed; }
.empty-state { padding: 50px 16px; text-align: center; color: var(--muted); font-size: 13px; }
.error-state { color: var(--c-danger); }
.link-button { margin-left: 9px; border: 0; background: transparent; color: inherit; cursor: pointer; text-decoration: underline; }
@media (max-width: 900px) { .page-shell { padding: 18px; } .workspace { grid-template-columns: 1fr; } .editor-panel { position: static; } }
</style>
