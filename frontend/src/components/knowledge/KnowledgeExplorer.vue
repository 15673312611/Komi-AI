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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  useKnowledgeExplorer,
  type ExplorerSource,
  type AddSourcePayload,
} from '@/composables/useKnowledgeExplorer'
import KnowledgeSourceTree from './KnowledgeSourceTree.vue'
import KnowledgePageDetail from './KnowledgePageDetail.vue'
import KnowledgePageEditor from './KnowledgePageEditor.vue'
import KnowledgePlanMeters from './KnowledgePlanMeters.vue'
import KnowledgeAddSourceModal from './KnowledgeAddSourceModal.vue'
import KnowledgeLinkModal from './KnowledgeLinkModal.vue'

const props = withDefaults(
  defineProps<{
    mode: 'agent' | 'org'
    organizationId: string
    agentId?: string
    showPlanMeters?: boolean
    title?: string
    description?: string
    variant?: 'page' | 'section'
  }>(),
  {
    agentId: undefined,
    showPlanMeters: false,
    title: '',
    description: '',
    variant: 'section',
  },
)

const ex = useKnowledgeExplorer(props.mode, props.agentId, props.organizationId)

// Add-source modal state.
const addOpen = ref(false)
const isSubmittingSource = ref(false)

// A single, reusable confirm dialog for the destructive actions.
interface ConfirmState {
  title: string
  message: string
  actionLabel: string
  busyLabel: string
  action: () => Promise<void>
}
const confirmState = ref<ConfirmState | null>(null)

const largestSource = computed(() =>
  ex.sources.value.reduce<ExplorerSource | null>((max, s) => {
    if (!max || (s.pages ?? s.pageStubs).length > (max.pages ?? max.pageStubs).length) return s
    return max
  }, null),
)
const largestSubpageCount = computed(() => {
  const s = largestSource.value
  return s ? (s.pages ?? s.pageStubs).length : 0
})

const activeCrawlDiscoveredCount = computed(() => {
  let count = 0
  for (const c of ex.activeCrawls.value) {
    if (c.crawled_urls) count += c.crawled_urls.length
    else if (c.processed_items) count += c.processed_items
  }
  return count
})

function openAdd() {
  addOpen.value = true
}

async function onSubmitSource(payload: AddSourcePayload) {
  if (isSubmittingSource.value) return
  isSubmittingSource.value = true
  try {
    const ok = await ex.submitSource(payload)
    if (ok) addOpen.value = false
  } finally {
    isSubmittingSource.value = false
  }
}

function askDeleteSource(source: ExplorerSource) {
  if (source.queued && source.queuedStatus === 'error') {
    confirmState.value = {
      title: '移除失败知识源',
      message: `确认移除抓取失败的知识源 “${source.name}”？`,
      actionLabel: '确认移除',
      busyLabel: '正在移除…',
      action: () => ex.deleteSource(source),
    }
  } else if (source.queued) {
    confirmState.value = {
      title: '取消抓取任务',
      message: `确认取消排队抓取知识源 “${source.name}”？`,
      actionLabel: '取消抓取',
      busyLabel: '正在取消…',
      action: () => ex.deleteSource(source),
    }
  } else if (props.mode === 'agent') {
    confirmState.value = {
      title: '从当前智能体解绑',
      message: `确认从当前智能体解绑知识源 “${source.name}”？该知识源仍会保留在企业组织知识库中。`,
      actionLabel: '解除关联',
      busyLabel: '正在解除…',
      action: () => ex.unlinkSource(source.id),
    }
  } else {
    confirmState.value = {
      title: '彻底删除知识源',
      message: `确认彻底删除知识源 “${source.name}” 及其所有子页面？此操作不可恢复。`,
      actionLabel: '确认删除',
      busyLabel: '正在删除…',
      action: () => ex.deleteSource(source),
    }
  }
}

function askDeletePage() {
  const page = ex.selectedPage.value
  if (!page) return
  confirmState.value = {
    title: '删除知识页面',
    message: `确认从当前知识源中删除页面 “${page.title}”？此操作不可恢复。`,
    actionLabel: '确认删除',
    busyLabel: '正在删除…',
    action: () => ex.deletePage(),
  }
}

async function runConfirm() {
  const state = confirmState.value
  if (!state) return
  await state.action()
  confirmState.value = null
}

onMounted(() => {
  ex.refresh()
  ex.startPolling()
})

onUnmounted(() => {
  ex.stopPolling()
})
</script>

