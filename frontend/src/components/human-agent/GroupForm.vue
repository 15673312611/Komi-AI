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
import type { UserGroup } from '@/types/user'

const props = defineProps<{
  group?: UserGroup | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [groupData: Partial<UserGroup>]
  cancel: []
}>()

const formData = ref({
  name: props.group?.name || '',
  description: props.group?.description || ''
})
const error = ref('')

const handleSubmit = () => {
  if (props.submitting) return
  const name = formData.value.name.trim()
  if (!name) {
    error.value = '业务组名称不能为空'
    return
  }
  error.value = ''
  emit('submit', {
    name,
    description: formData.value.description.trim() || undefined
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="group-form">
    <div class="form-group">
      <label for="name">业务组名称</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        placeholder="如：售前咨询组 / 跨境物流售后组"
        required
        class="form-input"
      />
      <span v-if="error" class="form-error">{{ error }}</span>
    </div>

    <div class="form-group">
      <label for="description">业务组描述说明</label>
      <textarea
        id="description"
        v-model="formData.description"
        placeholder="简要说明该业务组负责接待的业务场景（选填）"
        class="form-input"
        rows="3"
      />
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="props.submitting">
        {{ props.submitting ? '正在保存...' : (props.group ? '保存修改' : '确认创建') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.group-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-input {
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.form-error {
  color: var(--error-color);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
