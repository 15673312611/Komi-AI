<!--
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { agentService } from '@/services/agent'
import { useAgentEdit } from '@/composables/useAgentEdit'
import { useSubscriptionStorage } from '@/utils/storage'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'

interface UserGroup {
  id: string;
  name: string;
}

const props = defineProps({
  instructions: {
    type: String,
    required: true
  },
  guardrailPrompt: {
    type: String as () => string | null,
    default: null
  },
  guardrailEnabled: {
    type: Boolean,
    default: true
  },
  transferToHuman: {
    type: Boolean,
    required: true
  },
  aiRepliesEnabled: {
    type: Boolean,
    default: true
  },
  askForRating: {
    type: Boolean,
    required: true
  },
  handoffCollectEmail: {
    type: Boolean,
    default: true
  },
  handoffCollectName: {
    type: Boolean,
    default: true
  },
  userGroups: {
    type: Array as () => UserGroup[],
    required: true
  },
  selectedGroupIds: {
    type: Array as () => string[],
    required: true
  },
  loadingGroups: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object as () => any,
    required: true
  }
})

const emit = defineEmits([
  'save-agent'
])

// Initialize agent edit composable
const { generateInstructions, isLoading, error } = useAgentEdit(props.agent)

// Subscription and rating feature checking
const subscriptionStorage = useSubscriptionStorage()
const { hasEnterpriseModule } = useEnterpriseFeatures()
const isSubscriptionActive = computed(() => subscriptionStorage.isSubscriptionActive())

// Check if rating feature is available
const hasRatingFeature = computed(() => {
  return subscriptionStorage.hasFeature('rating')
})

// Check if rating is locked
const isRatingLocked = computed(() => {
  // Only lock if enterprise module exists
  if (!hasEnterpriseModule) {
    return false
  }
  return !hasRatingFeature.value || !isSubscriptionActive.value
})

// Upgrade modal state
const showUpgradeModal = ref(false)

// Modal functions
const closeUpgradeModal = () => {
  showUpgradeModal.value = false
}

const handleUpgrade = () => {
  window.location.href = '/settings/subscription'
}

// Create local state for all editable fields
const localInstructions = ref(props.instructions)
// The box shows the real shipped rule so it can be read and edited, rather than a
// prose summary of it — that summary drifted from the actual wording the first
// time the default changed. NULL in the database still means "follow the shipped
// default", so an agent left untouched keeps picking up improvements: on save we
// send null whenever the text is empty or still identical to the default.
const localGuardrailPrompt = ref(props.guardrailPrompt ?? '')
const defaultGuardrailPrompt = ref('')
const localGuardrailEnabled = ref(props.guardrailEnabled)

const isGuardrailDefault = computed(() => {
  const text = localGuardrailPrompt.value.trim()
  return !text || text === defaultGuardrailPrompt.value.trim()
})
const localTransferToHuman = ref(props.transferToHuman)
const localAiRepliesEnabled = ref(props.aiRepliesEnabled)
const localAskForRating = ref(props.askForRating)
const localHandoffCollectEmail = ref(props.handoffCollectEmail)
const localHandoffCollectName = ref(props.handoffCollectName)
const localSelectedGroupIds = ref<string[]>([...props.selectedGroupIds])

// Human-like response delay & typing simulation state
const initialResponseDelay = props.agent?.customization?.customization_metadata?.response_delay || {
  mode: 'human_like',
  custom_delay_seconds: 3,
  simulate_typing: true
}
const localResponseDelayMode = ref<'human_like' | 'instant' | 'custom'>(initialResponseDelay.mode || 'human_like')
const localCustomDelaySeconds = ref<number>(initialResponseDelay.custom_delay_seconds ?? 3)
const localSimulateTyping = ref<boolean>(initialResponseDelay.simulate_typing !== false)

// Unknown question & knowledge miss fallback strategy
const initialFallbackStrategy = (props.agent?.customization?.customization_metadata as any)?.unknown_fallback_strategy || 'transfer_human'
const localUnknownFallbackStrategy = ref<'transfer_human' | 'create_ticket' | 'clarify'>(initialFallbackStrategy)

