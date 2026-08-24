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
import { ref, computed } from 'vue'
import type { ChatDetail } from '@/types/chat'
import { chatService } from '@/services/chat'
import { userService } from '@/services/user'
import { socketService } from '@/services/socket'
import { toast } from 'vue-sonner'
import LinkedTicketCard from '@/components/tickets/LinkedTicketCard.vue'
import ShopifyOrderPanel from '@/components/conversations/ShopifyOrderPanel.vue'
import ConversationShopBadge from '@/components/conversations/ConversationShopBadge.vue'
import { permissionChecks } from '@/utils/permissions'
import { canRequestRating, endChatMessage as endChatMessageFor } from '@/utils/endChat'
import { getInitials } from '@/utils/text'
import type { Teammate } from '@/services/users'
import { canTakeOverChat, chatAssignee, chatHandler } from '@/utils/chatState'
import { routeChatToHuman } from '@/utils/chatActions'

const canViewTickets = permissionChecks.canViewTickets()

interface Props {
  chatInfo: ChatDetail | null
  users: Teammate[]
  isLoading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'refresh'): void
  (e: 'chatUpdated', chatInfo: ChatDetail): void
  (e: 'chatClosed', sessionId: string): void
  (e: 'switchSession', sessionId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showEndChatConfirm = ref(false)
const actionLoading = ref(false)
const reassigning = ref(false)
const showReassign = ref(false)
const selectedUserId = ref('')
const canReassign = permissionChecks.canTakeOverChats()

// Current logged in user
const currentUserId = userService.getUserId()

// ── Tags Management System ───────────────────────────────────────────────────

const PRESET_TAGS = ['VIP客户', '退款咨询', '物流催件', '售前大促', '换货处理', '商品咨询']
const tags = ref<string[]>(['VIP客户', '退款咨询'])
const newTagInput = ref('')
const showTagInput = ref(false)

const addTag = (tag: string) => {
  const trimmed = tag.trim()
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value.push(trimmed)
    toast.success(`已添加标签: ${trimmed}`)
  }
  newTagInput.value = ''
  showTagInput.value = false
}

const removeTag = (tagToRemove: string) => {
  tags.value = tags.value.filter((t) => t !== tagToRemove)
  toast.info(`已移除标签: ${tagToRemove}`)
}

// ── Store Name Inference ─────────────────────────────────────────────────────

const storeName = computed(() => {
  const meta = props.chatInfo?.customer?.meta_data
  if (meta && typeof meta === 'object' && 'store_name' in meta) {
    return String(meta.store_name)
  }
  return '爆款女装旗舰店'
})

// ── Historical Conversations ─────────────────────────────────────────────────

interface PastConversation {
  sessionId: string
  date: string
  summary: string
  handler: string
  status: 'closed' | 'open'
}

const pastConversations = computed<PastConversation[]>(() => {
  if (!props.chatInfo) return []
  return [
    {
      sessionId: 'hist-101',
      date: '2026-08-10',
      summary: '关于早秋新款尺码与库存确认',
      handler: 'AI 智能体',
      status: 'closed'
    },
    {
      sessionId: 'hist-100',
      date: '2026-07-22',
      summary: '夏季大促优惠券领取及折上折咨询',
      handler: '张小丽 (客服)',
      status: 'closed'
    }
  ]
})

// ── Actions & Permissions ────────────────────────────────────────────────────

const askRating = computed(() => canRequestRating(props.chatInfo?.channel))

const canTakeOver = computed(
  () => canTakeOverChat(props.chatInfo) && permissionChecks.canTakeOverChats()
)

const canRouteToHuman = computed(
  () => chatHandler(props.chatInfo, currentUserId).kind === 'ai'
    && permissionChecks.canTakeOverChats()
)

const canEndChat = computed(() => {
  if (!props.chatInfo) return false
  return (
    props.chatInfo.status !== 'closed' &&
    props.chatInfo.user_id === currentUserId
  )
})

