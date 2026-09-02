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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useTicketsWorkspace } from '@/composables/useTicketsWorkspace'
import { formatSlaCountdown, ticketInitials } from '@/components/tickets/ticketMeta'
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge.vue'
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge.vue'
import TicketAiStateChip from '@/components/tickets/TicketAiStateChip.vue'
import TicketFilterBar from '@/components/tickets/TicketFilterBar.vue'
import TicketEmptyState from '@/components/tickets/TicketEmptyState.vue'
import TicketCreateModal from '@/components/tickets/TicketCreateModal.vue'
import { permissionChecks } from '@/utils/permissions'
import type { TicketListFilters } from '@/types/ticket'

const router = useRouter()
const {
  tickets, stats, pagination, page, filters, phase,
  error, planGated, hasActiveFilters, refresh, clearFilters,
} = useTicketsWorkspace()

const showCreateModal = ref(false)
const canManage = permissionChecks.canManageTickets()

// "AI 4.6 · human 4.2" when both sides have responses — the split is the point
// of the chip now that L3 auto-resolve is live.
const csatSub = computed(() => {
  const s = stats.value
  if (!s) return ''
  const window = `近 ${s.csat_window_days} 天`
  if (!s.csat_responses) return window
  const parts: string[] = []
  if (s.csat_ai_avg != null) parts.push(`AI ${s.csat_ai_avg.toFixed(1)}`)
  if (s.csat_human_avg != null) parts.push(`人工 ${s.csat_human_avg.toFixed(1)}`)
  return parts.length ? parts.join(' · ') : `${s.csat_responses} 条评价 · ${window}`
})

const csatColor = computed(() => {
  const avg = stats.value?.csat_avg
  if (avg == null) return 'var(--c-info)'
  return avg >= 4 ? 'var(--c-positive)' : avg >= 3 ? 'var(--c-warn)' : 'var(--c-danger)'
})

const statChips = computed(() => [
  { label: '待处理工单', value: stats.value?.open ?? '—', color: 'var(--c-info)', alert: false },
  { label: '待审批动作', value: stats.value?.awaiting_approval ?? '—', color: 'var(--c-warn)', alert: false },
  {
    label: '即将/已超时 (SLA)',
    value: stats.value?.sla_breaching ?? '—',
    color: 'var(--c-danger)',
    alert: (stats.value?.sla_breaching ?? 0) > 0,
  },
  {
    label: 'AI 自主解决率',
    value: stats.value?.ai_resolved_pct_7d != null ? `${stats.value.ai_resolved_pct_7d}%` : '—',
    color: 'var(--c-positive)',
    alert: false,
    sub: '近 7 天',
  },
  {
    label: '客户满意度 (CSAT)',
    value: stats.value?.csat_avg != null ? `${stats.value.csat_avg.toFixed(1)}/5` : '—',
    color: csatColor.value,
    alert: false,
    sub: csatSub.value,
  },
])

const timeAgo = (iso?: string | null) => {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : formatDistanceToNow(date, { addSuffix: false })
}

function openTicket(id: string) {
  router.push(`/tickets/${id}`)
}

function updateFilters(next: TicketListFilters) {
  Object.assign(filters, next)
}
</script>

