<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { chatService, type ShopifyProduct } from '@/services/chat'

const props = defineProps<{
  open: boolean
  sessionId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', product: ShopifyProduct, shopDomain?: string): void
}>()

const products = ref<ShopifyProduct[]>([])
const shopDomain = ref<string>()
const loading = ref(false)
const error = ref('')
const query = ref('')
let productsRequestVersion = 0

const priceLabel = (product: ShopifyProduct) => {
  if (product.price === undefined || product.price === null || product.price === '') return '价格待确认'
  const max = product.price_max && String(product.price_max) !== String(product.price)
    ? ` - ${product.price_max}`
    : ''
  return `${product.currency || ''} ${product.price}${max}`.trim()
}

const filteredProducts = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  if (!needle) return products.value
  return products.value.filter(product =>
    [product.title, product.vendor, product.handle].some(value => value?.toLocaleLowerCase().includes(needle))
  )
})

const loadProducts = async () => {
  const sessionId = props.sessionId
  const requestVersion = ++productsRequestVersion
  if (!sessionId) {
    products.value = []
    shopDomain.value = undefined
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  products.value = []
  shopDomain.value = undefined
  const isCurrentRequest = () =>
    requestVersion === productsRequestVersion && props.open && props.sessionId === sessionId

  try {
    const result = await chatService.getShopifyProducts(sessionId)
    if (!isCurrentRequest()) return
    products.value = result.products || []
    shopDomain.value = result.shop_domain
    if (result.status !== 'ok') error.value = '当前会话未关联可用的 Shopify 商品目录。'
  } catch (err: any) {
    if (!isCurrentRequest()) return
    error.value = err?.response?.data?.detail || '商品目录暂时不可用。'
    products.value = []
  } finally {
    if (isCurrentRequest()) loading.value = false
  }
}

watch(() => [props.open, props.sessionId], ([open]) => {
  if (!open) {
    productsRequestVersion += 1
    loading.value = false
    return
  }
  query.value = ''
  void loadProducts()
}, { immediate: true })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" @click.self="emit('close')">
    <div class="w-full max-w-lg bg-[#FFFFFF] border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- 头部 -->
      <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#141B2E]">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <i class="fa-solid fa-bag-shopping"></i>
          </div>
          <div>
            <h3 class="font-bold text-[#0F172A] text-sm">选择 Shopify 商品卡片</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ shopDomain || '仅显示当前会话关联店铺的在售商品' }}</p>
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

      <!-- 搜索框 -->
      <div class="p-3.5 border-b border-slate-100 bg-[#0C111C]">
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
          <input
            v-model="query"
            type="search"
            placeholder="搜索商品名称、品牌或商品链接标识…"
            class="w-full bg-[#161E31] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            autofocus
          />
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="p-4 space-y-2 overflow-y-auto flex-1">
        <div v-if="loading" class="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <i class="fa-solid fa-circle-notch fa-spin text-purple-400"></i>
          <span>正在同步商品目录…</span>
        </div>
        <div v-else-if="error" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {{ error }}
        </div>
        <div v-else-if="filteredProducts.length === 0" class="p-8 text-center text-slate-500 text-xs">
          没有找到匹配的商品
        </div>
        <template v-else>
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="emit('select', product, shopDomain); emit('close')"
            class="p-2.5 rounded-xl border border-slate-100 bg-[#141B2E] hover:bg-[#1A233A] hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                v-if="product.image?.src"
                :src="product.image.src"
                :alt="product.image.alt || product.title"
                class="w-11 h-11 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-200"
              />
              <div v-else class="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                <i class="fa-solid fa-box"></i>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-semibold text-[#0F172A] group-hover:text-purple-300 transition-colors truncate">
                  {{ product.title }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 truncate">{{ product.vendor || 'Shopify 官方在售' }}</div>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <div class="text-xs font-mono font-bold text-purple-400">{{ priceLabel(product) }}</div>
              <div class="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 justify-end group-hover:text-purple-400">
                <span>插入</span>
                <i class="fa-solid fa-arrow-right text-[9px]"></i>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
