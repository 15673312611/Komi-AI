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
  <div v-if="open" class="picker-backdrop" @click.self="emit('close')">
    <section class="picker" role="dialog" aria-modal="true" aria-labelledby="product-picker-title">
      <header class="picker-header">
        <div>
          <h2 id="product-picker-title">选择 Shopify 商品</h2>
          <p>{{ shopDomain || '仅显示当前会话关联店铺的在售商品' }}</p>
        </div>
        <button type="button" class="icon-button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="picker-body">
        <input v-model="query" type="search" placeholder="搜索商品名称、品牌或链接标识" class="search-input" />
        <p v-if="loading" class="state">正在加载商品目录...</p>
        <p v-else-if="error" class="state">{{ error }}</p>
        <p v-else-if="filteredProducts.length === 0" class="state">没有匹配的商品。</p>
        <div v-else class="product-list">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            type="button"
            class="product-row"
            @click="emit('select', product, shopDomain); emit('close')"
          >
            <img v-if="product.image?.src" :src="product.image.src" :alt="product.image.alt || product.title" class="product-image" />
            <span v-else class="product-image fallback"><i class="fa-solid fa-box"></i></span>
            <span class="product-copy">
              <strong>{{ product.title }}</strong>
              <small>{{ product.vendor || 'Shopify 商品' }}</small>
            </span>
            <span class="price">{{ priceLabel(product) }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.picker-backdrop { position: fixed; inset: 0; z-index: 65; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0, 0, 0, .68); }
.picker { width: min(620px, 100%); max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--o12); border-radius: 10px; background: var(--bg2); color: var(--text); box-shadow: 0 24px 80px rgba(0, 0, 0, .35); }
.picker-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--o08); }
.picker-header h2 { margin: 0; font-size: 16px; }
.picker-header p { margin: 5px 0 0; color: var(--muted); font-size: 11px; }
.icon-button { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 22px; cursor: pointer; }
.icon-button:hover { background: var(--o08); color: var(--text); }
.picker-body { min-height: 180px; padding: 14px; overflow-y: auto; }
.search-input { width: 100%; box-sizing: border-box; min-height: 36px; padding: 0 10px; border: 1px solid var(--o12); border-radius: 7px; background: var(--bg); color: var(--text); font: inherit; font-size: 12px; outline: 0; }
.search-input:focus { border-color: var(--teal-border); }
.state { margin: 28px 0; color: var(--muted); text-align: center; font-size: 12px; }
.product-list { display: grid; gap: 8px; margin-top: 12px; }
.product-row { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 64px; padding: 8px; border: 1px solid var(--o08); border-radius: 7px; background: var(--bg); color: var(--text); text-align: left; cursor: pointer; }
.product-row:hover { border-color: var(--teal-border); background: var(--o06); }
.product-image { width: 46px; height: 46px; flex: 0 0 auto; border-radius: 5px; object-fit: cover; background: var(--o06); }
.fallback { display: inline-flex; align-items: center; justify-content: center; color: var(--muted); }
.product-copy { display: grid; min-width: 0; gap: 3px; flex: 1; }
.product-copy strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.product-copy small { overflow: hidden; color: var(--muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.price { color: var(--c-teal); font-size: 11px; font-weight: 600; white-space: nowrap; }
</style>
