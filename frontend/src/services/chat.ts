/*
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
*/

import api from './api'
import type { Conversation, ChatDetail } from '@/types/chat'

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
}

export interface ShopifyOrdersResponse {
  status?: string
  orders: ShopifyOrder[]
}

interface ChatParams {
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
    return response.data as Conversation[]
  },

  async getChatDetail(sessionId: string) {
    const urlParams = new URLSearchParams(window.location.search)
    const hasShopParam = urlParams.has('shop') || urlParams.has('host')
    
    const endpoint = hasShopParam ? `/chats/${sessionId}/shopify` : `/chats/${sessionId}`
    const response = await api.get<ChatDetail>(endpoint)
    return response.data
  },

  async takeoverChat(sessionId: string): Promise<void> {
    const response = await api.post(`/sessions/${sessionId}/takeover`)
    return response.data
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
    const response = await api.post(`/sessions/${sessionId}/toggle-ai-auto-reply`, { enabled })
    return response.data as ChatDetail
  },

  async reassignChat(sessionId: string, toUserId: string) {
    const response = await api.post(`/sessions/${sessionId}/reassign`, null, { params: { to_user_id: toUserId } })
    return response.data as ChatDetail
  },

  async getShopifyOrders(sessionId: string): Promise<ShopifyOrdersResponse> {
    const response = await api.get<ShopifyOrdersResponse>(`/sessions/${sessionId}/shopify-orders`)
    return response.data
  },

  async generateCopilotDraft(sessionId: string, params: { draft: string; mode: string }): Promise<{ draft: string }> {
    const response = await api.post<{ draft: string }>(`/sessions/${sessionId}/copilot-draft`, params)
    return response.data
  }
}