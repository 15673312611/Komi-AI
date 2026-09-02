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
import { ref, onMounted, computed } from 'vue'
import { useAgentWorkflow } from '@/composables/useAgentWorkflow'
import type { AgentWithCustomization } from '@/types/agent'
import WorkflowBuilder from '../workflow/WorkflowBuilder.vue'
import { workflowCacheStorage } from '@/utils/storage'

const props = defineProps<{
  agent: AgentWithCustomization
}>()

const {
  workflow,
  workflowLoading,
  workflowError,
  createWorkflowLoading,
  hasWorkflow,
  fetchWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow
} = useAgentWorkflow(props.agent.id)

// Create workflow form state
const showCreateForm = ref(false)
const workflowName = ref('')
const workflowDescription = ref('')

// Edit workflow form state
const showEditForm = ref(false)
const editWorkflowName = ref('')
const editWorkflowDescription = ref('')

// Workflow builder state
const showWorkflowBuilder = ref(false)

// Computed properties
const workflowStatus = computed(() => {
  if (!workflow.value) return '暂无工作流'
  const status = (workflow.value.status || 'Draft').toLowerCase()
  if (status === 'published') return '已发布运行'
  if (status === 'draft') return '草稿状态'
  if (status === 'archived') return '已归档'
  return workflow.value.status
})

