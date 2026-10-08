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
import { ref } from 'vue'
import type { WidgetApp, WidgetAppCreate } from '@/types/widget-app'

const props = defineProps<{
  app?: WidgetApp | null
  submitting?: boolean
}>()

// Always emit WidgetAppCreate since the form requires name
// The parent component uses this for both create and update operations
const emit = defineEmits<{
  submit: [data: WidgetAppCreate]
  cancel: []
}>()

const name = ref(props.app?.name || '')
const description = ref(props.app?.description || '')
const error = ref('')

const handleSubmit = () => {
  if (props.submitting) return
  error.value = ''

  if (!name.value.trim()) {
    error.value = '应用名称为必填项'
    return
  }

  if (name.value.length > 100) {
    error.value = '应用名称长度不能超过 100 个字符'
    return
  }

  if (description.value && description.value.length > 500) {
    error.value = '应用描述长度不能超过 500 个字符'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim() || undefined
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="widget-app-form">
    <div class="form-group">
      <label for="name">应用名称 <span class="required">*</span></label>
      <input
        id="name"
        v-model="name"
        type="text"
        placeholder="例如：营销官网主站、移动端 H5 挂件"
        maxlength="100"
        required
      />
      <span class="hint">为该挂件凭证指定一个易于识别的名称</span>
    </div>

    <div class="form-group">
      <label for="description">应用描述 (选填)</label>
      <textarea
        id="description"
        v-model="description"
        placeholder="该挂件将嵌入到哪个网站或业务场景？"
        maxlength="500"
        rows="3"
      />
      <span class="hint">选填，便于团队了解该密钥的应用场景与用途</span>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="props.submitting">
        {{ props.submitting ? '正在保存...' : (app ? '更新应用' : '立即创建') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.widget-app-form {
  padding: 0;
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  margin-bottom: 9px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
}

.required {
  color: var(--c-coral);
}

.form-group input,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 15px;
  background: var(--bg);
  border: 1px solid var(--o12);
  border-radius: var(--radius-input);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14.5px;
}

.form-group textarea {
  resize: vertical;
  line-height: 1.5;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--faint);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-ink);
  box-shadow: var(--ring-focus);
}

.hint {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.error-message {
  padding: var(--space-sm) var(--space-md);
  background: var(--error-bg);
  color: var(--error-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: var(--space-lg);
}

.btn {
  padding: 12px 22px;
  border-radius: var(--radius-btn);
  font-family: var(--font-sans);
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast), filter var(--transition-fast);
}

.btn-primary {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
}

.btn-primary:hover {
  filter: brightness(1.05);
}

.btn-secondary {
  background: var(--o05);
  border: 1px solid var(--o14);
  color: var(--text);
}

.btn-secondary:hover {
  background: var(--o10);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