// Watch for changes in props to update local state
// Show the shipped rule when this agent has not written its own. Fetched rather
// than duplicated here so the box can never drift from the wording actually sent
// to the model. If it fails, the box stays empty and still means "use the
// default" — the feature degrades to what it was before.
onMounted(async () => {
  try {
    defaultGuardrailPrompt.value = await agentService.getGuardrailDefault()
    if (!localGuardrailPrompt.value.trim()) {
      localGuardrailPrompt.value = defaultGuardrailPrompt.value
    }
  } catch (e) {
    console.error('Could not load the default guardrail rule:', e)
  }
})

watch(() => props.guardrailPrompt, (v) => {
  localGuardrailPrompt.value = v ?? defaultGuardrailPrompt.value
})
watch(() => props.guardrailEnabled, (v) => { localGuardrailEnabled.value = v })

watch(() => props.instructions, (newValue) => {
  localInstructions.value = newValue
})

watch(() => props.transferToHuman, (newValue) => {
  localTransferToHuman.value = newValue
})

watch(() => props.aiRepliesEnabled, (newValue) => {
  localAiRepliesEnabled.value = newValue
})

watch(() => props.askForRating, (newValue) => {
  localAskForRating.value = newValue
})

watch(() => props.handoffCollectEmail, (newValue) => {
  localHandoffCollectEmail.value = newValue
})

watch(() => props.handoffCollectName, (newValue) => {
  localHandoffCollectName.value = newValue
})

watch(() => props.selectedGroupIds, (newValue) => {
  localSelectedGroupIds.value = [...newValue]
}, { deep: true })

watch(() => props.agent?.customization?.customization_metadata?.response_delay, (v) => {
  if (v) {
    localResponseDelayMode.value = v.mode || 'human_like'
    localCustomDelaySeconds.value = v.custom_delay_seconds ?? 3
    localSimulateTyping.value = v.simulate_typing !== false
  }
}, { deep: true })

watch(() => (props.agent?.customization?.customization_metadata as any)?.unknown_fallback_strategy, (v) => {
  if (v) {
    localUnknownFallbackStrategy.value = v
  }
})

const transferReasons = [
  "知识库未覆盖或无法解答",
  "客户明确要求人工客服",
  "检测到客户负面或不满情绪",
  "高优先级或紧急业务咨询",
  "涉及退款、合规或安全事项"
]

const tooltipContent = computed(() => {
  return `满足以下情况时自动转人工：\n${transferReasons.map(reason => `• ${reason}`).join('\n')}`
})

const ratingTooltipContent = computed(() => {
  return `开启后：\n• 会话结束时邀请客户评价\n• 收集 1-5 星级满意度评分\n• 收集客户反馈建议\n• 持续追踪与提升服务体验`
})

// AI generation state
const showAIPrompt = ref(false)
const aiPrompt = ref('')

const handleGenerateWithAI = async () => {
  if (!aiPrompt.value.trim()) return
  
  try {
    const generatedInstructions = await generateInstructions(aiPrompt.value)
    if (generatedInstructions.length > 0) {
      // Join the generated instructions with newlines
      localInstructions.value = generatedInstructions.join('\n')
      showAIPrompt.value = false
      aiPrompt.value = ''
    }
  } catch (err) {
    console.error('Failed to generate instructions:', err)
  }
}

// Handle rating toggle with feature check
const handleRatingToggle = (event: Event) => {
  const newValue = (event.target as HTMLInputElement).checked
  
  if (newValue && isRatingLocked.value && hasEnterpriseModule) {
    // Prevent the toggle and show upgrade modal only if enterprise module exists
    event.preventDefault()
    ;(event.target as HTMLInputElement).checked = false
    showUpgradeModal.value = true
    return
  }
  
  localAskForRating.value = newValue
}