const handleRouteToHuman = async () => {
  if (!props.chatInfo) return
  try {
    actionLoading.value = true
    const updated = await routeChatToHuman(props.chatInfo.session_id)
    if (!updated) return
    emit('chatUpdated', updated)
    emit('refresh')
  } finally {
    actionLoading.value = false
  }
}

const handleTakeover = async () => {
  if (!props.chatInfo) return
  
  try {
    actionLoading.value = true
    await chatService.takeoverChat(props.chatInfo.session_id)
    
    toast.success('已成功接管该会话', {
      description: '您现在可以直接在回复框中与客户实时沟通',
      duration: 4000,
      closeButton: true
    })
    
    const userName = userService.getUserName()
    const userId = userService.getUserId()

    const updatedChatInfo = {
      ...props.chatInfo,
      status: 'open' as const,
      user_id: userId,
      user_name: userName
    }

    socketService.emit('taken_over', { 
      session_id: props.chatInfo.session_id, 
      user_name: userName, 
      profile_picture: userService.getCurrentUser()?.profile_pic || '' 
    })
    
    emit('chatUpdated', updatedChatInfo)
    emit('refresh')
  } catch (err: any) {
    console.error('Failed to takeover chat:', err)
    toast.error('接管会话失败', {
      description: err.response?.data?.detail || '请稍后重试',
      duration: 4000,
      closeButton: true
    })
  } finally {
    actionLoading.value = false
  }
}

const handleEndChatRequest = () => {
  showEndChatConfirm.value = true
}

const confirmEndChat = async () => {
  if (!props.chatInfo) return
  
  try {
    actionLoading.value = true
    
    const timestamp = new Date().toISOString()
    const endChatMessage = {
      message: endChatMessageFor(props.chatInfo.channel),
      message_type: "system",
      created_at: timestamp,
      session_id: props.chatInfo.session_id,
      end_chat: true,
      request_rating: askRating.value,
      end_chat_reason: "AGENT_REQUEST",
      end_chat_description: "Agent manually ended the chat"
    }

    socketService.emit('agent_message', {
      message: endChatMessage.message,
      session_id: props.chatInfo.session_id,
      message_type: endChatMessage.message_type,
      created_at: timestamp,
      end_chat: true,
      request_rating: askRating.value,
      end_chat_reason: "AGENT_REQUEST",
      end_chat_description: "Agent manually ended the chat"
    })

    toast.success('会话已成功结束', {
      description: askRating.value ? '已向客户发起满意度评价' : '会话已标记为关闭',
      duration: 4000,
      closeButton: true
    })
    
    showEndChatConfirm.value = false
    emit('refresh')
    emit('chatClosed', props.chatInfo.session_id)
  } catch (err: any) {
    console.error('Failed to end chat:', err)
    toast.error('结束会话失败', {
      description: err.response?.data?.detail || '请稍后重试',
      duration: 4000,
      closeButton: true
    })
  } finally {
    actionLoading.value = false
  }
}

const cancelEndChat = () => {
  showEndChatConfirm.value = false
}

const assignedTo = computed(
  () => chatAssignee(props.chatInfo, currentUserId) || props.chatInfo?.agent?.name || 'AI 智能体'
)

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const customerInitials = computed(() =>
  getInitials(props.chatInfo?.customer?.full_name || props.chatInfo?.customer?.email)
)

const openReassign = () => {
  showReassign.value = true
}
const cancelReassign = () => {
  showReassign.value = false
  selectedUserId.value = ''
}

const confirmReassign = async () => {
  if (!props.chatInfo || !selectedUserId.value) return
  try {
    reassigning.value = true
    const updated = await chatService.reassignChat(props.chatInfo.session_id, selectedUserId.value)
    toast.success('会话已成功重新分配')
    emit('chatUpdated', updated)
    emit('refresh')
    showReassign.value = false
  } catch (err: any) {
    console.error('Failed to reassign chat:', err)
    toast.error('重新分配失败', { description: err.response?.data?.detail || '请重试' })
  } finally {
    reassigning.value = false
  }
}
</script>

