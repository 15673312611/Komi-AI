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

<template>
  <div class="agent-performance-container">
    <div v-if="error" class="error-state">
      {{ error }}
      <button type="button" class="retry-button" @click="fetchPerformanceData">重试</button>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      正在加载效能分析数据…
    </div>

    <div v-else class="agent-performance-tabs">
      <div class="tab-buttons">
        <button 
          :class="{ active: activeTab === 'bot' }"
          @click="activeTab = 'bot'"
        >
          AI 智能体客服
        </button>
        <button 
          :class="{ active: activeTab === 'human' }"
          @click="activeTab = 'human'"
        >
          人工客服坐席
        </button>
      </div>

      <div class="tab-content">
        <!-- Bot Agents Tab -->
        <div v-if="activeTab === 'bot'" class="agents-table-container">
          <div v-if="!performanceData?.bot_agents?.length" class="no-data">
            暂无 AI 智能体效能数据
          </div>
          <table v-else class="agents-table">
            <thead>
              <tr>
                <th>智能体名称</th>
                <th>接待会话数</th>
                <th>结单会话数</th>
                <th>结单率</th>
                <th>平均评分</th>
                <th>评价次数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agent in performanceData.bot_agents" :key="agent.id">
                <td>{{ agent.name }}</td>
                <td>{{ agent.total_chats }}</td>
                <td>{{ agent.closed_chats }}</td>
                <td>{{ calculateClosureRate(agent.closed_chats, agent.total_chats) }}%</td>
                <td>
                  <div class="rating-display">
                    <span class="stars">
                      <font-awesome-icon v-for="n in 5" :key="n" :class="{ filled: n <= Math.round(agent.avg_rating) }" icon="fa-solid fa-star" />
                    </span>
                    <span class="rating-value">{{ agent.avg_rating.toFixed(1) }}</span>
                  </div>
                </td>
                <td>{{ agent.rating_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Human Agents Tab -->
        <div v-if="activeTab === 'human'" class="agents-table-container">
          <div v-if="!performanceData?.human_agents?.length" class="no-data">
            暂无人工客服效能数据
          </div>
          <table v-else class="agents-table">
            <thead>
              <tr>
                <th>客服坐席姓名</th>
                <th>接待会话数</th>
                <th>结单会话数</th>
                <th>结单率</th>
                <th>平均评分</th>
                <th>评价次数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agent in performanceData.human_agents" :key="agent.id">
                <td>{{ agent.name }}</td>
                <td>{{ agent.total_chats }}</td>
                <td>{{ agent.closed_chats }}</td>
                <td>{{ calculateClosureRate(agent.closed_chats, agent.total_chats) }}%</td>
                <td>
                  <div class="rating-display">
                    <span class="stars">
                      <font-awesome-icon v-for="n in 5" :key="n" :class="{ filled: n <= Math.round(agent.avg_rating) }" icon="fa-solid fa-star" />
                    </span>
                    <span class="rating-value">{{ agent.avg_rating.toFixed(1) }}</span>
                  </div>
                </td>
                <td>{{ agent.rating_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

interface AgentData {
  id: string
  name: string
  total_chats: number
  closed_chats: number
  avg_rating: number
  rating_count: number
}

interface PerformanceData {
  bot_agents: AgentData[]
  human_agents: AgentData[]
  time_range: string
}

const props = defineProps<{
  timeRange: string
}>()

const isLoading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('bot')
const performanceData = ref<PerformanceData | null>(null)
let requestVersion = 0

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const normalizeAgent = (raw: any, index: number): AgentData => ({
  id: String(raw?.id ?? index),
  name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name : 'Unknown User',
  total_chats: toFiniteNumber(raw?.total_chats),
  closed_chats: toFiniteNumber(raw?.closed_chats),
  avg_rating: toFiniteNumber(raw?.avg_rating),
  rating_count: toFiniteNumber(raw?.rating_count),
})

const calculateClosureRate = (closed: number, total: number): string => {
  const safeTotal = toFiniteNumber(total)
  if (safeTotal <= 0) return '0.0'
  return ((toFiniteNumber(closed) / safeTotal) * 100).toFixed(1)
}

const fetchPerformanceData = async () => {
  const version = ++requestVersion
  try {
    isLoading.value = true
    error.value = null
    const response = await api.get('/analytics/agent-performance', {
      params: { time_range: props.timeRange }
    })
    if (version === requestVersion) {
      const data = response?.data || {}
      performanceData.value = {
        bot_agents: Array.isArray(data.bot_agents) ? data.bot_agents.map(normalizeAgent) : [],
        human_agents: Array.isArray(data.human_agents) ? data.human_agents.map(normalizeAgent) : [],
        time_range: typeof data.time_range === 'string' ? data.time_range : props.timeRange,
      }
    }
  } catch (err: any) {
    if (version === requestVersion) {
      error.value = err.response?.data?.detail || 'Failed to fetch agent performance data'
    }
  } finally {
    if (version === requestVersion) isLoading.value = false
  }
}

// Watch for time range changes from parent
watch(() => props.timeRange, () => {
  void fetchPerformanceData()
})

onMounted(() => {
  void fetchPerformanceData()
})
</script>

<style scoped>
.agent-performance-container {
  padding: var(--space-lg);
}

.agent-performance-tabs {
  background: var(--background-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-buttons button {
  padding: var(--space-md) var(--space-lg);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-md);
  color: var(--text-muted);
  transition: all var(--transition-fast);
  position: relative;
}

.tab-buttons button.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-buttons button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-solid);
}

.tab-content {
  padding: var(--space-lg);
}

.agents-table-container {
  overflow-x: auto;
}

.agents-table {
  width: 100%;
  border-collapse: collapse;
}

.agents-table th,
.agents-table td {
  padding: var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.agents-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.agents-table td {
  font-size: var(--text-md);
}

.rating-display {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.stars {
  display: flex;
  gap: 2px;
}

.stars svg {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.stars svg.filled {
  color: #FFD700;
}

.rating-value {
  font-weight: 600;
}

.error-state {
  background-color: var(--error-color);
  color: white;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-secondary);
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
  font-size: var(--text-md);
}
</style>
