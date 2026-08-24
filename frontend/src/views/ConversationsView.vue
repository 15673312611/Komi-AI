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
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ConversationsList from '@/components/conversations/ConversationsList.vue'
import ConversationFilters from '@/components/conversations/ConversationFilters.vue'
import ChatInfoPanel from '@/components/conversations/ChatInfoPanel.vue'
import type { Conversation, ChatDetail } from '@/types/chat'
import { chatService } from '@/services/chat'
import { agentService } from '@/services/agent'
import { listTeammates, type Teammate } from '@/services/users'
import channelsService, { type ChannelAccount } from '@/services/channels'
import NewWhatsAppConversation from '@/components/conversations/NewWhatsAppConversation.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const route = useRoute()
const router = useRouter()
const { isMobile } = useBreakpoint()
// Deep-link target session (e.g. from analytics "Sessions Needing Attention")
const initialSessionId = ref<string | null>(
  typeof route.query.session === 'string' ? route.query.session : null
)

// On mobile the ?session= query drives which pane is visible (list vs chat) so
// the hardware back button walks chat → list. It's also kept reactive for push
// deep-links into an already-open app.
watch(
  () => route.query.session,
  (session) => {
    if (typeof session === 'string' && session) {
      initialSessionId.value = session
    } else {
      initialSessionId.value = null
      if (isMobile.value) {
        conversationsListRef.value?.clearSelectedChat()
      }
    }
  }
)

// Mobile pane state (list vs full-screen chat vs full-screen info)
const mobileChatOpen = computed(() => isMobile.value && !!route.query.session)
const mobileInfoOpen = computed(() => mobileChatOpen.value && route.query.info === '1')

// Open a session: on mobile through the URL (history-backed), on desktop locally
const openSession = (sessionId: string) => {
  if (isMobile.value) {
    router.push({ query: { ...route.query, session: sessionId } })
  } else {
    initialSessionId.value = sessionId
  }
}

const conversations = ref<Conversation[]>([])
const loading = ref(true)
const error = ref('')

// Outbound exists only when it can work: at least one active WhatsApp number.
// (The server additionally requires an agent routed to it.)
const whatsappAccounts = ref<ChannelAccount[]>([])
const showNewConversation = ref(false)

const loadWhatsAppAccounts = async () => {
  whatsappAccounts.value = await channelsService.listActiveWhatsAppAccounts()
}

const onConversationStarted = (sessionId: string) => {
  showNewConversation.value = false
  openSession(sessionId)
  loadConversations(1)
}
// Select the matching tab when deep-linking (closed sessions live under the "Closed" tab)
const statusFilter = ref<'open' | 'closed'>(
  route.query.status === 'closed' ? 'closed' : 'open'
)
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const totalCount = ref<number | null>(null)

// Filter states
const filterValues = ref({
  customerEmailFilter: '',
  dateFromFilter: '',
  dateToFilter: '',
  agentFilter: '',
  userFilter: ''
})
const showFilters = ref(false)
const users = ref<Teammate[]>([])
const loadingUsers = ref(false)
const agents = ref<Array<{id: string, name: string, display_name: string | null}>>([])
const loadingAgents = ref(false)

// Chat info states
const selectedChatInfo = ref<ChatDetail | null>(null)
const showChatInfo = ref(false)

// Ref for ConversationsList component
const conversationsListRef = ref<InstanceType<typeof ConversationsList> | null>(null)

// Computed property to show how many conversations are loaded
const loadedCount = computed(() => conversations.value?.length || 0)
const totalItems = computed(() => totalCount.value || loadedCount.value)