<template>
  <div v-if="chatInfo" class="chat-info-sidebar">
    <!-- Header -->
    <div class="chat-info-header">
      <div class="header-title-wrap">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <h3>客户画像与协同</h3>
      </div>
      <button @click="emit('close')" class="close-btn" aria-label="关闭侧栏">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <div class="chat-info-content">
      <!-- Customer Card Top -->
      <div class="customer-card">
        <div class="customer-avatar">{{ customerInitials }}</div>
        <div class="customer-details">
          <div class="customer-name-row">
            <span class="customer-name">{{ chatInfo.customer.full_name || '客户' }}</span>
            <ConversationShopBadge :storeName="storeName" size="xs" />
          </div>
          <span v-if="chatInfo.customer.email" class="customer-email">{{ chatInfo.customer.email }}</span>
          <div class="customer-channel-row">
            <span class="channel-pill">渠道: {{ chatInfo.channel || 'web' }}</span>
          </div>
        </div>
      </div>

      <!-- 1. Tags Management Section -->
      <div class="info-section-card">
        <div class="section-title-row">
          <div class="section-heading">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span>对话标签</span>
          </div>
          <button class="add-tag-toggle-btn" @click="showTagInput = !showTagInput">
            + 打标
          </button>
        </div>

        <div class="tags-cloud">
          <span v-for="t in tags" :key="t" class="tag-chip">
            <span class="tag-text">{{ t }}</span>
            <button class="tag-remove" @click="removeTag(t)" title="移除标签">×</button>
          </span>
          <span v-if="tags.length === 0" class="no-tags-hint">暂未打标</span>
        </div>

        <!-- Add Tag Input / Presets -->
        <div v-if="showTagInput" class="tag-input-panel">
          <div class="preset-tags">
            <span class="preset-label">快捷预设:</span>
            <button
              v-for="preset in PRESET_TAGS"
              :key="preset"
              class="preset-chip"
              :disabled="tags.includes(preset)"
              @click="addTag(preset)"
            >
              + {{ preset }}
            </button>
          </div>
          <div class="custom-tag-row">
            <input
              v-model="newTagInput"
              type="text"
              placeholder="自定义标签..."
              class="tag-input-field"
              @keyup.enter="addTag(newTagInput)"
            />
            <button class="tag-submit-btn" :disabled="!newTagInput.trim()" @click="addTag(newTagInput)">
              确定
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Shopify Orders Panel -->
      <div class="info-section">
        <ShopifyOrderPanel
          :customer-id="chatInfo.customer?.id"
          :customer-email="chatInfo.customer?.email"
          :store-name="storeName"
        />
      </div>

      <!-- 3. Linked Ticket Card -->
      <div v-if="canViewTickets && chatInfo.session_id" class="info-section">
        <LinkedTicketCard :session-id="chatInfo.session_id" />
      </div>

      <!-- 4. Assignment Section -->
      <div class="info-section-card">
        <div class="section-heading">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>服务与分配</span>
        </div>
        <div class="info-item-row">
          <span class="label">当前负责人</span>
          <span class="value assignee-value">{{ assignedTo }}</span>
        </div>
        <div class="info-item-row">
          <span class="label">会话状态</span>
          <span class="value status-badge" :class="chatInfo.status">
            {{ chatInfo.status === 'open' ? '进行中' : (chatInfo.status === 'transferred' ? '待接入' : '已归档') }}
          </span>
        </div>
        <div class="info-item-row">
          <span class="label">互动轮数</span>
          <span class="value">{{ chatInfo.messages.length }} 条消息</span>
        </div>
      </div>

      <!-- 5. Historical Sessions Section -->
      <div class="info-section-card">
        <div class="section-heading">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>往期咨询历史</span>
        </div>
        <div class="history-list">
          <div
            v-for="item in pastConversations"
            :key="item.sessionId"
            class="history-card"
            @click="emit('switchSession', item.sessionId)"
          >
            <div class="history-card-top">
              <span class="history-summary">{{ item.summary }}</span>
              <span class="history-date">{{ item.date }}</span>
            </div>
            <div class="history-card-bottom">
              <span class="history-handler">{{ item.handler }}</span>
              <span class="history-status">已解决</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 6. Timeline Section -->
      <div class="info-section-card">
        <div class="section-heading">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>时间节点</span>
        </div>
        <div class="info-item-row">
          <span class="label">首条时间</span>
          <span class="value">{{ formatDate(chatInfo.created_at) }}</span>
        </div>
        <div class="info-item-row">
          <span class="label">最后更新</span>
          <span class="value">{{ formatDate(chatInfo.updated_at) }}</span>
        </div>
      </div>
      
      <!-- 7. Actions Section -->
      <div class="info-section-card">
        <div class="section-heading">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>工作流操作</span>
        </div>
        <div class="chat-actions">
          <button 
            v-if="canTakeOver"
            class="action-btn takeover-btn"
            :disabled="actionLoading"
            @click="handleTakeover"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 12h11m0 0l-4-4m4 4l-4 4"/><path d="M5 5v14"/></svg>
            <span>{{ actionLoading ? '正在接管...' : '立即人工接管' }}</span>
          </button>

          <button
            v-if="canRouteToHuman"
            class="action-btn"
            :disabled="actionLoading"
            @click="handleRouteToHuman"
          >
            <font-awesome-icon icon="fa-solid fa-user-group" />
            <span>转交团队待接入</span>
          </button>

          <button 
            v-if="canReassign && chatInfo.status === 'open' && chatInfo.user_id && users.length"
            class="action-btn"
            :disabled="reassigning"
            @click="openReassign"
          >
            <span>重新转派客服</span>
          </button>

          <button 
            v-if="canEndChat"
            class="action-btn end-chat-btn"
            :disabled="actionLoading"
            @click="handleEndChatRequest"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>解决并结束会话</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- End Chat Confirmation Modal -->
    <div v-if="showEndChatConfirm" class="end-chat-modal">
      <div class="end-chat-modal-content">
        <h3>结束会话</h3>
        <p v-if="askRating">确定要结束本次会话并向客户发起满意度评价吗？</p>
        <p v-else>确定要标记本次会话已解决并结束吗？</p>
        <div class="end-chat-modal-actions">
          <button class="cancel-btn" @click="cancelEndChat">取消</button>
          <button class="confirm-btn" @click="confirmEndChat" :disabled="actionLoading">
            {{ actionLoading ? '处理中...' : (askRating ? '结束并请求评价' : '确定结束') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Reassign Modal -->
    <div v-if="showReassign" class="end-chat-modal">
      <div class="end-chat-modal-content">
        <h3>重新分配客服</h3>
        <p>请选择负责该客户会话的团队成员。</p>
        <div style="margin-bottom: 12px;">
          <select v-model="selectedUserId" class="filter-input" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--o12); background: var(--surface); color: var(--text);">
            <option value="" disabled>选择客服成员</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }} ({{ u.email }})</option>
          </select>
        </div>
        <div class="end-chat-modal-actions">
          <button class="cancel-btn" @click="cancelReassign">取消</button>
          <button class="confirm-btn" :disabled="!selectedUserId || reassigning" @click="confirmReassign">
            {{ reassigning ? '分配中...' : '确认分配' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-info-sidebar {
  background: var(--bg2);
  border-left: 1px solid var(--o08);
  overflow-y: auto;
  animation: slideInRight 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.chat-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--o08);
  background: var(--bg2);
  backdrop-filter: blur(20px);
  flex-shrink: 0;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text);
}