const handleSave = () => {
  emit('save-agent', {
    instructions: localInstructions.value,
    // null when untouched, so this agent keeps following the shipped default
    // rather than freezing a copy of today's wording.
    guardrailPrompt: isGuardrailDefault.value ? null : localGuardrailPrompt.value.trim(),
    guardrailEnabled: localGuardrailEnabled.value,
    transferToHuman: localTransferToHuman.value,
    aiRepliesEnabled: localAiRepliesEnabled.value,
    askForRating: localAskForRating.value,
    handoffCollectEmail: localHandoffCollectEmail.value,
    handoffCollectName: localHandoffCollectName.value,
    selectedGroupIds: localSelectedGroupIds.value,
    responseDelay: {
      mode: localResponseDelayMode.value,
      custom_delay_seconds: Number(localCustomDelaySeconds.value) || 3,
      simulate_typing: localSimulateTyping.value
    },
    unknownFallbackStrategy: localUnknownFallbackStrategy.value
  })
}
</script>

<template>
  <div class="instructions-tab">
    <!-- Instructions Section -->
    <section class="detail-section instructions-section">
      <div class="instructions-header">
        <h4 class="section-title">人设与指令 (System Instructions)</h4>
        <button 
          class="ai-generate-button" 
          @click="showAIPrompt = true"
          :disabled="isLoading"
          v-if="isEditing"
        >
          <span class="ai-icon">✨</span>
          AI 智能生成人设
        </button>
      </div>
      
      <!-- AI Prompt Modal -->
      <div v-if="showAIPrompt" class="ai-prompt-modal">
        <div class="ai-prompt-content">
          <h5>使用 AI 生成智能体人设与指令</h5>
          <textarea 
            v-model="aiPrompt"
            placeholder="描述您期望智能客服承担的职责。例如：'创建一个专业温和的跨境电商售后客服，负责协助买家处理订单物流追踪、退换货及商品保修咨询'"
            rows="4"
            class="ai-prompt-textarea"
          ></textarea>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="ai-prompt-actions">
            <button 
              class="cancel-ai-button" 
              @click="showAIPrompt = false"
              :disabled="isLoading"
            >
              取消
            </button>
            <button 
              class="generate-ai-button" 
              @click="handleGenerateWithAI"
              :disabled="isLoading || !aiPrompt.trim()"
            >
              {{ isLoading ? '正在生成...' : '立即生成' }}
            </button>
          </div>
        </div>
      </div>
      
      <textarea 
        class="instructions-textarea" 
        v-model="localInstructions"
        rows="6" 
        placeholder="输入智能客服的人设设定、回答语气及行为规范..."
        :readonly="!isEditing"
      ></textarea>
    </section>

    <!-- Guardrail Section -->
    <section class="detail-section guardrail-section">
      <div class="toggle-header">
        <h4 class="section-title">业务防护栏 (Guardrail)</h4>
        <label class="switch">
          <input type="checkbox" v-model="localGuardrailEnabled" :disabled="!isEditing">
          <span class="slider"></span>
        </label>
      </div>
      <p class="helper-text">
        确保智能体仅聚焦于您企业的核心业务话题，防止访客将其作为通用大模型闲聊或越权使用。防御 Prompt 注入与保护系统配置的机制始终默认开启。
      </p>

      <template v-if="localGuardrailEnabled">
        <textarea
          class="instructions-textarea"
          v-model="localGuardrailPrompt"
          rows="5"
          :readonly="!isEditing"
          placeholder="留空则使用系统内置的通用商业防护栏设定。"
        ></textarea>
        <p class="helper-text">
          <template v-if="isGuardrailDefault">
            当前采用平台推荐默认规则。您可以根据自身行业特性进行定制。
          </template>
          <template v-else>
            已启用自定义业务防护规则（已覆盖系统默认设置）。清空输入框可恢复默认防护栏。
          </template>
          支持在文案中使用 <code>{org}</code> 代表您的企业名称。
        </p>
      </template>
    </section>

    <!-- Transfer and Rating Section -->
    <section class="detail-section">
      <div class="transfer-section">
        <!-- 默认接待模式选择 -->
        <div class="routing-mode-selector mb-6">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h4 class="section-title text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>会话默认接待模式</span>
                <span class="text-[11px] font-normal text-slate-400">（新会话进入时的默认接待方）</span>
              </h4>
              <p class="helper-text text-xs text-slate-400 mt-0.5">
                配置新客户咨询进入系统时，默认优先由 AI 智能体接待还是直接进入人工客服队列。
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <!-- AI优先卡片 -->
            <div
              @click="isEditing && (localAiRepliesEnabled = true)"
              :class="[
                'p-3.5 rounded-xl border transition-all flex items-start gap-3',
                isEditing ? 'cursor-pointer' : 'cursor-default opacity-80',
                localAiRepliesEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                  : 'bg-[#141B2E] border-white/[0.08] text-slate-400 hover:border-white/20'
              ]"
            >
              <div :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5',
                localAiRepliesEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              ]">
                <font-awesome-icon icon="fa-solid fa-robot" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold" :class="localAiRepliesEnabled ? 'text-emerald-300' : 'text-slate-200'">
                    🤖 AI 智能客服优先 (推荐)
                  </span>
                  <font-awesome-icon v-if="localAiRepliesEnabled" icon="fa-solid fa-circle-check" class="text-emerald-400 text-sm" />
                </div>
                <p class="text-[11px] mt-1 text-slate-400 leading-relaxed">
                  收到新咨询后，AI 智能体基于知识库与业务规则自动应答，支持 7×24 小时即时响应。
                </p>
              </div>
            </div>

            <!-- 人工优先卡片 -->
            <div
              @click="isEditing && (localAiRepliesEnabled = false)"
              :class="[
                'p-3.5 rounded-xl border transition-all flex items-start gap-3',
                isEditing ? 'cursor-pointer' : 'cursor-default opacity-80',
                !localAiRepliesEnabled
                  ? 'bg-blue-500/10 border-blue-500/50 text-slate-100 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : 'bg-[#141B2E] border-white/[0.08] text-slate-400 hover:border-white/20'
              ]"
            >
              <div :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5',
                !localAiRepliesEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
              ]">
                <font-awesome-icon icon="fa-solid fa-headset" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold" :class="!localAiRepliesEnabled ? 'text-blue-300' : 'text-slate-200'">
                    👤 真人客服优先 (纯人工接待)
                  </span>
                  <font-awesome-icon v-if="!localAiRepliesEnabled" icon="fa-solid fa-circle-check" class="text-blue-400 text-sm" />
                </div>
                <p class="text-[11px] mt-1 text-slate-400 leading-relaxed">
                  新咨询直接路由至人工客服排队队列，AI 不自动对外发送回复，完全由人工坐席承接。
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 拟人化回复间隔与打字仿真 (AI模式下可用) -->
        <div v-if="localAiRepliesEnabled" class="response-delay-box p-4 rounded-xl bg-[#0F1523] border border-white/[0.08] mb-6">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-100">⏱️ AI 拟人化回复间隔与输入仿真</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">防机器感辨识</span>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="localSimulateTyping" :disabled="!isEditing">
              <span class="slider"></span>
            </label>
          </div>
          <p class="helper-text text-xs text-slate-400 mb-3">
            开启打字中状态模拟与回复间隔，避免毫秒级秒回长篇文本给客户带来生硬的机器人感。
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            <button
              type="button"
              :disabled="!isEditing"
              @click="localResponseDelayMode = 'human_like'"
              :class="[
                'p-2.5 rounded-xl border text-left transition-all',
                localResponseDelayMode === 'human_like'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div class="text-xs font-bold flex items-center gap-1.5">
                <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" />
                <span>智能动态拟人 (推荐)</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">2~4秒，根据文本长短智能计算打字时长</p>
            </button>

            <button
              type="button"
              :disabled="!isEditing"
              @click="localResponseDelayMode = 'instant'"
              :class="[
                'p-2.5 rounded-xl border text-left transition-all',
                localResponseDelayMode === 'instant'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div class="text-xs font-bold flex items-center gap-1.5">
                <font-awesome-icon icon="fa-solid fa-bolt" />
                <span>极速即时响应</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">0秒延迟，生成完成后立即送达客户</p>
            </button>

            <button
              type="button"
              :disabled="!isEditing"
              @click="localResponseDelayMode = 'custom'"
              :class="[
                'p-2.5 rounded-xl border text-left transition-all',
                localResponseDelayMode === 'custom'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div class="text-xs font-bold flex items-center gap-1.5">
                <font-awesome-icon icon="fa-solid fa-sliders" />
                <span>自定义固定延迟</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">手动指定固定等待回复秒数</p>
            </button>
          </div>

          <div v-if="localResponseDelayMode === 'custom'" class="flex items-center gap-3 p-2.5 rounded-xl bg-[#161E31] border border-white/[0.06]">
            <span class="text-xs text-slate-300 shrink-0">回复延迟时间：</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              v-model.number="localCustomDelaySeconds"
              :disabled="!isEditing"
              class="flex-1 accent-emerald-500"
            />
            <span class="text-xs font-mono font-bold text-emerald-400 w-14 text-right">{{ localCustomDelaySeconds }} 秒</span>
          </div>
        </div>

        <!-- 未知问题与知识库未命中应对策略 -->
        <div v-if="localAiRepliesEnabled" class="unknown-fallback-section p-4 rounded-xl bg-[#0F1523] border border-white/[0.08] mb-6">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-100">🛡️ 知识库未覆盖与未知问题应对策略</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">防幻觉与胡编</span>
            </div>
          </div>
          <p class="helper-text text-xs text-slate-400 mb-3">
            当客户提问超出知识库已知范围或 AI 不确定时，系统采取的优雅降级与承接方式。
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- 自动转人工 (推荐) -->
            <button
              type="button"
              :disabled="!isEditing"
              @click="localUnknownFallbackStrategy = 'transfer_human'"
              :class="[
                'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                localUnknownFallbackStrategy === 'transfer_human'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div>
                <div class="text-xs font-bold flex items-center justify-between">
                  <span class="flex items-center gap-1.5" :class="localUnknownFallbackStrategy === 'transfer_human' ? 'text-blue-300' : 'text-slate-200'">
                    <font-awesome-icon icon="fa-solid fa-headset" />
                    <span>自动转交人工 (推荐)</span>
                  </span>
                  <font-awesome-icon v-if="localUnknownFallbackStrategy === 'transfer_human'" icon="fa-solid fa-circle-check" class="text-blue-400 text-xs" />
                </div>
                <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  礼貌说明已知情况，并自动将该会话排队转交人工客服专员接管。
                </p>
              </div>
            </button>

            <!-- 引导留资 / 生成工单 -->
            <button
              type="button"
              :disabled="!isEditing"
              @click="localUnknownFallbackStrategy = 'create_ticket'"
              :class="[
                'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                localUnknownFallbackStrategy === 'create_ticket'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div>
                <div class="text-xs font-bold flex items-center justify-between">
                  <span class="flex items-center gap-1.5" :class="localUnknownFallbackStrategy === 'create_ticket' ? 'text-blue-300' : 'text-slate-200'">
                    <font-awesome-icon icon="fa-solid fa-ticket" />
                    <span>引导留资 / 建立工单</span>
                  </span>
                  <font-awesome-icon v-if="localUnknownFallbackStrategy === 'create_ticket'" icon="fa-solid fa-circle-check" class="text-blue-400 text-xs" />
                </div>
                <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  主动询问客户联系邮箱与订单问题，自动生成待办售后工单后续跟进。
                </p>
              </div>
            </button>

            <!-- 礼貌答复并引导补充 -->
            <button
              type="button"
              :disabled="!isEditing"
              @click="localUnknownFallbackStrategy = 'clarify'"
              :class="[
                'p-3 rounded-xl border text-left transition-all flex flex-col justify-between',
                localUnknownFallbackStrategy === 'clarify'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : 'bg-[#161E31] border-white/[0.06] text-slate-400 hover:border-white/20'
              ]"
            >
              <div>
                <div class="text-xs font-bold flex items-center justify-between">
                  <span class="flex items-center gap-1.5" :class="localUnknownFallbackStrategy === 'clarify' ? 'text-blue-300' : 'text-slate-200'">
                    <font-awesome-icon icon="fa-solid fa-comments" />
                    <span>礼貌答复并引导澄清</span>
                  </span>
                  <font-awesome-icon v-if="localUnknownFallbackStrategy === 'clarify'" icon="fa-solid fa-circle-check" class="text-blue-400 text-xs" />
                </div>
                <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  说明目前暂未查询到确切信息，引导客户补充具体订单号或详细描述。
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- 转人工开关 -->
        <div v-if="localAiRepliesEnabled" class="transfer-toggle">
          <div class="toggle-header">
            <h4 class="section-title">自动转交人工客服</h4>
            <label class="switch" v-tooltip="tooltipContent">
              <input type="checkbox"
                v-model="localTransferToHuman"
                :disabled="!isEditing"
              >
              <span class="slider"></span>
            </label>
          </div>
          <p class="helper-text">当客户情绪激动、明确要求人工或 AI 无法妥善回答时，自动触发转人工流程</p>
        </div>

        <!-- 转人工留资 -->
        <div v-if="localAiRepliesEnabled && localTransferToHuman" class="handoff-collect">
          <div class="toggle-header">
            <span class="subsection-title">转人工时向客户收集邮箱</span>
            <label class="switch">
              <input type="checkbox" v-model="localHandoffCollectEmail" :disabled="!isEditing">
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-header">
            <span class="subsection-title">转人工时向客户收集姓名 (可选)</span>
            <label class="switch">
              <input type="checkbox" v-model="localHandoffCollectName" :disabled="!isEditing">
              <span class="slider"></span>
            </label>
          </div>
          <p class="helper-text">在交接给人工客服前收集联系方式，以便客服人员后续离线跟进。</p>
        </div>

        <!-- 客服分组选择 -->
        <div v-if="localTransferToHuman || !localAiRepliesEnabled" class="transfer-groups">
          <h4 class="subsection-title">接待客服分组</h4>
          <p v-if="userGroups.length" class="helper-text">选择负责承接该智能体转交会话的人工客服团队</p>
          
          <div v-if="!loadingGroups">
            <div v-if="userGroups.length" class="groups-list">
              <label v-for="group in userGroups" :key="group.id" class="group-item">
                <input 
                  type="checkbox" 
                  :value="group.id"
                  v-model="localSelectedGroupIds"
                  :disabled="!isEditing"
                >
                <span>{{ group.name }}</span>
              </label>
            </div>
            <div v-else class="no-groups-message">
              <p>暂无可用客服分组。</p>
              <router-link to="/human-agents" class="create-group-link">
                创建客服分组 <font-awesome-icon icon="fa-solid fa-arrow-right" />
              </router-link>
            </div>
          </div>
          
          <div v-else class="loading-groups">
            正在加载团队分组...
          </div>
        </div>

        <!-- 满意度评价 -->
        <div class="rating-toggle">
          <div class="toggle-header">
            <h4 class="section-title">
              会话结束满意度评价 (CSAT)
              <font-awesome-icon v-if="hasEnterpriseModule && isRatingLocked" icon="fa-solid fa-lock" class="lock-icon" />
            </h4>
            <label class="switch" :class="{ 'locked': isRatingLocked }" v-tooltip="ratingTooltipContent">
              <input type="checkbox" 
                :checked="localAskForRating"
                @change="handleRatingToggle"
                :disabled="!isEditing || (isRatingLocked && !localAskForRating)"
              >
              <span class="slider" :class="{ 'locked': isRatingLocked }"></span>
            </label>
          </div>
          <p class="helper-text">
            <span v-if="!isRatingLocked || !hasEnterpriseModule">在会话结束时主动邀请客户对本次服务进行星级评分与留言反馈</span>
            <span v-else class="locked-text">
              <font-awesome-icon icon="fa-solid fa-crown" class="premium-icon" />
              升级企业套餐以解锁客户满意度星级评价功能
            </span>
          </p>
          <p class="helper-text channel-note">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="info-icon" />
            提示：满意度评价仅在网页内置挂件中触发，第三方集成渠道（WhatsApp/Telegram 等）暂不展示。
          </p>
        </div>
      </div>
    </section>

    <!-- Save Button -->
    <div v-if="isEditing" class="save-section">
      <button class="save-button" @click="handleSave">
        保存人设配置
      </button>
    </div>

    <!-- Rating Feature Upgrade Modal (only shown when enterprise module exists) -->
    <div v-if="hasEnterpriseModule && showUpgradeModal" class="upgrade-modal-overlay">
      <div class="upgrade-modal">
        <div class="upgrade-modal-header">
          <div class="upgrade-icon">
            <font-awesome-icon icon="fa-solid fa-star" />
          </div>
          <h3>解锁客户满意度评价功能</h3>
          <button class="close-button" @click="closeUpgradeModal">×</button>
        </div>
        <div class="upgrade-modal-content">
          <p class="upgrade-description">
            开启客户服务反馈收集，追踪客户满意度评分，获取客户真实改进建议并优化智能体与人工接待质量。
          </p>
          <div class="upgrade-features">
            <div class="feature-item">
              <font-awesome-icon icon="fa-solid fa-check" class="feature-icon" />
              <span>1-5 星级满意度评分体系</span>
            </div>
            <div class="feature-item">
              <font-awesome-icon icon="fa-solid fa-check" class="feature-icon" />
              <span>客户自定义文本反馈留言</span>
            </div>
            <div class="feature-item">
              <font-awesome-icon icon="fa-solid fa-check" class="feature-icon" />
              <span>多维度 CSAT 统计与分析看板</span>
            </div>
            <div class="feature-item">
              <font-awesome-icon icon="fa-solid fa-check" class="feature-icon" />
              <span>人机接待质量综合洞察</span>
            </div>
          </div>
        </div>
        <div class="upgrade-modal-footer">
          <button class="upgrade-button" @click="handleUpgrade">
            <font-awesome-icon icon="fa-solid fa-crown" class="upgrade-icon" />
            升级套餐以解锁评价功能
            <font-awesome-icon icon="fa-solid fa-arrow-right" class="arrow-icon" />
          </button>
          <button class="cancel-upgrade-button" @click="closeUpgradeModal">暂不升级</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instructions-tab {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--space-lg);
}

