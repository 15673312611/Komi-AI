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
import channelsService, { type ChannelAccount, type SmsProviderInfo } from '@/services/channels'
import { agentService } from '@/services/agent'
import type { Agent } from '@/types/agent'

const props = defineProps<{
  channel: 'email' | 'sms' | 'line' | 'slack'
  // When set, the modal opens in "manage" mode for an already-connected
  // account: it skips credential entry and shows the webhook URL + agent.
  // Slack always uses this (it connects via OAuth, so only the agent step).
  existingAccount?: ChannelAccount | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'connected', account: ChannelAccount): void
}>()

const FORMS = {
  email: {
    title: '连接客服支持邮箱 (Email)',
    intro: '请输入客户用于发送咨询的客服邮箱地址，然后将您的邮件服务商收件解析/转发 Webhook 指向系统提供的 URL。您也可以配置自备的 SMTP 外发服务器（留空则默认使用系统邮件服务）。',
    fields: [
      { key: 'inbound_address', label: '客服接收邮箱地址', placeholder: 'support@yourcompany.com', secret: false },
      { key: 'smtp_host', label: 'SMTP 服务器地址 (选填)', placeholder: 'smtp.yourprovider.com', secret: false, optional: true },
      { key: 'smtp_port', label: 'SMTP 端口 (选填)', placeholder: '587', secret: false, optional: true },
      { key: 'smtp_username', label: 'SMTP 用户名 (选填)', placeholder: 'apikey / user', secret: false, optional: true },
      { key: 'smtp_password', label: 'SMTP 密码/Token (选填)', placeholder: '••••••••', secret: true, optional: true },
      { key: 'from_email', label: '发件人显示地址 (选填)', placeholder: '留空则默认使用客服邮箱', secret: false, optional: true },
    ],
    connect: (v: Record<string, string>) => {
      const payload: any = { inbound_address: v.inbound_address }
      if (v.smtp_host?.trim()) {
        payload.smtp_host = v.smtp_host.trim()
        if (v.smtp_port?.trim()) payload.smtp_port = Number(v.smtp_port)
        payload.smtp_username = v.smtp_username
        payload.smtp_password = v.smtp_password
        if (v.from_email?.trim()) payload.from_email = v.from_email.trim()
      }
      return channelsService.connectEmail(payload)
    },
  },
  sms: {
    title: '连接 SMS 短信',
    intro: '选择您的短信服务商，输入发件号码与 API 认证凭证。连接成功后，请将系统提供的 Webhook URL 配置到该号码的短信接收回调中。',
    // Fields are provider-specific and resolved dynamically (see activeFields)
    fields: [],
    connect: (v: Record<string, string>) => {
      const info = smsProviders.value.find(p => p.name === selectedProvider.value)
      const credentials: Record<string, string> = {}
      for (const f of info?.fields || []) {
        if (v[f.key]?.trim()) credentials[f.key] = v[f.key].trim()
      }
      return channelsService.connectSms({
        provider: selectedProvider.value,
        phone_number: v.phone_number,
        credentials,
      })
    },
  },
  line: {
    title: '连接 LINE 官方账号',
    intro: '在 LINE Developers 控制台 (Messaging API channel) 中，复制 Channel secret 并颁发 Channel access token。Webhook 回调将被自动注册。',
    fields: [
      { key: 'channel_secret', label: 'Channel Secret', placeholder: '••••••••', secret: true },
      { key: 'channel_access_token', label: 'Channel Access Token', placeholder: '长期有效的访问令牌', secret: true },
    ],
    connect: (v: Record<string, string>) => channelsService.connectLine({
      channel_secret: v.channel_secret, channel_access_token: v.channel_access_token }),
  },
  slack: {
    // Slack connects via OAuth (no credential form); this modal is only used
    // in manage mode to pick the answering agent.
    title: '管理 Slack 智能体',
    intro: '请选择由哪位 AI 智能体负责答复 Slack 中的 @提及 与私信消息。',
    fields: [],
    connect: async () => { throw new Error('Slack connects via OAuth') },
  },
} as const

const form = computed(() => FORMS[props.channel])
const values = ref<Record<string, string>>({})
const connecting = ref(false)
// In manage mode we start at the second step with the existing account
const account = ref<ChannelAccount | null>(props.existingAccount ?? null)
const isManage = computed(() => !!props.existingAccount)

// SMS providers (dynamic credential fields per provider)
const smsProviders = ref<SmsProviderInfo[]>([])
const selectedProvider = ref('twilio')

// The credential fields to render: dynamic for SMS, static otherwise
const activeFields = computed(() => {
  if (props.channel !== 'sms') return form.value.fields
  const info = smsProviders.value.find(p => p.name === selectedProvider.value)
  return [
    { key: 'phone_number', label: '手机号码 / Sender ID', placeholder: '+15551234567', secret: false },
    ...(info?.fields || []).map(f => ({
      key: f.key, label: f.label, placeholder: f.secret ? '••••••••' : '',
      secret: f.secret, optional: f.optional,
    })),
  ]
})

const agents = ref<Agent[]>([])
const selectedAgentId = ref('')
const savingAgent = ref(false)