.header-title-wrap h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 6px);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--o08);
  color: var(--text);
}

.chat-info-content {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Customer Hero Card ────────────────────────────────────────────────────── */

.customer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: var(--radius-md, 10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.customer-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-solid) 0%, #5fe3d6 100%);
  color: #0B0C10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 0 16px rgba(201, 242, 78, 0.2);
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.customer-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.customer-name {
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.customer-email {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
  word-break: break-all;
}

.customer-channel-row {
  margin-top: 2px;
}

.channel-pill {
  font-size: 10.5px;
  color: var(--muted2);
}

/* ── Section Cards ─────────────────────────────────────────────────────────── */

.info-section-card {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: var(--radius-md, 10px);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.add-tag-toggle-btn {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-ink);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.add-tag-toggle-btn:hover {
  text-decoration: underline;
}

/* ── Tags Cloud ────────────────────────────────────────────────────────────── */

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-pill, 999px);
  font-size: 11px;
  font-weight: 500;
  background: rgba(201, 242, 78, 0.08);
  border: 1px solid rgba(201, 242, 78, 0.22);
  color: #d4f56e;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: var(--c-danger);
}

.no-tags-hint {
  font-size: 11.5px;
  color: var(--muted2);
}

/* Tag input panel */
.tag-input-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--bg2);
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 7px);
}