.detail-section {
  margin-bottom: var(--space-xl);
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 18px;
  padding: var(--space-lg);
  width: 100%;
}

.instructions-section {
  margin-bottom: var(--space-xl);
}

.instructions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-title {
  margin-bottom: 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.ai-generate-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--grad-generate);
  color: var(--on-dark);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ai-generate-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--c-purple) 35%, transparent);
}

.ai-generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-icon {
  font-size: 1rem;
}

.ai-prompt-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--text) 50%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ai-prompt-content {
  background: var(--surface);
  border: 1px solid var(--o10);
  padding: var(--space-xl);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.ai-prompt-content h5 {
  margin-bottom: var(--space-md);
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.ai-prompt-textarea {
  width: 100%;
  min-height: 100px;
  padding: var(--space-md);
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 1rem;
  color: var(--text-color);
  resize: vertical;
  margin-bottom: var(--space-md);
  box-sizing: border-box;
}

.ai-prompt-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.error-message {
  color: var(--error-color);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
  padding: var(--space-sm);
  background: var(--error-light);
  border-radius: var(--radius-sm);
}

.ai-prompt-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.cancel-ai-button {
  padding: var(--space-sm) var(--space-md);
  background: var(--background-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-ai-button:hover:not(:disabled) {
  background: var(--background-soft);
}

.generate-ai-button {
  padding: 10px 16px;
  background: var(--grad-generate);
  color: var(--on-dark);
  border: none;
  border-radius: var(--radius-chip);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: var(--font-weight-semibold);
  transition: filter 0.2s ease, transform 0.2s ease;
}

.generate-ai-button:hover:not(:disabled) {
  filter: brightness(1.06);
}

.generate-ai-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subsection-title {
  margin-bottom: var(--space-md);
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 500;
}

.instructions-textarea {
  width: 100%;
  min-height: 150px;
  padding: var(--space-md);
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  color: var(--text-color);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.instructions-textarea:read-only {
  background: var(--background-alt);
  cursor: default;
}

.instructions-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.transfer-section {
  padding-top: var(--space-md);
}

.transfer-toggle {
  margin-bottom: var(--space-xl);
}

.toggle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.helper-text {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
  line-height: 1.5;
}

.channel-note {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  margin-top: calc(-1 * var(--space-xs));
  opacity: 0.85;
}

.channel-note .info-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--toggle-track-off);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--toggle-knob);
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--text) 10%, transparent);
}

