<!--
Copyright 2024-2026 ChatterMate
中栏：聊天流与工作流主屏 (ConversationChat.vue - 1:1 原版 FontAwesome 复刻)
-->

<script setup lang="ts">
import { ref } from 'vue'
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox.vue'
import TrackingTimelineModal from '@/components/conversations/TrackingTimelineModal.vue'
import AICopilotAssistModal from '@/components/conversations/AICopilotAssistModal.vue'
import CannedResponsesModal from '@/components/conversations/CannedResponsesModal.vue'
import WhatsAppTemplatePicker from '@/components/conversations/WhatsAppTemplatePicker.vue'

const props = defineProps<{
  chat?: any
}>()

const emit = defineEmits<{
  (e: 'toggle-right-drawer'): void
  (e: 'open-transfer'): void
  (e: 'refresh'): void
  (e: 'action-toast', msg: string, type?: 'success' | 'info' | 'error'): void
}>()

const currentStatus = ref<'ai' | 'human' | 'resolved'>('ai')
const showTrackingModal = ref(false)
const showAiPolishModal = ref(false)
const showCannedModal = ref(false)
const showTemplateModal = ref(false)

// 模拟消息流
const messages = ref<any[]>([
  {
    type: 'customer',
    author: 'Jessica Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    time: '14:20',
    text: "Hi! I ordered the Silk Halter Evening Dress for my sister's wedding this Saturday. Can you confirm if DHL will deliver it before Friday evening?",
  },
  {
    type: 'ai',
    time: '14:21',
    duration: '0.6s',
    intent: '物流时效查询与加急催促',
    source: '《北美专线时效保障规则 & DHL Express API》',
    text: "Hello Jessica! ✨ I checked your order #US-2026-9812. The package has cleared US Customs in Los Angeles LAX this morning and is already sorted at your local DHL hub. It is guaranteed to be delivered by Thursday, August 27 at 4:00 PM (1 day ahead of your sister's wedding)! 👗",
  },
  {
    type: 'note',
    author: 'Alex Chen (售后主管)',
    time: '14:22',
    text: '内部备注：该客户是 L5 钻冠会员，年消费超 $1500。若出现任何物流异常，授权可直接赠送 $20 无门槛券补偿并电话跟进。',
  },
  {
    type: 'customer',
    author: 'Jessica Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    time: '14:25',
    text: 'That is amazing news! Thank you so much for the super quick response! Does the dress have stretch around the bust area?',
  },
])

const aiSuggestions = [
  '👗 告知面料微弹（含 5% 氨纶）并附赠穿搭指南',
  '🎁 推荐搭配同系列珍珠耳坠并送 15% 优惠券',
  '📦 发送专属物流动态实时跟踪卡片',
]

const handleSendMessage = (text: string, isNote: boolean) => {
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (isNote) {
    messages.value.push({
      type: 'note',
      author: 'Alex Chen (内部便签)',
      time: timeStr,
      text: text,
    })
    emit('action-toast', '内部团队私信便签已记录', 'info')
  } else {
    messages.value.push({
      type: 'agent',
      author: 'Alex Chen (客服坐席)',
      time: timeStr,
      text: text,
    })
    emit('action-toast', '消息已下发给客户', 'success')
  }
}

const handleTakeover = () => {
  currentStatus.value = 'human'
  emit('action-toast', '已成功接管会话，AI 自动回复已暂停', 'success')
}

const handleHandoverAI = () => {
  currentStatus.value = 'ai'
  emit('action-toast', '已将该会话无缝转交回 AI 智能接待', 'success')
}

const handleResolveSession = () => {
  currentStatus.value = 'resolved'
  emit('action-toast', '会话已标记为【已解决关闭】', 'success')
}
</script>