const workflowStatusColor = computed(() => {
  const status = (workflow.value?.status || 'Draft').toLowerCase()
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'muted'
    default:
      return 'muted'
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleCreateWorkflow = async () => {
  if (!workflowName.value.trim()) {
    return
  }

  try {
    const created = await createWorkflow({
      name: workflowName.value.trim(),
      description: workflowDescription.value.trim() || undefined
    })
    if (!created) return
    
    // Reset form
    workflowName.value = ''
    workflowDescription.value = ''
    showCreateForm.value = false
    
    // Open workflow builder
    openWorkflowBuilder()
  } catch {
    // Error handling is done in the composable
  }
}

const handleEditWorkflow = () => {
  if (workflow.value) {
    editWorkflowName.value = workflow.value.name
    editWorkflowDescription.value = workflow.value.description || ''
    showEditForm.value = true
    showCreateForm.value = false
  }
}

const handleUpdateWorkflow = async () => {
  if (!editWorkflowName.value.trim()) {
    return
  }

  try {
    const updated = await updateWorkflow({
      name: editWorkflowName.value.trim(),
      description: editWorkflowDescription.value.trim() || undefined
    })
    if (!updated) return
    
    showEditForm.value = false
  } catch {
    // Error handling is done in the composable
  }
}

const cancelEditForm = () => {
  editWorkflowName.value = ''
  editWorkflowDescription.value = ''
  showEditForm.value = false
}

const handleDeleteWorkflow = async () => {
  if (confirm('确定要删除此工作流吗？此操作无法撤销。')) {
    try {
      await deleteWorkflow()
    } catch {
      // Error handling is done in the composable
    }
  }
}

const openWorkflowBuilder = () => {
  // Clear existing cache and reload fresh data when opening workflow builder
  if (workflow.value) {
    workflowCacheStorage.clearWorkflowCache(workflow.value.id)
  }
  showWorkflowBuilder.value = true
}

const closeWorkflowBuilder = async () => {
  showWorkflowBuilder.value = false
  await fetchWorkflow()
}

const handleWorkflowSave = async () => {
  // Refresh workflow data after saving
  showWorkflowBuilder.value = false
  await fetchWorkflow()
}

const cancelCreateForm = () => {
  workflowName.value = ''
  workflowDescription.value = ''
  showCreateForm.value = false
}

// Fetch workflow on mount
onMounted(() => {
  fetchWorkflow()
})
</script>

<template>
  <div class="workflow-tab">
    <section class="detail-section">
      <div class="wf-header">
        <h3 class="section-title">可视化工作流编排</h3>
        <p class="section-description">
          创建与管理对话流程。通过低代码拖拽式画布，构建精准的客服应答、表单收集、业务分支与条件路由。
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="workflowLoading && !hasWorkflow" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载工作流...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="workflowError && !hasWorkflow" class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ workflowError }}</p>
        <button class="retry-button" @click="fetchWorkflow">重试</button>
      </div>

      <!-- No Workflow State -->
      <div v-else-if="!hasWorkflow && !showCreateForm && !showEditForm" class="no-workflow-container">
        <div class="no-workflow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="6" height="6"/>
            <rect x="15" y="3" width="6" height="6"/>
            <rect x="9" y="15" width="6" height="6"/>
            <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
            <path d="M12 15v-3"/>
          </svg>
        </div>
        <h4 class="no-workflow-title">暂未创建工作流</h4>
        <p class="no-workflow-description">
          创建工作流后，您可以使用可视化拖拽画布自由编排多轮对话节点与自动化逻辑。
        </p>
        <button class="create-workflow-button" :disabled="workflowLoading" @click="showCreateForm = true; showEditForm = false">
          + 创建工作流
        </button>
      </div>

      <!-- Create Workflow Form -->
      <div v-else-if="showCreateForm" class="create-form-container">
        <div class="form-header">
          <h4 class="form-title">新建对话工作流</h4>
          <button class="close-form-button" @click="cancelCreateForm" aria-label="关闭">
            ✕
          </button>
        </div>

        <form @submit.prevent="handleCreateWorkflow" class="create-form">
          <div class="form-group">
            <label for="workflow-name" class="form-label">工作流名称 <span class="req">*</span></label>
            <input
              id="workflow-name"
              v-model="workflowName"
              type="text"
              class="form-input"
              placeholder="输入工作流名称，如：售后退换货指引"
              required
              :disabled="createWorkflowLoading"
            />
          </div>

          <div class="form-group">
            <label for="workflow-description" class="form-label">描述说明</label>
            <textarea
              id="workflow-description"
              v-model="workflowDescription"
              class="form-textarea"
              placeholder="简要说明该工作流适用的业务场景（可选）"
              rows="3"
              :disabled="createWorkflowLoading"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="cancelCreateForm"
              :disabled="createWorkflowLoading"
            >
              取消
            </button>
            <button
              type="submit"
              class="submit-button"
              :disabled="!workflowName.trim() || createWorkflowLoading"
            >
              <div v-if="createWorkflowLoading" class="button-spinner"></div>
              <span v-else>创建并进入画布</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Edit Workflow Form -->
      <div v-else-if="showEditForm" class="create-form-container">
        <div class="form-header">
          <h4 class="form-title">重命名与修改描述</h4>
          <button class="close-form-button" @click="cancelEditForm" aria-label="关闭">
            ✕
          </button>
        </div>

        <form @submit.prevent="handleUpdateWorkflow" class="create-form">
          <div class="form-group">
            <label for="edit-workflow-name" class="form-label">工作流名称 <span class="req">*</span></label>
            <input
              id="edit-workflow-name"
              v-model="editWorkflowName"
              type="text"
              class="form-input"
              placeholder="输入工作流名称"
              required
              :disabled="workflowLoading"
            />
          </div>

          <div class="form-group">
            <label for="edit-workflow-description" class="form-label">描述说明</label>
            <textarea
              id="edit-workflow-description"
              v-model="editWorkflowDescription"
              class="form-textarea"
              placeholder="描述说明（可选）"
              rows="3"
              :disabled="workflowLoading"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="cancel-button"
              @click="cancelEditForm"
              :disabled="workflowLoading"
            >
              取消
            </button>
            <button
              type="submit"
              class="submit-button"
              :disabled="!editWorkflowName.trim() || workflowLoading"
            >
              <div v-if="workflowLoading" class="button-spinner"></div>
              <span v-else>保存修改</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Existing Workflow -->
      <div v-else-if="hasWorkflow && !showEditForm" class="workflow-container">
        <div class="workflow-card">
          <div class="workflow-info">
            <div class="workflow-main">
              <span class="workflow-name">{{ workflow!.name }}</span>
              <span class="workflow-status" :class="`status-${workflowStatusColor}`">
                {{ workflowStatus }}
              </span>
            </div>
            <p v-if="workflow!.description" class="workflow-description">
              {{ workflow!.description }}
            </p>
            <div class="workflow-meta">
              <span class="workflow-date">创建时间 {{ formatDate(workflow!.created_at) }}</span>
              <span class="workflow-separator">·</span>
              <span class="workflow-date">最后更新 {{ formatDate(workflow!.updated_at) }}</span>
            </div>
          </div>

          <div class="workflow-actions">
            <button class="action-button primary" :disabled="workflowLoading" @click="openWorkflowBuilder">
              ⛶ 进入画布编排
            </button>

            <button class="action-button secondary" :disabled="workflowLoading" @click="handleEditWorkflow">
              ✎ 修改信息
            </button>

            <button class="action-button danger" :disabled="workflowLoading" @click="handleDeleteWorkflow">
              删除
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Workflow Builder -->
    <WorkflowBuilder
      v-if="showWorkflowBuilder && workflow"
      :workflow="workflow"
      @close="closeWorkflowBuilder"
      @save="handleWorkflowSave"
    />
  </div>
