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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { checkJiraConnection, getJiraAuthUrl, disconnectJira } from '@/services/jira'
import { checkShopifyConnection, getShopifyShops } from '@/services/shopify'
import channelsService, { type ChannelAccount } from '@/services/channels'
import crmService, { type CrmConnection, type CrmProvider } from '@/services/crm'
import TelegramConnectModal from '@/components/integrations/TelegramConnectModal.vue'
import MetaChannelConnect from '@/components/integrations/MetaChannelConnect.vue'
import WhatsAppTemplateManager from '@/components/integrations/WhatsAppTemplateManager.vue'
import ChannelConnectModal from '@/components/integrations/ChannelConnectModal.vue'

// Import logos
import jiraLogo from '@/assets/jira-logo.svg'
import chattermateLogo from '@/assets/logo.svg'
import slackLogo from '@/assets/slack-logo.svg'
import zendeskLogo from '@/assets/zendesk-logo.svg'
import shopifyLogo from '@/assets/shopify-logo.svg'
import telegramLogo from '@/assets/telegram-logo.svg'
import whatsappLogo from '@/assets/whatsapp-logo.svg'
import messengerLogo from '@/assets/messenger-logo.svg'
import instagramLogo from '@/assets/instagram-logo.svg'
import emailLogo from '@/assets/email-logo.svg'
import smsLogo from '@/assets/sms-logo.svg'
import lineLogo from '@/assets/line-logo.svg'
import hubspotLogo from '@/assets/hubspot-logo.svg'
import pipedriveLogo from '@/assets/pipedrive-logo.svg'

// Define interface for Shopify shop
interface ShopifyShop {
  id: string
  shop_domain: string
  is_installed: boolean
  [key: string]: any
}

// Shopify state variables
const shopifyConnected = ref(false)
const shopifyShopDomain = ref('')
const shopifyLoading = ref(true)

// Messaging channel state (Telegram + Meta channels share one accounts list)
const channelAccounts = ref<ChannelAccount[]>([])
const channelsLoading = ref(true)
const showTelegramModal = ref(false)
// Which Meta connect modal is open (null = none)
const metaModalChannel = ref<'whatsapp' | 'messenger' | 'instagram' | null>(null)
const showTemplateManager = ref(false)
// Which credential connect modal is open (null = none)
const credentialModalChannel = ref<'email' | 'sms' | 'line' | 'slack' | null>(null)
// Account being managed (null = fresh connect). Also used for Telegram/Meta manage.
const credentialModalAccount = ref<ChannelAccount | null>(null)
const telegramModalAccount = ref<ChannelAccount | null>(null)
const metaModalAccount = ref<ChannelAccount | null>(null)

const CREDENTIAL_CHANNELS = ['email', 'sms', 'line']
const META_CHANNELS = ['whatsapp', 'messenger', 'instagram']
const CRM_PROVIDERS: CrmProvider[] = ['hubspot', 'pipedrive']

// CRM lead-push connections
const crmConnections = ref<CrmConnection[]>([])
const crmLoading = ref(true)
// 403 from the connections endpoint = plan doesn't include crm_sync
const crmUpgradeMessage = ref<string | null>(null)

const crmFor = (provider: CrmProvider) =>
  crmConnections.value.find(c => c.provider === provider) ?? null

const fetchCrmConnections = async () => {
  try {
    crmLoading.value = true
    crmConnections.value = await crmService.listConnections()
    crmUpgradeMessage.value = null
  } catch (error: any) {
    if (error?.response?.status === 403) {
      crmUpgradeMessage.value = error.response?.data?.detail || 'CRM sync is not available in your current plan.'
    } else {
      console.error('Error loading CRM connections:', error)
    }
  } finally {
    crmLoading.value = false
  }
}

const connectCrm = (provider: CrmProvider) => {
  if (crmUpgradeMessage.value) {
    toast.error(crmUpgradeMessage.value)
    return
  }
  window.location.href = crmService.getInstallUrl(provider)
}

const testCrm = async (provider: CrmProvider) => {
  try {
    const result = await crmService.testConnection(provider)
    if (result.ok) {
      toast.success(`Connected to ${result.account_name || provider}`)
    } else {
      toast.error(result.error || `${provider} connection check failed`)
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || `${provider} connection check failed`)
  }
}

const handleDisconnectCrm = async (provider: CrmProvider) => {
  try {
    crmLoading.value = true
    await crmService.disconnect(provider)
    crmConnections.value = crmConnections.value.filter(c => c.provider !== provider)
    toast.success(`${provider === 'hubspot' ? 'HubSpot' : 'Pipedrive'} disconnected successfully`)
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || `Error disconnecting ${provider}`)
  } finally {
    crmLoading.value = false
    showDisconnectConfirm.value = false
    disconnectingIntegration.value = null
  }
}

const crmCardWarning = (connection: CrmConnection | null): string | undefined => {
  if (!connection) return undefined
  if (connection.status !== 'active') {
    return '连接已过期 — 请重新授权以恢复线索自动同步。'
  }
  if (connection.recent_failures > 0) {
    return `过去 7 天内有 ${connection.recent_failures} 条线索同步失败。`
  }
  return undefined
}

