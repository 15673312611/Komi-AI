/*
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import api from './api'
import { apiPath } from '@/config/api'
import type { SignupChannel } from '@/utils/metaSdk'

// Types
export type ChannelType =
  | 'web'
  | 'telegram'
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'slack'
  | 'email'
  | 'sms'
  | 'line'
  | 'api'

export interface SmsProviderField {
  key: string
  label: string
  secret: boolean
  optional: boolean
}

export interface SmsProviderInfo {
  name: string
  label: string
  fields: SmsProviderField[]
}

export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | (string & {})

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export interface TemplateComponent {
  type: string
  text?: string
  format?: string
  [key: string]: unknown
}

export interface WhatsAppTemplate {
  id?: string
  name: string
  status?: TemplateStatus
  category?: TemplateCategory
  language?: string
  components?: TemplateComponent[]
}

export interface EmbeddedSignupConfig {
  enabled: boolean
  config_id: string | null
  app_id: string | null
  graph_version: string
}

export interface MessengerSignupPage {
  id: string
  name: string
}

export interface MessengerSignupPages {
  pages: MessengerSignupPage[]
  signup_token: string
}

export interface ChannelAccount {
  id: string
  channel_type: ChannelType
  external_account_id: string
  display_name?: string
  is_active: boolean
  agent_id?: string
  created_at?: string
  webhook_url?: string
}

const channelsService = {
  /** All connected messaging channel accounts for the organization */
  async listAccounts(): Promise<ChannelAccount[]> {
    const response = await api.get('/channels/accounts')
    return Array.isArray(response?.data) ? response.data : []
  },

  async listActiveWhatsAppAccounts(): Promise<ChannelAccount[]> {
    const accounts = await this.listAccounts()
    return accounts.filter(
      (account) => account.channel_type === 'whatsapp' && account.is_active,
    )
  },

  /** Connect a Telegram bot by token */
  async connectTelegram(botToken: string): Promise<ChannelAccount> {
    const response = await api.post('/channels/telegram', { bot_token: botToken })
    return response.data
  },

  async disconnectTelegram(accountId: string): Promise<void> {
    await api.delete(`/channels/telegram/${accountId}`)
  },

  /** Connect a WhatsApp Cloud API number */
  async connectWhatsApp(payload: {
    phone_number_id: string
    access_token: string
    waba_id?: string
  }): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/whatsapp', payload)
    return response.data
  },

  async getEmbeddedSignupConfig(channel: SignupChannel = 'whatsapp'): Promise<EmbeddedSignupConfig> {
    const response = await api.get('/channels/meta/embedded-signup-config', { params: { channel } })
    return response.data
  },

  async connectWhatsAppEmbeddedSignup(payload: {
    code: string
    waba_id: string
    phone_number_id: string
  }): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/whatsapp/embedded-signup', payload)
    return response.data
  },

  /** Connect a Facebook Page for Messenger */
  async connectMessenger(payload: { page_id: string; page_access_token: string }): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/messenger', payload)
    return response.data
  },

  async listMessengerSignupPages(code: string, redirectUri: string): Promise<MessengerSignupPages> {
    const response = await api.post('/channels/meta/messenger/signup/pages', {
      code,
      redirect_uri: redirectUri,
    })
    return response.data
  },

  async connectMessengerSignup(payload: { signup_token: string; page_id: string }): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/messenger/signup/connect', payload)
    return response.data
  },

  /** Connect an Instagram account via Instagram Login */
  async connectInstagramLogin(code: string, redirectUri: string): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/instagram/login/connect', {
      code,
      redirect_uri: redirectUri,
    })
    return response.data
  },

  async connectInstagram(payload: { ig_id: string; page_access_token: string }): Promise<ChannelAccount> {
    const response = await api.post('/channels/meta/instagram', payload)
    return response.data
  },

  async disconnectMeta(accountId: string): Promise<void> {
    await api.delete(`/channels/meta/${accountId}`)
  },

  async listWhatsAppTemplates(accountId: string): Promise<WhatsAppTemplate[]> {
    const response = await api.get(`/channels/meta/whatsapp/${accountId}/templates`)
    return response.data
  },

  async getWhatsAppTemplateLibraryUrl(accountId: string): Promise<string> {
    const response = await api.get(`/channels/meta/whatsapp/${accountId}/template-library`)
    return response.data.url
  },

  async startWhatsAppConversation(
    accountId: string,
    payload: {
      to: string
      template_name: string
      language?: string
      components?: TemplateComponent[]
      customer_id?: string
      customer_name?: string
      idempotency_key?: string
    },
  ): Promise<{ session_id: string }> {
    const response = await api.post(`/channels/meta/whatsapp/${accountId}/conversations`, payload)
    return response.data
  },

  async sendWhatsAppTemplate(
    accountId: string,
    payload: {
      session_id: string
      template_name: string
      language?: string
      components?: TemplateComponent[]
      idempotency_key?: string
    },
  ): Promise<{ status: string; external_message_id?: string }> {
    const response = await api.post(`/channels/meta/whatsapp/${accountId}/send-template`, payload)
    return response.data
  },

  /** Connect an email support inbox */
  async connectEmail(payload: {
    inbound_address: string
    display_name?: string
    smtp_host?: string
    smtp_port?: number
    smtp_username?: string
    smtp_password?: string
    from_email?: string
  }): Promise<ChannelAccount> {
    const response = await api.post('/channels/email', payload)
    return response.data
  },

  async disconnectEmail(accountId: string): Promise<void> {
    await api.delete(`/channels/email/${accountId}`)
  },

  async getEmailWebhookUrl(accountId: string): Promise<string> {
    const response = await api.get(`/channels/email/${accountId}/webhook-url`)
    return response.data.webhook_url
  },

  async listSmsProviders(): Promise<SmsProviderInfo[]> {
    const response = await api.get('/channels/sms/providers')
    return Array.isArray(response?.data) ? response.data : []
  },

  async connectSms(payload: {
    provider: string
    phone_number: string
    credentials: Record<string, string>
  }): Promise<ChannelAccount> {
    const response = await api.post('/channels/sms', payload)
    return response.data
  },

  async disconnectSms(accountId: string): Promise<void> {
    await api.delete(`/channels/sms/${accountId}`)
  },

  async connectLine(payload: { channel_secret: string; channel_access_token: string }): Promise<ChannelAccount> {
    const response = await api.post('/channels/line', payload)
    return response.data
  },

  async disconnectLine(accountId: string): Promise<void> {
    await api.delete(`/channels/line/${accountId}`)
  },

  getSlackInstallUrl(): string {
    return apiPath('/channels/slack/install')
  },

  async disconnectSlack(accountId: string): Promise<void> {
    await api.delete(`/channels/slack/${accountId}`)
  },

  async setAccountAgent(accountId: string, agentId: string, isActive = true): Promise<ChannelAccount> {
    const response = await api.post(`/channels/agent-config/${accountId}`, {
      agent_id: agentId,
      is_active: isActive,
    })
    return response.data
  },

  async clearAccountAgent(accountId: string): Promise<void> {
    await api.delete(`/channels/agent-config/${accountId}`)
  },
}

export default channelsService
