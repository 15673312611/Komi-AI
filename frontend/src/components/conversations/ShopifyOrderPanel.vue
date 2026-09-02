<!--
Copyright 2024-2026 Komi AI
Shopify 订单面板 (ShopifyOrderPanel.vue - 现代高定多维色彩体系)
-->

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { chatService, type ShopifyOrder } from '@/services/chat'
import { permissionChecks } from '@/utils/permissions'

const props = defineProps<{
  sessionId: string
  canManageChat: boolean
}>()

const emit = defineEmits<{
  (e: 'open-tracking', order: any): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const loading = ref(false)
const loadingMore = ref(false)
const orderList = ref<ShopifyOrder[]>([])
const selectedOrderId = ref<string | null>(null)
const nextCursor = ref<string | null>(null)
const hasNextPage = ref(false)
const orderCount = ref(0)
const writeOrdersEnabled = ref(false)
const shopDomain = ref<string | null>(null)
const showAllOrders = ref(false)

const activeAction = ref<'refund' | 'address' | 'invoice' | null>(null)
const actionLoading = ref(false)
const refundPreviewLoading = ref(false)
const refundPreview = ref<any>(null)
const addressDraft = ref({ recipient_name: '', address1: '', address2: '', city: '', province: '', country: '', zip: '', phone: '' })

let activeContextVersion = 0
let actionContextVersion = 0
let refundPreviewRequest = 0
let actionRequest = 0

const canPerformOrderWrites = computed(() =>
  props.canManageChat && Boolean(props.sessionId) && writeOrdersEnabled.value,
)

const activeOrder = computed(() => {
  if (!orderList.value.length) return null
  if (selectedOrderId.value) {
    const matched = orderList.value.find((item: any) => String(item.id) === String(selectedOrderId.value))
    if (matched) return matched
  }
  return orderList.value[0]
})

const order = computed(() => {
  const current = activeOrder.value
  if (!current) return null
  return {
    id: current.id,
    number: current.name,
    payStatus: current.financial_status || '已支付',
    fulfillStatus: current.fulfillment_status || '待履约',
    products: (current.line_items || []).map((item: any) => ({
      title: item.title,
      specs: item.variant_title || item.sku || '标准规格',
      price: `${current.currency || '$'} ${item.price}`,
      qty: item.quantity,
    })),
    carrier: current.fulfillments?.[0]?.tracking_company || 'Shopify 官方物流',
    tracking: current.fulfillments?.[0]?.tracking_numbers?.[0] || (current.fulfillments?.[0] as any)?.tracking_number || '',
    fulfillment_status: current.fulfillment_status,
  }
})

const actionOrder = computed(() => {
  return activeOrder.value || null
})

const copyText = (text?: string, successMsg = '已复制') => {
  if (!text) return
  navigator.clipboard.writeText(text)
  emit('action-toast', successMsg, 'info')
}

const loadOrders = async (cursor?: string) => {
  const currentSessionId = props.sessionId
  if (!currentSessionId) {
    orderList.value = []
    selectedOrderId.value = null
    nextCursor.value = null
    hasNextPage.value = false
    orderCount.value = 0
    writeOrdersEnabled.value = false
    shopDomain.value = null
    loading.value = false
    loadingMore.value = false
    return
  }
  const isLoadMore = Boolean(cursor)
  if (isLoadMore) loadingMore.value = true
  else loading.value = true
  const contextVersion = ++activeContextVersion
  try {
    const data = await chatService.getShopifyOrders(currentSessionId, cursor)
    if (contextVersion !== activeContextVersion || props.sessionId !== currentSessionId) return
    if (isLoadMore) orderList.value = [...orderList.value, ...(data.orders || [])]
    else orderList.value = data.orders || []
    if (!selectedOrderId.value && orderList.value[0]) selectedOrderId.value = String(orderList.value[0].id)
    nextCursor.value = data.end_cursor || null
    hasNextPage.value = Boolean(data.has_next_page)
    orderCount.value = typeof data.count === 'number' ? data.count : orderList.value.length
    writeOrdersEnabled.value = Boolean(data.write_orders_enabled)
    shopDomain.value = data.shop_domain || null
  } catch (err: any) {
    if (contextVersion !== activeContextVersion || props.sessionId !== currentSessionId) return
    orderList.value = []
    selectedOrderId.value = null
    nextCursor.value = null
    hasNextPage.value = false
    orderCount.value = 0
    writeOrdersEnabled.value = false
    shopDomain.value = null
  } finally {
    if (contextVersion === activeContextVersion && props.sessionId === currentSessionId) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

watch(() => props.sessionId, () => {
  actionContextVersion += 1
  refundPreviewRequest += 1
  actionRequest += 1
  activeAction.value = null
  actionLoading.value = false
  refundPreviewLoading.value = false
  selectedOrderId.value = null
  void loadOrders()
}, { immediate: true })

const startShopifyReauthorization = () => {
  const domain = (shopDomain.value || '').trim()
  if (!domain) {
    emit('action-toast', '未找到绑定的 Shopify 店铺域名，请前往渠道设置检查。', 'error')
    return
  }
  const normalizedDomain = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  window.location.href = `/api/v1/shopify/install?shop=${encodeURIComponent(normalizedDomain)}`
}

const openRefund = async () => {
  const current = activeOrder.value
  const sessionId = props.sessionId
  if (!current || !sessionId) return
  activeAction.value = 'refund'
  refundPreview.value = null
  refundPreviewLoading.value = true
  const request = ++refundPreviewRequest
  const contextVersion = actionContextVersion
  try {
    const preview = await chatService.getShopifyRefundPreview(sessionId, String(current.id))
    if (request !== refundPreviewRequest || contextVersion !== actionContextVersion || props.sessionId !== sessionId) return
    refundPreview.value = preview
  } catch (err: any) {
    if (request !== refundPreviewRequest || contextVersion !== actionContextVersion || props.sessionId !== sessionId) return
    refundPreview.value = { refundable: false, reason: err?.response?.data?.detail || '无法获取退款预览信息' }
  } finally {
    if (request === refundPreviewRequest && contextVersion === actionContextVersion && props.sessionId === sessionId) {
      refundPreviewLoading.value = false
    }
  }
}

const openAddress = () => {
  const current = activeOrder.value
  if (!current) return
  const addr = current.shipping_address || {}
  addressDraft.value = {
    recipient_name: addr.name || (current as any).customer?.first_name || '',
    address1: addr.address1 || '',
    address2: addr.address2 || '',
    city: addr.city || '',
    province: addr.province || '',
    country: addr.country || '',
    zip: addr.zip || '',
    phone: addr.phone || '',
  }
  activeAction.value = 'address'
}

const openInvoice = () => {
  if (!activeOrder.value) return
  activeAction.value = 'invoice'
}

const submitAction = async () => {
  const current = activeOrder.value
  const sessionId = props.sessionId
  const action = activeAction.value
  if (!current || !sessionId || !action || actionLoading.value) return
  const orderId = String(current.id)
  const address = { ...addressDraft.value }
  const idempotencyKeyForAction = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  const request = ++actionRequest
  const contextVersion = actionContextVersion
  const isCurrentContext = () =>
    request === actionRequest && contextVersion === actionContextVersion && props.sessionId === sessionId
  actionLoading.value = true
  try {
    if (action === 'refund') {
      const result = await chatService.refundShopifyOrder(sessionId, orderId, { confirmed: true, idempotency_key: idempotencyKeyForAction })
      if (!isCurrentContext()) return
      emit('action-toast', `已完成退款${result?.amount ? `：${result.currency || ''} ${result.amount}` : ''}`, 'success')
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
      <span class="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
        <i class="fa-brands fa-shopify text-emerald-600 text-sm"></i>
        <span>关联 Shopify 订单</span>
      </span>
      <button
        type="button"
        :disabled="loading || !orderCount"
        class="text-[11px] text-indigo-600 font-semibold hover:text-indigo-800 disabled:no-underline disabled:opacity-60 flex items-center gap-1"
        @click="showAllOrders = !showAllOrders"
      >
        <span>{{ loading ? '正在加载…' : showAllOrders ? '收起订单' : `全部 ${orderCount} 笔` }}</span>
        <i class="fa-solid fa-chevron-down text-[9px]"></i>
      </button>
    </div>

    <!-- 当前最新关注订单卡片 -->
    <div v-if="loading" class="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-xs text-slate-400">正在加载订单…</div>
    <div v-else-if="!order" class="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-xs text-slate-400">该客户暂无关联 Shopify 订单。</div>
    <div v-else class="rounded-xl bg-[#FFFFFF] border border-slate-200 p-3.5 space-y-3 shadow-sm">
      <!-- 订单编号与状态 -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-bold text-[#0F172A] text-xs">{{ order.number }}</span>
          <button
            @click="copyText(order.number, '订单号已复制')"
            class="text-slate-400 hover:text-indigo-600 transition-colors"
            title="复制订单号"
          >
            <i class="fa-regular fa-copy text-[10px]"></i>
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {{ order.payStatus }}
          </span>
          <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {{ order.fulfillStatus }}
          </span>
        </div>
      </div>

      <!-- 订单商品清单 -->
      <div class="space-y-2">
        <div
          v-for="(prod, i) in order.products"
          :key="i"
          class="flex items-center gap-2 p-2 rounded-lg bg-slate-50/70 border border-slate-100"
        >
          <div class="w-8 h-8 rounded-md bg-white border border-slate-200 shrink-0 flex items-center justify-center text-indigo-500 shadow-sm"><i class="fa-solid fa-box text-xs"></i></div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-slate-900 text-[11px] truncate">{{ prod.title }}</div>
            <div class="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
              <span>{{ prod.specs }}</span>
              <span class="font-mono text-indigo-700 font-bold">{{ prod.price }} × {{ prod.qty }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 物流单号与一键查询 -->
      <div class="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100 text-xs space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-slate-600 font-medium flex items-center gap-1">
            <i class="fa-solid fa-truck-fast text-indigo-500"></i>
            <span>{{ order.carrier }}</span>
          </span>
          <span class="text-emerald-700 font-mono text-[10px] font-bold">{{ order.fulfillment_status || '待履约' }}</span>
        </div>
        <div class="flex items-center justify-between font-mono text-[11px] text-slate-800">
          <span class="font-semibold">{{ order.tracking || '暂无物流单号' }}</span>
          <div v-if="order.tracking" class="flex items-center gap-2">
            <button
              @click="copyText(order.tracking, '运单号已复制')"
              class="text-slate-400 hover:text-indigo-600 text-[10px]"
              title="复制单号"
            >
              <i class="fa-regular fa-copy"></i>
            </button>
            <button
              @click="emit('open-tracking', order)"
              class="px-2 py-0.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded text-[10px] font-sans font-bold shadow-sm transition-colors"
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
          class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-40 text-[11px] text-rose-700 text-center font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1 shadow-sm"
        >
          <i class="fa-solid fa-rotate-left text-[10px]"></i>
          <span>发起退款</span>
        </button>
        <button
          type="button"
          :disabled="!canPerformOrderWrites"
          :title="props.canManageChat ? '更新 Shopify 收货地址' : '您没有管理此会话的权限'"
          @click="openAddress"
          class="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-40 text-[11px] text-blue-700 text-center font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1 shadow-sm"
        >
          <i class="fa-solid fa-location-dot text-[10px]"></i>
          <span>改派地址</span>
        </button>
        <button
          type="button"
          :disabled="!canPerformOrderWrites"
          :title="props.canManageChat ? '通过 Shopify 重发订单凭证' : '您没有管理此会话的权限'"
          @click="openInvoice"
          class="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-[11px] text-indigo-700 text-center font-bold border border-indigo-200 transition-colors flex items-center justify-center gap-1 shadow-sm"
        >
          <i class="fa-regular fa-paper-plane text-[10px]"></i>
          <span>重发凭证</span>
        </button>
      </div>

      <div v-if="props.canManageChat && !writeOrdersEnabled" class="flex items-center justify-between gap-2 text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
        <span>订单写操作需要管理员重新授权 Shopify。</span>
        <button v-if="permissionChecks.canManageOrganization() && shopDomain" type="button" class="shrink-0 text-indigo-700 font-bold hover:underline" @click="startShopifyReauthorization">重新授权</button>
      </div>
    </div>

    <div v-if="showAllOrders" class="mt-2 space-y-1.5">
      <button
        v-for="item in orderList"
        :key="item.id"
        type="button"
        :class="['w-full flex items-center justify-between gap-2 rounded-lg border bg-[#FFFFFF] px-2.5 py-2 text-left hover:border-indigo-400 shadow-sm transition-all', String(item.id) === selectedOrderId ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200']"
        @click="selectedOrderId = String(item.id)"
      >
        <span class="min-w-0">
          <span class="block truncate font-mono text-[11px] font-bold text-[#0F172A]">{{ item.name }}</span>
          <span class="block truncate text-[10px] text-slate-500">{{ item.financial_status || '未知支付状态' }} · {{ item.fulfillment_status || '待履约' }}</span>
        </span>
        <span class="shrink-0 text-[10px] font-mono text-indigo-700 font-bold">{{ item.currency || '$' }} {{ item.total_price || '--' }}</span>
      </button>
      <button
        v-if="hasNextPage"
        type="button"
        :disabled="loadingMore"
        class="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 py-1.5 text-[11px] text-indigo-700 hover:bg-indigo-100 font-semibold disabled:opacity-50 shadow-sm transition-colors"
        @click="nextCursor && loadOrders(nextCursor)"
      >
        {{ loadingMore ? '正在加载…' : '加载更多订单' }}
      </button>
    </div>

    <!-- 弹窗部分 -->
    <div v-if="activeAction" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" @click.self="!actionLoading && (activeAction = null)">
      <section class="w-full max-w-sm rounded-xl border border-slate-200 bg-[#FFFFFF] p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-[#0F172A]">
              {{ activeAction === 'refund' ? '确认全额退款' : activeAction === 'address' ? '更新收货地址' : '确认重发订单凭证' }}
            </h4>
            <p class="mt-1 text-[11px] text-indigo-600 font-mono font-medium">{{ actionOrder?.name }}</p>
          </div>
          <button type="button" :disabled="actionLoading" class="text-slate-400 hover:text-[#0F172A] disabled:opacity-40" aria-label="关闭" @click="activeAction = null"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div v-if="activeAction === 'refund'" class="mt-4 space-y-2 text-xs text-slate-600">
          <p v-if="refundPreviewLoading" class="text-slate-400">正在核验可退款金额…</p>
          <template v-else>
            <p>将通过 Shopify 原支付方式退回 <strong class="font-mono text-rose-600 font-bold">{{ refundPreview?.currency || '$' }} {{ refundPreview?.amount || '--' }}</strong>。</p>
            <p class="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">确认后无法撤销，请先核对订单和客户诉求。</p>
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

        <p v-else class="mt-4 text-xs leading-relaxed text-slate-600">Shopify 将向订单客户邮箱重新发送电子凭证。</p>

        <div class="mt-5 flex justify-end gap-2">
          <button type="button" :disabled="actionLoading" class="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-40" @click="activeAction = null">取消</button>
          <button
            type="button"
            :disabled="actionLoading || (activeAction === 'refund' && (refundPreviewLoading || !refundPreview?.refundable)) || (activeAction === 'address' && (!addressDraft.address1 || !addressDraft.city || !addressDraft.country || !addressDraft.zip))"
            :class="['rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-md disabled:opacity-40', activeAction === 'refund' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20']"
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
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #0F172A;
  font-size: 12px;
}
.order-field:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
</style>