// "Manage" on a connected card: open the right modal for the connected account
const manageIntegration = (integration: IntegrationCard) => {
  const id = integration.id
  const acc = accountsFor(id)[0] ?? null
  if (CREDENTIAL_CHANNELS.includes(id)) {
    credentialModalAccount.value = acc
    credentialModalChannel.value = id as 'email' | 'sms' | 'line'
  } else if (id === 'telegram') {
    telegramModalAccount.value = acc
    showTelegramModal.value = true
  } else if (META_CHANNELS.includes(id)) {
    metaModalAccount.value = acc
    metaModalChannel.value = id as 'whatsapp' | 'messenger' | 'instagram'
  } else if (id === 'slack') {
    // Slack connects via OAuth; Manage just picks the answering agent
    credentialModalAccount.value = acc
    credentialModalChannel.value = 'slack'
  } else if (CRM_PROVIDERS.includes(id as CrmProvider)) {
    // CRM Manage = read-only connectivity check, surfaced as a toast
    testCrm(id as CrmProvider)
  } else {
    // Jira/Shopify: re-run their connect/OAuth flow
    if (id === 'shopify') openShopifyInstallation()
    else integration.connectAction?.()
  }
}

const accountsFor = (channelType: string) =>
  channelAccounts.value.filter(a => a.channel_type === channelType)

const telegramAccounts = computed(() => accountsFor('telegram'))

const fetchChannelAccounts = async () => {
  try {
    channelsLoading.value = true
    channelAccounts.value = await channelsService.listAccounts()
  } catch (error) {
    console.error('Error loading channel accounts:', error)
  } finally {
    channelsLoading.value = false
  }
}

const onChannelConnected = async () => {
  showTelegramModal.value = false
  metaModalChannel.value = null
  credentialModalChannel.value = null
  credentialModalAccount.value = null
  telegramModalAccount.value = null
  metaModalAccount.value = null
  await fetchChannelAccounts()
}

// Shared disconnect for messaging channels; Telegram also removes its webhook
const disconnectChannelAccounts = async (channelType: string, label: string) => {
  try {
    channelsLoading.value = true
    for (const account of accountsFor(channelType)) {
      if (channelType === 'telegram') {
        await channelsService.disconnectTelegram(account.id)
      } else if (channelType === 'slack') {
        await channelsService.disconnectSlack(account.id)
      } else if (channelType === 'email') {
        await channelsService.disconnectEmail(account.id)
      } else if (channelType === 'sms') {
        await channelsService.disconnectSms(account.id)
      } else if (channelType === 'line') {
        await channelsService.disconnectLine(account.id)
      } else {
        await channelsService.disconnectMeta(account.id)
      }
    }
    channelAccounts.value = channelAccounts.value.filter(a => a.channel_type !== channelType)
    toast.success(`${label} 已成功断开连接`)
  } catch (error: any) {
    toast.error(error?.response?.data?.detail || `断开 ${label} 连接失败`)
  } finally {
    channelsLoading.value = false
    showDisconnectConfirm.value = false
    disconnectingIntegration.value = null
  }
}

const handleDisconnectTelegram = () => disconnectChannelAccounts('telegram', 'Telegram')
const handleDisconnectSlack = () => disconnectChannelAccounts('slack', 'Slack')
const connectSlack = () => { window.location.href = channelsService.getSlackInstallUrl() }
const handleDisconnectWhatsApp = () => disconnectChannelAccounts('whatsapp', 'WhatsApp')
const handleDisconnectMessenger = () => disconnectChannelAccounts('messenger', 'Messenger')
const handleDisconnectInstagram = () => disconnectChannelAccounts('instagram', 'Instagram')
const handleDisconnectEmail = () => disconnectChannelAccounts('email', 'Email')
const handleDisconnectSms = () => disconnectChannelAccounts('sms', 'SMS')
const handleDisconnectLine = () => disconnectChannelAccounts('line', 'LINE')


const route = useRoute()
const router = useRouter()

const jiraConnected = ref(false)
const jiraSiteUrl = ref('')
const isLoading = ref(true)
const showDisconnectConfirm = ref(false)
const disconnectingIntegration = ref<string | null>(null)
// OAuth connect error, tagged with the integration it belongs to so the banner
// renders on that card rather than always on Jira's.
const connectionError = ref<{ integration: string; message: string } | null>(null)

// Check if Jira is connected
const fetchJiraStatus = async () => {
  try {
    isLoading.value = true
    const data = await checkJiraConnection()
    jiraConnected.value = data.connected
    jiraSiteUrl.value = data.site_url || ''
  } catch (error) {
    console.error('Error checking Jira connection:', error)
    jiraConnected.value = false
  } finally {
    isLoading.value = false
  }
}

// Connect to Jira
const connectJira = () => {
  try {
    // Clear any previous error messages
    connectionError.value = null
    window.location.href = getJiraAuthUrl()
  } catch (error) {
    console.error('Error connecting to Jira:', error)
    toast.error('连接 Jira 发生错误')
  }
}

// Show disconnect confirmation
const showDisconnectConfirmation = (integrationId: string) => {
  disconnectingIntegration.value = integrationId
  showDisconnectConfirm.value = true
}

// Cancel disconnect
const cancelDisconnect = () => {
  showDisconnectConfirm.value = false
  disconnectingIntegration.value = null
}

