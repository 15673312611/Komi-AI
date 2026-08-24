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
import { useJiraTicket } from '@/composables/useJiraTicket'

const props = defineProps<{
  chatId: string
  initialSummary?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ticketCreated', ticketKey: string): void
}>()

const {
  jiraConnected,
  jiraLoading,
  showTicketModal,
  jiraProjects,
  jiraIssueTypes,
  jiraPriorities,
  selectedProject,
  selectedIssueType,
  selectedPriority,
  ticketSummary,
  ticketDescription,
  loadingProjects,
  loadingIssueTypes,
  loadingPriorities,
  creatingTicket,
  createdTicketKey,
  priorityAvailable,
  checkingPriorityAvailability,
  isFormValid,
  checkJiraStatus,
  handleProjectChange,
  handleIssueTypeChange,
  openTicketModal,
  closeTicketModal,
  submitTicket
} = useJiraTicket()

// Initialize the modal
const initModal = async () => {
  await openTicketModal(props.initialSummary)
}

// Handle close
const handleClose = () => {
  closeTicketModal()
  emit('close')
}

// Handle submit
const handleSubmit = async () => {
  const ticketKey = await submitTicket(props.chatId)
  if (ticketKey) {
    emit('ticketCreated', ticketKey)
    handleClose()
  }
}

// Initialize on mount
initModal()
</script>

<template>
  <div class="ticket-modal">
    <div class="ticket-modal-content">
      <div class="ticket-modal-header">
        <h3>创建 Jira 缺陷工单</h3>
        <button class="close-modal-btn" @click="handleClose">
          <font-awesome-icon icon="fa-solid fa-times" />
        </button>
      </div>

      <div v-if="jiraLoading" class="ticket-loading">
        <font-awesome-icon icon="fa-solid fa-spinner" spin />
        正在检查 Jira 连接状态…
      </div>

      <div v-else-if="!jiraConnected" class="ticket-not-connected">
        <font-awesome-icon icon="fa-solid fa-exclamation-triangle" />
        <p>当前尚未连接 Jira 实例。请先前往设置中完成授权连接。</p>
        <router-link to="/settings/integrations" class="connect-jira-btn">
          去连接 Jira
        </router-link>
      </div>

      <div v-else class="ticket-form">
        <div class="form-group">
          <label for="ticket-project">所属项目 (Project) *</label>
          <div v-if="loadingProjects" class="loading-indicator">
            <font-awesome-icon icon="fa-solid fa-spinner" spin /> 正在加载项目列表…
          </div>
          <select 
            v-else
            id="ticket-project" 
            v-model="selectedProject"
            @change="handleProjectChange(selectedProject)"
          >
            <option value="">请选择所属项目</option>
            <option 
              v-for="project in jiraProjects" 
              :key="project.id" 
              :value="project.key"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-issue-type">问题类型 (Issue Type) *</label>
          <div v-if="loadingIssueTypes" class="loading-indicator">
            <font-awesome-icon icon="fa-solid fa-spinner" spin /> 正在加载问题类型…
          </div>
          <select 
            v-else
            id="ticket-issue-type" 
            v-model="selectedIssueType"
            :disabled="!selectedProject"
            @change="handleIssueTypeChange(selectedIssueType)"
          >
            <option value="">请选择问题类型</option>
            <option 
              v-for="issueType in jiraIssueTypes" 
              :key="issueType.id" 
              :value="issueType.id"
            >
              {{ issueType.name }}
            </option>
          </select>
        </div>

        <div v-if="selectedProject && selectedIssueType" class="form-group">
          <div v-if="checkingPriorityAvailability" class="loading-indicator">
            <font-awesome-icon icon="fa-solid fa-spinner" spin /> 正在检查优先级字段…
          </div>
          
          <template v-else-if="priorityAvailable">
            <label for="ticket-priority">优先级 (Priority)</label>
            <div v-if="loadingPriorities" class="loading-indicator">
              <font-awesome-icon icon="fa-solid fa-spinner" spin /> 正在加载优先级…
            </div>
            <select 
              v-else
              id="ticket-priority" 
              v-model="selectedPriority"
            >
              <option value="">请选择优先级</option>
              <option 
                v-for="priority in jiraPriorities" 
                :key="priority.id" 
                :value="priority.id"
              >
                {{ priority.name }}
              </option>
            </select>
          </template>
          
          <div v-else class="priority-unavailable">
            <font-awesome-icon icon="fa-solid fa-info-circle" />
            当前项目/类型不支持设置优先级字段
          </div>
        </div>

        <div class="form-group">
          <label for="ticket-summary">工单标题 (Summary) *</label>
          <input 
            type="text" 
            id="ticket-summary" 
            v-model="ticketSummary"
            placeholder="请输入工单简要标题概述"
          >
        </div>

        <div class="form-group">
          <label for="ticket-description">详细描述 (Description)</label>
          <textarea 
            id="ticket-description" 
            v-model="ticketDescription"
            placeholder="请输入工单详细描述或复现步骤"
            rows="4"
          ></textarea>
        </div>

        <div class="ticket-actions">
          <button class="cancel-btn" @click="handleClose">取消</button>
          <button 
            class="create-btn" 
            @click="handleSubmit"
            :disabled="!isFormValid || creatingTicket"
          >
            <font-awesome-icon v-if="creatingTicket" icon="fa-solid fa-spinner" spin />
            {{ creatingTicket ? '正在创建…' : '立即创建工单' }}
          </button>
        </div>

        <div v-if="createdTicketKey" class="ticket-created">
          <font-awesome-icon icon="fa-solid fa-check-circle" />
          工单创建成功：<strong>{{ createdTicketKey }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ticket-modal-content {
  background: var(--background-color);
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ticket-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

.ticket-modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 32px;
  height: 32px;
}

.close-modal-btn:hover {
  background: var(--background-mute);
  color: var(--text-primary);
}

.ticket-loading,
.ticket-not-connected {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

.ticket-loading svg,
.ticket-not-connected svg {
  font-size: 24px;
  margin-bottom: 16px;
  display: block;
}

.ticket-not-connected svg {
  color: var(--warning);
}

.connect-jira-btn {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.connect-jira-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.ticket-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--background-color);
  color: var(--text-primary);
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
  outline: none;
}

.form-group select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-indicator {
  padding: 10px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.loading-indicator svg {
  margin-right: 8px;
}

.ticket-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  background: var(--background-mute);
  color: var(--text-primary);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.create-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  filter: none;
}

.ticket-created {
  margin-top: 16px;
  padding: 12px;
  background: var(--success-light);
  color: var(--success);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-created svg {
  font-size: 18px;
}

.priority-unavailable {
  padding: 10px;
  background-color: var(--background-mute);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-unavailable svg {
  color: var(--warning);
  font-size: 16px;
}
</style> 