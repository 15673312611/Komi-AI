<script setup lang="ts">
import { computed } from 'vue'
import type { ShopifyOrder } from '@/services/chat'
import { copyTextToClipboard } from '@/utils/clipboard'

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
  try {
    if (await copyTextToClipboard(value)) {
      emit('action-toast', label, 'success')
    } else {
      emit('action-toast', '复制失败，请手动复制', 'error')
    }
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
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="w-full max-w-lg bg-[#FAFAFC] border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- 头部 -->
      <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#141B2E]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <i class="fa-solid fa-truck-fast"></i>
          </div>
          <div>
            <h3 class="font-bold text-[#0F172A] text-sm">物流追踪与履约详情</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ order?.name || '当前订单' }} · 实时同步 Shopify 物流轨迹</p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#0F172A] flex items-center justify-center transition-colors"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- 主体列表 -->
      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <div v-if="!hasData" class="p-8 text-center text-slate-400 text-xs bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <i class="fa-solid fa-box-open text-slate-500 text-2xl mb-2 block"></i>
          Shopify 尚未返回可用的运单号、物流链接或履约轨迹。
        </div>

        <template v-else>
          <!-- 轨迹节点 -->
          <div class="space-y-3">
            <div
              v-for="(fulfillment, index) in fulfillments"
              :key="index"
              class="p-3.5 rounded-xl bg-[#141B2E] border border-white/[0.06] space-y-2 relative"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ (fulfillment as any).status || (fulfillment as any).shipment_status || '履约就绪' }}
                </span>
                <span v-if="(fulfillment as any).tracking_company" class="px-2 py-0.5 rounded-full bg-white/5 border border-slate-200 text-[10px] text-slate-300">
                  {{ (fulfillment as any).tracking_company }}
                </span>
              </div>

              <div v-if="fulfillment.tracking_numbers?.length" class="text-xs text-slate-300 flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span class="font-mono">运单号：{{ fulfillment.tracking_numbers.join('、') }}</span>
                <button
                  type="button"
                  @click="copy(fulfillment.tracking_numbers.join(', '), '运单号已复制')"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <i class="fa-regular fa-copy mr-1"></i>复制
                </button>
              </div>

              <div v-if="fulfillment.tracking_urls?.length" class="text-xs text-slate-400 space-y-1">
                <div v-for="url in fulfillment.tracking_urls" :key="url" class="flex items-center justify-between gap-2">
                  <a :href="url" target="_blank" rel="noreferrer" class="text-[11px] text-blue-400 hover:underline truncate">{{ url }}</a>
                  <button
                    type="button"
                    @click="copy(url, '物流链接已复制')"
                    class="text-[11px] text-slate-400 hover:text-slate-800 shrink-0"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 底部栏 -->
      <div class="px-5 py-3.5 border-t border-slate-200 bg-[#141B2E] flex items-center justify-between gap-2">
        <button
          type="button"
          @click="emit('close')"
          class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-slate-200 text-slate-300 text-xs font-medium transition-all"
        >
          关闭
        </button>
        <button
          type="button"
          :disabled="!hasData"
          @click="insertDraft"
          class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="fa-solid fa-file-import text-xs"></i>
          <span>插入回复草稿</span>
        </button>
      </div>
    </div>
  </div>
</template>
