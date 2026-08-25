<script setup lang="ts">
import { computed } from 'vue'
import type { ShopifyOrder } from '@/services/chat'

const props = defineProps<{
  show: boolean
  order?: ShopifyOrder | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'send-to-chat', text: string): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const fulfillments = computed(() => props.order?.fulfillments || [])
const trackingNumbers = computed(() => fulfillments.value.flatMap(item => item.tracking_numbers || []).filter(Boolean))
const trackingUrls = computed(() => fulfillments.value.flatMap(item => item.tracking_urls || []).filter(Boolean))
const hasData = computed(() => fulfillments.value.length > 0 && (trackingNumbers.value.length > 0 || trackingUrls.value.length > 0))

const copy = async (value: string, label: string) => {
  if (!value) return
  if (!navigator.clipboard) {
    emit('action-toast', '无法访问剪贴板，请手动复制', 'error')
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    emit('action-toast', label, 'success')
  } catch {
    emit('action-toast', '复制失败，请手动复制', 'error')
  }
}

const insertDraft = () => {
  const orderLabel = props.order?.name ? `订单 ${props.order.name}` : '您的订单'
  const carrier = fulfillments.value.map(item => (item as any).tracking_company).filter(Boolean)[0]
  const parts = [carrier ? `承运商：${carrier}` : '', trackingNumbers.value.length ? `运单号：${trackingNumbers.value.join('、')}` : '', trackingUrls.value.length ? `查询链接：${trackingUrls.value[0]}` : ''].filter(Boolean)
  if (!parts.length) return
  emit('send-to-chat', `${orderLabel}的物流信息如下：${parts.join('；')}。如需进一步核实，我可以继续为您查询。`)
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="tracking-title">
      <header class="modal-header">
        <div>
          <h2 id="tracking-title">物流信息</h2>
          <p>{{ order?.name || '当前订单' }} · 仅展示 Shopify 返回的数据</p>
        </div>
        <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
      </header>
      <div class="modal-body">
        <div v-if="!hasData" class="empty">Shopify 尚未返回可用的运单号、物流链接或履约记录。</div>
        <template v-else>
          <article v-for="(fulfillment, index) in fulfillments" :key="index" class="fulfillment">
            <div class="timeline-dot" :class="{ active: index === fulfillments.length - 1 }" />
            <div class="fulfillment-content">
              <strong>{{ (fulfillment as any).status || (fulfillment as any).shipment_status || '履约记录' }}</strong>
              <span v-if="(fulfillment as any).tracking_company">{{ (fulfillment as any).tracking_company }}</span>
              <span v-if="fulfillment.tracking_numbers?.length">运单号：{{ fulfillment.tracking_numbers.join('、') }}</span>
              <div v-if="fulfillment.tracking_urls?.length" class="url-list">
                <a v-for="url in fulfillment.tracking_urls" :key="url" :href="url" target="_blank" rel="noreferrer">{{ url }}</a>
              </div>
            </div>
          </article>
          <div v-if="trackingNumbers.length" class="copy-row">
            <span>运单号：{{ trackingNumbers.join('、') }}</span>
            <button type="button" class="link-button" @click="copy(trackingNumbers.join(', '), '运单号已复制')">复制</button>
          </div>
          <div v-if="trackingUrls.length" class="copy-row">
            <span>追踪链接：{{ trackingUrls[0] }}</span>
            <button type="button" class="link-button" @click="copy(trackingUrls[0], '物流链接已复制')">复制链接</button>
          </div>
        </template>
      </div>
      <footer class="modal-footer">
        <button type="button" class="btn-secondary" @click="emit('close')">关闭</button>
        <button type="button" class="btn-primary" :disabled="!hasData" @click="insertDraft">插入回复草稿</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 65; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.68); }
.modal { width: min(560px, 100%); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--o12); border-radius: 10px; background: var(--bg2); color: var(--text); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
.modal-header, .modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.modal-footer { justify-content: flex-end; border-top: 1px solid var(--o08); border-bottom: 0; }
.modal-header h2 { margin: 0; font-size: 16px; }
.modal-header p { margin: 5px 0 0; color: var(--muted); font-size: 11px; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 22px; cursor: pointer; }
.icon-button:hover { background: var(--o08); color: var(--text); }
.modal-body { padding: 16px; overflow-y: auto; }
.empty { margin: 0; padding: 35px 10px; color: var(--muted); text-align: center; font-size: 12px; line-height: 1.5; }
.fulfillment { position: relative; display: flex; gap: 12px; padding: 0 0 18px 18px; border-left: 1px solid var(--o12); }
.fulfillment:last-of-type { padding-bottom: 8px; }
.timeline-dot { position: absolute; left: -5px; top: 2px; width: 9px; height: 9px; border: 2px solid var(--bg2); border-radius: 50%; background: var(--o12); }
.timeline-dot.active { background: var(--c-teal); }
.fulfillment-content { display: grid; gap: 4px; min-width: 0; font-size: 12px; }
.fulfillment-content strong { font-size: 13px; }
.fulfillment-content span { color: var(--muted); }
.url-list { display: grid; gap: 3px; }
.url-list a { color: var(--c-teal); font-size: 11px; overflow-wrap: anywhere; }
.copy-row { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; padding: 9px; border: 1px solid var(--o08); border-radius: 7px; color: var(--muted); font-size: 11px; }
.copy-row span { min-width: 0; overflow-wrap: anywhere; }
.link-button { border: 0; background: transparent; color: var(--c-teal); cursor: pointer; white-space: nowrap; }
.btn-primary, .btn-secondary { min-height: 34px; padding: 0 12px; border-radius: 7px; border: 1px solid transparent; font-size: 12px; cursor: pointer; }
.btn-primary { background: var(--accent-solid); color: var(--on-accent-solid); }
.btn-secondary { background: var(--o06); border-color: var(--o12); color: var(--text); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
</style>