// Disconnect from Jira
const handleDisconnectJira = async () => {
  try {
    isLoading.value = true
    await disconnectJira()
    jiraConnected.value = false
    jiraSiteUrl.value = ''
    toast.success('Jira 已成功断开连接')
  } catch (error: any) {
    console.error('Error disconnecting from Jira:', error)
    let errorMessage = '断开 Jira 连接失败'
    
    // Try to extract a more detailed error message if available
    if (error.response && error.response.data && error.response.data.detail) {
      errorMessage = error.response.data.detail
    }
    
    toast.error(errorMessage)
  } finally {
    isLoading.value = false
    showDisconnectConfirm.value = false
    disconnectingIntegration.value = null
  }
}

// Check if Shopify is connected
const fetchShopifyStatus = async () => {
  try {
    shopifyLoading.value = true
    const data = await checkShopifyConnection()
    shopifyConnected.value = data.connected
    shopifyShopDomain.value = data.shop_domain || ''
  } catch (error) {
    console.error('Error checking Shopify connection:', error)
    shopifyConnected.value = false
  } finally {
    shopifyLoading.value = false
  }
}


// Open Shopify installation page
const openShopifyInstallation = () => {
  try {
    // Direct installation URL provided by Shopify
    const installUrl = 'https://admin.shopify.com/?organization_id=162380510&no_redirect=true&redirect=/oauth/redirect_from_developer_dashboard?client_id%3D280379be88b01dbdde1bcf06c027b1d4'
    
    // Open in new tab
    window.open(installUrl, '_blank')
    
    // Show helpful message
    toast.info('正在前往 Shopify 应用安装页面。安装完成后，请刷新本页面查看连接状态。')
  } catch (error: any) {
    console.error('Error opening Shopify installation:', error)
    toast.error('打开 Shopify 安装页面失败')
  }
}

// Disconnect from Shopify - redirect to Shopify admin to uninstall
const handleDisconnectShopify = () => {
  try {
    // Close the modal
    showDisconnectConfirm.value = false
    disconnectingIntegration.value = null

    // Open Shopify admin apps page in a new tab where user can uninstall the app
    const shopifyAdminUrl = `https://${shopifyShopDomain.value}/admin/apps`
    window.open(shopifyAdminUrl, '_blank')

    // Show a helpful toast message
    toast.info('请在 Shopify 管理后台卸载本应用，以完成完全解绑。')
  } catch (error: any) {
    console.error('Error opening Shopify admin:', error)
    toast.error('打开 Shopify 管理后台失败')
    showDisconnectConfirm.value = false
    disconnectingIntegration.value = null
  }
}

// Define interface for IntegrationCard
interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  isLoading?: boolean;
  siteUrl?: string;
  shopDomain?: string;
  teamName?: string;
  comingSoon?: boolean;
  category?: string;
  color?: string;
  /** Inline warning under the description (expired connection, sync failures). */
  warning?: string;
  connectAction?: () => void;
  disconnectAction?: () => void;
  /** An extra action on the connected card, alongside Manage/Disconnect. */
  extraActionLabel?: string;
  extraAction?: () => void;
}

