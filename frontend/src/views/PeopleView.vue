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
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { peopleService } from '@/services/people'
import type { PersonListItem, PeopleStats } from '@/types/people'
import PersonDetailDrawer from '@/components/people/PersonDetailDrawer.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'
import { subscriptionStorage } from '@/utils/storage'
import { getInitials } from '@/utils/text'

const { hasEnterpriseModule } = useEnterpriseFeatures()

// People / Lead Management is a Pro-plan feature. Locked where the enterprise
// module is present and the plan doesn't include 'lead_capture' (Free/Base).
const isPeopleLocked = computed(() =>
  hasEnterpriseModule &&
  (!subscriptionStorage.hasFeature('lead_capture') || !subscriptionStorage.isSubscriptionActive())
)
function goToUpgrade() {
  window.location.href = '/settings/subscription'
}

const stats = ref<PeopleStats | null>(null)
const items = ref<PersonListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const stage = ref<'all' | 'visitor' | 'lead' | 'customer'>('all')
// The identity split: the directory shows identified people; anonymous
// browser sessions are a funnel count behind their own tab.
const view = ref<'identified' | 'anonymous'>('identified')
const search = ref('')
const selectedId = ref<string | null>(null)

// One definition per column: `label` heads the desktop table, `short` labels
// the same value inside the mobile card (which has no table header to name it).
const COLUMNS = {
  person: { label: '客户/访客', short: '访客' },
  stage: { label: '生命周期阶段', short: '阶段' },
  source: { label: '来源渠道', short: '来源' },
  captured: { label: '留资时间', short: '留资' },
  activity: { label: '最近活跃', short: '活跃' },
  sync: { label: 'CRM 同步', short: '同步' },
} as const

const STAGES = [
  { value: 'all', label: '全部' },
  { value: 'visitor', label: '访客' },
  { value: 'lead', label: '销售线索' },
  { value: 'customer', label: '成交客户' },
] as const

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

async function loadStats() {
  try { stats.value = await peopleService.getStats() } catch { /* non-blocking */ }
}

async function loadList() {
  loading.value = true
  try {
    const res = await peopleService.listPeople({
      stage: stage.value, search: search.value || undefined, page: page.value,
      page_size: pageSize, view: view.value,
    })
    items.value = res.items
    total.value = res.total
  } catch {
    toast.error('获取客户线索列表失败')
  } finally {
    loading.value = false
  }
}

function setStage(s: typeof stage.value) { stage.value = s; view.value = 'identified'; page.value = 1; loadList() }
function showAnonymous() { view.value = 'anonymous'; stage.value = 'all'; page.value = 1; loadList() }
function nextPage() { if (page.value < totalPages.value) { page.value++; loadList() } }
function prevPage() { if (page.value > 1) { page.value--; loadList() } }

let searchTimer: any = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; loadList() }, 350)
})

function initials(p: PersonListItem): string {
  // Anonymous visitors get the dashed empty avatar, not letters
  if (p.is_anonymous || !p.name) return ''
  return getInitials(p.name, '')
}
function stageLabel(s: string) {
  const map: Record<string, string> = {
    visitor: '访客',
    lead: '销售线索',
    customer: '成交客户',
    all: '全部'
  }
  return map[s] || s
}
function fmtDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) } catch { return '—' }
}
function sourceLabel(p: PersonListItem) {
  const s = p.source || {}
  if (s.page_url) {
    // Show a compact host+path; the full URL is in the tooltip.
    try {
      const u = new URL(s.page_url)
      const path = u.pathname === '/' ? '' : u.pathname
      return `${u.host}${path}`
    } catch { return s.page_url }
  }
  return s.channel || '—'
}
function sourceTitle(p: PersonListItem): string {
  return p.source?.page_url || ''
}
// Short stable visitor id (first 8 chars of the customer UUID) — lets you match a
// person to widget sessions/devices even before they share an email.
function shortId(p: PersonListItem): string {
  return `#${String(p.id).slice(0, 8)}`
}

function onPersonUpdated(updatedStage?: string) {
  // A person changed (e.g. marked customer) — refresh list + stats.
  loadList(); loadStats()
}

onMounted(() => {
  if (isPeopleLocked.value) return  // don't hit the API on a non-Pro plan
  loadStats(); loadList()
})
</script>

