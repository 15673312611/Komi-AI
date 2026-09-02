<!--
Copyright 2024-2026 Komi AI
右栏：客户画像、Shopify 订单详情与协作抽屉 (ChatInfoPanel.vue - 现代高定多维色彩体系)
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ChatDetail } from '@/types/chat'
import { chatService, type CustomerSummary } from '@/services/chat'
import ShopifyOrderPanel from '@/components/conversations/ShopifyOrderPanel.vue'
import CreateTicketModal from '@/components/conversations/CreateTicketModal.vue'
import { permissionChecks } from '@/utils/permissions'

const props = defineProps<{
  chatInfo?: ChatDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-transfer'): void
  (e: 'open-tracking', order: any): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
  (e: 'select-session', sessionId: string): void
  (e: 'ticket-created', ticketId: string): void
}>()

const showCreateTicketModal = ref(false)
const histories = ref<Array<{ sessionId: string; channel: string; date: string; title: string; outcome: string }>>([])
const historyLoading = ref(false)
const customerSummary = ref<CustomerSummary | null>(null)
const customerSummaryLoading = ref(false)
const tagsSaving = ref(false)
const newTagText = ref('')

const canManageChat = computed(() => permissionChecks.canTakeOverChats())
const canEditTags = computed(() => canManageChat.value && Boolean(props.chatInfo?.session_id) && props.chatInfo?.status !== 'closed')

const customerName = computed(() => props.chatInfo?.customer?.full_name || props.chatInfo?.customer?.email || '未知客户')
const customerEmail = computed(() => props.chatInfo?.customer?.email || '')
const customerInitial = computed(() => customerName.value.trim().slice(0, 1).toUpperCase() || '?')
const channelLabel = computed(() => {
  const ch = props.chatInfo?.channel || 'web'
  return ch === 'web' ? '网页挂件' : ch === 'whatsapp' ? 'WhatsApp' : ch === 'email' ? '邮件' : ch[0].toUpperCase() + ch.slice(1)
})
const assignmentLabel = computed(() => {
  if (props.chatInfo?.user_name) return `由 ${props.chatInfo.user_name} 接待`
  if (props.chatInfo?.status === 'closed') return '会话已解决归档'
  return '未分配人工，AI 智能应答中'
})

const TAG_COLORS = ['indigo', 'emerald', 'amber', 'rose', 'cyan', 'purple']
const tags = computed(() => {
  const metaTags = props.chatInfo?.customer?.meta_data?.tags
  if (Array.isArray(metaTags)) {
    return metaTags.map((t: any, idx: number) => {
      const color = TAG_COLORS[idx % TAG_COLORS.length]
      return typeof t === 'string' ? { id: `tag-${idx}`, name: t, color } : { id: t.id || `tag-${idx}`, name: t.name || String(t), color: t.color || color }
    })
  }
  return []
})

const copyEmail = () => {
  if (!customerEmail.value) return
  navigator.clipboard.writeText(customerEmail.value)
  emit('action-toast', '邮箱已复制到剪贴板', 'info')
}

const persistTags = async (nextTags: string[]) => {
  const sessionId = props.chatInfo?.session_id
  if (!sessionId) return
  tagsSaving.value = true
  try {
    const updated = await chatService.updateTags(sessionId, nextTags)
    if (props.chatInfo?.customer) {
      props.chatInfo.customer.meta_data = {
        ...(props.chatInfo.customer.meta_data || {}),
        tags: updated.customer?.meta_data?.tags || nextTags,
      }
    }
    emit('action-toast', '标签已更新', 'success')
  } catch (err: any) {
    emit('action-toast', err?.response?.data?.detail || '保存标签失败', 'error')
  } finally {
    tagsSaving.value = false
  }
}

const addTagFromInput = () => {
  const text = newTagText.value.trim()
  if (!text || !canEditTags.value || tagsSaving.value) return
  const current = tags.value.map(t => t.name)
  if (current.includes(text)) {
    newTagText.value = ''
    return
  }
  newTagText.value = ''
  void persistTags([...current, text])
}

const removeTag = (tagId: string) => {
  if (!canEditTags.value || tagsSaving.value) return
  const current = tags.value.filter(t => t.id !== tagId).map(t => t.name)
  void persistTags(current)
}

const addPresetTag = (name: string) => {
  if (!canEditTags.value || tagsSaving.value) return
  const current = tags.value.map(t => t.name)
  if (!current.includes(name)) void persistTags([...current, name])
}

const formatSpend = (summary: CustomerSummary | null) => {
  if (!summary || summary.total_spend === null || summary.total_spend === undefined) return '--'
  const currency = summary.currency || '$'
  return `${currency} ${Number(summary.total_spend).toFixed(2)}`
}