// List of available integrations
const availableIntegrations = computed<IntegrationCard[]>(() => [
  {
    id: 'jira',
    name: 'Jira',
    description: '连接 Jira 实例，支持直接在客服对话与事件中一键创建缺陷工单。',
    logo: jiraLogo,
    category: '项目管理',
    color: 'purple',
    connected: jiraConnected.value,
    siteUrl: jiraSiteUrl.value,
    isLoading: isLoading.value,
    connectAction: connectJira,
    disconnectAction: handleDisconnectJira
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: '从 Shopify App Store 安装应用，将您的独立站店铺与客户对话无缝集成。',
    logo: shopifyLogo,
    category: '跨境电商',
    color: 'teal',
    connected: shopifyConnected.value,
    shopDomain: shopifyShopDomain.value,
    isLoading: shopifyLoading.value,
    disconnectAction: handleDisconnectShopify
  },
  {
    id: 'slack',
    name: 'Slack',
    description: '连接 Slack 工作区，团队成员可通过 @提及 或私信与 AI 智能体实时问答。',
    logo: slackLogo,
    category: '即时通讯',
    color: 'accent',
    connected: accountsFor('slack').length > 0,
    teamName: accountsFor('slack').map(a => a.display_name).filter(Boolean).join(', '),
    isLoading: channelsLoading.value,
    connectAction: connectSlack,
    disconnectAction: handleDisconnectSlack
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: '连接 Telegram Bot，让客户可直接在 Telegram 上与 AI 客服对话。',
    logo: telegramLogo,
    category: '即时通讯',
    color: 'accent',
    connected: telegramAccounts.value.length > 0,
    teamName: telegramAccounts.value.map(a => a.display_name).filter(Boolean).join(', '),
    isLoading: channelsLoading.value,
    connectAction: () => { showTelegramModal.value = true },
    disconnectAction: handleDisconnectTelegram
  },
  ...(['whatsapp', 'messenger', 'instagram'] as const).map(channel => {
    const meta = {
      whatsapp: { name: 'WhatsApp', logo: whatsappLogo, color: 'teal',
        description: '接入 WhatsApp Business，让全球客户在 WhatsApp 上与 AI 智能体沟通。',
        disconnect: handleDisconnectWhatsApp },
      messenger: { name: 'Messenger', logo: messengerLogo, color: 'accent',
        description: '连接 Facebook Messenger，让公共主页访客直接咨询 AI 客服。',
        disconnect: handleDisconnectMessenger },
      instagram: { name: 'Instagram', logo: instagramLogo, color: 'purple',
        description: '接入 Instagram Direct，让客户在 Instagram 私信中与 AI 客服互动。',
        disconnect: handleDisconnectInstagram },
    }[channel]
    const accounts = accountsFor(channel)
    return {
      id: channel,
      name: meta.name,
      description: meta.description,
      logo: meta.logo,
      category: '即时通讯',
      color: meta.color,
      connected: accounts.length > 0,
      teamName: accounts.map(a => a.display_name).filter(Boolean).join(', '),
      isLoading: channelsLoading.value,
      connectAction: () => { metaModalChannel.value = channel },
      disconnectAction: meta.disconnect,
      // Templates are WhatsApp-only — the other Meta channels have no equivalent.
      ...(channel === 'whatsapp' && accounts.length > 0
        ? { extraActionLabel: '消息模板', extraAction: () => { showTemplateManager.value = true } }
        : {})
    }
  }),
  ...(['email', 'sms', 'line'] as const).map(channel => {
    const meta = {
      email: { name: 'Email', logo: emailLogo, color: 'purple',
        description: '接入企业客服支持邮箱，客户邮件将由 AI 智能体自动解析并答复。',
        disconnect: handleDisconnectEmail },
      sms: { name: 'SMS 短信', logo: smsLogo, color: 'coral',
        description: '连接 Twilio 短信号码，让客户通过发送手机短信与 AI 客服交流。',
        disconnect: handleDisconnectSms },
      line: { name: 'LINE', logo: lineLogo, color: 'teal',
        description: '连接 LINE 官方账号 (Official Account)，让客户在 LINE 上与 AI 互动。',
        disconnect: handleDisconnectLine },
    }[channel]
    const accounts = accountsFor(channel)
    return {
      id: channel,
      name: meta.name,
      description: meta.description,
      logo: meta.logo,
      category: '即时通讯',
      color: meta.color,
      connected: accounts.length > 0,
      teamName: accounts.map(a => a.display_name).filter(Boolean).join(', '),
      isLoading: channelsLoading.value,
      connectAction: () => { credentialModalChannel.value = channel },
      disconnectAction: meta.disconnect
    }
  }),
  ...CRM_PROVIDERS.map(provider => {
    const meta = {
      hubspot: { name: 'HubSpot', logo: hubspotLogo, color: 'coral',
        description: '自动将对话捕获的线索同步至 HubSpot Contacts，按邮箱去重并附带 AI 总结。' },
      pipedrive: { name: 'Pipedrive', logo: pipedriveLogo, color: 'teal',
        description: '自动将捕获的线索同步至 Pipedrive Persons/Leads，按邮箱去重并附带 AI 总结。' },
    }[provider]
    const connection = crmFor(provider)
    return {
      id: provider,
      name: meta.name,
      description: meta.description,
      logo: meta.logo,
      category: 'CRM 客户管理',
      color: meta.color,
      connected: connection?.status === 'active',
      teamName: connection?.display_name || undefined,
      warning: crmCardWarning(connection),
      isLoading: crmLoading.value,
      connectAction: () => connectCrm(provider),
      disconnectAction: () => handleDisconnectCrm(provider)
    }
  }),
  // Native AI ticketing (built-in) — the card links to its settings page.
  {
    id: 'ai-ticketing',
    name: 'AI 原生智能工单',
    description: '内置全流程 AI 工单系统，支持自动分类流转与根因溯源 — 无需配置第三方追踪工具。',
    logo: chattermateLogo,
    category: '客服与工单',
    color: 'lime',
    connected: true,
    connectAction: () => router.push('/settings/ticketing'),
    disconnectAction: () => router.push('/settings/ticketing')
  },
  // Future integrations
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: '连接 Zendesk 客户支持平台，实现跨渠道客服工单统一同步与管理。',
    logo: zendeskLogo,
    category: '客服与工单',
    color: 'coral',
    connected: false,
    comingSoon: true
  }
])

// Search + summary
const intQuery = ref('')

const filteredIntegrations = computed(() => {
  const q = intQuery.value.trim().toLowerCase()
  if (!q) return availableIntegrations.value
  return availableIntegrations.value.filter(it =>
    it.name.toLowerCase().includes(q) ||
    it.description.toLowerCase().includes(q) ||
    (it.category || '').toLowerCase().includes(q)
  )
})

const intEmpty = computed(() => filteredIntegrations.value.length === 0)

const intSummary = computed(() => {
  const total = availableIntegrations.value.length
  const connected = availableIntegrations.value.filter(it => it.connected).length
  return `${connected}/${total} 已连接`
})

// Display name for an ?integration= id, taken from the card list so a new
// integration never has to be named twice. Jira's callback predates the param,
// so a missing id means Jira.
const integrationName = (id?: string) => {
  const integrationId = id || 'jira'
  return availableIntegrations.value.find(it => it.id === integrationId)?.name || integrationId
}

