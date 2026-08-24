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
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import channelsService, { type ChannelAccount } from '@/services/channels'
import { agentService } from '@/services/agent'
import type { Agent } from '@/types/agent'
import MessengerPagePicker from './MessengerPagePicker.vue'
import { useMetaSignup } from '@/composables/useMetaSignup'

const props = defineProps<{
  channel: 'whatsapp' | 'messenger' | 'instagram'
  existingAccount?: ChannelAccount | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'connected', account: ChannelAccount): void
}>()

// Where the credentials are copied from — linked so it's one click, not a
// hostname to retype.
const META_APPS_URL = 'https://developers.facebook.com/apps/'

// Per-channel copy + credential fields. The intro is split around the link
// rather than carrying markup, so it renders as escaped text.
const META_FORMS = {
  whatsapp: {
    title: '连接 WhatsApp Business',
    introBefore: '在您的 Meta 开发者应用后台 (',
    introAfter: ' → WhatsApp → API 设置) 中，复制电话号码 ID 与永久访问令牌。',
    fields: [
      { key: 'phone_number_id', label: '电话号码 ID (Phone Number ID)', placeholder: '1234567890', secret: false },
      { key: 'access_token', label: '访问令牌 (Access Token)', placeholder: 'EAAG…', secret: true },
      { key: 'waba_id', label: '商业账号 ID (WABA ID，选填)', placeholder: '用于 Webhook 自动订阅', secret: false },
    ],
  },
  messenger: {
    title: '连接 Facebook Messenger',
    introBefore: '在您的 Meta 开发者应用后台 (',
    introAfter: ' → Messenger → 设置) 中，为您要绑定的 Facebook 公共主页生成主页访问令牌。',
    fields: [
      { key: 'page_id', label: '公共主页 ID (Page ID)', placeholder: '1234567890', secret: false },
      { key: 'page_access_token', label: '主页访问令牌 (Page Access Token)', placeholder: 'EAAG…', secret: true },
    ],
  },
  instagram: {
    title: '连接 Instagram Direct',
    introBefore: '您的 Instagram 账号需为已关联 Facebook 公共主页的商业账户。请使用该关联主页的访问令牌，前往 ',
    introAfter: ' → Instagram 查看配置。',
    fields: [
      { key: 'ig_id', label: 'Instagram 账号 ID', placeholder: '17841400000000000', secret: false },
      { key: 'page_access_token', label: '关联主页访问令牌 (Page Access Token)', placeholder: 'EAAG…', secret: true },
    ],
  },
} as const

const form = computed(() => META_FORMS[props.channel])
const values = ref<Record<string, string>>({})
const connecting = ref(false)
const account = ref<ChannelAccount | null>(props.existingAccount ?? null)

const agents = ref<Agent[]>([])
const selectedAgentId = ref('')
const savingAgent = ref(false)

// The three one-click logins live in their own composable; this component owns
// the manual credentials form and agent assignment.
const {
  signupEnabled,
  signingUp,
  showManualForm,
  signupPages,
  connectingPage,
  copy: signupCopy,
  startSignup,
  onPageSelected,
} = useMetaSignup({
  channel: props.channel,
  existingAccount: props.existingAccount,
  onConnected: (connected) => { account.value = connected },
})

onMounted(async () => {
  try {
    agents.value = await agentService.getOrganizationAgents()
    selectedAgentId.value = String(
      props.existingAccount?.agent_id || agents.value[0]?.id || '')
  } catch (error) {
    console.error('Error loading agents:', error)
  }
})

const connect = async () => {
  const missing = form.value.fields.filter(f => !f.label.includes('选填') && !f.label.includes('optional') && !values.value[f.key]?.trim())
  if (missing.length > 0) {
    toast.error(`请填写必要项：${missing.map(f => f.label).join(', ')}`)
    return
  }
  try {
    connecting.value = true
    const payload: any = Object.fromEntries(
      form.value.fields
        .map(f => [f.key, values.value[f.key]?.trim()])
        .filter(([, v]) => v)
    )
    if (props.channel === 'whatsapp') {
      account.value = await channelsService.connectWhatsApp(payload)
    } else if (props.channel === 'messenger') {
      account.value = await channelsService.connectMessenger(payload)
    } else {
      account.value = await channelsService.connectInstagram(payload)
    }
    toast.success(`已成功连接 ${account.value.display_name || form.value.title.replace('连接 ', '')}`)
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || `连接 ${props.channel} 失败`)
  } finally {
    connecting.value = false
  }
}