</template>

<style scoped>
.workflow-tab {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--space-lg);
}

.detail-section {
  margin-bottom: var(--space-xl);
}

/* Header */
.wf-header {
  margin-bottom: 22px;
}

.section-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  color: var(--text);
  margin: 0 0 6px;
}

.section-description {
  color: var(--muted);
  font-size: 14px;
  max-width: 600px;
  line-height: 1.55;
  margin: 0;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--o08);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--o10);
  border-radius: 50%;
  border-top-color: var(--accent-ink);
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

.loading-text {
  color: var(--muted);
  font-size: var(--text-sm);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--coral-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--error-color);
}

.error-icon {
  font-size: 2rem;
  margin-bottom: var(--space-md);
}

.error-message {
  color: var(--error-color);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
  text-align: center;
}

.retry-button {
  padding: var(--space-sm) var(--space-md);
  background: var(--error-color);
  color: var(--on-dark);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.retry-button:hover {
  filter: brightness(1.05);
}

/* No Workflow State */
.no-workflow-container {
  border: 1px solid var(--o08);
  border-radius: var(--radius-card);
  padding: 64px 30px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.no-workflow-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 14px;
  color: var(--muted);
  opacity: 0.7;
}

.no-workflow-icon svg {
  width: 100%;
  height: 100%;
}

.no-workflow-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 20px;
  color: var(--text);
  margin: 0;
}

.no-workflow-description {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  max-width: 420px;
  margin: 6px 0 20px;
}

.create-workflow-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 22px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: var(--radius-btn);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-workflow-button:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

/* Create / Rename Form */
.create-form-container {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: var(--radius-card);
  padding: 28px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.form-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 19px;
  color: var(--text);
  margin: 0;
}

.close-form-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--o05);
  border: 1px solid var(--o10);
  border-radius: 9px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-form-button:hover {
  background: var(--o10);
  color: var(--text);
}

.create-form {
  padding: 0;
}

.form-group {
  margin-bottom: 18px;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13.5px;
  color: var(--text3);
  margin-bottom: 8px;
}

.form-label .req {
  color: var(--c-coral);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid var(--o12);
  border-radius: var(--radius-btn);
  background: var(--bg);
  color: var(--text);
  font-size: 14.5px;
  font-family: var(--font-sans);
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-ink);
}

.form-textarea {
  resize: vertical;
  line-height: 1.5;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 22px;
}

.cancel-button,
.submit-button {
  border-radius: var(--radius-btn);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.cancel-button {
  padding: 12px 22px;
  background: var(--o05);
  border: 1px solid var(--o14);
  color: var(--text);
}

.cancel-button:hover {
  background: var(--o10);
}

.submit-button {
  padding: 12px 24px;
  background: var(--accent-solid);
  border: none;
  color: var(--on-accent-solid);
}

.submit-button:hover:not(:disabled) {
  filter: brightness(1.05);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Workflow Card */
.workflow-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workflow-card {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.workflow-info {
  min-width: 0;
}

.workflow-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  color: var(--text);
}

.workflow-description {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
  margin: 6px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workflow-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.workflow-status {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.workflow-status.status-success {
  background: color-mix(in srgb, var(--success-color) 15%, transparent);
  color: var(--success-color);
}

.workflow-status.status-warning {
  background: color-mix(in srgb, var(--warning-color) 15%, transparent);
  color: var(--warning-color);
}

.workflow-status.status-muted {
  background: var(--o05);
  color: var(--muted);
}

.workflow-date {
  color: var(--muted2);
  font-size: 12.5px;
  white-space: nowrap;
}

.workflow-separator {
  color: var(--muted2);
  font-size: 12.5px;
}

.workflow-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-family: var(--font-sans);
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-button.primary {
  padding: 10px 18px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  font-weight: 600;
}

.action-button.primary:hover {
  filter: brightness(1.05);
}

.action-button.secondary {
  padding: 10px 16px;
  background: var(--o05);
  color: var(--text);
  border: 1px solid var(--o14);
  font-weight: 500;
}

.action-button.secondary:hover {
  background: var(--o10);
}

.action-button.danger {
  padding: 10px 16px;
  background: transparent;
  color: var(--c-coral);
  border: 1px solid var(--coral-border);
  font-weight: 500;
}

.action-button.danger:hover {
  background: color-mix(in srgb, var(--c-coral) 12%, transparent);
}

/* Responsive design */
@media (max-width: 768px) {
  .workflow-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .workflow-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