const formatSatisfaction = (summary: CustomerSummary | null) => {
  if (!summary || summary.satisfaction_score === null || summary.satisfaction_score === undefined) return '--'
  return `${Number(summary.satisfaction_score).toFixed(1)} / 5.0`
}

const loadCustomerHistory = async () => {
  const sessionId = props.chatInfo?.session_id
  const email = customerEmail.value
  if (!sessionId || !email) {
    histories.value = []
    historyLoading.value = false
    return
  }
  historyLoading.value = true
  try {
    const list = await chatService.getRecentChats({ customer_email: email, limit: 10 })
    histories.value = list.filter(c => c.session_id !== sessionId).map(item => ({
      sessionId: item.session_id,
      channel: item.channel === 'whatsapp' ? 'WhatsApp' : item.channel === 'email' ? '邮件' : '网页挂件',
      date: item.updated_at ? new Date(item.updated_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
      title: item.last_message || '无消息内容',
      outcome: item.status === 'closed' ? '已解决' : '接待中',
    }))
  } catch {
    histories.value = []
  } finally {
    historyLoading.value = false
  }
}

const loadCustomerSummary = async () => {
  const sessionId = props.chatInfo?.session_id
  if (!sessionId) {
    customerSummary.value = null
    customerSummaryLoading.value = false
    return
  }
  customerSummaryLoading.value = true
  try {
    customerSummary.value = await chatService.getCustomerSummary(sessionId)
  } catch {
    customerSummary.value = null
  } finally {
    customerSummaryLoading.value = false
  }
}

const onTicketCreated = (ticketId: string) => {
  showCreateTicketModal.value = false
  emit('ticket-created', ticketId)
  emit('action-toast', `工单 #${ticketId.slice(0, 8)} 创建成功`, 'success')
}

watch(() => [props.chatInfo?.session_id, customerEmail.value], () => { void loadCustomerHistory() }, { immediate: true })
watch(() => props.chatInfo?.session_id, () => { void loadCustomerSummary() }, { immediate: true })
</script>

<template>
  <aside class="w-[340px] bg-[#FFFFFF] border-l border-slate-200/80 flex flex-col shrink-0 overflow-y-auto transition-all duration-300 relative z-20 select-none h-full shadow-[ -1px_0_4px_rgba(0,0,0,0.02)]">
    <!-- 客户画像头部卡片 -->
    <div class="p-4 border-b border-slate-100 bg-[#FFFFFF]">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-base font-bold text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            {{ customerInitial }}
          </div>
          <div>
            <h3 class="font-bold text-[#0F172A] text-sm">{{ customerName }}</h3>
            <p
              v-if="customerEmail"
              @click="copyEmail"
              class="text-xs text-indigo-600 mt-0.5 flex items-center gap-1 cursor-pointer hover:underline transition-colors"
            >
              <span>{{ customerEmail }}</span>
              <i class="fa-regular fa-copy text-[10px] text-slate-400"></i>
            </p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
          {{ channelLabel }}
        </span>
      </div>

      <!-- 电商关键指标概览 -->
      <div class="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-center">
        <div class="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100/80">
          <div class="text-[10px] text-indigo-700 font-medium">历史消费</div>
          <div class="text-xs font-bold text-indigo-900 mt-0.5 truncate" :title="formatSpend(customerSummary)">{{ customerSummaryLoading ? '…' : formatSpend(customerSummary) }}</div>
        </div>
        <div class="bg-blue-50/70 p-2 rounded-lg border border-blue-100/80">
          <div class="text-[10px] text-blue-700 font-medium">订单数量</div>
          <div class="text-xs font-bold text-blue-900 font-mono mt-0.5">{{ customerSummaryLoading ? '…' : customerSummary?.order_count ?? '--' }}</div>
        </div>
        <div class="bg-amber-50/70 p-2 rounded-lg border border-amber-100/80">
          <div class="text-[10px] text-amber-700 font-medium">满意度</div>
          <div class="text-xs font-bold text-amber-900 font-mono mt-0.5" :title="customerSummary?.rating_count ? `${customerSummary.rating_count} 条评分` : ''">{{ customerSummaryLoading ? '…' : formatSatisfaction(customerSummary) }}</div>
        </div>
      </div>

      <!-- 快捷转工单入口 -->
      <div class="mt-3">
        <button
          @click="showCreateTicketModal = true"
          class="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          title="将当前会话转为售后/技术流转工单"
        >
          <i class="fa-solid fa-ticket text-[11px] text-indigo-600"></i>
          <span>一键转为工单</span>
        </button>
      </div>
    </div>

    <!-- 对话标签系统 -->
    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
          <i class="fa-solid fa-tags text-indigo-500 text-[11px]"></i>
          <span>客户与对话标签</span>
        </span>
        <span class="text-[10px] text-slate-400">{{ canEditTags ? '点击标签可移除' : '只读' }}</span>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-2.5">
        <span
          v-for="t in tags"
          :key="t.id"
          @click="removeTag(t.id)"
          :class="[
            'px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 transition-all shadow-sm',
            canEditTags ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
            t.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            t.color === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            t.color === 'rose' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            t.color === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
            t.color === 'cyan' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
            'bg-indigo-50 text-indigo-800 border-indigo-200'
          ]"
        >
          <span>{{ t.name }}</span>
          <i v-if="canEditTags" class="fa-solid fa-xmark text-[9px] opacity-70"></i>
        </span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <input
            v-model="newTagText"
            type="text"
            placeholder="输入新标签按回车..."
            :disabled="!canEditTags || tagsSaving"
            @keydown.enter="addTagFromInput"
            class="flex-1 bg-[#FFFFFF] text-[11px] text-[#0F172A] placeholder-slate-400 rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-sm"
          />
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addTagFromInput"
            class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm transition-colors"
          >
            + 添加
          </button>
        </div>
        <div class="flex flex-wrap gap-1 text-[10px] text-slate-400">
          <span class="text-slate-400 font-medium">常用:</span>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('VIP客户')"
            class="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors"
          >
            + VIP客户
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('物流催件')"
            class="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium transition-colors"
          >
            + 物流催件
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('退款咨询')"
            class="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium transition-colors"
          >
            + 退款咨询
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('尺码偏小')"
            class="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium transition-colors"
          >
            + 尺码偏小
          </button>
        </div>
      </div>
    </div>

    <!-- Shopify / 多渠道电商订单面板 -->
    <div class="p-4 border-b border-slate-100">
      <ShopifyOrderPanel
        :session-id="chatInfo?.session_id || ''"
        :can-manage-chat="canManageChat"
        @open-tracking="(order: any) => emit('open-tracking', order)"
        @action-toast="(msg: string, type?: 'success' | 'info' | 'error') => emit('action-toast', msg, type)"
      />
    </div>

    <!-- 团队协同与工单指派 -->
    <div class="p-4 border-b border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
          <i class="fa-solid fa-user-group text-indigo-500 text-[11px]"></i>
          <span>团队协同与工单指派</span>
        </span>
        <span class="text-[10px] text-slate-400">{{ assignmentLabel }}</span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-indigo-100 text-[10px] text-indigo-700 font-bold flex items-center justify-center border border-indigo-200">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-[#0F172A]">{{ chatInfo?.user_name || '未分配客服' }}</div>
              <div class="text-[10px] text-slate-500">{{ assignmentLabel }}</div>
            </div>
          </div>
          <button
            v-if="canManageChat && chatInfo?.status !== 'closed' && chatInfo?.user_id"
            @click="emit('open-transfer')"
            class="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-lg border border-indigo-200 shadow-sm transition-colors"
          >
            重新指派
          </button>
        </div>
      </div>
    </div>

    <!-- 往期多渠道咨询历史 -->
    <div class="p-4 flex-1">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
          <i class="fa-solid fa-clock-rotate-left text-purple-500 text-[11px]"></i>
          <span>往期多渠道咨询历史 ({{ historyLoading ? '…' : histories.length }})</span>
        </span>
      </div>

      <div class="space-y-3 relative pl-3.5 border-l-2 border-indigo-100 ml-2 text-xs">
        <button
          v-for="hist in histories"
          :key="hist.sessionId"
          type="button"
          class="relative block w-full border-0 bg-transparent p-0 text-left cursor-pointer group"
          @click="emit('select-session', hist.sessionId)"
        >
          <span class="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white group-hover:bg-indigo-600 transition-colors shadow-sm"></span>
          <div class="flex items-center justify-between leading-none">
            <span class="font-bold text-slate-800 text-xs">{{ hist.channel }}</span>
            <span class="text-[10px] text-slate-400 font-mono">{{ hist.date }}</span>
          </div>
          <p class="text-slate-600 text-[11px] mt-1 line-clamp-1">{{ hist.title }}</p>
          <p class="text-emerald-700 text-[10px] mt-0.5 font-semibold">状态: {{ hist.outcome }}</p>
        </button>
        <p v-if="!historyLoading && histories.length === 0" class="text-slate-400 text-[11px]">暂无可访问的往期会话。</p>
      </div>
    </div>

    <!-- 关联工单弹窗 -->
    <CreateTicketModal
      v-if="showCreateTicketModal"
      :show="showCreateTicketModal"
      :chat-info="props.chatInfo"
      @close="showCreateTicketModal = false"
      @ticket-created="onTicketCreated"
    />
  </aside>
</template>

<style scoped>
</style>
