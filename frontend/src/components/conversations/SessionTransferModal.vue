<script setup lang="ts">
import { ref, watch } from 'vue'
import { listTeammates, type Teammate } from '@/services/users'

const props = withDefaults(defineProps<{
  show: boolean
  currentUserId?: string | null
  actionLoading?: boolean
}>(), { currentUserId: null, actionLoading: false })

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'transfer', targetUserId: string, note: string): void
  (e: 'hand-back-to-ai'): void
}>()

const teammates = ref<Teammate[]>([])
const selectedTarget = ref('')
const note = ref('')
const loading = ref(false)
const error = ref('')

const loadTeammates = async () => {
  loading.value = true
  error.value = ''
  try {
    teammates.value = (await listTeammates()).filter(user => user.id !== props.currentUserId)
    if (!selectedTarget.value || !teammates.value.some(user => user.id === selectedTarget.value)) {
      selectedTarget.value = teammates.value[0]?.id || ''
    }
  } catch (err: any) {
    error.value = err.response?.data?.detail || '无法加载团队成员，请刷新后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (show) => {
  if (show) {
    note.value = ''
    void loadTeammates()
  }
})

const confirm = () => {
  if (!selectedTarget.value || props.actionLoading) return
  emit('transfer', selectedTarget.value, note.value.trim())
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
      <header class="modal-header">
        <div>
          <h2 id="transfer-title">转交会话</h2>
          <p>选择实际可处理该客户问题的团队成员。</p>
        </div>
        <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
      </header>
      <div class="modal-body">
        <label class="field-label" for="transfer-target">团队成员</label>
        <select id="transfer-target" v-model="selectedTarget" :disabled="loading || !teammates.length || actionLoading">
          <option value="" disabled>{{ loading ? '正在加载…' : '请选择成员' }}</option>
          <option v-for="user in teammates" :key="user.id" :value="user.id">
            {{ user.full_name || user.email }}<template v-if="user.full_name"> · {{ user.email }}</template><template v-if="user.is_online"> · 在线</template>
          </option>
        </select>
        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-else-if="!loading && !teammates.length" class="muted">当前没有可转交的团队成员。</p>

        <label class="field-label" for="transfer-note">交接备注（可选，仅团队可见）</label>
        <textarea id="transfer-note" v-model="note" rows="3" :disabled="actionLoading" placeholder="说明已核实的事实、待处理事项或客户的明确诉求…" />
        <p class="muted">备注会先以内部便签保存，再执行转交。</p>
      </div>
      <footer class="modal-footer">
        <button type="button" class="btn-secondary" :disabled="actionLoading" @click="emit('hand-back-to-ai')">交还给 AI</button>
        <span class="footer-spacer" />
        <button type="button" class="btn-secondary" :disabled="actionLoading" @click="emit('close')">取消</button>
        <button type="button" class="btn-primary" :disabled="loading || !selectedTarget || actionLoading" @click="confirm">{{ actionLoading ? '处理中…' : '确认转交' }}</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.68); }
.modal { width: min(520px, 100%); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--o12); border-radius: 10px; background: var(--bg2); color: var(--text); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
.modal-header, .modal-footer { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.modal-header { justify-content: space-between; }
.modal-footer { border-top: 1px solid var(--o08); border-bottom: 0; }
.modal-header h2 { margin: 0; font-size: 16px; }
.modal-header p, .muted { margin: 5px 0 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 22px; cursor: pointer; }
.icon-button:hover { background: var(--o08); color: var(--text); }
.modal-body { padding: 16px; overflow-y: auto; display: grid; gap: 8px; }
.field-label { margin-top: 3px; font-size: 12px; font-weight: 600; }
select, textarea { width: 100%; border: 1px solid var(--o12); border-radius: 7px; background: var(--bg); color: var(--text); padding: 10px; outline: none; font: inherit; font-size: 13px; }
select:focus, textarea:focus { border-color: var(--teal-border); }
textarea { resize: vertical; }
.error-text { margin: 0; color: var(--c-danger); font-size: 12px; }
.footer-spacer { flex: 1; }
.btn-primary, .btn-secondary { min-height: 34px; padding: 0 12px; border-radius: 7px; border: 1px solid transparent; font-size: 12px; cursor: pointer; white-space: nowrap; }
.btn-primary { background: var(--accent-solid); color: var(--on-accent-solid); }
.btn-secondary { background: var(--o06); border-color: var(--o12); color: var(--text); }
button:disabled { opacity: .5; cursor: not-allowed; }
</style>