onMounted(async () => {
  await Promise.all([
    fetchJiraStatus(),
    fetchShopifyStatus(),
    fetchChannelAccounts(),
    fetchCrmConnections()
  ])
  
  // Check if we're returning from an OAuth flow
  if (route.query.status) {
    if (route.query.status === 'success') {
      if (route.query.integration === 'shopify') {
        toast.success('Shopify 店铺连接成功！')
      } 
      else if (route.query.integration === 'slack') {
        toast.success('Slack 已成功连接 — 请选择由哪位 AI 智能体接待答复。')
        // Open the agent picker for the just-connected Slack workspace
        const slackAcc = accountsFor('slack')[0]
        if (slackAcc) {
          credentialModalAccount.value = slackAcc
          credentialModalChannel.value = 'slack'
        }
      }
      else {
        toast.success(`${integrationName(route.query.integration as string)} 连接成功！`)
      }
      connectionError.value = null
    } else if (route.query.status === 'failure') {
      // Jira's callback omits the integration param, so a missing value means Jira.
      const failedIntegration = (route.query.integration as string) || 'jira'
      const name = integrationName(failedIntegration)
      const reason = route.query.reason as string || 'unknown'

      let errorMessage = `连接至 ${name} 失败`

      // Map common error reasons to user-friendly messages
      if (reason === 'cancelled') {
        errorMessage = `${name} 授权连接已取消`
      } else if (reason === 'invalid_state') {
        errorMessage = '身份认证会话已失效或过期'
      } else if (reason.includes('unauthorized')) {
        errorMessage = '授权失败，请检查您的账号权限'
      } else if (reason) {
        errorMessage = `连接至 ${name} 失败：${reason.replace(/_/g, ' ')}`
      }

      toast.error(errorMessage)
      connectionError.value = { integration: failedIntegration, message: errorMessage }
    }
    
    // Remove the query parameters to avoid showing the toast on refresh
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  // Landing-page install: arriving with ?connect=slack starts the OAuth flow
  // immediately. The router guard has already ensured the user is signed in
  // (redirecting through login if needed), so this same-domain redirect carries
  // the session cookie the install endpoint requires.
  if (route.query.connect === 'slack') {
    window.history.replaceState({}, document.title, window.location.pathname)
    if (accountsFor('slack').length === 0) {
      connectSlack()
    }
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="integrations-settings">
      <!-- Page header + search -->
      <div class="int-page-header">
        <div class="int-page-titles">
          <h1 class="int-title">第三方渠道与平台集成</h1>
          <p class="int-subtitle">将 ChatterMate 与您团队正在使用的电商、即时通讯、工单和 CRM 工具无缝连接。</p>
        </div>
        <div class="int-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M21 21l-4-4"></path>
          </svg>
          <input
            v-model="intQuery"
            type="search"
            name="integration-search"
            autocomplete="off"
            aria-label="搜索集成平台"
            placeholder="搜索集成渠道与平台…"
          />
        </div>
      </div>

      <!-- Summary bar -->
      <div class="int-summary-bar">
        <span class="int-summary">{{ intSummary }}</span>
      </div>

      <!-- Cards grid -->
      <div class="integration-cards">
        <div
          v-for="integration in filteredIntegrations"
          :key="integration.id"
          class="integration-card"
        >
          <div class="integration-header">
            <div class="integration-tile" :class="`tile-${integration.color}`">
              <img
                v-if="integration.logo"
                :src="integration.logo"
                :alt="`${integration.name} Logo`"
                class="integration-logo"
              />
              <span v-else>{{ integration.name.charAt(0) }}</span>
            </div>
            <div class="integration-info">
              <div class="integration-name">{{ integration.name }}</div>
              <div class="integration-cat">{{ integration.category }}</div>
            </div>
            <span
              v-if="integration.connected"
              class="status-badge connected"
            >
              <span class="status-dot"></span>
              已连接
            </span>
            <span
              v-else-if="!integration.comingSoon"
              class="status-badge not-connected"
            >
              <span class="status-dot"></span>
              未连接
            </span>
            <span
              v-else
              class="status-badge soon"
            >
              即将推出
            </span>
          </div>

          <p class="integration-desc">{{ integration.description }}</p>

          <div v-if="integration.connected && integration.siteUrl" class="integration-meta">
            <a :href="integration.siteUrl" target="_blank" class="meta-link">↗ 访问 {{ integration.name }} 站点</a>
          </div>
          <div v-else-if="integration.connected && integration.shopDomain" class="integration-meta">
            <span class="meta-text">{{ integration.shopDomain }}</span>
            <a :href="`https://${integration.shopDomain}/admin`" target="_blank" class="meta-link">↗ 打开 Shopify 管理后台</a>
          </div>
          <div v-else-if="integration.connected && integration.teamName" class="integration-meta">
            <span class="meta-text">{{ integration.teamName }}</span>
          </div>
          <div v-else-if="!integration.connected && connectionError && connectionError.integration === integration.id" class="integration-meta">
            <span class="meta-error">⚠️ {{ connectionError.message }}</span>
          </div>
          <div v-if="integration.warning" class="integration-meta">
            <span class="meta-error">⚠️ {{ integration.warning }}</span>
          </div>

          <!-- Loading state -->
          <button
            v-if="integration.isLoading"
            class="int-btn int-btn-loading"
            disabled
          >
            <span class="loading-spinner"></span>
            正在加载…
          </button>

          <!-- Connected: Manage + Disconnect -->
          <div v-else-if="integration.connected" class="int-actions">
            <button class="int-btn int-btn-manage" @click="manageIntegration(integration)">管理</button>
            <button
              v-if="integration.extraAction"
              class="int-btn int-btn-manage"
              @click="integration.extraAction()"
            >
              {{ integration.extraActionLabel }}
            </button>
            <button class="int-btn int-btn-disconnect" @click="showDisconnectConfirmation(integration.id)">
              断开连接
            </button>
          </div>

          <!-- Coming soon -->
          <button
            v-else-if="integration.comingSoon"
            class="int-btn int-btn-soon"
            disabled
          >
            即将推出
          </button>

          <!-- Not connected: Connect / Install -->
          <button
            v-else
            class="int-btn int-btn-connect"
            @click="integration.id === 'shopify' ? openShopifyInstallation() : integration.connectAction?.()"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            {{ integration.id === 'shopify' ? '去安装' : '立即连接' }}
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="intEmpty" class="int-empty">
        未找到与搜索相匹配的集成平台。
      </div>
    </div>
  </DashboardLayout>
  
  <!-- Disconnect Confirmation Modal -->
  <div v-if="showDisconnectConfirm" class="disconnect-modal">
    <div class="disconnect-modal-content">
      <div class="disconnect-modal-header">
        <h3>断开集成连接</h3>
        <button class="close-modal-btn" @click="cancelDisconnect">
          <span>×</span>
        </button>
      </div>
      <div class="disconnect-modal-body">
        <div class="warning-icon">⚠️</div>
        <p>确定要断开此平台的集成连接吗？</p>
        <p class="warning-text">此操作将移除与该集成关联的所有账号配置与连接关系。</p>
        
        <div v-if="disconnectingIntegration === 'jira'" class="integration-specific-warning">
          <p>断开 Jira 连接将会：</p>
          <ul>
            <li>从所有智能体中移除 Jira 相关配置</li>
            <li>停用客服会话中的 Jira 工单创建功能</li>
            <li>如需再次使用，需要重新授权并重新配置</li>
          </ul>
        </div>
        
        <div v-if="disconnectingIntegration === 'shopify'" class="integration-specific-warning">
          <p>断开 Shopify 连接步骤：</p>
          <ul>
            <li>系统将引导您前往 Shopify 后台应用列表</li>
            <li>在 Shopify 店铺中卸载本应用</li>
            <li>此操作可确保两端平台的数据完全解绑同步</li>
            <li>如需再次使用，需重新从应用市场安装</li>
          </ul>
        </div>

        <div v-if="disconnectingIntegration === 'slack'" class="integration-specific-warning">
          <p>断开 Slack 连接将会：</p>
          <ul>
            <li>移除所有 Slack 频道与机器人配置</li>
            <li>停用 Slack 中的智能体对话功能</li>
            <li>删除已存储的会话缓存数据</li>
            <li>如需再次使用，需要重新发起 OAuth 授权</li>
          </ul>
        </div>

        <div v-if="disconnectingIntegration === 'telegram'" class="integration-specific-warning">
          <p>断开 Telegram 连接将会：</p>
          <ul>
            <li>注销 Bot Webhook 回调地址，机器人将停止接收消息</li>
            <li>解除该 Bot 与当前 AI 智能体的绑定关系</li>
            <li>如需再次使用，需重新录入 Bot Token</li>
          </ul>
        </div>

        <div v-if="disconnectingIntegration === 'whatsapp' || disconnectingIntegration === 'messenger' || disconnectingIntegration === 'instagram'" class="integration-specific-warning">
          <p>断开此渠道连接将会：</p>
          <ul>
            <li>AI 智能体将停止接收和答复来自该渠道的客户消息</li>
            <li>解除该渠道账号与客服智能体的路由绑定</li>
            <li>如需再次使用，需重新配置凭证进行授权</li>
          </ul>
        </div>

        <div v-if="disconnectingIntegration === 'hubspot' || disconnectingIntegration === 'pipedrive'" class="integration-specific-warning">
          <p>断开此 CRM 系统将会：</p>
          <ul>
            <li>停止推送新捕获的销售线索（待推送队列将被取消）</li>
            <li>注销并吊销访问令牌 Token</li>
            <li>保留智能体中的“同步到 CRM”配置项（重新连接后自动恢复）</li>
          </ul>
        </div>
      </div>
      <div class="disconnect-modal-actions">
        <button class="btn-cancel" @click="cancelDisconnect">取消</button>
        <button 
          v-if="disconnectingIntegration === 'jira'" 
          class="btn-disconnect" 
          @click="handleDisconnectJira"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>断开 Jira 连接</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'shopify'"
          class="btn-disconnect"
          @click="handleDisconnectShopify"
        >
          <span class="btn-icon">↗</span>
          <span>打开 Shopify 管理后台</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'slack'"
          class="btn-disconnect"
          @click="handleDisconnectSlack"
          :disabled="channelsLoading"
        >
          <span v-if="channelsLoading" class="loading-spinner"></span>
          <span v-else>断开 Slack 连接</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'telegram'"
          class="btn-disconnect"
          @click="handleDisconnectTelegram"
          :disabled="channelsLoading"
        >
          <span v-if="channelsLoading" class="loading-spinner"></span>
          <span v-else>断开 Telegram 连接</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'email' || disconnectingIntegration === 'sms' || disconnectingIntegration === 'line'"
          class="btn-disconnect"
          @click="disconnectingIntegration === 'email' ? handleDisconnectEmail() : disconnectingIntegration === 'sms' ? handleDisconnectSms() : handleDisconnectLine()"
          :disabled="channelsLoading"
        >
          <span v-if="channelsLoading" class="loading-spinner"></span>
          <span v-else>断开 {{ disconnectingIntegration === 'email' ? 'Email' : disconnectingIntegration === 'sms' ? 'SMS 短信' : 'LINE' }} 连接</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'whatsapp' || disconnectingIntegration === 'messenger' || disconnectingIntegration === 'instagram'"
          class="btn-disconnect"
          @click="disconnectingIntegration === 'whatsapp' ? handleDisconnectWhatsApp() : disconnectingIntegration === 'messenger' ? handleDisconnectMessenger() : handleDisconnectInstagram()"
          :disabled="channelsLoading"
        >
          <span v-if="channelsLoading" class="loading-spinner"></span>
          <span v-else>断开 {{ disconnectingIntegration === 'whatsapp' ? 'WhatsApp' : disconnectingIntegration === 'messenger' ? 'Messenger' : 'Instagram' }} 连接</span>
        </button>
        <button
          v-if="disconnectingIntegration === 'hubspot' || disconnectingIntegration === 'pipedrive'"
          class="btn-disconnect"
          @click="handleDisconnectCrm(disconnectingIntegration as CrmProvider)"
          :disabled="crmLoading"
        >
          <span v-if="crmLoading" class="loading-spinner"></span>
          <span v-else>断开 {{ disconnectingIntegration === 'hubspot' ? 'HubSpot' : 'Pipedrive' }} 连接</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Telegram Connect Modal -->
  <TelegramConnectModal
    v-if="showTelegramModal"
    :existing-account="telegramModalAccount"
    @close="showTelegramModal = false; telegramModalAccount = null"
    @connected="onChannelConnected"
  />

  <!-- Meta Channel Connect Modal (WhatsApp / Messenger / Instagram) -->
  <MetaChannelConnect
    v-if="metaModalChannel"
    :channel="metaModalChannel"
    :existing-account="metaModalAccount"
    @close="metaModalChannel = null; metaModalAccount = null"
    @connected="onChannelConnected"
  />

  <!-- WhatsApp template management -->
  <WhatsAppTemplateManager
    v-if="showTemplateManager"
    :accounts="accountsFor('whatsapp')"
    @close="showTemplateManager = false"
  />

  <!-- Credential Connect Modal (Email / SMS / LINE) -->
  <ChannelConnectModal
    v-if="credentialModalChannel"
    :channel="credentialModalChannel"
    :existing-account="credentialModalAccount"
    @close="credentialModalChannel = null; credentialModalAccount = null"
    @connected="onChannelConnected"
  />

</template>

<style scoped>
:root {
  --primary-color-rgb: 59, 130, 246; /* This is a typical blue color in RGB format */
  --error-color-rgb: 220, 38, 38; /* Red color in RGB format */
}

.integrations-settings {
  padding: var(--space-lg);
  max-width: 1180px;
  margin: 0 auto;
}

/* Page header + search */
.int-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.int-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 6px;
}

.int-subtitle {
  font-size: 15px;
  color: var(--muted);
  margin: 0;
}

.int-search {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--o10);
  border-radius: var(--radius-btn);
  min-width: 230px;
  color: var(--muted2);
}

.int-search input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
}

.int-search input::placeholder {
  color: var(--muted2);
}

/* Summary bar */
.int-summary-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.int-summary {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted2);
  flex-shrink: 0;
}