<template>
  <DashboardLayout>
  <!-- Locked screen (Pro feature, enterprise builds on a non-Pro plan) -->
  <div v-if="isPeopleLocked" class="pv-locked">
    <div class="pv-locked-card">
      <div class="pv-locked-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2"/>
          <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
        </svg>
      </div>
      <div class="pv-locked-badge">专业版高级功能</div>
      <h2 class="pv-locked-title">客户画像与线索留资管理</h2>
      <p class="pv-locked-desc">
        聚合所有由智能体和人工客服接待捕获的访客、销售线索与签约客户 — 自动去重合并为统一客户档案，沉淀 AI 意向识别小结、生命周期阶段及留资画像信息。
      </p>
      <ul class="pv-locked-feats">
        <li>全企业统一客户库，支持多生命周期阶段筛选与搜索</li>
        <li>AI 意向度智能打分评级与结构化画像字段自动归集</li>
        <li>自动推进 访客 → 销售线索 → 成交客户 的全生命周期</li>
      </ul>
      <button class="pv-locked-btn" @click="goToUpgrade">立即升级专业版</button>
    </div>
  </div>

  <div v-else class="people-view">
    <div class="pv-header">
      <div>
        <h1 class="pv-title">客户档案与线索管理 (CRM)</h1>
        <p class="pv-sub">智能体与客服接待捕获的客户线索库，跨渠道自动归集去重生成统一画像档案。</p>
      </div>
    </div>

    <!-- KPI strip -->
    <div class="pv-kpis" v-if="stats">
      <div class="pv-kpi"><div class="pv-kpi-label">客户线索总数</div><div class="pv-kpi-value">{{ stats.total_people }}</div></div>
      <div class="pv-kpi"><div class="pv-kpi-label">近 7 天新增线索</div><div class="pv-kpi-value accent">{{ stats.new_leads_7d }}</div></div>
      <div class="pv-kpi"><div class="pv-kpi-label">正式成交客户</div><div class="pv-kpi-value">{{ stats.customers }}</div></div>
      <div class="pv-kpi"><div class="pv-kpi-label">已同步至 CRM</div><div class="pv-kpi-value muted">{{ stats.synced_to_crm }}</div></div>
    </div>

    <!-- toolbar -->
    <div class="pv-toolbar">
      <div class="pv-tabs">
        <button v-for="s in STAGES" :key="s.value" class="pv-tab" :class="{ on: view === 'identified' && stage === s.value }" @click="setStage(s.value)">{{ s.label }}</button>
        <!-- Anonymous sessions are a lead-capture funnel signal, not directory
             content — an explicit tab, never the default view. -->
        <button class="pv-tab pv-tab-anon" :class="{ on: view === 'anonymous' }" @click="showAnonymous()">
          匿名访客<span v-if="stats?.anonymous" class="pv-tab-count">{{ stats.anonymous }}</span>
        </button>
      </div>
      <input class="pv-search" v-model="search" placeholder="搜索姓名、邮箱、电话或公司..." />
    </div>

    <!-- table -->
    <div class="pv-table">
      <div class="pv-thead rcards-head">
        <span>{{ COLUMNS.person.label }}</span><span>{{ COLUMNS.stage.label }}</span><span>{{ COLUMNS.source.label }}</span><span>{{ COLUMNS.captured.label }}</span><span>{{ COLUMNS.activity.label }}</span><span>{{ COLUMNS.sync.label }}</span>
      </div>
      <button v-for="p in items" :key="p.id" class="pv-row rcards-row" @click="selectedId = p.id">
        <span class="pv-person rcards-primary">
          <span class="pv-avatar" :class="{ anon: p.is_anonymous }">{{ initials(p) }}</span>
          <span class="pv-person-text">
            <span class="pv-name">{{ p.name || (p.is_anonymous ? '匿名访客' : (p.email || '—')) }}</span>
            <span class="pv-email">
              {{ p.is_anonymous ? '匿名会话' : (p.email || '') }}
              <span v-if="p.phone" class="pv-phone">{{ p.phone }}</span>
              <span class="pv-id" :title="String(p.id)">{{ shortId(p) }}</span>
            </span>
          </span>
        </span>
        <span class="pv-stage rcards-badge">
          <span class="pv-badge" :class="p.lead_stage">{{ stageLabel(p.lead_stage) }}</span>
          <span v-if="p.qualified" class="pv-star" title="AI 意向度达标">★</span>
        </span>
        <span class="pv-source rcards-meta" :title="sourceTitle(p)">
          <span class="rcards-label">{{ COLUMNS.source.short }}</span>
          <span class="rcards-value">{{ sourceLabel(p) }}</span>
        </span>
        <span class="pv-captured rcards-meta">
          <span class="rcards-label">{{ COLUMNS.captured.short }}</span>
          <span class="rcards-value">{{ fmtDate(p.captured_at) }}</span>
        </span>
        <span class="pv-activity rcards-meta">
          <span class="rcards-label">{{ COLUMNS.activity.short }}</span>
          <span class="rcards-value">{{ fmtDate(p.last_activity) }}</span>
        </span>
        <span class="pv-sync rcards-meta">
          <span class="rcards-label">{{ COLUMNS.sync.short }}</span>
          <span class="rcards-value">{{ p.synced ? '已同步' : '—' }}</span>
        </span>
      </button>
      <div v-if="!loading && items.length === 0" class="pv-empty">暂无符合当前筛选条件的客户或线索。</div>
      <div v-if="loading" class="pv-empty">正在加载...</div>
      <div class="pv-foot">
        <span>共 {{ total }} 位客户档案</span>
        <span class="pv-pager">
          <button :disabled="page <= 1" @click="prevPage">‹</button>
          <span>第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
          <button :disabled="page >= totalPages" @click="nextPage">›</button>
        </span>
      </div>
    </div>

    <PersonDetailDrawer
      v-if="selectedId"
      :customer-id="selectedId"
      @close="selectedId = null"
      @updated="onPersonUpdated"
    />
  </div>
  </DashboardLayout>