<template>
  <DashboardLayout>
  <div class="tickets-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">工单与 AI 调查管理</h1>
        <p class="page-subtitle">
          AI 智能体全流程协同调查 — 自动生成假设、溯源业务数据库并提供完整证据链。
        </p>
      </div>
      <button v-if="canManage" class="new-ticket-btn" @click="showCreateModal = true">
        <span class="plus">+</span> 新建工单
      </button>
    </div>

    <div v-if="planGated" class="plan-gate">
      {{ error }}
    </div>

    <template v-else>
      <div class="stat-grid">
        <div v-for="chip in statChips" :key="chip.label" class="stat-card">
          <div class="stat-label">
            <span class="stat-dot" :style="{ background: chip.color }"></span>
            {{ chip.label }}
          </div>
          <div class="stat-value" :style="chip.alert ? { color: chip.color } : {}">
            {{ chip.value }}
            <span v-if="chip.sub" class="stat-sub">{{ chip.sub }}</span>
          </div>
        </div>
      </div>

      <TicketFilterBar :filters="filters" @update:filters="updateFilters" />

      <div class="ticket-table">
        <div class="table-scroll">
          <div class="table-head">
            <span>工单编号</span><span>主题</span><span>状态</span><span>优先级</span>
            <span>AI 状态</span><span>处理人 / SLA</span><span class="right">最近更新</span>
          </div>

          <div v-if="phase === 'loading'" class="table-loading">正在加载工单列表…</div>

          <template v-else-if="phase === 'populated'">
            <div
              v-for="ticket in tickets"
              :key="ticket.id"
              class="table-row"
              @click="openTicket(ticket.id)"
            >
              <span class="ticket-number">{{ ticket.display_number }}</span>
              <div class="title-cell">
                <div class="ticket-title">{{ ticket.title }}</div>
                <div v-if="ticket.tags?.length" class="ticket-tags">
                  {{ ticket.tags.join(' · ') }}
                </div>
              </div>
              <span><TicketStatusBadge :status="ticket.status" /></span>
              <span><TicketPriorityBadge :priority="ticket.priority" /></span>
              <span><TicketAiStateChip :state="ticket.ai_state" /></span>
              <div class="assignee-cell">
                <span
                  class="avatar"
                  :class="{ 'avatar-ai': !ticket.assignee_name }"
                  :title="ticket.assignee_name || 'AI 智能体'"
                >
                  {{ ticketInitials(ticket.assignee_name) }}
                </span>
                <span
                  class="sla"
                  :style="{ color: formatSlaCountdown(ticket.sla_due_at, ticket.resolved_at).color }"
                >
                  {{ formatSlaCountdown(ticket.sla_due_at, ticket.resolved_at).label }}
                </span>
              </div>
              <span class="updated">{{ timeAgo(ticket.updated_at) }}</span>
            </div>
          </template>

          <TicketEmptyState
            v-else
            :filtered="hasActiveFilters"
            @clear="clearFilters"
            @create="showCreateModal = true"
          />
        </div>

        <div v-if="pagination && pagination.total_pages > 1" class="pager">
          <button class="pager-btn" :disabled="page <= 1" @click="page--">← 上一页</button>
          <span class="pager-info">第 {{ pagination.page }} 页 / 共 {{ pagination.total_pages }} 页</span>
          <button class="pager-btn" :disabled="page >= pagination.total_pages" @click="page++">
            下一页 →
          </button>
        </div>
      </div>
    </template>

    <TicketCreateModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="refresh()"
    />
  </div>
  </DashboardLayout>
</template>

<style scoped>
.tickets-view {
  padding: 24px 32px 60px;
  max-width: 1320px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}
.page-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
  color: var(--text);
}
.page-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: var(--muted);
}
.new-ticket-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 15px;
  background: #0F172A;
  color: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.9);
  border-radius: var(--radius-btn);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}
.new-ticket-btn:hover {
  background: #000000;
  transform: translateY(-0.5px);
}
.plus {
  font-size: 15px;
  line-height: 0;
}
.plan-gate {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: 14px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.stat-label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
}
.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.stat-value {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.stat-sub {
  font-size: 11.5px;
  font-family: var(--font-sans);
  font-weight: 400;
  color: var(--muted2);
}
.ticket-table {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: #FFFFFF;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.table-scroll {
  overflow-x: auto;
}
.table-head,
.table-row {
  display: grid;
  grid-template-columns: 98px minmax(200px, 1fr) 150px 96px 158px 132px 92px;
  gap: 14px;
  align-items: center;
  padding: 11px 20px;
  min-width: 900px;
}
.table-head {
  border-bottom: 1px solid var(--border-color);
  background: #F8FAFC;
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--muted);
}
.table-row {
  padding: 13px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: background 0.15s ease;
}
.table-row:hover {
  background: #F8FAFC;
}
.table-row:last-child {
  border-bottom: none;
}
.table-loading {
  padding: 46px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}
.ticket-number {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}
.title-cell {
  min-width: 0;
}
.ticket-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ticket-tags {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--muted2);
  margin-top: 2px;
}
.assignee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6366F1;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}
.avatar-ai {
  background: #0F172A;
  color: #FFFFFF;
  border-radius: 6px;
}
.sla {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
}
.updated {
  text-align: right;
  font-size: 11.5px;
  color: var(--muted2);
}
.right {
  text-align: right;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 12px;
  border-top: 1px solid var(--border-color);
}
.pager-btn {
  padding: 5px 12px;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  color: var(--text);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.pager-btn:hover:not(:disabled) {
  background: #F8FAFC;
  border-color: var(--border-color-hover);
}
.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pager-info {
  font-size: 12px;
  color: var(--muted);
}
@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>