const loadConversations = async (page = 1, loadMore = false) => {
  error.value = ''
  
  if (page === 1 || !loadMore) {
    loading.value = true
  }
  
  const skip = (page - 1) * pageSize.value
  
  let newConversations: Conversation[] = []
  
  try {
    const params: any = {
      skip,
      limit: pageSize.value,
      status: statusFilter.value === 'open' ? 'open,transferred' : statusFilter.value
    }
    
    // Add filters if they have values
    if (filterValues.value.customerEmailFilter.trim()) {
      params.customer_email = filterValues.value.customerEmailFilter.trim()
    }
    if (filterValues.value.agentFilter.trim()) {
      params.agent_id = filterValues.value.agentFilter.trim()
    }
    if (filterValues.value.userFilter.trim()) {
      params.user_id = filterValues.value.userFilter.trim()
    }
    if (filterValues.value.dateFromFilter) {
      params.date_from = new Date(filterValues.value.dateFromFilter).toISOString()
    }
    if (filterValues.value.dateToFilter) {
      params.date_to = new Date(filterValues.value.dateToFilter).toISOString()
    }
    
    newConversations = await chatService.getRecentChats(params)
    
    // If we're loading more, append to existing conversations
    if (loadMore && page > 1) {
      conversations.value = [...(conversations.value || []), ...newConversations]
    } else {
      conversations.value = newConversations
    }
    
    // Check if there might be more conversations to load
    hasMore.value = newConversations?.length === pageSize.value
    currentPage.value = page
    
    // If we received fewer items than the page size, we can calculate the total
    if (newConversations?.length < pageSize.value) {
      totalCount.value = skip + (newConversations?.length || 0)
    }
    
  } catch (err) {
    error.value = 'Failed to load conversations'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadMoreConversations = () => {
  if (!loading.value && hasMore.value) {
    loadConversations(currentPage.value + 1, true)
  }
}

const updateFilter = (status: 'open' | 'closed') => {
  statusFilter.value = status
  currentPage.value = 1
  hasMore.value = true
  totalCount.value = null
  loadConversations(1)
}

// Filter handlers
const handleApplyFilters = () => {
  currentPage.value = 1
  hasMore.value = true
  totalCount.value = null
  loadConversations(1)
  showFilters.value = false
}

const handleClearFilters = () => {
  filterValues.value = {
    customerEmailFilter: '',
    dateFromFilter: '',
    dateToFilter: '',
    agentFilter: '',
    userFilter: ''
  }
  handleApplyFilters()
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const loadUsers = async () => {
  if (loadingUsers.value) return

  loadingUsers.value = true
  try {
    users.value = await listTeammates()
  } catch (error) {
    console.error('Failed to load teammates:', error)
  } finally {
    loadingUsers.value = false
  }
}

const loadAgents = async () => {
  if (loadingAgents.value) return
  
  loadingAgents.value = true
  try {
    agents.value = await agentService.getAgentRoster()
  } catch (error) {
    console.error('Failed to load agents:', error)
  } finally {
    loadingAgents.value = false
  }
}

onMounted(() => {
  loadWhatsAppAccounts()
  loadConversations(1)
  loadUsers()
  loadAgents()
})

const handleChatUpdated = (chatDetail: ChatDetail) => {
  const index = conversations.value.findIndex(c => c.session_id === chatDetail.session_id)
  if (index !== -1) {
    const updatedConversation: Conversation = {
      ...conversations.value[index],
      last_message: chatDetail.messages[chatDetail.messages.length - 1]?.message || '',
      updated_at: chatDetail.updated_at,
      message_count: chatDetail.messages.length,
      status: chatDetail.status,
      user_id: chatDetail.user_id,
      user_name: chatDetail.user_name,
      group_id: chatDetail.group_id
    }
    
    const updatedConversations = [...conversations.value]
    updatedConversations[index] = updatedConversation
    conversations.value = updatedConversations
  }
  
  if (selectedChatInfo.value && selectedChatInfo.value.session_id === chatDetail.session_id) {
    selectedChatInfo.value = chatDetail
  }
  
  if (conversationsListRef.value) {
    conversationsListRef.value.updateSelectedChat(chatDetail)
  }
}

const handleChatSelected = (chatDetail: ChatDetail) => {
  selectedChatInfo.value = chatDetail
  if (!showChatInfo.value) {
    showChatInfo.value = true
  }
}

const closeChatInfo = () => {
  if (mobileInfoOpen.value) {
    router.back()
    return
  }
  showChatInfo.value = false
}

const toggleChatInfo = () => {
  if (!selectedChatInfo.value) return
  if (isMobile.value) {
    openMobileInfo()
  } else {
    showChatInfo.value = !showChatInfo.value
  }
}

const openMobileInfo = () => {
  if (selectedChatInfo.value && !mobileInfoOpen.value) {
    router.push({ query: { ...route.query, info: '1' } })
  }
}

const handleChatBack = () => {
  const previous = window.history.state?.back
  if (typeof previous === 'string' && previous.startsWith('/conversations') && !previous.includes('session=')) {
    router.back()
  } else {
    router.replace({ query: { ...route.query, session: undefined, info: undefined } })
  }
}

const handleChatClosed = (_sessionId?: string) => {
  showChatInfo.value = false
  selectedChatInfo.value = null
  if (conversationsListRef.value) {
    conversationsListRef.value.clearSelectedChat()
  }
  if (mobileChatOpen.value) {
    router.replace({ query: { ...route.query, session: undefined, info: undefined } })
  }
}
</script>

<template>
  <DashboardLayout :hideHeader="true">
    <div class="conversations-page" :class="{ 'mobile-chat-open': mobileChatOpen }">
      <header class="page-header">
        <div class="header-content">
          <h1>会话中心</h1>
          <div class="header-actions">
            <button
              v-if="whatsappAccounts.length"
              class="new-conversation-btn"
              @click="showNewConversation = true"
            >
              <font-awesome-icon :icon="['fab', 'whatsapp']" />
              新建对话
            </button>
            <ConversationFilters
              :showFilters="showFilters"
              :filterValues="filterValues"
              :users="users"
              :agents="agents"
              :loadingUsers="loadingUsers"
              :loadingAgents="loadingAgents"
              @toggle="toggleFilters"
              @apply="handleApplyFilters"
              @clear="handleClearFilters"
              @update:filterValues="filterValues = $event"
            />
            
            <button 
              @click="toggleChatInfo" 
              class="info-toggle-btn"
              :class="{ active: showChatInfo }"
              aria-label="Toggle chat information"
              :disabled="!selectedChatInfo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <NewWhatsAppConversation
        v-if="showNewConversation"
        :accounts="whatsappAccounts"
        @close="showNewConversation = false"
        @started="onConversationStarted"
      />

      <div class="main-content">
        <ConversationsList
          ref="conversationsListRef"
          :conversations="conversations"
          :loading="loading"
          :error="error"
          :status-filter="statusFilter"
          :has-more="hasMore"
          :loading-more="loading && currentPage > 1"
          :loaded-count="loadedCount"
          :total-count="totalItems"
          :show-chat-info="showChatInfo && !!selectedChatInfo"
          :initial-session-id="initialSessionId"
          :mobile-pane="mobileChatOpen ? 'chat' : 'list'"
          @refresh="loadConversations(1)"
          @update-filter="updateFilter"
          @load-more="loadMoreConversations"
          @chat-updated="handleChatUpdated"
          @chat-selected="handleChatSelected"
          @select="openSession"
          @back="handleChatBack"
          @info="openMobileInfo"
          @clear-unread="() => {}"
        />

        <ChatInfoPanel
          v-if="isMobile ? mobileInfoOpen : showChatInfo"
          :class="{ 'mobile-fullscreen': mobileInfoOpen }"
          :chatInfo="selectedChatInfo"
          :users="users"
          @close="closeChatInfo"
          @refresh="loadConversations(1)"
          @chatUpdated="handleChatUpdated"
          @chatClosed="handleChatClosed"
          @switchSession="openSession"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.conversations-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  grid-template-rows: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  position: relative;
  background: var(--bg);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content:not(:has(.chat-info-sidebar)) {
  grid-template-columns: 1fr;
}

.page-header {
  padding: calc(12px + var(--safe-top)) 24px 12px;
  border-bottom: 1px solid var(--o08);
  background: var(--bg2);
  backdrop-filter: blur(20px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-content h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.new-conversation-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: var(--radius-btn, 8px);
  border: none;
  background: #25D366;
  color: #0B0C10;
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(37, 211, 102, 0.2);
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.new-conversation-btn:hover {
  background: #2ee070;
  transform: translateY(-0.5px);
  box-shadow: 0 0 18px rgba(37, 211, 102, 0.35);
}

.new-conversation-btn:active {
  transform: translateY(0);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 7px);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-toggle-btn:hover {
  background: var(--o08);
  color: var(--text);
  border-color: var(--o18);
  transform: translateY(-0.5px);
}

.info-toggle-btn.active {
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink);
  border-color: rgba(201, 242, 78, 0.35);
}

.info-toggle-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.info-toggle-btn:disabled:hover {
  background: var(--surface);
  color: var(--muted);
  border-color: var(--o10);
  transform: none;
}

/* Responsive design */
@media (max-width: 900px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .header-actions {
    align-self: flex-end;
  }

  .main-content {
    grid-template-columns: 1fr !important;
  }

  .conversations-page.mobile-chat-open .page-header {
    display: none;
  }

  .info-toggle-btn {
    display: none;
  }
}
</style>