</template>

<style scoped>
.people-view { padding: 24px 32px 60px; max-width: 1320px; margin: 0 auto; }

/* Locked (Pro-feature) screen */
.pv-locked { display: flex; align-items: center; justify-content: center; min-height: 70vh; padding: 32px; }
.pv-locked-card { max-width: 440px; width: 100%; text-align: center; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 14px; padding: 36px 32px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.pv-locked-icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(99, 102, 241, 0.1); color: #6366F1; }
.pv-locked-icon svg { width: 26px; height: 26px; }
.pv-locked-badge { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: var(--purple-bg, rgba(124,58,237,.14)); color: var(--c-purple, #7c3aed); margin-bottom: 12px; }
.pv-locked-title { font-size: 20px; font-weight: 600; margin: 0 0 8px; color: var(--text); }
.pv-locked-desc { font-size: 13.5px; line-height: 1.5; color: var(--muted); margin: 0 0 18px; }
.pv-locked-feats { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; display: flex; flex-direction: column; gap: 10px; }
.pv-locked-feats li { position: relative; padding-left: 26px; font-size: 13px; color: var(--text2, var(--text)); line-height: 1.4; }
.pv-locked-feats li::before { content: '✓'; position: absolute; left: 0; top: 0; width: 18px; height: 18px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: #10B981; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.pv-locked-btn { width: 100%; padding: 10px 18px; background: #0F172A; color: #FFFFFF; border: 1px solid rgba(15,23,42,0.9); border-radius: var(--radius-btn); font-size: 13.5px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.pv-locked-btn:hover { background: #000000; }
.pv-header { margin-bottom: 20px; }
.pv-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.02em; }
.pv-sub { font-size: 13.5px; color: var(--muted); margin: 0; }
.pv-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.pv-kpi { background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.pv-kpi-label { font-size: 12px; font-weight: 500; color: var(--muted); margin-bottom: 8px; }
.pv-kpi-value { font-size: 24px; font-weight: 700; color: var(--text); }
.pv-kpi-value.accent { color: #4F46E5; }
.pv-kpi-value.muted { color: var(--muted); }
.pv-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.pv-tabs { display: flex; gap: 3px; padding: 3px; background: rgba(15, 23, 42, 0.04); border-radius: 8px; border: 1px solid var(--border-color); }
.pv-tab { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; font-size: 13px; cursor: pointer; color: var(--muted); transition: all var(--transition-fast); }
.pv-tab.on { background: #FFFFFF; color: var(--text); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
.pv-tab-count { margin-left: 5px; padding: 1px 6px; border-radius: 999px; background: rgba(15, 23, 42, 0.06); font-size: 11px; font-variant-numeric: tabular-nums; }
.pv-phone { color: var(--muted); font-variant-numeric: tabular-nums; }
.pv-search { flex: 1; min-width: 220px; max-width: 320px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; background: #FFFFFF; color: var(--text); outline: none; }
.pv-search:focus { border-color: #0F172A; box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08); }
.pv-table { background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.pv-thead, .pv-row { padding: 11px 20px; }
@media (min-width: 769px) {
  .pv-thead, .pv-row { display: grid; grid-template-columns: minmax(0,2.4fr) 1fr 1.2fr .9fr .9fr .7fr; gap: 14px; align-items: center; }
}
.pv-thead { font-size: 11.5px; font-weight: 600; letter-spacing: .02em; color: var(--muted); border-bottom: 1px solid var(--border-color); background: #F8FAFC; }
.pv-row { width: 100%; border: none; background: transparent; border-bottom: 1px solid rgba(15, 23, 42, 0.04); cursor: pointer; text-align: left; font-size: 13px; color: var(--text); transition: background 0.15s ease; }
.pv-row:hover { background: #F8FAFC; }
.pv-person { display: flex; align-items: center; gap: 10px; min-width: 0; }
.pv-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: #0F172A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
.pv-avatar.anon { background: transparent; border: 1.5px dashed var(--border-color); color: var(--muted); }
.pv-person-text { min-width: 0; display: flex; flex-direction: column; }
.pv-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13.5px; }
.pv-email { font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-id { font-family: var(--font-mono, ui-monospace, monospace); font-size: 11px; color: var(--muted2); margin-left: 6px; }
.pv-stage { display: flex; align-items: center; gap: 6px; }
.pv-badge { padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 500; }
.pv-badge.visitor { background: rgba(15, 23, 42, 0.06); color: var(--muted); }
.pv-badge.lead { background: rgba(99, 102, 241, 0.1); color: #6366F1; }
.pv-badge.customer { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.pv-star { color: #f59e0b; }
.pv-source { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: 12px; }
.pv-sync { color: var(--muted2); font-size: 12px; }
.pv-empty { padding: 40px; text-align: center; color: var(--muted); font-size: 13.5px; }
.pv-foot { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; font-size: 12px; color: var(--muted); border-top: 1px solid var(--border-color); }
.pv-pager { display: flex; align-items: center; gap: 8px; }
.pv-pager button { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border-color); background: #FFFFFF; cursor: pointer; transition: all var(--transition-fast); }
.pv-pager button:hover:not(:disabled) { background: #F8FAFC; border-color: var(--border-color-hover); }
.pv-pager button:disabled { opacity: .4; cursor: default; }

/* ── Mobile ──────────────────────────────────────────────────────────────
   The row/card switch itself comes from the shared .rcards-* utility in
   components.css; only People-specific sizing lives here. */
@media (max-width: 768px) {
  .people-view { padding: 16px 12px; }
  .pv-header { margin-bottom: 18px; }
  .pv-title { font-size: 22px; }
  .pv-sub { font-size: 13.5px; }

  /* Four KPIs as a 2×2 grid — all visible, no horizontal scroll */
  .pv-kpis { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .pv-kpi { padding: 12px 14px; border-radius: 12px; }
  .pv-kpi-label { margin-bottom: 6px; }
  .pv-kpi-value { font-size: 22px; }

  .pv-toolbar { flex-direction: column; align-items: stretch; gap: 10px; }

  /* Five stage tabs don't fit 375px — swipe them instead of wrapping */
  .pv-tabs { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .pv-tabs::-webkit-scrollbar { display: none; }
  .pv-tab { flex-shrink: 0; padding: 8px 12px; }

  /* 16px keeps iOS from zooming the field on focus */
  .pv-search { max-width: none; min-width: 0; width: 100%; padding: 11px 13px; font-size: 16px; }

  .pv-row { padding: 14px 16px; }
  .pv-name { font-size: 15px; }
  .pv-avatar { width: 38px; height: 38px; font-size: 13px; }

  /* Sync is CRM plumbing — not worth a phone row */
  .pv-sync { display: none; }

  .pv-foot { padding: 12px 16px; }
}
</style>
