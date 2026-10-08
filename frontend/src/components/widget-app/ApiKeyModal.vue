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
import { ClipboardIcon, CheckIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import { toast } from 'vue-sonner'
import { copyTextToClipboard } from '@/utils/clipboard'

const props = defineProps<{
  apiKey: string
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

const copyToClipboard = async () => {
  try {
    if (!(await copyTextToClipboard(props.apiKey))) {
      toast.error('复制失败', {
        description: '请手动选中文本复制',
        duration: 2000
      })
      return
    }
    copied.value = true
    toast.success('复制成功！', {
      description: 'API 密钥已复制到剪贴板',
      duration: 2000
    })
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    toast.error('复制失败', {
      description: '请手动选中文本复制',
      duration: 2000
    })
  }
}
</script>

<template>
  <Modal @close="emit('close')">
    <template #title>API 密钥已生成</template>
    <template #content>
      <div class="api-key-modal">
        <div class="warning-banner">
          <strong>⚠️ 请立即妥善保存此密钥！</strong>
          <p>出于安全原因，此 API 密钥仅完整展示这一次，后续系统将无法再次查看。</p>
        </div>

        <div class="key-container">
          <label>API 密钥 (API Key)：</label>
          <div class="key-display">
            <code class="api-key">{{ apiKey }}</code>
            <button
              class="copy-button"
              @click="copyToClipboard"
              :title="copied ? '已复制！' : '复制到剪贴板'"
            >
              <CheckIcon v-if="copied" class="icon success" />
              <ClipboardIcon v-else class="icon" />
            </button>
          </div>
        </div>

        <div class="instructions">
          <h4>后续接入指引：</h4>
          <ol>
            <li>复制并安全保存此 API 密钥至您的业务服务端环境中</li>
            <li>用于调用接口以生成聊天挂件认证会话 Token</li>
            <li>在 HTTP 请求头中添加认证：<code>Authorization: Bearer {{ apiKey.substring(0, 20) }}...</code></li>
          </ol>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="emit('close')">
            我已妥善保存密钥
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.api-key-modal {
  padding: var(--space-md);
  max-width: 600px;
}

.warning-banner {
  background: var(--warning-bg);
  border: 1px solid var(--warning-color);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.warning-banner strong {
  display: block;
  color: var(--warning-color);
  margin-bottom: var(--space-xs);
}

.warning-banner p {
  margin: 0;
  font-size: var(--text-sm);
}

.key-container {
  margin-bottom: var(--space-lg);
}

.key-container label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--space-sm);
}

.key-display {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.api-key {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: var(--text-sm);
  word-break: break-all;
  user-select: all;
}

.copy-button {
  padding: var(--space-xs);
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-normal);
}

.copy-button:hover {
  background: var(--hover-bg);
}

.icon {
  width: 20px;
  height: 20px;
  color: var(--text-color);
}

.icon.success {
  color: var(--success-color);
}

.instructions {
  background: var(--info-bg);
  border: 1px solid var(--info-color);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.instructions h4 {
  margin-top: 0;
  margin-bottom: var(--space-sm);
  color: var(--info-color);
}

.instructions ol {
  margin: 0;
  padding-left: var(--space-lg);
}

.instructions li {
  margin-bottom: var(--space-xs);
  font-size: var(--text-sm);
}

.instructions code {
  background: var(--code-bg);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
