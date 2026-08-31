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
import { onMounted } from 'vue'
import type { TicketListFilters } from '@/types/ticket'
import { useUsers } from '@/composables/useUsers'

const props = defineProps<{ filters: TicketListFilters }>()
const emit = defineEmits<{
  (e: 'update:filters', filters: TicketListFilters): void
}>()

const updateFilter = <K extends keyof TicketListFilters>(key: K, value: TicketListFilters[K]) => {
  emit('update:filters', { ...props.filters, [key]: value })
}

const STATUS_PILLS = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'awaiting', label: '待审批' },
  { value: 'breaching', label: 'SLA 即将超时' },
  { value: 'resolved', label: '已解决' },
]

const AI_PILLS = [
  { value: 'all', label: '全部 AI 阶段', color: 'var(--muted)' },
  { value: 'investigating', label: '调查中', color: 'var(--c-info)' },
  { value: 'awaiting', label: '待人工接入', color: 'var(--c-warn)' },
  { value: 'human', label: '人工跟进中', color: 'var(--c-neutral)' },
  { value: 'resolved', label: 'AI 已自主解决', color: 'var(--c-positive)' },
]

const { users, fetchUsers } = useUsers()
onMounted(() => {
  fetchUsers().catch(() => {})
})
</script>

<template>
  <div class="filter-bar">
    <div class="pill-group">
      <button
        v-for="pill in STATUS_PILLS"
        :key="pill.value"
        class="pill"
        :class="{ active: filters.status === pill.value }"
        @click="updateFilter('status', pill.value)"
      >
        {{ pill.label }}
      </button>
    </div>

    <select :value="filters.priority" class="filter-select" @change="updateFilter('priority', ($event.target as HTMLSelectElement).value)">
      <option value="all">优先级 · 全部</option>
      <option value="urgent">紧急</option>
      <option value="high">高</option>
      <option value="medium">中</option>
      <option value="low">低</option>
    </select>

    <select :value="filters.assignee" class="filter-select" @change="updateFilter('assignee', ($event.target as HTMLSelectElement).value)">
      <option value="all">处理人 · 全部</option>
      <option value="unassigned">未分配 / AI 智能体</option>
      <option v-for="user in users" :key="user.id" :value="user.id">
        {{ user.full_name || user.email }}
      </option>
    </select>

    <div class="pill-group">
      <button
        v-for="pill in AI_PILLS"
        :key="pill.value"
        class="pill with-dot"
        :class="{ active: filters.ai === pill.value }"
        @click="updateFilter('ai', pill.value)"
      >
        <span class="dot" :style="{ background: pill.color }"></span>{{ pill.label }}
      </button>
    </div>

    <div class="search-wrap">
      <span class="search-glyph"></span>
      <input :value="filters.search" class="search-input" placeholder="搜索工单标题、编号或描述..." @input="updateFilter('search', ($event.target as HTMLInputElement).value)" />
    </div>

    <select :value="filters.sort" class="filter-select" @change="updateFilter('sort', ($event.target as HTMLSelectElement).value)">
      <option value="updated">排序 · 最近更新</option>
      <option value="created">最新创建</option>
      <option value="priority">优先级最高</option>
    </select>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.pill-group {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 10px;
}
.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  background: transparent;
  color: var(--muted);
}
.pill.active {
  background: var(--o10);
  color: var(--text);
  font-weight: var(--font-weight-semibold);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.filter-select {
  padding: 8px 11px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 9px;
  color: var(--text);
  font-size: 12.5px;
  cursor: pointer;
}
.search-wrap {
  position: relative;
  margin-left: auto;
}
.search-glyph {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--faint);
  border-radius: 50%;
}
.search-input {
  width: 190px;
  padding: 8px 12px 8px 30px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 9px;
  color: var(--text);
  font-size: 12.5px;
  outline: none;
}
.search-input:focus {
  border-color: var(--o16);
}
</style>