/* Cards grid */
.integration-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 18px;
}

.integration-card {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 18px;
  padding: 22px;
  display: flex;
  flex-direction: column;
}

.integration-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

/* Color-coded icon tile */
.integration-tile {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
}

.integration-tile .integration-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.tile-purple {
  background: var(--purple-bg);
  color: var(--c-purple);
}

.tile-teal {
  background: var(--teal-bg);
  color: var(--c-teal);
}

.tile-accent {
  background: var(--accent-bg-12);
  color: var(--accent-ink);
}

.tile-coral {
  background: var(--coral-bg);
  color: var(--c-coral);
}

.integration-info {
  flex: 1;
  min-width: 0;
}

.integration-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16.5px;
  color: var(--text2);
}

.integration-cat {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted2);
  margin-top: 3px;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.connected {
  background: var(--teal-bg);
  color: var(--c-teal);
}

.status-badge.not-connected {
  background: var(--o05);
  color: var(--muted2);
}

.status-badge.soon {
  background: var(--o05);
  color: var(--faint);
}

/* Description */
.integration-desc {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.55;
  margin: 0 0 18px;
  flex: 1;
}

/* Connected meta info */
.integration-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: -8px 0 16px;
}

.meta-text {
  font-size: 13px;
  color: var(--text2);
  font-weight: 500;
}

