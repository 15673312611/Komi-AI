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
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="canned-title">
      <header class="modal-header">
        <div>
          <h2 id="canned-title">快捷话术</h2>
          <p>从已配置的团队话术中选择，插入后仍可编辑。</p>
        </div>
        <div class="header-actions">
          <button v-if="canManageResponses" type="button" class="manage-button" @click="router.push('/settings/canned-responses'); emit('close')">管理</button>
          <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
        </div>
      </header>
      <div class="filters">
        <input v-model="query" type="search" placeholder="搜索标题、内容或快捷指令" autofocus />
        <select v-model="category" aria-label="话术分类">
          <option v-for="item in categories" :key="item" :value="item">{{ item === 'all' ? '全部分类' : item }}</option>
        </select>
      </div>
      <div class="response-list">
        <p v-if="loading" class="empty">正在加载快捷话术…</p>
        <p v-else-if="error" class="empty error-text">{{ error }}<button type="button" class="retry-button" @click="loadResponses">重试</button></p>
        <button v-for="item in filtered" :key="item.id" type="button" class="response-item" @click="select(item)">
          <span class="response-item__title">{{ item.title }}</span>
          <span class="response-item__meta">{{ item.category }}<template v-if="item.shortcut"> · {{ item.shortcut }}</template></span>
          <span class="response-item__content">{{ item.content }}</span>
        </button>
        <p v-if="!loading && !error && !filtered.length" class="empty">没有匹配的话术。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.68); }
.modal { width: min(620px, 100%); max-height: min(680px, 90vh); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--o12); border-radius: 10px; background: var(--bg2); color: var(--text); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.header-actions { display: flex; align-items: center; gap: 6px; }
.manage-button, .retry-button { border: 1px solid var(--o12); border-radius: 6px; background: var(--o06); color: var(--text); cursor: pointer; font-size: 11px; padding: 5px 8px; }
.retry-button { margin-left: 8px; color: var(--c-teal); }
.modal-header h2 { margin: 0; font-size: 16px; }
.modal-header p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 22px; cursor: pointer; }
.icon-button:hover { background: var(--o08); color: var(--text); }
.filters { display: grid; grid-template-columns: 1fr 150px; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--o08); }
.filters input, .filters select { min-width: 0; border: 1px solid var(--o12); border-radius: 7px; background: var(--bg); color: var(--text); padding: 9px 10px; font-size: 12px; outline: none; }
.filters input:focus, .filters select:focus { border-color: var(--teal-border); }
.response-list { padding: 10px; overflow-y: auto; display: grid; gap: 7px; }
.response-item { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; text-align: left; border: 1px solid var(--o08); border-radius: 8px; padding: 11px; background: transparent; color: var(--text); cursor: pointer; }
.response-item:hover { border-color: var(--teal-border); background: var(--o05); }
.response-item__title { font-size: 13px; font-weight: 600; }
.response-item__meta { color: var(--muted); font-size: 10px; }
.response-item__content { grid-column: 1 / -1; color: var(--muted); font-size: 12px; line-height: 1.5; }
.empty { padding: 36px 16px; margin: 0; text-align: center; color: var(--muted); font-size: 12px; }
.error-text { color: var(--c-danger); }
@media (max-width: 520px) { .filters { grid-template-columns: 1fr; } .response-item { grid-template-columns: 1fr; } }
</style>