<template>
  <div class="explorer">
    <header class="explorer__header">
      <div class="explorer__heading">
        <component :is="variant === 'page' ? 'h1' : 'h3'" class="explorer__title" :class="`explorer__title--${variant}`">
          {{ title }}
        </component>
        <p v-if="description" class="explorer__desc">{{ description }}</p>
      </div>
      <div class="explorer__actions">
        <slot name="actions" />
        <button v-if="mode === 'agent'" class="btn btn--ghost" type="button" @click="ex.openLinkPicker">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></svg>
          关联已有知识源
        </button>
        <button class="btn btn--primary" type="button" @click="openAdd">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          添加知识源
        </button>
      </div>
    </header>

    <KnowledgePlanMeters
      v-if="showPlanMeters"
      class="explorer__meters"
      :source-count="ex.sources.value.length"
      :largest-source-name="largestSource?.name ?? null"
      :largest-subpage-count="largestSubpageCount"
    />

    <div v-if="ex.error.value" class="banner" role="alert">
      {{ ex.error.value }}
      <button class="banner__close" type="button" aria-label="关闭" @click="ex.error.value = null">×</button>
    </div>

    <!-- 实时抓取监控流 (Live Crawling Monitor) -->
    <div v-if="ex.activeCrawls.value.length > 0" class="live-monitor-banner">
      <div class="live-monitor-header">
        <div class="live-pulse-badge">
          <span class="live-dot"></span>
          <span class="live-pulse-text">后台实时抓取中</span>
        </div>
        <div class="live-meta">
          <span class="live-count-text">
            正在并发解析网站并流式入库，已抓取入库 <strong>{{ activeCrawlDiscoveredCount }}</strong> 个页面（即抓即显，无需刷新）
          </span>
        </div>
      </div>
      <div v-for="crawl in ex.activeCrawls.value" :key="crawl.id" class="live-crawl-item">
        <div class="live-crawl-top">
          <div class="live-crawl-info">
            <i class="fa-solid fa-satellite-dish live-crawl-icon"></i>
            <span class="live-source-name" :title="crawl.source">{{ crawl.source }}</span>
            <span class="stage-tag">
              {{ crawl.processing_stage === 'crawling' ? '正在爬取与解析' : crawl.processing_stage === 'embedding' ? '正在建立向量索引' : '正在分析页面' }}
            </span>
          </div>
          <span class="live-pct">{{ Math.round(crawl.progress_percentage || 5) }}%</span>
        </div>
        <div class="live-progress-track">
          <div class="live-progress-fill" :style="{ width: `${crawl.progress_percentage || 5}%` }"></div>
        </div>
        <div v-if="crawl.crawled_urls && crawl.crawled_urls.length > 0" class="live-stream-pills">
          <span class="stream-label">最新解析页面：</span>
          <span
            v-for="(u, idx) in crawl.crawled_urls.slice(-4)"
            :key="idx"
            class="stream-pill"
            :title="u"
          >
            <i class="fa-solid fa-file-lines text-emerald-600 text-[10px]"></i>
            <span class="truncate max-w-[180px]">{{ u.split('/').pop() || u }}</span>
          </span>
          <span v-if="crawl.crawled_urls.length > 4" class="stream-more">
            +{{ crawl.crawled_urls.length - 4 }} 个更多页面
          </span>
        </div>
      </div>
    </div>

    <div class="grid">
      <KnowledgeSourceTree
        class="grid__tree"
        :sources="ex.filteredSources.value"
        :selected-page-id="ex.selectedPageId.value"
        :selected-source-id="ex.selectedSourceId.value"
        :query="ex.query.value"
        :status-of="ex.sourceStatus"
        :page-rows-of="ex.pageRows"
        @update:query="ex.query.value = $event"
        @toggle="ex.toggleSource"
        @select="(source, pageId) => ex.selectPage(source, pageId)"
        @retry="(source) => ex.loadSourceContent(source.id, true)"
        @delete-source="askDeleteSource"
        @add-page="ex.startAddPage"
      />

      <div class="grid__detail">
        <KnowledgePageEditor
          v-if="ex.editing.value && (ex.selectedPage.value || ex.isAddingPage.value)"
          :title="ex.draftTitle.value"
          :content="ex.draftContent.value"
          :saving="ex.isSaving.value"
          :submit-label="ex.isAddingPage.value ? '添加子页面' : '保存修改'"
          :url="ex.draftUrl.value"
          :show-url="ex.isAddingPage.value"
          @update:title="ex.draftTitle.value = $event"
          @update:content="ex.draftContent.value = $event"
          @update:url="ex.draftUrl.value = $event"
          @save="ex.savePage"
          @cancel="ex.cancelEdit"
        />
        <KnowledgePageDetail
          v-else-if="ex.selectedPage.value && ex.selectedSource.value"
          :page="ex.selectedPage.value"
          :source-name="ex.selectedSource.value.name"
          :source-type="ex.selectedSource.value.type"
          :agents="ex.selectedSource.value.agents"
          :status="ex.sourceStatus(ex.selectedSource.value)"
          :deleting="ex.isDeleting.value"
          @edit="ex.startEdit"
          @delete="askDeletePage"
        />
        <div v-else class="empty">
          <div class="empty__orb"></div>
          <div class="empty__title">请选择要查看的知识页面</div>
          <p class="empty__text">
            在左侧选择已提取解析的文档或页面进行阅读、编辑或管理；也可点击右上角添加新的知识源。
          </p>
        </div>
      </div>
    </div>

    <div v-if="confirmState" class="confirm" role="dialog" aria-modal="true">
      <div class="confirm__card">
        <h3 class="confirm__title">{{ confirmState.title }}</h3>
        <p class="confirm__msg">{{ confirmState.message }}</p>
        <div class="confirm__actions">
          <button class="btn btn--ghost" type="button" :disabled="ex.isDeleting.value" @click="confirmState = null">取消</button>
          <button class="btn btn--danger-solid" type="button" :disabled="ex.isDeleting.value" @click="runConfirm">
            {{ ex.isDeleting.value ? confirmState.busyLabel : confirmState.actionLabel }}
          </button>
        </div>
      </div>
    </div>

    <KnowledgeAddSourceModal
      v-if="addOpen"
      :submitting="isSubmittingSource"
      @close="addOpen = false"
      @submit="onSubmitSource"
    />

    <KnowledgeLinkModal
      v-if="ex.linkPickerOpen.value"
      :sources="ex.orgSources.value"
      :linked-ids="ex.linkedSourceIds.value"
      :busy-ids="ex.linkingIds.value"
      :loading="ex.isLoadingOrgSources.value"
      :error="ex.orgSourcesError.value"
      @close="ex.linkPickerOpen.value = false"
      @link="ex.linkSource"
      @unlink="ex.unlinkSource"
    />
  </div>
