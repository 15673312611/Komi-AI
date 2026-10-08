<!--
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
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import InboxChannelSidebar from '@/components/inbox/InboxChannelSidebar.vue'
import InboxMessageList from '@/components/inbox/InboxMessageList.vue'
import channelsService, { type ChannelAccount } from '@/services/channels'
import { chatService } from '@/services/chat'
import type { Conversation } from '@/types/chat'

// ── Router ─────────────────────────────────────────────────────────────────────

const router = useRouter()

// ── State ──────────────────────────────────────────────────────────────────────

const accounts = ref<ChannelAccount[]>([])
const conversations = ref<Conversation[]>([])
const loading = ref(true)
const selectedAccountId = ref<string | null>(null)
const selectedStore = ref<string>('all')
const searchQuery = ref('')
const showUnreadOnly = ref(false)

const STORE_OPTIONS = [
  { id: 'all', label: '全部店铺 (All Stores)' },
  { id: '爆款女装旗舰店', label: '🏪 爆款女装旗舰店' },
  { id: '极客数码潮品店', label: '🏪 极客数码潮品店' },
  { id: '美妆护肤海外店', label: '🏪 美妆护肤海外店' },
]

const getConvStoreName = (conv: Conversation): string => {
  const meta = conv.customer.meta_data
  if (meta && typeof meta === 'object' && 'store_name' in meta) {
    return String(meta.store_name)
  }
  const idx = conv.session_id.charCodeAt(0) % 3
  return ['爆款女装旗舰店', '极客数码潮品店', '美妆护肤海外店'][idx]
}

// ── Data loading ───────────────────────────────────────────────────────────────

async function loadData() {
  loading.value = true
  try {
    const [fetchedAccounts, fetchedConvs] = await Promise.all([
      channelsService.listAccounts(),
      chatService.getRecentChats({ status: 'open,transferred', limit: 100 }),
    ])
    accounts.value = fetchedAccounts
    conversations.value = fetchedConvs
  } catch (err) {
    console.error('[InboxView] Failed to load inbox data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// ── Unread counts ──────────────────────────────────────────────────────

type ConversationWithAccountId = Conversation & { channel_account_id?: string | null }

const unreadCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const conv of conversations.value as ConversationWithAccountId[]) {
    if (conv.status !== 'open' || !conv.message_count) continue
    const accountId = conv.channel_account_id
    if (accountId) {
      counts[accountId] = (counts[accountId] ?? 0) + 1
    }
  }
  return counts
})

// ── Filtered conversations ─────────────────────────────────────────────────────

const filteredConversations = computed<Conversation[]>(() => {
  let list = conversations.value

  // Store filter
  if (selectedStore.value !== 'all') {
    list = list.filter((c) => getConvStoreName(c) === selectedStore.value)
  }

  // Unread-only filter
  if (showUnreadOnly.value) {
    list = list.filter((c) => c.status === 'open')
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) => {
      const name = (c.customer.full_name ?? '').toLowerCase()
      const email = (c.customer.email ?? '').toLowerCase()
      const msg = (c.last_message ?? '').toLowerCase()
      return name.includes(q) || email.includes(q) || msg.includes(q)
    })
  }

  return list
})

// ── Navigation ─────────────────────────────────────────────────────────────────

function openConversation(sessionId: string) {
  router.push({ path: '/conversations', query: { session: sessionId } })
}
</script>

<template>
  <DashboardLayout :hideHeader="true">
    <div class="inbox-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-title-wrap">
            <div class="title-with-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7"/><path d="M22 13a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5"/><polyline points="22 13 16 13 14 16 10 16 8 13 2 13"/></svg>
              <h1>收件箱</h1>
            </div>
            <span class="header-badge">{{ filteredConversations.length }} 条消息</span>
          </div>

          <div class="header-actions">
            <!-- Store Selector -->
            <div class="store-select-wrapper">
              <svg class="store-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
              <select v-model="selectedStore" class="store-select" aria-label="筛选店铺">
                <option v-for="opt in STORE_OPTIONS" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
              <svg class="chevron-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <!-- Search input -->
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                v-model="searchQuery"
                type="search"
                placeholder="搜索消息内容或客户..."
                class="search-input"
                aria-label="搜索收件箱"
              />
            </div>

            <!-- Unread toggle -->
            <button
              class="filter-btn"
              :class="{ active: showUnreadOnly }"
              @click="showUnreadOnly = !showUnreadOnly"
            >
              {{ showUnreadOnly ? '显示全部' : '仅看未读' }}
            </button>

            <!-- Refresh button -->
            <button class="refresh-btn" @click="loadData" aria-label="刷新">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main two-column layout -->
      <div class="main-content">
        <InboxChannelSidebar
          class="sidebar"
          :accounts="accounts"
          :selectedAccountId="selectedAccountId"
          :unreadCounts="unreadCounts"
          @select="selectedAccountId = $event"
        />

        <InboxMessageList
          class="list-pane"
          :conversations="filteredConversations"
          :loading="loading"
          :selectedAccountId="selectedAccountId"
          @open-conversation="openConversation"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────────────────── */

.inbox-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Header ────────────────────────────────────────────────────────────────── */

.page-header {
  padding: calc(12px + var(--safe-top)) 24px 12px;
  border-bottom: 1px solid var(--o08);
  background: var(--bg2);
  backdrop-filter: blur(20px);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.header-content h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.header-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-pill, 999px);
  background: var(--surface);
  border: 1px solid var(--o10);
  color: var(--muted);
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* ── Store Selector ────────────────────────────────────────────────────────── */

.store-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.store-svg {
  position: absolute;
  left: 10px;
  color: var(--muted);
  pointer-events: none;
}

.chevron-svg {
  position: absolute;
  right: 10px;
  color: var(--muted);
  pointer-events: none;
}

.store-select {
  height: 34px;
  padding: 0 26px 0 28px;
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 7px);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.15s ease;
}

.store-select:hover {
  border-color: var(--o16);
  background: var(--o06);
}

.store-select:focus {
  border-color: var(--accent-solid);
}

/* ── Search input ──────────────────────────────────────────────────────────── */

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--muted);
  pointer-events: none;
}

.search-input {
  height: 34px;
  padding: 0 12px 0 30px;
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 7px);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 12.5px;
  outline: none;
  transition: all 0.15s ease;
  min-width: 200px;
}

.search-input::placeholder {
  color: var(--faint);
}

.search-input:hover {
  border-color: var(--o16);
}

.search-input:focus {
  border-color: var(--accent-solid);
  box-shadow: 0 0 0 2px var(--accent-bg-12);
}

/* ── Filter / refresh buttons ──────────────────────────────────────────────── */

.filter-btn,
.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 13px;
  border: 1px solid var(--o10);
  border-radius: var(--radius-sm, 7px);
  background: var(--surface);
  color: var(--text3);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn:hover,
.refresh-btn:hover {
  background: var(--o08);
  color: var(--text);
  border-color: var(--o18);
  transform: translateY(-0.5px);
}

.filter-btn.active {
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink);
  border-color: rgba(201, 242, 78, 0.3);
  font-weight: 600;
}

.refresh-btn {
  padding: 0 10px;
  color: var(--muted);
}

/* ── Main content area ─────────────────────────────────────────────────────── */

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
}

.sidebar {
  flex-shrink: 0;
}

.list-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ── Mobile ────────────────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .header-actions {
    align-self: stretch;
    flex-wrap: wrap;
  }

  .sidebar {
    display: none;
  }

  .search-input {
    min-width: 140px;
    flex: 1;
  }
}
</style>
