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
import type { Conversation, ChatDetail } from '@/types/chat'
import type { Teammate } from '@/services/users'

export interface ShopifyLineItem {
  id?: number | string
  title?: string
  quantity?: number
  price?: string | number
  sku?: string
}

export interface ShopifyFulfillment {
  id?: number | string
  status?: string
  shipment_status?: string
  tracking_company?: string
  tracking_numbers?: string[]
  tracking_urls?: string[]
}

export interface ShopifyOrder {
  id: string | number
  name: string
  created_at?: string
  financial_status?: string
  fulfillment_status?: string
  total_price?: string | number
  currency?: string
  line_items?: ShopifyLineItem[]
  fulfillments?: ShopifyFulfillment[]
  shipping_address?: ShopifyShippingAddress
}

export interface ShopifyOrdersResponse {
  status?: string
  orders: ShopifyOrder[]
  count?: number
  shop_domain?: string
  has_next_page?: boolean
  end_cursor?: string | null
  write_orders_enabled?: boolean
}

export interface CustomerSummary {
  status?: string
  order_count: number | null
  total_spend: string | number | null
  currency: string | null
  satisfaction_score: number | null
  rating_count: number
}

export interface ThreadUnreadCountsResponse {
  counts: Record<string, number>
}

export interface ShopifyRefundPreview {
  status?: string
  order_name?: string
  amount?: string | number | null
  currency?: string | null
  refundable: boolean
}

export interface ShopifyShippingAddress {
  name?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  country?: string
  zip?: string
  phone?: string
}

export interface ShopifyProduct {
  id: string
  title: string
  handle?: string
  vendor?: string
  price?: string | number
  price_max?: string | number
  currency?: string
  image?: { src?: string; alt?: string }
}

export interface ShopifyProductsResponse {
  status?: string
  products: ShopifyProduct[]
  count: number
  shop_domain?: string
}

export interface ChatParams {
  skip?: number
  limit?: number
  agent_id?: string
  status?: 'open' | 'closed' | 'transferred' | string
  user_id?: string
  customer_email?: string
  date_from?: string
  date_to?: string
}

export const chatService = {
  async getRecentChats(params?: ChatParams) {
    const urlParams = new URLSearchParams(window.location.search)
    const hasShopParam = urlParams.has('shop') || urlParams.has('host')
    
    const endpoint = hasShopParam ? '/chats/recent/shopify' : '/chats/recent'
    const response = await api.get(endpoint, { params })
    return Array.isArray(response.data) ? response.data as Conversation[] : []
  },

  async getChatDetail(sessionId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const hasShopParam = urlParams.has('shop') || urlParams.has('host')
    
    const endpoint = hasShopParam ? `/chats/${sessionId}/shopify` : `/chats/${sessionId}`
    const response = await api.get<ChatDetail>(endpoint)
    return response.data
  },

  async takeoverChat(sessionId: string): Promise<ChatDetail> {
    const response = await api.post(`/sessions/${sessionId}/takeover`)
    return response.data as ChatDetail
  },

  /** Stop the AI on this chat and queue it for the team, without claiming it. */
  async routeToHuman(sessionId: string): Promise<ChatDetail> {
    const response = await api.post(`/sessions/${sessionId}/route-to-human`)
    return response.data as ChatDetail
  },

  async handBackToAI(sessionId: string): Promise<ChatDetail> {
    const response = await api.post(`/sessions/${sessionId}/hand-back-to-ai`)
    return response.data as ChatDetail
  },

  async toggleAIAutoReply(sessionId: string, enabled: boolean): Promise<ChatDetail> {
    const response = await api.post(`/sessions/${sessionId}/ai-auto-reply`, { enabled })
    return response.data as ChatDetail
  },

  async endChat(sessionId: string, payload: { message?: string; request_rating?: boolean; end_chat_reason?: string; end_chat_description?: string; client_message_id?: string }): Promise<ChatDetail> {
    const response = await api.post(`/sessions/${sessionId}/end`, payload)
    return response.data as ChatDetail
  },

  async reassignChat(sessionId: string, toUserId: string, note?: string) {
    const response = await api.post(`/sessions/${sessionId}/reassign`, { to_user_id: toUserId, note })
    return response.data as ChatDetail
  },

  async updateTags(sessionId: string, tags: string[]): Promise<ChatDetail> {
    const response = await api.put(`/sessions/${sessionId}/tags`, { tags })
    return response.data as ChatDetail
  },

  async getMentionableTeammates(sessionId: string): Promise<Teammate[]> {
    const response = await api.get<Teammate[]>(`/sessions/${sessionId}/mentionable-teammates`)
    return response.data
  },

  async getThreadUnreadCounts(): Promise<ThreadUnreadCountsResponse> {
    const response = await api.get<ThreadUnreadCountsResponse>('/chats/inbox/thread-unread-counts')
    return response.data
  },

  async markChatRead(sessionId: string): Promise<{ session_id: string; last_read_at: string }> {
    const response = await api.put<{ session_id: string; last_read_at: string }>(`/chats/${sessionId}/read`)
    return response.data
  },

  async getShopifyOrders(sessionId: string, cursor?: string): Promise<ShopifyOrdersResponse> {
    const response = await api.get<ShopifyOrdersResponse>(`/chats/${sessionId}/shopify/orders`, {
      params: cursor ? { cursor } : undefined,
    })
    return response.data
  },

  async getCustomerSummary(sessionId: string): Promise<CustomerSummary> {
    const response = await api.get<CustomerSummary>(`/chats/${sessionId}/customer-summary`)
    return response.data
  },

  async getShopifyProducts(sessionId: string): Promise<ShopifyProductsResponse> {
    const response = await api.get<ShopifyProductsResponse>(`/chats/${sessionId}/shopify/products`)
    return response.data
  },

  async getShopifyRefundPreview(sessionId: string, orderId: string): Promise<ShopifyRefundPreview> {
    const response = await api.get<ShopifyRefundPreview>(`/chats/${sessionId}/shopify/orders/${orderId}/refund-preview`)
    return response.data
  },

  async refundShopifyOrder(sessionId: string, orderId: string, params: { confirmed: true; idempotency_key: string; note?: string }) {
    const response = await api.post(`/chats/${sessionId}/shopify/orders/${orderId}/refund`, params)
    return response.data
  },

  async updateShopifyShippingAddress(
    sessionId: string,
    orderId: string,
    params: ShopifyShippingAddress & { recipient_name?: string; confirmed: true; idempotency_key: string },
  ) {
    const response = await api.put(`/chats/${sessionId}/shopify/orders/${orderId}/shipping-address`, params)
    return response.data
  },

  async resendShopifyInvoice(sessionId: string, orderId: string, params: { confirmed: true; idempotency_key: string }) {
    const response = await api.post(`/chats/${sessionId}/shopify/orders/${orderId}/invoice`, params)
    return response.data
  },

  async getReplySuggestions(sessionId: string, maxSuggestions = 3): Promise<{ suggestions: string[]; status?: string }> {
    const response = await api.post<{ suggestions: string[]; status?: string }>(`/chats/${sessionId}/reply-suggestions`, {
      max_suggestions: maxSuggestions,
    })
    return response.data
  },

  async generateCopilotDraft(sessionId: string, params: { draft: string; mode: string }): Promise<{ draft: string }> {
    const response = await api.post<{ draft: string }>(`/chats/${sessionId}/copilot-draft`, params)
    return response.data
  }
}