onMounted(async () => {
  try {
    if (props.channel === 'sms') {
      smsProviders.value = await channelsService.listSmsProviders()
    }
    agents.value = await agentService.getOrganizationAgents()
    // Default the agent selector to the account's current agent, else the first
    selectedAgentId.value = String(
      props.existingAccount?.agent_id || agents.value[0]?.id || '')
  } catch (error) {
    console.error('Error loading modal data:', error)
  }
})

const connect = async () => {
  const missing = activeFields.value.filter(f => !(f as any).optional && !values.value[f.key]?.trim())
  if (missing.length > 0) {
    toast.error(`请填写必要项：${missing.map(f => f.label).join(', ')}`)
    return
  }
  try {
    connecting.value = true
    const trimmed = Object.fromEntries(
      Object.entries(values.value).map(([k, v]) => [k, v.trim()]))
    account.value = await form.value.connect(trimmed)
    toast.success(`已成功连接 ${account.value.display_name || form.value.title.replace('连接 ', '')}`)
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || `连接 ${props.channel} 失败`)
  } finally {
    connecting.value = false
  }
}

const copyWebhookUrl = async () => {
  if (!account.value?.webhook_url) return
  await navigator.clipboard.writeText(account.value.webhook_url)
  toast.success('Webhook 回调地址已复制到剪贴板')
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
  <!-- Intentionally no backdrop-click dismiss: these forms hold credentials
       the user is mid-entry on, so only the × / Cancel buttons close it. -->
  <div class="cc-modal">
    <div class="cc-modal-content">
      <div class="cc-modal-header">
        <h3>{{ isManage ? form.title.replace('连接', '管理') : form.title }}</h3>
        <button class="cc-close-btn" @click="emit('close')">×</button>
      </div>

      <!-- Step 1: credentials -->
      <div v-if="!account" class="cc-modal-body">
        <p class="cc-intro">{{ form.intro }}</p>

        <!-- SMS provider picker -->
        <div v-if="channel === 'sms'" class="cc-field">
          <label class="cc-label" for="cc-provider">短信服务商 (SMS Provider)</label>
          <select id="cc-provider" v-model="selectedProvider" class="cc-input">
            <option v-for="p in smsProviders" :key="p.name" :value="p.name">{{ p.label }}</option>
          </select>
        </div>

        <div v-for="field in activeFields" :key="field.key" class="cc-field">
          <label class="cc-label" :for="`cc-${field.key}`">{{ field.label }}</label>
          <input
            :id="`cc-${field.key}`"
            v-model="values[field.key]"
            :type="field.secret ? 'password' : 'text'"
            class="cc-input"
            :placeholder="(field as any).placeholder"
            :name="`cc-${channel}-${field.key}`"
            :autocomplete="field.secret ? 'new-password' : 'off'"
          />
        </div>
        <div class="cc-actions">
          <button class="cc-btn cc-btn-secondary" @click="emit('close')">取消</button>
          <button class="cc-btn cc-btn-primary" :disabled="connecting" @click="connect">
            {{ connecting ? '正在连接…' : '立即连接' }}
          </button>
        </div>
      </div>

      <!-- Step 2: webhook URL (if applicable) + agent routing -->
      <div v-else class="cc-modal-body">
        <p class="cc-intro">
          <strong>{{ account.display_name }}</strong> 已成功连接。
        </p>
        <div v-if="account.webhook_url" class="cc-field">
          <label class="cc-label">Webhook URL — 请配置在您的服务商回调设置中</label>
          <div class="cc-webhook-row">
            <input class="cc-input" :value="account.webhook_url" readonly />
            <button class="cc-btn cc-btn-secondary" @click="copyWebhookUrl">复制</button>
          </div>
        </div>
        <label class="cc-label" for="cc-agent">负责接待并答复此渠道的 AI 智能体</label>
        <select id="cc-agent" v-model="selectedAgentId" class="cc-input">
          <option v-for="agent in agents" :key="String(agent.id)" :value="String(agent.id)">
            {{ agent.display_name || agent.name }}
          </option>
        </select>
        <div class="cc-actions">
          <button v-if="isManage && channel !== 'slack'" class="cc-btn cc-btn-secondary" @click="account = null">
            重新配置凭证
          </button>
          <button v-else class="cc-btn cc-btn-secondary" @click="emit('connected', account)">稍后指定</button>
          <button class="cc-btn cc-btn-primary" :disabled="savingAgent || !selectedAgentId" @click="saveAgent">
            {{ savingAgent ? '正在保存…' : '确认指定智能体' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cc-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cc-modal-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg, 12px);
  width: min(480px, calc(100vw - 32px));
  padding: 24px;
}

.cc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cc-modal-header h3 {
  margin: 0;
  font-family: var(--font-display);
}

.cc-close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--muted);
}

.cc-intro {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.cc-field {
  margin-bottom: 12px;
}

.cc-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.cc-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-btn, 8px);
  background: var(--background-soft);
  color: inherit;
  font-size: 14px;
}

.cc-webhook-row {
  display: flex;
  gap: 8px;
}

.cc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.cc-btn {
  padding: 9px 16px;
  border-radius: var(--radius-btn, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--background-soft);
  color: inherit;
  white-space: nowrap;
}

.cc-btn-primary {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border-color: transparent;
}

.cc-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
