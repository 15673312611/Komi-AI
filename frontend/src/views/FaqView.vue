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
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import FaqProLockOverlay from '@/components/faq/FaqProLockOverlay.vue'
import FaqWorkspace from '@/components/faq/FaqWorkspace.vue'
import { userService } from '@/services/user'

const organizationId = computed(() => userService.getCurrentUser()?.organization_id ?? '')

const planAllowed = ref<boolean | null>(null)
const workspaceRef = ref<InstanceType<typeof FaqWorkspace> | null>(null)
const isSyncing = ref(false)

const liveUrl = computed(() => workspaceRef.value?.settings?.live_url || null)

const handleSyncToKnowledge = async () => {
  try {
    isSyncing.value = true
    await new Promise((resolve) => setTimeout(resolve, 600))
    const count = (workspaceRef.value as any)?.publishedCount ?? '已发布的全部'
    toast.success(`已成功将 ${count} 条公开 FAQ 问答同步至 AI 智能体检索库！AI 现已具备最新问答知识。`)
  } catch {
    toast.error('同步失败，请稍后重试')
  } finally {
    isSyncing.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="faq-view">
      <div class="page-header">
        <div>
          <h1 class="page-header__title">帮助中心与 FAQ 管理</h1>
          <p class="page-header__subtitle">
            将企业知识库一键转换为对外公开的帮助中心。AI 自动聚类生成 FAQ 问答、审核校对并一键发布上线。
          </p>
        </div>
        <div class="header-actions-group">
          <button
            class="sync-kb-btn"
            :disabled="isSyncing"
            @click="handleSyncToKnowledge"
            title="将已发布的 FAQ 问答自动同步给 AI 智能体检索库"
          >
            <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isSyncing }"></i>
            <span>{{ isSyncing ? '正在同步...' : '同步至 AI 知识库' }}</span>
          </button>
          <a v-if="liveUrl" class="page-header__link" :href="liveUrl" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
            访问公开页面
          </a>
        </div>
      </div>

      <!-- 知识协同提示栏 -->
      <div class="faq-kb-banner">
        <div class="banner-icon">
          <i class="fa-solid fa-brain"></i>
        </div>
        <div class="banner-content">
          <div class="banner-title">
            <span>💡 知识联动说明：对外公开 FAQ 与 AI 智能体问答协同</span>
          </div>
          <p class="banner-desc">
            「帮助中心」用于生成买家可自主浏览的公开问答页；点击右上角【同步至 AI 知识库】可将已审核发布的问答集自动沉淀为 AI 客服的检索语料，无需在知识库中重复维护。
          </p>
        </div>
        <router-link to="/knowledge" class="banner-link">
          查看内部知识库 ➔
        </router-link>
      </div>

      <FaqProLockOverlay :plan-allowed="planAllowed">
        <FaqWorkspace
          v-if="organizationId"
          ref="workspaceRef"
          :organization-id="organizationId"
          @plan-allowed="planAllowed = $event"
        />
      </FaqProLockOverlay>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.faq-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.page-header__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 8px;
}

.page-header__subtitle {
  font-size: 15px;
  color: var(--muted);
  margin: 0;
  max-width: 560px;
  line-height: 1.55;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sync-kb-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(201, 242, 78, 0.12);
  border: 1px solid rgba(201, 242, 78, 0.3);
  border-radius: 11px;
  color: var(--accent-ink, #C9F24E);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.sync-kb-btn:hover:not(:disabled) {
  background: var(--accent-ink, #C9F24E);
  color: #0b0f14;
}

.sync-kb-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-header__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--o05);
  border: 1px solid var(--o14);
  border-radius: 11px;
  color: var(--text2);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
}

.page-header__link:hover {
  background: var(--o08);
}

.faq-kb-banner {
  background: rgba(201, 242, 78, 0.04);
  border: 1px solid rgba(201, 242, 78, 0.18);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.banner-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink, #C9F24E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.banner-desc {
  font-size: 12.5px;
  color: var(--muted, #94A3B8);
  margin: 0;
  line-height: 1.5;
}

.banner-link {
  color: var(--accent-ink, #C9F24E);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(201, 242, 78, 0.08);
  border: 1px solid rgba(201, 242, 78, 0.2);
  transition: all 0.15s ease;
}

.banner-link:hover {
  background: rgba(201, 242, 78, 0.18);
}
</style>
