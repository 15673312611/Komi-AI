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

Shared display metadata for ticket statuses / priorities / AI states.
Colors come from the design tokens so both themes work.
*/

import type { HypothesisStatus, TicketAiState, TicketPriority, TicketStatus } from '@/types/ticket'

export interface ChipMeta {
  label: string
  color: string
}

export const STATUS_META: Record<TicketStatus, ChipMeta> = {
  open: { label: '待处理', color: 'var(--c-info)' },
  triaging: { label: '待处理 · AI 分诊中', color: 'var(--c-info)' },
  investigating: { label: '待处理 · AI 调查中', color: 'var(--c-info)' },
  awaiting_approval: { label: '待人工审批', color: 'var(--c-warn)' },
  in_progress: { label: '处理中', color: 'var(--c-teal)' },
  resolved_pending_confirmation: { label: '已解决 · 待客户确认', color: 'var(--c-positive)' },
  resolved: { label: '已解决', color: 'var(--c-positive)' },
  closed: { label: '已关闭', color: 'var(--c-neutral)' },
  reopened: { label: '已重新开启', color: 'var(--c-coral)' },
}

export const PRIORITY_META: Record<TicketPriority, ChipMeta> = {
  urgent: { label: '紧急', color: 'var(--c-danger)' },
  high: { label: '高', color: 'var(--c-coral)' },
  medium: { label: '中', color: 'var(--c-warn)' },
  low: { label: '低', color: 'var(--c-neutral)' },
}

export const AI_STATE_META: Record<TicketAiState, ChipMeta & { pulse: boolean }> = {
  investigating: { label: 'AI 调查中', color: 'var(--c-info)', pulse: true },
  awaiting: { label: '等待人工接入', color: 'var(--c-warn)', pulse: false },
  human: { label: '人工处理中', color: 'var(--c-neutral)', pulse: false },
  resolved: { label: 'AI 已自主解决', color: 'var(--c-positive)', pulse: false },
}

// Human-selectable statuses for the detail dropdown, in lifecycle order.
// Triaging/investigating are AI-driven and not directly selectable.
export const SELECTABLE_STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'awaiting_approval',
  'resolved_pending_confirmation',
  'resolved',
  'closed',
  'reopened',
]

export const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

export function statusMeta(status: TicketStatus): ChipMeta {
  return STATUS_META[status] || { label: status, color: 'var(--c-neutral)' }
}

export function priorityMeta(priority: TicketPriority): ChipMeta {
  return PRIORITY_META[priority] || { label: priority, color: 'var(--c-neutral)' }
}

export function aiStateMeta(state?: TicketAiState | null) {
  return (state && AI_STATE_META[state]) || AI_STATE_META.human
}

export const HYPOTHESIS_STATUS_META: Record<HypothesisStatus, ChipMeta> = {
  pending: { label: '待验证', color: 'var(--c-neutral)' },
  testing: { label: '验证测试中', color: 'var(--c-info)' },
  validated: { label: '已证实成立', color: 'var(--c-positive)' },
  invalidated: { label: '已推翻排除', color: 'var(--c-danger)' },
  inconclusive: { label: '未得出定论', color: 'var(--c-warn)' },
}

export function hypothesisMeta(status: HypothesisStatus): ChipMeta {
  return HYPOTHESIS_STATUS_META[status] || { label: status, color: 'var(--c-neutral)' }
}

export function ticketInitials(name?: string | null): string {
  if (!name) return 'AI'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function formatSlaCountdown(slaDueAt?: string | null, resolvedAt?: string | null): ChipMeta {
  if (resolvedAt || !slaDueAt) return { label: '—', color: 'var(--faint)' }
  const remainingMs = new Date(slaDueAt).getTime() - Date.now()
  if (remainingMs <= 0) return { label: '已超时违约', color: 'var(--c-danger)' }
  const minutes = Math.floor(remainingMs / 60000)
  const label =
    minutes >= 60 * 24
      ? `${Math.floor(minutes / (60 * 24))}天 ${Math.floor((minutes % (60 * 24)) / 60)}小时`
      : minutes >= 60
        ? `${Math.floor(minutes / 60)}小时 ${minutes % 60}分钟`
        : `${minutes}分钟`
  const color =
    minutes < 10 ? 'var(--c-danger)' : minutes < 30 ? 'var(--c-warn)' : 'var(--muted2)'
  return { label, color }
}
