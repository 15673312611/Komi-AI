import apiClient from '@/services/api'

export interface Store {
  id: string
  organization_id: string
  name: string
  platform: 'shopify' | 'woocommerce' | 'amazon' | 'tiktok' | 'email_custom' | 'web_widget' | 'other'
  shop_domain?: string
  email_account_id?: string
  channel_account_id?: string
  channel_type?: string
  channel_display_name?: string
  channel_external_id?: string
  email_address?: string
  email_display_name?: string
  agent_id?: string
  agent_name?: string
  agent_display_name?: string
  knowledge_tag?: string
  currency: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStorePayload {
  name: string
  platform: string
  shop_domain?: string
  email_account_id?: string
  channel_account_id?: string
  channel_type?: string
  channel_config?: Record<string, any>
  agent_id?: string
  knowledge_tag?: string
  currency?: string
  timezone?: string
  is_active?: boolean
}

export interface UpdateStorePayload {
  name?: string
  platform?: string
  shop_domain?: string
  email_account_id?: string
  channel_account_id?: string
  channel_type?: string
  channel_config?: Record<string, any>
  agent_id?: string
  knowledge_tag?: string
  currency?: string
  timezone?: string
  is_active?: boolean
}

export interface ChannelOption {
  id: string
  channel_type: string
  display_name: string
  external_id: string
  bound_store_id?: string
  bound_store_name?: string
}

export interface AgentOption {
  id: string
  name: string
  display_name?: string
  is_active: boolean
}

export interface ShopifyOption {
  id: string
  shop_domain: string
}

export interface StoreOptions {
  channels: ChannelOption[]
  agents: AgentOption[]
  shopify: ShopifyOption[]
}

export const storeService = {
  async getStores(): Promise<Store[]> {
    const response = await apiClient.get<Store[]>('/stores')
    return response.data || []
  },

  async getStore(id: string): Promise<Store> {
    const response = await apiClient.get<Store>(`/stores/${id}`)
    return response.data
  },

  async createStore(payload: CreateStorePayload): Promise<Store> {
    const response = await apiClient.post<Store>('/stores', payload)
    return response.data
  },

  async updateStore(id: string, payload: UpdateStorePayload): Promise<Store> {
    const response = await apiClient.put<Store>(`/stores/${id}`, payload)
    return response.data
  },

  async deleteStore(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/stores/${id}`)
    return response.data
  },

  async getOptions(): Promise<StoreOptions> {
    const response = await apiClient.get<StoreOptions>('/stores/options')
    return response.data || { channels: [], agents: [], shopify: [] }
  }
}

export default storeService
