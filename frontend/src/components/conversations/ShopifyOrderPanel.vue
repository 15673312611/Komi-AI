<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { chatService, type ShopifyOrder, type ShopifyOrdersResponse } from '@/services/chat'

const props = defineProps<{ sessionId: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-tracking', order: ShopifyOrder): void
}>()

const response = ref<ShopifyOrdersResponse | null>(null)
const orders = ref<ShopifyOrder[]>([])
const loading = ref(true)
const error = ref('')

const loadOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    response.value = await chatService.getShopifyOrders(props.sessionId)
    orders.value = response.value.orders || []
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Shopify 订单暂时无法加载。'
    response.value = null
    orders.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadOrders() })

const statusMessage = computed(() => {
  if (error.value) return error.value
  switch (response.value?.status) {
    case 'shopify_not_configured': return '组织尚未配置 Shopify 店铺或客服权限。'
    case 'customer_email_missing': return '当前会话没有可用于匹配订单的客户邮箱。'
    case 'shopify_unavailable': return 'Shopify 暂时不可用，请稍后重试。'
    case 'no_orders': return '没有找到与当前客户邮箱匹配的订单。'
    default: return ''
  }
})

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '未提供'
const formatMoney = (order: ShopifyOrder) => {
  if (!order.total_price) return '未提供金额'
  return `${order.currency || ''} ${order.total_price}`.trim()
}
const fulfillment = (order: ShopifyOrder) => order.fulfillment_status || '未发货'
const payment = (order: ShopifyOrder) => order.financial_status || '未知'
const hasTracking = (order: ShopifyOrder) => (order.fulfillments || []).some(item => (item.tracking_numbers || []).length || (item.tracking_urls || []).length)

const copy = async (value: string | null | undefined) => {
  if (!value) return
  try { await navigator.clipboard?.writeText(value) } catch { /* clipboard permission is optional */ }
}
</script>

<template>
  <div class="drawer-backdrop" @click.self="emit('close')">
    <aside class="order-panel" role="dialog" aria-modal="true" aria-labelledby="shopify-title">
      <header class="panel-header">
        <div>
          <h2 id="shopify-title">Shopify 订单</h2>
          <p>仅显示与当前会话客户邮箱精确匹配的订单。</p>
        </div>
        <div class="header-actions">
          <button type="button" class="icon-button" :disabled="loading" title="刷新订单" @click="loadOrders">↻</button>
          <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
        </div>
      </header>

      <div class="panel-body">
        <div v-if="loading" class="state">正在从 Shopify 加载订单…</div>
        <div v-else-if="statusMessage" class="state">{{ statusMessage }}</div>
        <div v-else class="order-list">
          <article v-for="order in orders" :key="String(order.id)" class="order-card">
            <div class="order-heading">
              <div>
                <strong>{{ order.name || `订单 ${order.id}` }}</strong>
                <span>{{ formatDate(order.processed_at || order.created_at) }}</span>
              </div>
              <button type="button" class="copy-button" title="复制订单号" @click="copy(order.name || order.id)">复制</button>
            </div>
            <div class="status-row">
              <span class="status-chip">付款：{{ payment(order) }}</span>
              <span class="status-chip">履约：{{ fulfillment(order) }}</span>
              <span class="order-total">{{ formatMoney(order) }}</span>
            </div>
            <div v-if="order.line_items?.length" class="line-items">
              <div v-for="item in order.line_items" :key="String(item.id || item.name)" class="line-item">
                <span>{{ item.name || '未命名商品' }}<template v-if="item.variant_title"> · {{ item.variant_title }}</template></span>
                <span>{{ item.quantity || 0 }} × {{ item.price || '未提供' }}</span>
              </div>
            </div>
            <div v-if="hasTracking(order)" class="tracking-row">
              <span>已有物流信息</span>
              <button type="button" class="link-button" @click="emit('open-tracking', order)">查看轨迹</button>
            </div>
            <div v-else class="muted">该订单暂未返回运单信息。</div>
          </article>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-backdrop { position: fixed; inset: 0; z-index: 55; display: flex; justify-content: flex-end; background: rgba(0,0,0,.5); }
.order-panel { width: min(480px, 100%); height: 100%; display: flex; flex-direction: column; background: var(--bg2); color: var(--text); border-left: 1px solid var(--o12); box-shadow: -20px 0 60px rgba(0,0,0,.28); }
.panel-header { display: flex; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.panel-header h2 { margin: 0; font-size: 16px; }
.panel-header p { margin: 5px 0 0; color: var(--muted); font-size: 11px; line-height: 1.45; }
.header-actions { display: flex; gap: 5px; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 20px; cursor: pointer; }
.icon-button:hover:not(:disabled) { background: var(--o08); color: var(--text); }
.icon-button:disabled { opacity: .5; cursor: not-allowed; }
.panel-body { flex: 1; overflow-y: auto; padding: 12px; }
.state { padding: 38px 16px; text-align: center; color: var(--muted); font-size: 12px; }
.order-list { display: grid; gap: 9px; }
.order-card { border: 1px solid var(--o10); border-radius: 9px; padding: 12px; background: var(--bg); }
.order-heading, .status-row, .tracking-row, .line-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.order-heading strong { display: block; font-size: 13px; }
.order-heading span { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; }
.copy-button, .link-button { border: 0; background: transparent; color: var(--c-teal); font-size: 11px; cursor: pointer; }
.status-row { flex-wrap: wrap; margin-top: 10px; }
.status-chip { padding: 3px 6px; border: 1px solid var(--o10); border-radius: 5px; color: var(--muted); font-size: 10px; }
.order-total { margin-left: auto; font-size: 12px; font-weight: 600; }
.line-items { display: grid; gap: 5px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--o08); }
.line-item { color: var(--muted); font-size: 11px; }
.line-item span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tracking-row { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--o08); color: var(--muted); font-size: 11px; }
.muted { margin-top: 10px; color: var(--muted); font-size: 11px; }
</style>