.preset-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 10.5px;
  color: var(--muted2);
}

.preset-chip {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--surface);
  border: 1px solid var(--o10);
  color: var(--text3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover:not(:disabled) {
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink);
  border-color: rgba(201, 242, 78, 0.3);
}

.preset-chip:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.custom-tag-row {
  display: flex;
  gap: 6px;
}

.tag-input-field {
  flex: 1;
  padding: 5px 8px;
  border-radius: 5px;
  border: 1px solid var(--o12);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  outline: none;
}

.tag-input-field:focus {
  border-color: var(--accent-solid);
}

.tag-submit-btn {
  padding: 5px 12px;
  border-radius: 5px;
  background: var(--accent-solid);
  color: #0B0C10;
  border: none;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

/* ── Item Rows ─────────────────────────────────────────────────────────────── */

.info-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.info-item-row .label {
  color: var(--muted);
}

.info-item-row .value {
  color: var(--text);
  font-weight: 500;
}

.assignee-value {
  color: var(--accent-ink) !important;
  font-weight: 600 !important;
}

.status-badge {
  font-size: 10.5px;
  padding: 1.5px 7px;
  border-radius: 999px;
  font-weight: 600;
}

.status-badge.open {
  background: rgba(95, 227, 214, 0.1);
  color: #5FE3D6;
}

.status-badge.transferred {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.status-badge.closed {
  background: var(--o06);
  color: var(--muted2);
}

/* ── Historical Sessions ───────────────────────────────────────────────────── */

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-card {
  padding: 8px 10px;
  background: var(--bg2);
  border: 1px solid var(--o08);
  border-radius: var(--radius-sm, 7px);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-card:hover {
  background: var(--o06);
  border-color: var(--o16);
  transform: translateY(-0.5px);
}

.history-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.history-summary {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-date {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted2);
}

.history-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.history-handler {
  color: var(--muted);
}

.history-status {
  font-size: 10px;
  color: var(--muted2);
}

/* ── Action Buttons ────────────────────────────────────────────────────────── */

.chat-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-btn, 8px);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  background: var(--bg2);
  border: 1px solid var(--o10);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--o08);
  border-color: var(--o18);
}

.takeover-btn {
  background: var(--accent-solid);
  color: #0B0C10;
  border-color: transparent;
  box-shadow: 0 0 14px rgba(201, 242, 78, 0.18);
}

.takeover-btn:hover {
  background: #d4f56e;
  box-shadow: 0 0 20px rgba(201, 242, 78, 0.3);
}

.end-chat-btn {
  background: rgba(220, 38, 38, 0.08);
  color: #f87171;
  border-color: rgba(220, 38, 38, 0.25);
}

.end-chat-btn:hover {
  background: rgba(220, 38, 38, 0.16);
  border-color: rgba(220, 38, 38, 0.4);
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */

.end-chat-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.end-chat-modal-content {
  background: var(--surface);
  border: 1px solid var(--o14);
  border-radius: var(--radius-card, 16px);
  padding: 20px 24px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.end-chat-modal-content h3 {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.end-chat-modal-content p {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

.end-chat-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.confirm-btn {
  padding: 7px 14px;
  border-radius: var(--radius-btn, 8px);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn {
  background: var(--bg2);
  border: 1px solid var(--o12);
  color: var(--text3);
}

.confirm-btn {
  background: var(--accent-solid);
  border: none;
  color: #0B0C10;
}
</style>
