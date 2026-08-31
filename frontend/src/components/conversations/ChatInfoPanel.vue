<!--
Copyright 2024-2026 ChatterMate
右栏：客户画像与电商上下文 (ChatInfoPanel.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ChatDetail, Conversation } from '@/types/chat'
import ShopifyOrderPanel from '@/components/conversations/ShopifyOrderPanel.vue'
import CreateTicketModal from '@/components/conversations/CreateTicketModal.vue'
import { chatService, type CustomerSummary } from '@/services/chat'
import { permissionChecks } from '@/utils/permissions'
import { copyTextToClipboard } from '@/utils/clipboard'
import { chatHandler } from '@/utils/chatState'

const props = defineProps<{
  chatInfo?: ChatDetail | null
}>()

const showCreateTicketModal = ref(false)

const onTicketCreated = (ticketId: string) => {
  if (props.chatInfo?.session_id) {
    if (!tagNames.value.includes('已转工单')) {
      tagNames.value.push('已转工单')
    }
  }
  emit('action-toast', '工单已创建成功并完成会话关联！', 'success')
}

const customerName = computed(() => props.chatInfo?.customer?.full_name || props.chatInfo?.customer?.email || '未知客户')
const customerEmail = computed(() => props.chatInfo?.customer?.email || '')
const customerInitial = computed(() => customerName.value.trim().slice(0, 1).toUpperCase() || '?')
const canManageChat = computed(() => permissionChecks.canTakeOverChats())
const channelLabel = computed(() => {
  const channel = props.chatInfo?.channel || 'web'
  return channel === 'web' ? '网页会话' : channel[0].toUpperCase() + channel.slice(1)
})
const assignmentLabel = computed(() => {
  const handler = chatHandler(props.chatInfo)
  if (handler.kind === 'closed') return '会话已关闭'
  if (handler.kind === 'human') return `已分配给 ${handler.label}`
  return handler.kind === 'waiting' ? '等待人工接入' : '由 AI 自动回复'
})

