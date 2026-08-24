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
import { computed } from 'vue'
import type { Conversation } from '@/types/chat'
import ConversationShopBadge from '@/components/conversations/ConversationShopBadge.vue'

// ── Props & Emits ──────────────────────────────────────────────────────────────

const props = defineProps<{
  conversations: Conversation[]
  loading: boolean
  selectedAccountId: string | null
}>()

const emit = defineEmits<{
  (e: 'open-conversation', sessionId: string): void
}>()

// ── Channel icons ──────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '🟢',
  email: '📧',
  telegram: '✈️',
  instagram: '📷',
  messenger: '💬',
  slack: '#',
  line: '🟩',
  web: '🌐',
  sms: '📱',
  api: '⚡',
}

function channelIcon(channel?: string | null): string {
  return channel ? (CHANNEL_ICONS[channel] ?? '💬') : '💬'
}

type ConversationWithAccountId = Conversation & { channel_account_id?: string | null }

const filtered = computed<ConversationWithAccountId[]>(() => {
  const list = props.conversations as ConversationWithAccountId[]
  if (!props.selectedAccountId) return list
  return list.filter((c) => c.channel_account_id === props.selectedAccountId)
})

const getConvStoreName = (conv: Conversation): string => {
  const meta = conv.customer.meta_data
  if (meta && typeof meta === 'object' && 'store_name' in meta) {
    return String(meta.store_name)
  }
  const idx = conv.session_id.charCodeAt(0) % 3
  return ['爆款女装旗舰店', '极客数码潮品店', '美妆护肤海外店'][idx]
}

// ── Time formatting ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function isUnread(c: Conversation): boolean {
  return c.status === 'open' && c.message_count > 0
}

function customerLabel(c: Conversation): string {
  return c.customer.full_name || c.customer.email || '未知用户'
}
</script>

<template>
  <div class="inbox-message-list-wrap" role="list" aria-label="收件箱消息列表">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div v-for="i in 6" :key="i" class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-body">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line narrow"></div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else-if="filtered.length === 0" class="empty-inbox-state">
      <div class="empty-icon-ring">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7"/><path d="M22 13a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5"/><polyline points="22 13 16 13 14 16 10 16 8 13 2 13"/></svg>
      </div>
      <p class="empty-title">收件箱暂无多渠道消息</p>
      <p class="empty-sub">当前筛选条件下没有待处理的会话记录</p>
    </div>

    <!-- Conversation rows -->
    <div v-else class="rows-container">
      <button
        v-for="conv in filtered"
        :key="conv.session_id"
        class="inbox-row"
        :class="{ unread: isUnread(conv) }"
        role="listitem"
        @click="emit('open-conversation', conv.session_id)"
      >
        <!-- Channel Icon Avatar -->
        <div class="channel-avatar" aria-hidden="true">
          <span class="channel-icon-emoji">{{ channelIcon(conv.channel) }}</span>
          <span v-if="isUnread(conv)" class="unread-glow-dot" aria-label="未读消息"></span>
        </div>

        <!-- Content Body -->
        <div class="inbox-row-content">
          <div class="row-top-line">
            <div class="customer-info-box">
              <span class="customer-name-text" :class="{ bold: isUnread(conv) }">
                {{ customerLabel(conv) }}
              </span>
              <ConversationShopBadge :storeName="getConvStoreName(conv)" size="xs" />
            </div>
            <span class="time-stamp">{{ formatTime(conv.updated_at) }}</span>
          </div>

          <div class="row-bottom-line">
            <span class="message-snippet" :class="{ bold: isUnread(conv) }">
              {{ conv.last_message || '（无消息内容）' }}
            </span>
            <div class="chips-group">
              <span v-if="conv.status === 'transferred'" class="status-pill transferred">待人工介入</span>
              <span v-else-if="conv.status === 'open'" class="status-pill open">进行中</span>
              <span v-else class="status-pill closed">已解决</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.inbox-message-list-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: var(--bg);
}

.rows-container {
  display: flex;
  flex-direction: column;
}

/* ── Skeleton ──────────────────────────────────────────────────────────────── */

.skeleton-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 14px 20px;
  border-bottom: 1px solid var(--o08);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--surface);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide { width: 55%; }
.skeleton-line.narrow { width: 35%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Empty State ───────────────────────────────────────────────────────────── */

.empty-inbox-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  padding: 40px;
  color: var(--muted);
  text-align: center;
}

.empty-icon-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--o10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted2);
  margin-bottom: 6px;
}

.empty-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.empty-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}

/* ── Message Rows ──────────────────────────────────────────────────────────── */

.inbox-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-bottom: 1px solid var(--o08);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.inbox-row:hover {
  background: var(--o05);
}

.inbox-row.unread {
  background: rgba(201, 242, 78, 0.04);
}

.inbox-row.unread:hover {
  background: rgba(201, 242, 78, 0.08);
}

/* ── Avatar ────────────────────────────────────────────────────────────────── */

.channel-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--o12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.channel-icon-emoji {
  font-size: 18px;
  line-height: 1;
}

.unread-glow-dot {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-solid);
  border: 2px solid var(--bg);
  box-shadow: 0 0 8px var(--accent-solid);
}

/* ── Row Content ───────────────────────────────────────────────────────────── */

.inbox-row-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-top-line,
.row-bottom-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.customer-info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.customer-name-text {
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.time-stamp {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted2);
  flex-shrink: 0;
  white-space: nowrap;
}

.message-snippet {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.bold {
  font-weight: 700;
  color: var(--text);
}

.chips-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-pill {
  font-size: 10.5px;
  font-weight: 600;
  padding: 1.5px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.status-pill.open {
  background: rgba(95, 227, 214, 0.1);
  color: #5FE3D6;
}

.status-pill.transferred {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.status-pill.closed {
  background: var(--o06);
  color: var(--muted2);
}
</style>