.meta-link {
  font-size: 12.5px;
  color: var(--c-teal);
  text-decoration: none;
  width: fit-content;
}

.meta-link:hover {
  text-decoration: underline;
}

.meta-error {
  font-size: 12px;
  color: var(--c-coral);
  background: var(--coral-bg);
  border: 1px solid var(--coral-border);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  word-break: break-word;
}

/* Buttons */
.int-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.int-actions {
  display: flex;
  gap: 9px;
}

.int-btn-connect {
  width: 100%;
  padding: 12px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: var(--radius-chip);
  font-size: 14px;
  font-weight: 600;
}

.int-btn-connect:hover {
  filter: brightness(1.05);
}

.int-btn-manage {
  flex: 1;
  padding: 11px;
  background: var(--o05);
  border: 1px solid var(--o14);
  border-radius: var(--radius-chip);
  color: var(--text);
}

.int-btn-manage:hover {
  background: var(--o10);
}

.int-btn-disconnect {
  flex-shrink: 0;
  padding: 11px 16px;
  background: transparent;
  border: 1px solid var(--coral-border);
  border-radius: var(--radius-chip);
  color: var(--c-coral);
}

.int-btn-disconnect:hover {
  background: var(--coral-bg);
}

.int-btn-soon {
  width: 100%;
  padding: 12px;
  background: var(--o03);
  border: 1px solid var(--o08);
  border-radius: var(--radius-chip);
  color: var(--faint);
  font-size: 14px;
  cursor: not-allowed;
}

