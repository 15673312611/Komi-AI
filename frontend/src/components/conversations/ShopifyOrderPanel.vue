<!--
Copyright 2024-2026 ChatterMate
右栏：Shopify 电商订单面板 (ShopifyOrderPanel.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { chatService, type ShopifyOrder, type ShopifyShippingAddress } from '@/services/chat'
import { connectToShopify } from '@/services/shopify'
import { permissionChecks } from '@/utils/permissions'

const props = withDefaults(defineProps<{
  sessionId?: string
  canManageChat?: boolean
}>(), {
  sessionId: '',
  canManageChat: true,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-tracking', order: any): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

type ActionType = 'refund' | 'address' | 'invoice'

const orders = ref<ShopifyOrder[]>([])
const orderCount = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const hasNextPage = ref(false)
const nextCursor = ref<string | undefined>()
const showAllOrders = ref(false)
const writeOrdersEnabled = ref(false)
const shopDomain = ref('')
const selectedOrderId = ref<string>('')
const activeAction = ref<ActionType | null>(null)
const actionLoading = ref(false)
const actionIdempotencyKey = ref('')
const refundPreview = ref<{ amount?: string | number | null; currency?: string | null; refundable: boolean } | null>(null)
const refundPreviewLoading = ref(false)
const addressDraft = ref<ShopifyShippingAddress & { recipient_name?: string }>({
  recipient_name: '', address1: '', address2: '', city: '', province: '', country: '', zip: '', phone: '',
})
let loadRequest = 0
let actionContextVersion = 0
let refundPreviewRequest = 0
let actionRequest = 0

const selectedOrder = computed(() => orders.value.find(item => String(item.id) === selectedOrderId.value) || orders.value[0])
const order = computed(() => selectedOrder.value ? {
  ...selectedOrder.value,
  number: selectedOrder.value.name,
  payStatus: selectedOrder.value.financial_status || '未知支付状态',
  fulfillStatus: selectedOrder.value.fulfillment_status || '待履约',
  products: (selectedOrder.value.line_items || []).map(item => ({ ...item, title: item.title || '商品', specs: item.sku || '', price: String(item.price || ''), qty: item.quantity || 1 })),
  carrier: selectedOrder.value.fulfillments?.[0]?.tracking_company || '',
  tracking: selectedOrder.value.fulfillments?.[0]?.tracking_numbers?.[0] || '',
} : null)

const actionOrder = computed(() => order.value)
const canPerformOrderWrites = computed(() => props.canManageChat && writeOrdersEnabled.value)
const idempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `shopify-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}

const clearOrderState = () => {
  orders.value = []
  orderCount.value = 0
  hasNextPage.value = false
  nextCursor.value = undefined
  shopDomain.value = ''
  writeOrdersEnabled.value = false
  selectedOrderId.value = ''
}

const clearActionState = () => {
  actionContextVersion += 1
  refundPreviewRequest += 1
  actionRequest += 1
  activeAction.value = null
  actionLoading.value = false
  actionIdempotencyKey.value = ''
  refundPreview.value = null
  refundPreviewLoading.value = false
  addressDraft.value = {
    recipient_name: '', address1: '', address2: '', city: '', province: '', country: '', zip: '', phone: '',
  }
}

const loadOrders = async (cursor?: string) => {
  const sessionId = props.sessionId
  const request = ++loadRequest
  if (!sessionId) {
    clearOrderState()
    loading.value = false
    loadingMore.value = false
    return
  }
  const isCurrentRequest = () => request === loadRequest && props.sessionId === sessionId
  if (cursor) loadingMore.value = true
  else {
    loading.value = true
    writeOrdersEnabled.value = false
  }
  try {
    const result = await chatService.getShopifyOrders(sessionId, cursor)
    if (!isCurrentRequest()) return
    const incoming = result.orders || []
    orders.value = cursor ? [...orders.value, ...incoming.filter(item => !orders.value.some(existing => existing.id === item.id))] : incoming
    if (!orders.value.some(item => String(item.id) === selectedOrderId.value)) selectedOrderId.value = String(orders.value[0]?.id || '')
    orderCount.value = orders.value.length
    hasNextPage.value = Boolean(result.has_next_page)
    nextCursor.value = result.end_cursor || undefined
    writeOrdersEnabled.value = Boolean(result.write_orders_enabled)
    shopDomain.value = result.shop_domain || ''
  } catch {
    if (isCurrentRequest() && !cursor) clearOrderState()
  } finally {
    if (isCurrentRequest()) {
      loading.value = false
      loadingMore.value = false
    }
  }
}
watch(() => props.sessionId, () => {
  showAllOrders.value = false
  clearActionState()
  clearOrderState()
  void loadOrders()
}, { immediate: true })

const copyText = async (text: string, label: string) => {
  if (!text) return
  if (!navigator.clipboard) {
    emit('action-toast', '无法访问剪贴板，请手动复制', 'error')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    emit('action-toast', label, 'success')
  } catch {
    emit('action-toast', '复制失败，请手动复制', 'error')
  }
}

const startShopifyReauthorization = () => {
  if (!shopDomain.value) return
  connectToShopify(shopDomain.value)
}

const openRefund = async () => {
  const sessionId = props.sessionId
  const selected = actionOrder.value
  if (!sessionId || !selected) return
  if (!props.canManageChat) {
    emit('action-toast', '您没有管理此会话的权限', 'error')
    return
  }
  if (!writeOrdersEnabled.value) {
    emit('action-toast', 'Shopify 缺少 write_orders 权限，请由管理员在集成设置中重新授权', 'error')
    return
  }
  const orderId = String(selected.id)
  const contextVersion = actionContextVersion
  const request = ++refundPreviewRequest
  const isCurrentRequest = () =>
    request === refundPreviewRequest &&
    contextVersion === actionContextVersion &&
    props.sessionId === sessionId &&
    activeAction.value === 'refund'
  activeAction.value = 'refund'
  actionIdempotencyKey.value = idempotencyKey()
  refundPreview.value = null
  refundPreviewLoading.value = true
  try {
    const preview = await chatService.getShopifyRefundPreview(sessionId, orderId)
    if (!isCurrentRequest()) return
    if (!preview.refundable) {
      activeAction.value = null
      emit('action-toast', '该订单当前没有可退款余额', 'info')
      return
    }
    refundPreview.value = preview
  } catch (err: any) {
    if (!isCurrentRequest()) return
    activeAction.value = null
    emit('action-toast', err?.response?.data?.detail || '无法获取退款金额', 'error')
  } finally {
    if (isCurrentRequest()) refundPreviewLoading.value = false
  }
}

const openAddress = () => {
  if (!actionOrder.value) return
  if (!props.canManageChat) {
    emit('action-toast', '您没有管理此会话的权限', 'error')
    return
  }
  if (!writeOrdersEnabled.value) {
    emit('action-toast', 'Shopify 缺少 write_orders 权限，请由管理员在集成设置中重新授权', 'error')
    return
  }
  const existing = actionOrder.value.shipping_address || {}
  addressDraft.value = {
    recipient_name: existing.name || '', address1: existing.address1 || '', address2: existing.address2 || '',
    city: existing.city || '', province: existing.province || '', country: existing.country || '',
    zip: existing.zip || '', phone: existing.phone || '',
  }
  activeAction.value = 'address'
  actionIdempotencyKey.value = idempotencyKey()
}

const openInvoice = () => {
  if (!actionOrder.value) return
  if (!props.canManageChat) {
    emit('action-toast', '您没有管理此会话的权限', 'error')
    return
  }
  if (!writeOrdersEnabled.value) {
    emit('action-toast', 'Shopify 缺少 write_orders 权限，请由管理员在集成设置中重新授权', 'error')
    return
  }
  activeAction.value = 'invoice'
  actionIdempotencyKey.value = idempotencyKey()
}

const submitAction = async () => {
  const sessionId = props.sessionId
  const selected = actionOrder.value
  const action = activeAction.value
  if (!sessionId || !selected || !action || !canPerformOrderWrites.value) return
  const orderId = String(selected.id)
  const address = { ...addressDraft.value }
  const idempotencyKeyForAction = actionIdempotencyKey.value || idempotencyKey()
  const contextVersion = actionContextVersion
  const request = ++actionRequest
  const isCurrentContext = () =>
    request === actionRequest && contextVersion === actionContextVersion && props.sessionId === sessionId
  actionLoading.value = true
  try {
    if (action === 'refund') {
      const result = await chatService.refundShopifyOrder(sessionId, orderId, { confirmed: true, idempotency_key: idempotencyKeyForAction })
      if (!isCurrentContext()) return
      emit('action-toast', `已完成退款${result.amount ? `：${result.currency || ''} ${result.amount}` : ''}`, 'success')
    } else if (action === 'address') {
      await chatService.updateShopifyShippingAddress(sessionId, orderId, {
        ...address,
        confirmed: true,
        idempotency_key: idempotencyKeyForAction,
      })
      if (!isCurrentContext()) return
      emit('action-toast', '收货地址已在 Shopify 更新', 'success')
    } else {
      await chatService.resendShopifyInvoice(sessionId, orderId, { confirmed: true, idempotency_key: idempotencyKeyForAction })
      if (!isCurrentContext()) return
      emit('action-toast', 'Shopify 已向订单客户邮箱重新发送凭证', 'success')
    }
    if (!isCurrentContext()) return
    activeAction.value = null
    await loadOrders()
  } catch (err: any) {
    if (!isCurrentContext()) return
    emit('action-toast', err?.response?.data?.detail || 'Shopify 操作失败，请稍后重试', 'error')
  } finally {
    if (isCurrentContext()) actionLoading.value = false
  }
}

</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
        <i class="fa-brands fa-shopify text-emerald-400 text-sm"></i>
        <span>关联 Shopify 订单</span>
      </span>
      <button
        type="button"
        :disabled="loading || !orderCount"
        class="text-[11px] text-emerald-400 hover:underline disabled:no-underline disabled:opacity-60 flex items-center gap-1"
        @click="showAllOrders = !showAllOrders"
      >
        <span>{{ loading ? '正在加载…' : showAllOrders ? '收起订单' : `查看全部 ${orderCount} 笔` }}</span>
        <i class="fa-solid fa-arrow-up-right-from-square fa-external-link-alt text-[9px]"></i>
      </button>
    </div>

    <!-- 当前最新关注订单卡片 (1:1 原版复刻) -->
    <div v-if="loading" class="rounded-xl bg-[#131B2E] border border-white/[0.08] p-6 text-center text-xs text-slate-400">正在加载订单…</div>
    <div v-else-if="!order" class="rounded-xl bg-[#131B2E] border border-white/[0.08] p-6 text-center text-xs text-slate-400">该客户没有可展示的 Shopify 订单，或此会话未关联 Shopify 店铺。</div>
    <div v-else class="rounded-xl bg-[#131B2E] border border-white/[0.08] p-3 space-y-3 shadow-md">
      <!-- 订单编号与状态 -->
      <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-bold text-slate-100 text-xs">{{ order.number }}</span>
          <button
              @click="copyText(order.number, '订单号已复制')"
            class="text-slate-400 hover:text-slate-200"
            title="复制订单号"
          >
            <i class="fa-regular fa-copy text-[10px]"></i>
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            {{ order.payStatus }}
          </span>
          <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {{ order.fulfillStatus }}
          </span>
        </div>
      </div>

      <!-- 订单商品清单 -->
      <div class="space-y-2">
        <div
          v-for="(prod, i) in order.products"
          :key="i"
          class="flex items-center gap-2 p-1.5 rounded-lg bg-[#080B11]/70 border border-white/[0.04] shadow-sm"
        >
          <div class="w-8 h-8 rounded-md bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-slate-500"><i class="fa-solid fa-box"></i></div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-slate-200 text-[11px] truncate">{{ prod.title }}</div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
              <span>{{ prod.specs }}</span>
              <span class="font-mono text-slate-300 font-bold">{{ prod.price }} × {{ prod.qty }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 物流单号与一键查询 (1:1 原版复刻) -->
      <div class="p-2 rounded-lg bg-[#080B11] border border-white/[0.08] text-xs space-y-1.5 shadow-inner">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-slate-400 flex items-center gap-1">
            <i class="fa-solid fa-truck-fast fa-shipping-fast text-emerald-400"></i>
            <span>{{ order.carrier }}</span>
          </span>
          <span class="text-emerald-400 font-mono text-[10px]">{{ order.fulfillment_status || '暂无履约状态' }}</span>
        </div>
        <div class="flex items-center justify-between font-mono text-[11px] text-slate-200">
          <span>{{ order.tracking }}</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="!order.tracking"
              @click="copyText(order.tracking, '运单号已复制')"
              class="text-slate-400 hover:text-emerald-300 text-[10px]"
              title="复制单号"
            >
              <i class="fa-regular fa-copy"></i>
            </button>
            <button
              :disabled="!order.tracking"
              @click="emit('open-tracking', order)"
              class="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-300 rounded text-[10px] font-sans font-medium"
            >
              实时轨迹
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-1.5 pt-1">
        <button
          type="button"
          :disabled="!canPerformOrderWrites"
          :title="props.canManageChat ? '创建 Shopify 全额退款' : '您没有管理此会话的权限'"
          @click="openRefund"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-40 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-solid fa-rotate-left fa-undo text-[10px]"></i>
          <span>发起退款</span>
        </button>
        <button
          type="button"
          :disabled="!canPerformOrderWrites"
          :title="props.canManageChat ? '更新 Shopify 收货地址' : '您没有管理此会话的权限'"
          @click="openAddress"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-40 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-solid fa-location-dot fa-map-marker-alt text-[10px]"></i>
          <span>改派地址</span>
        </button>
        <button
          type="button"
          :disabled="!canPerformOrderWrites"
          :title="props.canManageChat ? '通过 Shopify 重发订单凭证' : '您没有管理此会话的权限'"
          @click="openInvoice"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 disabled:opacity-40 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-regular fa-paper-plane text-[10px]"></i>
          <span>重发凭证</span>
        </button>
      </div>

      <div v-if="props.canManageChat && !writeOrdersEnabled" class="flex items-center justify-between gap-2 text-[10px] text-amber-300/80">
        <span>订单写操作需要管理员重新授权 Shopify。</span>
        <button v-if="permissionChecks.canManageOrganization() && shopDomain" type="button" class="shrink-0 text-emerald-300 hover:underline" @click="startShopifyReauthorization">重新授权</button>
      </div>
    </div>

    <div v-if="showAllOrders" class="mt-2 space-y-1.5">
      <button
        v-for="item in orders"
        :key="item.id"
        type="button"
        :class="['w-full flex items-center justify-between gap-2 rounded-lg border bg-[#131B2E] px-2.5 py-2 text-left hover:border-emerald-500/40', String(item.id) === selectedOrderId ? 'border-emerald-500/50' : 'border-white/[0.08]']"
        @click="selectedOrderId = String(item.id)"
      >
        <span class="min-w-0">
          <span class="block truncate font-mono text-[11px] font-semibold text-slate-100">{{ item.name }}</span>
          <span class="block truncate text-[10px] text-slate-400">{{ item.financial_status || '未知支付状态' }} · {{ item.fulfillment_status || '待履约' }}</span>
        </span>
        <span class="shrink-0 text-[10px] font-mono text-emerald-300">{{ item.currency || '' }} {{ item.total_price || '--' }}</span>
      </button>
      <button
        v-if="hasNextPage"
        type="button"
        :disabled="loadingMore"
        class="w-full rounded-lg border border-white/[0.08] bg-white/5 py-1.5 text-[11px] text-slate-300 hover:bg-white/10 disabled:opacity-50"
        @click="nextCursor && loadOrders(nextCursor)"
      >
        {{ loadingMore ? '正在加载…' : '加载更多订单' }}
      </button>
    </div>

    <div v-if="activeAction" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" @click.self="!actionLoading && (activeAction = null)">
      <section class="w-full max-w-sm rounded-lg border border-white/10 bg-[#111827] p-4 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-sm font-semibold text-slate-100">
              {{ activeAction === 'refund' ? '确认全额退款' : activeAction === 'address' ? '更新收货地址' : '确认重发订单凭证' }}
            </h4>
            <p class="mt-1 text-[11px] text-slate-400">{{ actionOrder?.number }}</p>
          </div>
          <button type="button" :disabled="actionLoading" class="text-slate-400 hover:text-slate-100 disabled:opacity-40" aria-label="关闭" @click="activeAction = null"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div v-if="activeAction === 'refund'" class="mt-4 space-y-2 text-xs text-slate-300">
          <p v-if="refundPreviewLoading" class="text-slate-400">正在核验可退款金额…</p>
          <template v-else>
            <p>将通过 Shopify 原支付方式退回 <strong class="font-mono text-rose-300">{{ refundPreview?.currency || '' }} {{ refundPreview?.amount || '--' }}</strong>。</p>
            <p class="text-[11px] text-amber-300">确认后无法在会话中心撤销，请先核对订单和客户诉求。</p>
          </template>
        </div>

        <div v-else-if="activeAction === 'address'" class="mt-4 grid grid-cols-2 gap-2">
          <input v-model="addressDraft.recipient_name" class="col-span-2 order-field" placeholder="收件人" />
          <input v-model="addressDraft.address1" class="col-span-2 order-field" placeholder="地址第一行" />
          <input v-model="addressDraft.address2" class="col-span-2 order-field" placeholder="地址第二行（选填）" />
          <input v-model="addressDraft.city" class="order-field" placeholder="城市" />
          <input v-model="addressDraft.province" class="order-field" placeholder="省/州（选填）" />
          <input v-model="addressDraft.country" class="order-field" placeholder="国家/地区" />
          <input v-model="addressDraft.zip" class="order-field" placeholder="邮编" />
          <input v-model="addressDraft.phone" class="col-span-2 order-field" placeholder="电话（选填）" />
        </div>

        <p v-else class="mt-4 text-xs leading-relaxed text-slate-300">Shopify 将向订单中已验证的客户邮箱重新发送凭证。</p>

        <div class="mt-5 flex justify-end gap-2">
          <button type="button" :disabled="actionLoading" class="rounded bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40" @click="activeAction = null">取消</button>
          <button
            type="button"
            :disabled="actionLoading || (activeAction === 'refund' && (refundPreviewLoading || !refundPreview?.refundable)) || (activeAction === 'address' && (!addressDraft.address1 || !addressDraft.city || !addressDraft.country || !addressDraft.zip))"
            :class="['rounded px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-40', activeAction === 'refund' ? 'bg-rose-400 hover:bg-rose-300' : 'bg-emerald-400 hover:bg-emerald-300']"
            @click="submitAction"
          >{{ actionLoading ? '正在提交…' : '确认执行' }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.order-field {
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: #080B11;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.25rem;
  padding: 0.375rem 0.5rem;
}

.order-field::placeholder { color: #64748b; }
.order-field:focus { border-color: rgba(16, 185, 129, 0.75); outline: none; }
</style>