input:checked + .slider {
  background-color: var(--toggle-on-accent);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.transfer-groups {
  padding: var(--space-lg);
  background: var(--background-alt);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--border-color);
  width: 100%;
  box-sizing: border-box;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.group-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.group-item:hover {
  background-color: var(--background-soft);
}

.group-item input {
  margin: 0;
}

.no-groups-message {
  text-align: center;
  padding: var(--space-xl);
  background: var(--background-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.create-group-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.create-group-link:hover {
  opacity: 0.8;
}

.create-group-link svg {
  font-size: 0.8em;
}

.loading-groups {
  text-align: center;
  padding: var(--space-xl);
  background: var(--background-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.rating-toggle {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-sm);
  color: var(--text-color);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 1rem;
  color: var(--text-color);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:read-only {
  background: var(--background-alt);
  cursor: default;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.save-section {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-lg) 0 0;
  margin-top: var(--space-md);
  border-top: 1px solid var(--o08);
  background: transparent;
}

.save-button {
  padding: var(--space-md) var(--space-xl);
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--text) 15%, transparent);
}

/* Rating Feature Lock Styles */
.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.lock-icon {
  font-size: 0.875rem;
  color: var(--warning-color);
  opacity: 0.8;
}

.switch.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.slider.locked {
  cursor: not-allowed;
  background-color: var(--toggle-track-off) !important;
}

.slider.locked:before {
  background-color: var(--toggle-knob) !important;
}

.locked-text {
  color: var(--warning-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.premium-icon {
  color: var(--warning-color);
  font-size: 0.875rem;
}

/* Upgrade Modal Styles */
.upgrade-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--text) 85%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.upgrade-modal {
  background: var(--surface);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.upgrade-modal-header {
  padding: var(--space-xl);
  text-align: center;
  position: relative;
  background: var(--grad-generate);
  color: var(--on-dark);
}

.upgrade-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-md);
  background: color-mix(in srgb, var(--on-dark) 20%, transparent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upgrade-icon svg {
  width: 24px;
  height: 24px;
}

.upgrade-modal-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text);
}

.upgrade-modal-header .close-button {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: color-mix(in srgb, var(--on-dark) 20%, transparent);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: var(--text);
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.upgrade-modal-header .close-button:hover {
  background: color-mix(in srgb, var(--on-dark) 30%, transparent);
  transform: scale(1.1);
}

.upgrade-modal-content {
  padding: var(--space-xl);
}

.upgrade-description {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-xl);
  text-align: center;
}

.upgrade-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  background: var(--background-soft);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

.feature-icon {
  width: 18px;
  height: 18px;
  color: var(--success-color);
  flex-shrink: 0;
}

.feature-item span {
  font-weight: 500;
  color: var(--text-color);
}

.upgrade-modal-footer {
  padding: var(--space-lg) var(--space-xl);
  background: var(--background-soft);
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}

.upgrade-button {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--space-md) var(--space-xl);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--text) 15%, transparent);
}

.upgrade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--text) 20%, transparent);
  filter: brightness(1.1);
}

.upgrade-button .upgrade-icon {
  font-size: 1rem;
  color: var(--warning-color);
  width: auto;
  height: auto;
  margin: 0;
  background: none;
  border-radius: 0;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.upgrade-button:hover .arrow-icon {
  transform: translateX(2px);
}

.cancel-upgrade-button {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: var(--space-md) var(--space-lg);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-upgrade-button:hover {
  background: var(--background-muted);
  color: var(--text-color);
  border-color: var(--text-muted);
}
</style> 