.int-btn-loading {
  width: 100%;
  padding: 12px;
  background: var(--o03);
  border: 1px solid var(--o08);
  border-radius: var(--radius-chip);
  color: var(--muted);
  font-size: 14px;
  cursor: default;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--o10);
  border-top-color: var(--accent-ink);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty state */
.int-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--muted2);
  font-size: 14px;
}

@media (max-width: 768px) {
  .integration-cards {
    grid-template-columns: 1fr;
  }

  .integrations-settings {
    padding: var(--space-md);
  }
}

/* Disconnect Modal Styles */
.disconnect-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.disconnect-modal-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg, 12px);
  width: 440px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.disconnect-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border-color);
}

.disconnect-modal-header h3 {
  margin: 0;
  color: var(--text-primary, var(--text));
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-display, inherit);
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-modal-btn:hover {
  color: var(--text-primary);
}

.disconnect-modal-body {
  padding: 24px;
}

.warning-icon {
  width: 56px;
  height: 56px;
  margin: 4px auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border-radius: 50%;
  background: var(--coral-bg, rgba(220, 38, 38, 0.12));
}

.disconnect-modal-body p {
  margin: 0 0 10px;
  text-align: center;
  color: var(--text-primary, var(--text));
}

.warning-text {
  color: var(--error-color);
  font-weight: 500;
  font-size: 13px;
}

.integration-specific-warning {
  margin-top: 20px;
  padding: 14px 16px;
  background: var(--background-soft);
  border-radius: var(--radius-md, 8px);
  border-left: 3px solid var(--warning, #f5a623);
}

.integration-specific-warning p {
  text-align: left;
  margin: 0 0 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary, var(--text));
}

.integration-specific-warning ul {
  margin: 0;
  padding-left: 20px;
}

.integration-specific-warning li {
  margin-bottom: 6px;
  color: var(--text-secondary, var(--muted));
  font-size: 13px;
}

.disconnect-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--border-color);
  background: var(--background-soft);
}

.btn-cancel {
  background: var(--background-mute);
  color: var(--text-primary, var(--text));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-btn, 8px);
  padding: 9px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-cancel:hover {
  background: var(--background-alt);
}

.btn-disconnect {
  background: var(--error-color);
  color: #fff;
  border: none;
  border-radius: var(--radius-btn, 8px);
  padding: 9px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-disconnect:hover {
  filter: brightness(1.08);
}

.btn-disconnect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--o30);
  border-radius: 50%;
  border-top-color: var(--text);
  animation: spin 1s linear infinite;
}

.not-connected-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.connection-error {
  font-size: var(--text-xs);
  color: var(--error-color);
  background-color: rgba(var(--error-color-rgb), 0.1);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  max-width: 100%;
  word-break: break-word;
}

.error-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.shop-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.shop-domain {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.team-name {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.integration-form {
  margin-top: var(--space-sm);
  border-top: 1px solid var(--border-color);
  padding-top: var(--space-sm);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--space-xs);
  color: var(--text-primary);
}

.input-with-label {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  overflow: hidden;
}

.input-with-label input {
  flex: 1;
  padding: var(--space-sm);
  border: none;
  font-size: var(--text-sm);
  background: transparent;
  min-width: 0;
}

.input-with-label input:focus {
  outline: none;
}

.input-suffix {
  padding: var(--space-sm) var(--space-sm) var(--space-sm) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  white-space: nowrap;
}

.form-help {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.form-error {
  display: block;
  font-size: var(--text-xs);
  color: var(--error-color);
  margin-top: var(--space-xs);
}
</style> 