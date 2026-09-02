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
import type { Teammate } from '@/services/users'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

export interface FilterValues {
  customerEmailFilter: string
  agentFilter: string
  userFilter: string
  dateFromFilter: string
  dateToFilter: string
}

interface Props {
  showFilters: boolean
  filterValues: FilterValues
  users: Teammate[]
  agents: Array<{id: string, name: string, display_name: string | null}>
  loadingUsers?: boolean
  loadingAgents?: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'apply', filters: FilterValues): void
  (e: 'clear'): void
  (e: 'update:filterValues', filters: FilterValues): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local filter state
const localFilters = ref<FilterValues>({ ...props.filterValues })

// Keep the draft in sync when the parent clears/applies filters while the
// dropdown stays mounted.
const updateLocalFilters = () => {
  localFilters.value = { ...props.filterValues }
}

watch(() => props.filterValues, updateLocalFilters, { deep: true })

const hasActiveFilters = computed(() => {
  return localFilters.value.customerEmailFilter.trim() || 
         localFilters.value.agentFilter.trim() || 
         localFilters.value.userFilter.trim() || 
         localFilters.value.dateFromFilter || 
         localFilters.value.dateToFilter
})

const activeFilterCount = computed(() => {
  return Object.values({
    customerEmailFilter: localFilters.value.customerEmailFilter.trim(),
    agentFilter: localFilters.value.agentFilter.trim(),
    userFilter: localFilters.value.userFilter.trim(),
    dateFromFilter: localFilters.value.dateFromFilter,
    dateToFilter: localFilters.value.dateToFilter
  }).filter(Boolean).length
})

const applyFilters = () => {
  emit('update:filterValues', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    customerEmailFilter: '',
    agentFilter: '',
    userFilter: '',
    dateFromFilter: '',
    dateToFilter: ''
  }
  emit('update:filterValues', { ...localFilters.value })
  emit('clear')
}

// Click outside handler
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  const filtersContainer = document.querySelector('.filters-container')
  const filterToggleBtn = document.querySelector('.filter-toggle-btn')
  
  if (props.showFilters && 
      filtersContainer && 
      !filtersContainer.contains(target) && 
      filterToggleBtn && 
      !filterToggleBtn.contains(target)) {
    emit('toggle')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="filter-header-section">
    <!-- Filter Toggle Button -->
    <button 
      @click="emit('toggle')" 
      class="filter-toggle-btn"
      :class="{ active: showFilters, 'has-filters': hasActiveFilters }"
      aria-label="打开筛选"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      <span v-if="hasActiveFilters" class="filter-count">{{ activeFilterCount }}</span>
    </button>
    
    <!-- Advanced Filters Dropdown -->
    <div v-if="showFilters" class="filters-container">
      <div class="filters-dropdown">
        <div class="filters-header">
          <h3>筛选会话记录</h3>
          <button @click="emit('toggle')" class="close-btn" aria-label="关闭筛选">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="filters-grid">
          <div class="filter-group">
            <label for="customer-email">客户邮箱</label>
            <input 
              id="customer-email"
              v-model="localFilters.customerEmailFilter" 
              type="email" 
              placeholder="按客户邮箱过滤..."
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="agent-filter">AI 智能体</label>
            <select 
              id="agent-filter"
              v-model="localFilters.agentFilter" 
              class="filter-input filter-select"
              :disabled="loadingAgents"
            >
              <option value="">全部智能体</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.display_name || agent.name }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="user-filter">人工客服成员</label>
            <select 
              id="user-filter"
              v-model="localFilters.userFilter" 
              class="filter-input filter-select"
              :disabled="loadingUsers"
            >
              <option value="">全部客服人员</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.full_name }} ({{ user.email }})
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="date-from">起始日期</label>
            <input 
              id="date-from"
              v-model="localFilters.dateFromFilter" 
              type="date" 
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="date-to">截止日期</label>
            <input 
              id="date-to"
              v-model="localFilters.dateToFilter" 
              type="date" 
              class="filter-input"
            />
          </div>
        </div>
        
        <div class="filter-actions">
          <button @click="applyFilters" class="apply-btn">应用筛选</button>
          <button @click="clearFilters" class="clear-btn">重置筛选</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-filters {
  position: relative;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-btn);
  background: #FFFFFF;
  color: var(--text2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.filter-toggle-btn:hover {
  background: #F8FAFC;
  border-color: var(--border-color-hover);
  color: var(--text);
}

.filter-toggle-btn.has-filters {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

.filter-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #EF4444;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
}

.filters-container {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  animation: slideDown 0.2s ease-out;
  min-width: 580px;
  max-width: 90vw;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filters-dropdown {
  padding: 20px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filters-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: #F1F5F9;
  color: var(--text);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--muted);
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-btn);
  background: #FFFFFF;
  color: var(--text);
  font-size: 13px;
  transition: all var(--transition-fast);
}

.filter-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 32px;
  cursor: pointer;
}

.filter-input:focus {
  outline: none;
  border-color: #0F172A;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
}

.filter-input::placeholder {
  color: var(--muted2);
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.apply-btn, .clear-btn {
  padding: 8px 16px;
  border-radius: var(--radius-btn);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  min-width: 80px;
}

.apply-btn {
  background: #0F172A;
  color: #FFFFFF;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.apply-btn:hover {
  background: #000000;
  transform: translateY(-0.5px);
}

.clear-btn {
  background: #FFFFFF;
  color: var(--text2);
  border: 1px solid var(--border-color);
}

.clear-btn:hover {
  background: #F8FAFC;
  border-color: var(--border-color-hover);
  color: var(--text);
}

@media (max-width: 768px) {
  .filters-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    min-width: unset;
    max-width: unset;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
  }
  
  .filters-dropdown {
    background: #FFFFFF;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    justify-content: stretch;
  }
  
  .apply-btn, .clear-btn {
    flex: 1;
  }
}
</style>