const emit = defineEmits<{
  (e: 'open-tracking', order: any): void
  (e: 'open-transfer'): void
  (e: 'select-session', sessionId: string): void
  (e: 'chat-updated', chat: ChatDetail): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const tagNames = ref<string[]>([])
const newTagText = ref('')
const tagsSaving = ref(false)
let tagsSaveRequest = 0
const canEditTags = computed(() => canManageChat.value && Boolean(props.chatInfo?.session_id))
const tagColors = ['amber', 'cyan', 'purple', 'emerald']
const tags = computed(() => tagNames.value.map((name, index) => ({
  id: `${index}-${name}`,
  name,
  color: tagColors[index % tagColors.length],
})))
watch(() => [props.chatInfo?.session_id, props.chatInfo?.tags] as const, ([, value]) => {
  // A save response belongs only to the conversation that initiated it. Reset
  // local state on every thread switch before an old request can settle.
  tagsSaveRequest += 1
  tagsSaving.value = false
  tagNames.value = [...(value || [])]
  newTagText.value = ''
}, { immediate: true, deep: true })

const saveTags = async (nextTags: string[]) => {
  const sessionId = props.chatInfo?.session_id
  if (!canEditTags.value || !sessionId || tagsSaving.value) return
  const request = ++tagsSaveRequest
  const isCurrentRequest = () => request === tagsSaveRequest && props.chatInfo?.session_id === sessionId
  tagsSaving.value = true
  try {
    const updated = await chatService.updateTags(sessionId, nextTags)
    if (!isCurrentRequest()) return
    tagNames.value = [...(updated.tags || [])]
    emit('chat-updated', updated)
  } catch (err: any) {
    if (!isCurrentRequest()) return
    emit('action-toast', err?.response?.data?.detail || '保存标签失败，请稍后重试', 'error')
  } finally {
    if (isCurrentRequest()) tagsSaving.value = false
  }
}

const removeTag = (id: string) => {
  if (!canEditTags.value) return
  void saveTags(tags.value.filter(tag => tag.id !== id).map(tag => tag.name))
}

const addTagFromInput = () => {
  if (!canEditTags.value) return
  const text = newTagText.value.trim()
  if (!text || tags.value.some(tag => tag.name.toLocaleLowerCase() === text.toLocaleLowerCase())) return
  newTagText.value = ''
  void saveTags([...tagNames.value, text])
}

const addPresetTag = (name: string) => {
  if (!canEditTags.value) return
  if (tags.value.some(tag => tag.name === name)) return
  void saveTags([...tagNames.value, name])
}

const copyEmail = async () => {
  if (!customerEmail.value) return
  try {
    if (await copyTextToClipboard(customerEmail.value)) {
      emit('action-toast', '客户邮箱已复制到剪贴板', 'success')
    } else {
      emit('action-toast', '无法访问剪贴板，请手动复制客户邮箱', 'error')
    }
  } catch {
    emit('action-toast', '无法访问剪贴板，请手动复制客户邮箱', 'error')
  }
}

const customerSummary = ref<CustomerSummary | null>(null)
const customerSummaryLoading = ref(false)
let customerSummaryRequest = 0
const formatSpend = (summary: CustomerSummary | null) => {
  if (!summary || summary.total_spend === null || summary.total_spend === undefined) return '--'
  const amount = Number(summary.total_spend)
  if (!Number.isFinite(amount)) return '--'
  return `${summary.currency || ''} ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim()
}
const formatSatisfaction = (summary: CustomerSummary | null) => {
  if (!summary || summary.satisfaction_score === null || summary.satisfaction_score === undefined) return '--'
  return `${summary.satisfaction_score.toFixed(1)} / 5`
}
const loadCustomerSummary = async () => {
  const sessionId = props.chatInfo?.session_id
  const request = ++customerSummaryRequest
  customerSummary.value = null
  if (!sessionId) {
    customerSummaryLoading.value = false
    return
  }
  customerSummaryLoading.value = true
  try {
    const summary = await chatService.getCustomerSummary(sessionId)
    if (request === customerSummaryRequest) customerSummary.value = summary
  } catch {
    if (request === customerSummaryRequest) customerSummary.value = null
  } finally {
    if (request === customerSummaryRequest) customerSummaryLoading.value = false
  }
}

interface CustomerHistory {
  sessionId: string
  channel: string
  date: string
  title: string
  outcome: string
}

const histories = ref<CustomerHistory[]>([])
const historyLoading = ref(false)
let historyRequest = 0
const historyOutcome = (chat: Conversation) => {
  if (chat.status === 'closed') return '已解决并关闭'
  if (chat.user_name) return `人工接待：${chat.user_name}`
  return chat.status === 'transferred' || chat.agent.ai_replies_enabled === false ? '等待人工接入' : 'AI 自动回复中'
}
const loadCustomerHistory = async () => {
  const email = customerEmail.value
  const currentSessionId = props.chatInfo?.session_id
  const request = ++historyRequest
  histories.value = []
  if (!email || !currentSessionId) {
    historyLoading.value = false
    return
  }
  historyLoading.value = true
  try {
    const chats = await chatService.getRecentChats({ customer_email: email, limit: 100 })
    if (request !== historyRequest) return
    histories.value = chats
      .filter(chat => chat.session_id !== currentSessionId)
      .map(chat => ({
        sessionId: chat.session_id,
        channel: chat.channel === 'web' ? '网页会话' : (chat.channel || 'web')[0].toUpperCase() + (chat.channel || 'web').slice(1),
        date: isNaN(new Date(chat.updated_at).getTime()) ? '' : new Date(chat.updated_at).toLocaleDateString('zh-CN'),
        title: chat.last_message || '（无消息内容）',
        outcome: historyOutcome(chat),
      }))
  } catch {
    if (request === historyRequest) histories.value = []
  } finally {
    if (request === historyRequest) historyLoading.value = false
  }
}
watch(() => [props.chatInfo?.session_id, customerEmail.value], () => { void loadCustomerHistory() }, { immediate: true })
watch(() => props.chatInfo?.session_id, () => { void loadCustomerSummary() }, { immediate: true })
</script>

<template>
  <aside class="w-[360px] bg-[#0F1523] border-l border-white/[0.08] flex flex-col shrink-0 overflow-y-auto transition-all duration-300 relative z-20 shadow-2xl select-none h-full">
    <!-- 客户画像头部卡片 (1:1 原版复刻) -->
    <div class="p-4 border-b border-white/[0.08] bg-gradient-to-b from-[#131B2E] to-[#0F1523]">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl border-2 border-emerald-500/40 bg-slate-700 text-base font-bold text-slate-100 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            {{ customerInitial }}
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">{{ customerName }}</h3>
            <p
              v-if="customerEmail"
              @click="copyEmail"
              class="text-xs text-slate-400 mt-0.5 flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors"
            >
              <span>{{ customerEmail }}</span>
              <i class="fa-regular fa-copy text-[10px]"></i>
            </p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {{ channelLabel }}
        </span>
      </div>

      <!-- 电商关键指标概览 -->
      <div class="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-[#080B11]/80 border border-white/[0.08] text-center shadow-inner">
        <div>
          <div class="text-[10px] text-slate-400">历史消费</div>
          <div class="text-xs font-bold text-emerald-400 mt-0.5 truncate" :title="formatSpend(customerSummary)">{{ customerSummaryLoading ? '…' : formatSpend(customerSummary) }}</div>
        </div>
        <div class="border-x border-white/5">
          <div class="text-[10px] text-slate-400">订单数量</div>
          <div class="text-xs font-bold text-slate-100 font-mono mt-0.5">{{ customerSummaryLoading ? '…' : customerSummary?.order_count ?? '--' }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400">满意度</div>
          <div class="text-xs font-bold text-amber-400 font-mono mt-0.5" :title="customerSummary?.rating_count ? `${customerSummary.rating_count} 条评分` : ''">{{ customerSummaryLoading ? '…' : formatSatisfaction(customerSummary) }}</div>
        </div>
      </div>

      <!-- 快捷转工单入口 -->
      <div class="mt-3">
        <button
          @click="showCreateTicketModal = true"
          class="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          title="将当前会话转为售后/技术流转工单"
        >
          <i class="fa-solid fa-ticket text-[11px]"></i>
          <span>一键转为工单</span>
        </button>
      </div>
    </div>

    <!-- 🏷️ 对话标签系统 (1:1 原版复刻) -->
    <div class="p-3.5 border-b border-white/[0.08]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fa-solid fa-tags text-emerald-400 text-[11px]"></i>
          <span>客户与对话标签</span>
        </span>
        <span class="text-[10px] text-slate-500">{{ canEditTags ? '点击标签即可管理' : '只读' }}</span>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-2.5">
        <span
          v-for="t in tags"
          :key="t.id"
          @click="removeTag(t.id)"
          :class="[
            'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-all shadow-sm',
            canEditTags ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
            t.color === 'amber'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : t.color === 'cyan'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              : t.color === 'purple'
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          ]"
        >
          <span>{{ t.name }}</span>
          <i class="fa-solid fa-xmark text-[9px] opacity-70"></i>
        </span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1">
          <input
            v-model="newTagText"
            type="text"
            placeholder="输入新标签按回车..."
            :disabled="!canEditTags || tagsSaving"
            @keydown.enter="addTagFromInput"
            class="flex-1 bg-[#080B11] text-[11px] text-slate-200 placeholder-slate-500 rounded-lg px-2.5 py-1.5 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50"
          />
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addTagFromInput"
            class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 添加
          </button>
        </div>
        <div class="flex flex-wrap gap-1 text-[10px] text-slate-400">
          <span class="text-slate-500">常用:</span>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('VIP客户')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + VIP客户
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('物流催件')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + 物流催件
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('退款咨询')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + 退款咨询
          </button>
          <button
            :disabled="!canEditTags || tagsSaving"
            @click="addPresetTag('尺码偏小')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + 尺码偏小
          </button>
        </div>
      </div>
    </div>

    <!-- 📦 Shopify / 多渠道电商订单面板 -->
    <div class="p-3.5 border-b border-white/[0.08]">
      <ShopifyOrderPanel
        :session-id="chatInfo?.session_id || ''"
        :can-manage-chat="canManageChat"
        @open-tracking="(order: any) => emit('open-tracking', order)"
        @action-toast="(msg: string, type?: 'success' | 'info' | 'error') => emit('action-toast', msg, type)"
      />
    </div>

    <!-- 👤 团队协同与工单指派 (1:1 原版复刻) -->
    <div class="p-3.5 border-b border-white/[0.08]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fa-solid fa-user-group text-blue-400 text-[11px]"></i>
          <span>团队协同与工单指派</span>
        </span>
        <span class="text-[10px] text-slate-400">{{ assignmentLabel }}</span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-white/[0.08]">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-slate-700 text-[10px] text-slate-200 flex items-center justify-center">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-100">{{ chatInfo?.user_name || '未分配客服' }}</div>
              <div class="text-[10px] text-slate-400">{{ assignmentLabel }}</div>
            </div>
          </div>
          <button
            v-if="canManageChat && chatInfo?.status !== 'closed' && chatInfo?.user_id"
            @click="emit('open-transfer')"
            class="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] rounded border border-white/[0.08]"
          >
            重新指派
          </button>
        </div>
      </div>
    </div>

    <!-- 📜 往期多渠道咨询历史 (1:1 原版复刻) -->
    <div class="p-3.5 flex-1">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fa-solid fa-clock-rotate-left text-purple-400 text-[11px]"></i>
          <span>往期多渠道咨询历史 ({{ historyLoading ? '…' : histories.length }})</span>
        </span>
      </div>

      <div class="space-y-3 relative pl-3.5 border-l border-white/10 ml-2 text-xs">
        <button
          v-for="(hist, i) in histories"
          :key="hist.sessionId"
          type="button"
          class="relative block w-full border-0 bg-transparent p-0 text-left"
          @click="emit('select-session', hist.sessionId)"
        >
          <span class="absolute -left-[18px] top-1 w-2 h-2 rounded-full bg-slate-500 border-2 border-[#0F1523]"></span>
          <div class="flex items-center justify-between leading-none">
            <span class="font-semibold text-slate-200 text-xs">{{ hist.channel }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ hist.date }}</span>
          </div>
          <p class="text-slate-400 text-[11px] mt-1">{{ hist.title }}</p>
          <p class="text-emerald-400 text-[10px] mt-0.5">结果: {{ hist.outcome }}</p>
        </button>
        <p v-if="!historyLoading && histories.length === 0" class="text-slate-500 text-[11px]">暂无可访问的往期会话。</p>
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