<template>
  <main class="flex-1 flex flex-col bg-[#080B11] relative overflow-hidden h-full">
    <!-- 顶部工作流状态条 (Workflow Header - 1:1 h-16 对齐) -->
    <header class="h-16 px-4 bg-[#0F1523]/90 border-b border-white/[0.08] flex items-center justify-between shrink-0 crystal-panel z-10 shadow-sm">
      <!-- 客户主信息与渠道 -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
            alt="Jessica Miller"
            class="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-md"
          />
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm">
            <i class="fa-brands fa-whatsapp"></i>
          </span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-100">Jessica Miller</h2>
            <span class="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded flex items-center gap-1">
              <i class="fa-solid fa-gem text-[8px]"></i> 钻石 VIP
            </span>
            <span class="px-1.5 py-0.2 text-[10px] font-medium bg-white/5 text-slate-300 border border-white/10 rounded">
              SHE-GLOW 美东站
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span class="flex items-center gap-1 text-[11px]">
              <i class="fa-regular fa-envelope text-[10px]"></i> jessica.m@outlook.com
            </span>
            <span class="text-slate-600">·</span>
            <span class="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i> 🇺🇸 纽约时间 14:28 PM
            </span>
          </div>
        </div>
      </div>

      <!-- 实时接待状态指示灯 + 快捷操作组 -->
      <div class="flex items-center gap-2.5">
        <!-- 实时状态胶囊 -->
        <div
          v-if="currentStatus === 'ai'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 pulse-subtle"></span>
          <span>AI 处理中 (置信度 98%)</span>
        </div>
        <div
          v-else-if="currentStatus === 'human'"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-[0_0_12px_rgba(59,130,246,0.25)]"
        >
          <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>人工接管 · Alex Chen</span>
        </div>
        <div
          v-else
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/40 border border-white/10 text-slate-400 text-xs font-semibold"
        >
          <span>🔒 已解决归档</span>
        </div>

        <div class="h-5 w-px bg-white/10"></div>

        <!-- 操作按钮组 -->
        <div class="flex items-center gap-1.5">
          <button
            v-if="currentStatus === 'ai'"
            @click="handleTakeover"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all"
          >
            <i class="fa-solid fa-user-check text-xs"></i>
            <span>人工接管</span>
          </button>

          <button
            v-else
            @click="handleHandoverAI"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <i class="fa-solid fa-robot text-xs"></i>
            <span>转回 AI</span>
          </button>

          <button
            @click="emit('open-transfer')"
            class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
            title="转交给售后/物流专员"
          >
            <i class="fa-solid fa-arrow-right-arrow-left fa-exchange-alt text-xs"></i>
            <span>转交</span>
          </button>

          <button
            @click="handleResolveSession"
            class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
            title="解决并关闭会话"
          >
            <i class="fa-solid fa-check-double text-xs"></i>
            <span>解决</span>
          </button>

          <button
            @click="emit('toggle-right-drawer')"
            class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center transition-all ml-1"
            title="展开/收起右侧栏"
          >
            <i class="fa-solid fa-table-columns fa-columns text-xs"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- WhatsApp 24 小时合规窗口倒计时提示条 -->
    <div class="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300 shrink-0">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation fa-exclamation-triangle text-amber-400"></i>
        <span><strong>WhatsApp 24小时合规窗口：</strong> 距离会话窗口关闭还剩 <span class="font-mono font-bold text-amber-200">03:42:15</span>。超时后仅允许发送 Meta 官方 Approved 模板消息。</span>
      </div>
      <button
        @click="showTemplateModal = true"
        class="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-200 text-[11px] font-medium transition-colors flex items-center gap-1"
      >
        <i class="fa-solid fa-file-lines fa-file-alt text-[10px]"></i> 选取官方模板
      </button>
    </div>

    <!-- 消息流区域 (Chat Space Feed) -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 chat-space-bg">
      <div class="flex items-center justify-center my-1">
        <div class="px-3.5 py-1 rounded-full bg-[#0F1523] border border-white/10 text-[11px] text-slate-400 flex items-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-lock text-emerald-400 text-xs"></i>
          <span>已通过 WhatsApp 端到端加密连接 · 所属店铺: SHE-GLOW 美东站</span>
        </div>
      </div>

      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="animate-in fade-in duration-200"
      >
        <!-- 客户消息 -->
        <div
          v-if="msg.type === 'customer'"
          class="flex items-start gap-3 max-w-[80%]"
        >
          <img
            :src="msg.avatar"
            :alt="msg.author"
            class="w-9 h-9 rounded-xl object-cover shrink-0 mt-0.5 border border-white/10 shadow-sm"
          />
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-300">{{ msg.author }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
            </div>
            <div class="p-3 rounded-2xl rounded-tl-sm bg-[#131B2E] border border-white/10 text-xs text-slate-100 leading-relaxed shadow-sm">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <!-- AI 应答卡片 -->
        <div
          v-else-if="msg.type === 'ai'"
          class="flex flex-col items-end max-w-[85%] ml-auto space-y-1.5"
        >
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <i class="fa-solid fa-bolt text-emerald-400 text-[10px]"></i>
              ⚡ AI {{ msg.duration }} 响应 · 意图: {{ msg.intent }}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
          </div>

          <div class="ai-crystal-bubble p-3.5 rounded-2xl rounded-tr-sm text-xs text-slate-100 leading-relaxed space-y-2.5 shadow-md">
            <div>{{ msg.text }}</div>
            <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-200 flex items-center justify-between">
              <span class="flex items-center gap-1.5 truncate">
                <i class="fa-solid fa-book-bookmark fa-bookmark text-xs text-emerald-400"></i>
                <span>知识库引用: {{ msg.source }}</span>
              </span>
              <button
                @click="showTrackingModal = true"
                class="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded font-medium text-[10px] shrink-0"
              >
                查看 DHL 轨迹
              </button>
            </div>
          </div>
        </div>

        <!-- 客服坐席消息 -->
        <div
          v-else-if="msg.type === 'agent'"
          class="flex flex-col items-end max-w-[80%] ml-auto space-y-1"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-blue-400">{{ msg.author }}</span>
            <span class="text-[10px] text-slate-500 font-mono">{{ msg.time }}</span>
          </div>
          <div class="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs leading-relaxed shadow-[0_0_16px_rgba(59,130,246,0.4)]">
            {{ msg.text }}
          </div>
        </div>

        <!-- 内部私信便签 -->
        <div
          v-else-if="msg.type === 'note'"
          class="my-2 p-3 rounded-xl note-crystal-bubble text-xs text-amber-200 space-y-1 shadow-sm"
        >
          <div class="flex items-center justify-between text-amber-400 font-bold text-[11px]">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-lock text-xs"></i>
              <span>内部团队私信便签</span>
            </span>
            <span class="font-normal font-mono text-[10px]">{{ msg.author }} · {{ msg.time }}</span>
          </div>
          <p class="leading-relaxed text-amber-100/90">{{ msg.text }}</p>
        </div>
      </div>
    </div>

    <!-- 底部回复多功能区 -->
    <ConversationReplyBox
      :ai-suggestions="aiSuggestions"
      @send="handleSendMessage"
      @open-ai-polish="showAiPolishModal = true"
      @open-canned="showCannedModal = true"
      @open-product="emit('action-toast', 'Shopify 商品选择器已就绪', 'info')"
      @action-toast="(msg, type) => emit('action-toast', msg, type)"
    />

    <!-- 物流全球实时轨迹弹窗 -->
    <TrackingTimelineModal
      :show="showTrackingModal"
      tracking-number="DHL-883921094US"
      carrier="DHL Express"
      @close="showTrackingModal = false"
      @send-to-chat="(msg) => handleSendMessage(msg, false)"
    />

    <!-- AI Copilot 智能改写润色弹窗 -->
    <AICopilotAssistModal
      :open="showAiPolishModal"
      @close="showAiPolishModal = false"
      @insert="(text: string) => handleSendMessage(text, false)"
    />

    <!-- 快捷话术库弹窗 -->
    <CannedResponsesModal
      :open="showCannedModal"
      :customer-name="'Jessica Miller'"
      @close="showCannedModal = false"
      @select="(text: string) => handleSendMessage(text, false)"
    />

    <!-- WhatsApp 官方报备模板 -->
    <WhatsAppTemplatePicker
      v-if="showTemplateModal"
      :account-id="'mock-account'"
      :session-id="'conv-1'"
      @close="showTemplateModal = false"
      @sent="emit('action-toast', 'Meta 官方报备模板已发送', 'success')"
    />
  </main>
</template>

<style scoped>
.crystal-panel {
  background: rgba(15, 21, 35, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.ai-crystal-bubble {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.2) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-top: 1px solid rgba(52, 211, 153, 0.5);
  box-shadow: 0 4px 20px -4px rgba(16, 185, 129, 0.15);
}

.note-crystal-bubble {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(217, 119, 6, 0.05) 100%);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-top: 1px solid rgba(251, 191, 36, 0.5);
}

.chat-space-bg {
  background-color: #080B11;
  background-image: 
    radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.03) 0px, transparent 60%),
    radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.02) 0px, transparent 50%);
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.04); }
}
.pulse-subtle {
  animation: pulse-subtle 3s infinite ease-in-out;
}
</style>
