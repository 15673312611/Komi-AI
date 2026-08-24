<!--
Copyright 2024-2026 ChatterMate
右栏：客户画像与电商上下文 (ChatInfoPanel.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref } from 'vue'
import ShopifyOrderPanel from '@/components/conversations/ShopifyOrderPanel.vue'

const props = defineProps<{
  chatInfo?: any
}>()

const emit = defineEmits<{
  (e: 'open-tracking', order: any): void
  (e: 'open-transfer'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const tags = ref([
  { id: '1', name: '🔥 VIP大客户', color: 'amber' },
  { id: '2', name: '📦 物流催件', color: 'cyan' },
  { id: '3', name: '👗 晚礼服大促', color: 'purple' },
])
const newTagText = ref('')

const removeTag = (id: string) => {
  tags.value = tags.value.filter((t) => t.id !== id)
}

const addTagFromInput = () => {
  const text = newTagText.value.trim()
  if (!text) return
  tags.value.push({
    id: String(Date.now()),
    name: text,
    color: 'emerald',
  })
  newTagText.value = ''
  emit('action-toast', `已添加标签: ${text}`, 'success')
}

const addPresetTag = (name: string, color: string) => {
  if (tags.value.some((t) => t.name === name)) return
  tags.value.push({ id: String(Date.now()), name, color })
  emit('action-toast', `已添加标签: ${name}`, 'success')
}

const copyEmail = () => {
  navigator.clipboard?.writeText('jessica.m@outlook.com')
  emit('action-toast', '客户邮箱已复制到剪贴板', 'success')
}

const histories = [
  {
    channel: 'Instagram DM',
    date: '2026-07-12',
    title: '咨询尺码推荐表',
    outcome: '已推荐购买 M 码并成单',
  },
  {
    channel: 'Email',
    date: '2026-05-18',
    title: '申请更改收件邮编',
    outcome: '客服 Sarah 2分钟内已同步 Shopify',
  },
]
</script>

<template>
  <aside class="w-[360px] bg-[#0F1523] border-l border-white/[0.08] flex flex-col shrink-0 overflow-y-auto transition-all duration-300 relative z-20 shadow-2xl select-none h-full">
    <!-- 客户画像头部卡片 (1:1 原版复刻) -->
    <div class="p-4 border-b border-white/[0.08] bg-gradient-to-b from-[#131B2E] to-[#0F1523]">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
            alt="Jessica Miller"
            class="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          />
          <div>
            <div class="flex items-center gap-1.5">
              <h3 class="font-bold text-slate-100 text-sm">Jessica Miller</h3>
              <span class="text-sm">🇺🇸</span>
            </div>
            <p
              @click="copyEmail"
              class="text-xs text-slate-400 mt-0.5 flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors"
            >
              <span>jessica.m@outlook.com</span>
              <i class="fa-regular fa-copy text-[10px]"></i>
            </p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          L5 钻冠会员
        </span>
      </div>

      <!-- 电商关键指标概览 -->
      <div class="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-[#080B11]/80 border border-white/[0.08] text-center shadow-inner">
        <div>
          <div class="text-[10px] text-slate-400">历史总消费</div>
          <div class="text-xs font-bold text-emerald-400 font-mono mt-0.5">$1,842.50</div>
        </div>
        <div class="border-x border-white/5">
          <div class="text-[10px] text-slate-400">订单总数</div>
          <div class="text-xs font-bold text-slate-100 font-mono mt-0.5">8 笔</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400">满意度评价</div>
          <div class="text-xs font-bold text-amber-400 font-mono mt-0.5">5.0 ⭐</div>
        </div>
      </div>
    </div>

    <!-- 🏷️ 对话标签系统 (1:1 原版复刻) -->
    <div class="p-3.5 border-b border-white/[0.08]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fa-solid fa-tags text-emerald-400 text-[11px]"></i>
          <span>客户与对话标签</span>
        </span>
        <span class="text-[10px] text-slate-500">点击标签即可管理</span>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-2.5">
        <span
          v-for="t in tags"
          :key="t.id"
          @click="removeTag(t.id)"
          :class="[
            'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all shadow-sm',
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
          <i class="fa-solid fa-xmark fa-times text-[9px] opacity-70"></i>
        </span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1">
          <input
            v-model="newTagText"
            type="text"
            placeholder="输入新标签按回车..."
            @keydown.enter="addTagFromInput"
            class="flex-1 bg-[#080B11] text-[11px] text-slate-200 placeholder-slate-500 rounded-lg px-2.5 py-1.5 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50"
          />
          <button
            @click="addTagFromInput"
            class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/[0.08]"
          >
            + 添加
          </button>
        </div>
        <div class="flex flex-wrap gap-1 text-[10px] text-slate-400">
          <span class="text-slate-500">常用:</span>
          <button
            @click="addPresetTag('🔥 VIP客户', 'amber')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + VIP客户
          </button>
          <button
            @click="addPresetTag('📦 物流催件', 'cyan')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + 物流催件
          </button>
          <button
            @click="addPresetTag('💰 退款咨询', 'rose')"
            class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
          >
            + 退款咨询
          </button>
          <button
            @click="addPresetTag('👗 尺码偏小', 'purple')"
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
        :session-id="'conv-1'"
        @open-tracking="(order: any) => emit('open-tracking', order)"
        @action-toast="(msg: string, type?: 'success' | 'info' | 'error') => emit('action-toast', msg, type)"
      />
    </div>

    <!-- 👤 团队协同与工单指派 (1:1 原版复刻) -->
    <div class="p-3.5 border-b border-white/[0.08]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fa-solid fa-user-group fa-users text-blue-400 text-[11px]"></i>
          <span>团队协同与工单指派</span>
        </span>
        <span class="text-[10px] text-emerald-400">● 客服在线</span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-white/[0.08]">
          <div class="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
              class="w-7 h-7 rounded-lg object-cover"
            />
            <div>
              <div class="text-xs font-semibold text-slate-100">Alex Chen (我)</div>
              <div class="text-[10px] text-slate-400">高级跨境售后支持 · P1 处理中</div>
            </div>
          </div>
          <button
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
          <i class="fa-solid fa-clock-rotate-left fa-history text-purple-400 text-[11px]"></i>
          <span>往期多渠道咨询历史 (2)</span>
        </span>
      </div>

      <div class="space-y-3 relative pl-3.5 border-l border-white/10 ml-2 text-xs">
        <div
          v-for="(hist, i) in histories"
          :key="i"
          class="relative"
        >
          <span class="absolute -left-[18px] top-1 w-2 h-2 rounded-full bg-slate-500 border-2 border-[#0F1523]"></span>
          <div class="flex items-center justify-between leading-none">
            <span class="font-semibold text-slate-200 text-xs">{{ hist.channel }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ hist.date }}</span>
          </div>
          <p class="text-slate-400 text-[11px] mt-1">{{ hist.title }}</p>
          <p class="text-emerald-400 text-[10px] mt-0.5">结果: {{ hist.outcome }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
