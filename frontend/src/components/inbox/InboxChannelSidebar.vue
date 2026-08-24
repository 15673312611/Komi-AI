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
import type { ChannelAccount, ChannelType } from '@/services/channels'

// ── Props & Emits ──────────────────────────────────────────────────────────────

const props = defineProps<{
  accounts: ChannelAccount[]
  selectedAccountId: string | null
  unreadCounts: Record<string, number>
}>()

const emit = defineEmits<{
  (e: 'select', accountId: string | null): void
}>()

// ── Channel meta ───────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  email: '邮件 (Email)',
  telegram: 'Telegram',
  instagram: 'Instagram',
  messenger: 'Messenger',
  slack: 'Slack',
  line: 'LINE',
  web: '网页在线',
  sms: '短信 SMS',
  api: 'API 对接',
}

const CHANNEL_ORDER: ChannelType[] = [
  'whatsapp',
  'email',
  'telegram',
  'instagram',
  'messenger',
  'slack',
  'line',
  'web',
  'sms',
  'api',
]

const CHANNEL_ICONS: Record<ChannelType, string> = {
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

// ── Derived data ───────────────────────────────────────────────────────────────

/** Total unread across all accounts */
const totalUnread = computed(() =>
  Object.values(props.unreadCounts).reduce((sum, n) => sum + n, 0),
)

/** Accounts grouped by channel_type, in display order */
const groupedAccounts = computed(() => {
  const map = new Map<ChannelType, ChannelAccount[]>()

  for (const account of props.accounts) {
    const type = account.channel_type
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push(account)
  }

  // Return only types that have at least one account, in preferred order
  return CHANNEL_ORDER.filter((t) => map.has(t)).map((type) => ({
    type,
    label: CHANNEL_LABELS[type] ?? type,
    icon: CHANNEL_ICONS[type] ?? '💬',
    accounts: map.get(type)!,
  }))
})

// ── Helpers ────────────────────────────────────────────────────────────────────

const unreadFor = (accountId: string): number => props.unreadCounts[accountId] ?? 0

const isAllSelected = computed(() => props.selectedAccountId === null)
</script>

<template>
  <nav class="channel-sidebar" aria-label="频道筛选">
    <div class="sidebar-inner">
      <!-- "全部" item -->
      <button
        class="nav-item all-item"
        :class="{ active: isAllSelected }"
        @click="emit('select', null)"
        aria-label="全部聚合频道"
      >
        <span class="item-icon-wrap">📥</span>
        <span class="item-label">全部多渠道消息</span>
        <span v-if="totalUnread > 0" class="unread-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
      </button>

      <!-- Channel groups -->
      <div v-for="group in groupedAccounts" :key="group.type" class="channel-group">
        <div class="group-header">
          <span class="group-icon">{{ group.icon }}</span>
          <span class="group-label">{{ group.label }}</span>
        </div>

        <button
          v-for="account in group.accounts"
          :key="account.id"
          class="nav-item account-item"
          :class="{ active: selectedAccountId === account.id }"
          @click="emit('select', account.id)"
          :aria-label="account.display_name || account.external_account_id"
        >
          <span class="account-dot" />
          <span class="item-label account-name">
            {{ account.display_name || account.external_account_id }}
          </span>
          <span v-if="unreadFor(account.id) > 0" class="unread-badge">
            {{ unreadFor(account.id) > 99 ? '99+' : unreadFor(account.id) }}
          </span>
        </button>
      </div>

      <!-- Empty state when no accounts connected -->
      <div v-if="groupedAccounts.length === 0" class="empty-hint">
        <span>暂未接入外部消息渠道</span>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.channel-sidebar {
  display: flex;
  flex-direction: column;
  width: 250px;
  min-width: 250px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg2);
  border-right: 1px solid var(--o08);
}

.sidebar-inner {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Nav items ─────────────────────────────────────────────────────────────── */

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text3);
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm, 8px);
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--o06);
  color: var(--text);
}

.nav-item.active {
  background: rgba(201, 242, 78, 0.1);
  border-color: rgba(201, 242, 78, 0.3);
  color: var(--accent-ink);
  font-weight: 600;
}

/* ── "全部" item ───────────────────────────────────────────────────────────── */

.all-item {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--o08);
}

.item-icon-wrap {
  font-size: 14px;
  line-height: 1;
}

.item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

/* ── Channel groups ─────────────────────────────────────────────────────────── */

.channel-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  margin-bottom: 2px;
}

.group-icon {
  font-size: 12px;
  line-height: 1;
}

.group-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-item {
  padding-left: 18px;
}

.account-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--muted2);
  transition: all 0.15s ease;
}

.account-item.active .account-dot {
  background: var(--accent-solid);
  box-shadow: 0 0 6px var(--accent-solid);
}

.account-name {
  color: inherit;
}

/* ── Unread badge ──────────────────────────────────────────────────────────── */

.unread-badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent-solid);
  color: #0B0C10;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  margin-left: auto;
}

/* ── Empty hint ────────────────────────────────────────────────────────────── */

.empty-hint {
  padding: 20px 10px;
  font-size: 12px;
  color: var(--muted2);
  text-align: center;
}
</style>
