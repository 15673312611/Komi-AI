<!--
Copyright 2024-2026 ChatterMate
右栏：Shopify 电商订单面板 (ShopifyOrderPanel.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    sessionId?: string
  }>(),
  {
    sessionId: 'conv-1',
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-tracking', order: any): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const order = ref({
  number: '#US-2026-9812',
  date: '2026-08-21 16:20',
  total: '$149.00',
  payStatus: '已支付',
  fulfillStatus: '国际运输中',
  carrier: 'DHL Express',
  tracking: 'DHL-883921094US',
  products: [
    {
      title: 'Silk Halter Evening Maxi Dress',
      sku: 'DR-992-BLK-M',
      specs: 'Black / M 码',
      price: '$129.00',
      qty: 1,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=80',
    },
    {
      title: 'Pearl Embellished Evening Clutch',
      sku: 'AC-102-WHT',
      specs: 'Ivory Pearl / 均码',
      price: '$20.00',
      qty: 1,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&auto=format&fit=crop&q=80',
    },
  ],
})

const copyText = (text: string, label: string) => {
  navigator.clipboard?.writeText(text)
  emit('action-toast', label, 'success')
}

const showRefund = () => {
  emit('action-toast', '已向财务中心发起退款申请审核', 'info')
}

const showAddress = () => {
  emit('action-toast', '已同步改派新地址至 DHL API', 'success')
}

const resendInvoice = () => {
  emit('action-toast', '已将 PDF 形式凭证通过邮件重发至客户', 'success')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
        <i class="fa-brands fa-shopify text-emerald-400 text-sm"></i>
        <span>关联 Shopify 订单</span>
      </span>
      <span
        class="text-[11px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
        @click="emit('action-toast', '已加载该客户全部 8 笔 Shopify 历史订单', 'info')"
      >
        <span>查看全部 8 笔</span>
        <i class="fa-solid fa-arrow-up-right-from-square fa-external-link-alt text-[9px]"></i>
      </span>
    </div>

    <!-- 当前最新关注订单卡片 (1:1 原版复刻) -->
    <div class="rounded-xl bg-[#131B2E] border border-white/[0.08] p-3 space-y-3 shadow-md">
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
          <img
            :src="prod.image"
            :alt="prod.title"
            class="w-8 h-8 rounded-md object-cover border border-white/10 shrink-0"
          />
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
          <span class="text-emerald-400 font-mono text-[10px]">清关完成 · 预计明日送达</span>
        </div>
        <div class="flex items-center justify-between font-mono text-[11px] text-slate-200">
          <span>{{ order.tracking }}</span>
          <div class="flex items-center gap-2">
            <button
              @click="copyText(order.tracking, '运单号已复制')"
              class="text-slate-400 hover:text-emerald-300 text-[10px]"
              title="复制单号"
            >
              <i class="fa-regular fa-copy"></i>
            </button>
            <button
              @click="emit('open-tracking', order)"
              class="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-sans font-medium"
            >
              实时轨迹
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷订单操作 (1:1 原版复刻) -->
      <div class="grid grid-cols-3 gap-1.5 pt-1">
        <button
          @click="showRefund"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-solid fa-rotate-left fa-undo text-[10px]"></i>
          <span>发起退款</span>
        </button>
        <button
          @click="showAddress"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-solid fa-location-dot fa-map-marker-alt text-[10px]"></i>
          <span>改派地址</span>
        </button>
        <button
          @click="resendInvoice"
          class="px-2 py-1.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-[11px] text-slate-300 text-center font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <i class="fa-regular fa-paper-plane text-[10px]"></i>
          <span>重发凭证</span>
        </button>
      </div>
    </div>
  </div>
</template>