const saveAgent = async () => {
  if (!account.value || !selectedAgentId.value) return
  try {
    savingAgent.value = true
    const updated = await channelsService.setAccountAgent(account.value.id, selectedAgentId.value)
    toast.success('已指定接待智能体 — 该渠道已正式上线！')
    emit('connected', updated)
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || '指定接待智能体失败')
  } finally {
    savingAgent.value = false
  }
}
</script>

<template>
  <div class="meta-modal" @click.self="emit('close')">
    <div class="meta-modal-content">
      <div class="meta-modal-header">
        <h3>{{ form.title }}</h3>
        <button class="meta-close-btn" @click="emit('close')">×</button>
      </div>

      <!-- Step 1: credentials -->
      <div v-if="!account" class="meta-modal-body">
        <!-- Login for Business can grant several accounts at once; the customer
             picks which one this channel answers. -->
        <MessengerPagePicker
          v-if="signupPages.length"
          :pages="signupPages"
          :connecting="connectingPage"
          @select="onPageSelected"
        />

        <!-- One-click signup under ChatterMate's Meta app; the manual form
             stays available for anyone who already has their own credentials. -->
        <div v-else-if="signupEnabled && !showManualForm" class="meta-signup">
          <p class="meta-intro">{{ signupCopy.intro }}</p>
          <button class="meta-btn meta-btn-primary meta-signup-btn" :disabled="signingUp" @click="startSignup">
            <font-awesome-icon v-if="signingUp" icon="fa-solid fa-spinner" spin />
            {{ signingUp ? '等待 Meta 授权中…' : signupCopy.cta }}
          </button>
          <button class="meta-link-btn" @click="showManualForm = true">
            改为手动输入凭证配置
          </button>
        </div>

        <template v-else>
        <p class="meta-intro">
          {{ form.introBefore }}<a
            :href="META_APPS_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="meta-intro-link"
          >developers.facebook.com</a>{{ form.introAfter }}
        </p>
        <div v-for="field in form.fields" :key="field.key" class="meta-field">
          <label class="meta-label" :for="`meta-${field.key}`">{{ field.label }}</label>
          <input
            :id="`meta-${field.key}`"
            v-model="values[field.key]"
            :type="field.secret ? 'password' : 'text'"
            class="meta-input"
            :placeholder="field.placeholder"
            :name="`meta-${channel}-${field.key}`"
            :autocomplete="field.secret ? 'new-password' : 'off'"
          />
        </div>
        <div class="meta-actions">
          <button class="meta-btn meta-btn-secondary" @click="emit('close')">取消</button>
          <button class="meta-btn meta-btn-primary" :disabled="connecting" @click="connect">
            {{ connecting ? '正在连接…' : '立即连接' }}
          </button>
        </div>
        </template>
      </div>

      <!-- Step 2: route to an agent -->
      <div v-else class="meta-modal-body">
        <p class="meta-intro">
          <strong>{{ account.display_name }}</strong> 已成功连接。
          请选择由哪位 AI 智能体负责答复客户消息：
        </p>
        <label class="meta-label" for="meta-agent">接待 AI 智能体</label>
        <select id="meta-agent" v-model="selectedAgentId" class="meta-input">
          <option v-for="agent in agents" :key="String(agent.id)" :value="String(agent.id)">
            {{ agent.display_name || agent.name }}
          </option>
        </select>
        <div class="meta-actions">
          <button class="meta-btn meta-btn-secondary" @click="emit('connected', account)">稍后指定</button>
          <button class="meta-btn meta-btn-primary" :disabled="savingAgent || !selectedAgentId" @click="saveAgent">
            {{ savingAgent ? '正在保存…' : '确认指定智能体' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meta-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.meta-modal-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg, 12px);
  width: min(460px, calc(100vw - 32px));
  padding: 24px;
}

.meta-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.meta-modal-header h3 {
  margin: 0;
  font-family: var(--font-display);
}

.meta-close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--muted);
}

.meta-intro {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.meta-intro-link {
  /* --accent-ink, not --accent-solid: the latter is the lime fill and stays
     lime in both themes, which is unreadable as text on a light background. */
  color: var(--accent-ink);
  text-decoration: underline;
  font-weight: 600;
}

.meta-intro-link:hover {
  text-decoration: none;
}

.meta-field {
  margin-bottom: 12px;
}

.meta-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.meta-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-btn, 8px);
  background: var(--background-soft);
  color: inherit;
  font-size: 14px;
}

.meta-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.meta-btn {
  padding: 9px 16px;
  border-radius: var(--radius-btn, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--background-soft);
  color: inherit;
}

.meta-btn-primary {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border-color: transparent;
}

.meta-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.meta-signup {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.meta-signup-btn {
  width: 100%;
  padding: 12px;
}

.meta-link-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px;
}

.meta-link-btn:hover {
  color: inherit;
}
</style>