</template>

<style scoped>
.explorer {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.explorer__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.explorer__heading {
  min-width: 0;
}

.explorer__title {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.explorer__title--page {
  font-size: 22px;
  letter-spacing: -0.02em;
}

.explorer__title--section {
  font-size: 18px;
  letter-spacing: -0.01em;
}

.explorer__desc {
  font-size: 13.5px;
  color: var(--muted);
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

.explorer__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.explorer__meters {
  margin-bottom: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: var(--radius-btn);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  background: #0F172A;
  color: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.9);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn--primary:hover:not(:disabled) {
  background: #000000;
  transform: translateY(-0.5px);
}

.btn--ghost {
  background: #FFFFFF;
  border-color: var(--border-color);
  color: var(--text2);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.btn--ghost:hover:not(:disabled) {
  background: #F8FAFC;
  border-color: var(--border-color-hover);
  color: var(--text);
}

.btn--danger-solid {
  background: var(--c-danger);
  color: #FFFFFF;
}

.btn--danger-solid:hover:not(:disabled) {
  background: #DC2626;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  margin-bottom: 16px;
  background: var(--error-bg);
  border: 1px solid var(--coral-border);
  border-radius: 11px;
  color: var(--c-coral);
  font-size: 13.5px;
}

.banner__close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.grid {
  display: grid;
  grid-template-columns: 344px 1fr;
  gap: 18px;
  align-items: stretch;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.grid__tree,
.grid__detail {
  height: 640px;
}

.grid__detail {
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.empty__orb {
  width: 52px;
  height: 52px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--c-lime), var(--c-purple), var(--c-teal), var(--c-coral), var(--c-lime));
  opacity: 0.85;
}

.empty__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--text2);
  margin-bottom: 8px;
}

.empty__text {
  font-size: 14px;
  color: var(--muted);
  max-width: 320px;
  line-height: 1.55;
  margin: 0;
}

.confirm {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm__card {
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
}

.confirm__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--text);
  margin: 0 0 8px;
}

.confirm__msg {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.55;
  margin: 0 0 20px;
}

.confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

/* Live Crawling Monitor */
.live-monitor-banner {
  background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%);
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.06);
}

.live-monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.live-pulse-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #4F46E5;
  color: #FFFFFF;
}

.live-pulse-text {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34D399;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.4);
  animation: pulse-dot 1.4s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.live-count-text {
  font-size: 12px;
  color: #4338CA;
}

.live-count-text strong {
  font-weight: 800;
  color: #312E81;
}

.live-crawl-item {
  background: #FFFFFF;
  border: 1px solid #E0E7FF;
  border-radius: 8px;
  padding: 10px 14px;
}

.live-crawl-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.live-crawl-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.live-crawl-icon {
  color: #6366F1;
  font-size: 12px;
  animation: spin-dish 3s linear infinite;
}

@keyframes spin-dish {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.live-source-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #0F172A;
  max-width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stage-tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 10.5px;
  font-weight: 600;
}

.live-pct {
  font-family: monospace;
  font-size: 12.5px;
  font-weight: 800;
  color: #4F46E5;
}

.live-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  background: #E2E8F0;
  overflow: hidden;
}

.live-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366F1 0%, #4F46E5 100%);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.live-stream-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.stream-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
}

.stream-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  font-size: 11px;
  color: #334155;
}

.stream-more {
  font-size: 10.5px;
  color: #94A3B8;
  font-weight: 600;
}
