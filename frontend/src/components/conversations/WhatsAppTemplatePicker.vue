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
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import channelsService, { type WhatsAppTemplate } from '@/services/channels'
import { DEFAULT_LANGUAGE } from '@/utils/whatsappLanguages'
import BaseModal from '@/components/common/BaseModal.vue'
import WhatsAppTemplateSelect, {
  type TemplateSelection,
} from '@/components/conversations/WhatsAppTemplateSelect.vue'

const props = defineProps<{
  accountId: string
  sessionId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'sent', template: WhatsAppTemplate): void
}>()

const selection = ref<TemplateSelection | null>(null)
const sending = ref(false)
let sendRequest = 0
const outboundIdempotencyKey = ref('')

const newIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}

const canSend = computed(() => !!props.accountId && !!props.sessionId && !!selection.value?.complete && !sending.value)

watch(() => [props.accountId, props.sessionId], () => {
  sendRequest += 1
  selection.value = null
  sending.value = false
  outboundIdempotencyKey.value = ''
}, { immediate: true })

const send = async () => {
  if (!selection.value || !canSend.value) return
  const accountId = props.accountId
  const sessionId = props.sessionId
  const request = ++sendRequest
  const isCurrentRequest = () =>
    request === sendRequest && props.accountId === accountId && props.sessionId === sessionId
  const { template, components } = selection.value
  try {
    sending.value = true
    if (!outboundIdempotencyKey.value) outboundIdempotencyKey.value = newIdempotencyKey()
    await channelsService.sendWhatsAppTemplate(accountId, {
      session_id: sessionId,
      template_name: template.name,
      language: template.language || DEFAULT_LANGUAGE,
      components,
      idempotency_key: outboundIdempotencyKey.value,
    })
    if (!isCurrentRequest()) return
    toast.success('模板消息已发送', { description: '客户在未来 24 小时内回复即可重新激活实时会话。' })
    emit('sent', template)
    emit('close')
  } catch (error: any) {
    if (!isCurrentRequest()) return
    toast.error('发送模板消息失败', {
      description: error?.response?.data?.detail || '请重试',
      closeButton: true,
    })
  } finally {
    if (isCurrentRequest()) sending.value = false
  }
}
</script>

<template>
  <BaseModal title="发送 WhatsApp 模板消息" @close="emit('close')">
    <p class="tpl-intro">
      当前会话已超出 WhatsApp 官方 24 小时自由应答窗口，发送已审核的模板消息可重新开启与客户的沟通。
    </p>

    <WhatsAppTemplateSelect v-model:selection="selection" :account-id="accountId" />

    <template #actions>
      <button class="modal-btn" @click="emit('close')">取消</button>
      <button
        class="modal-btn modal-btn-primary"
        :disabled="!canSend"
        :aria-busy="sending"
        @click="send"
      >
        <font-awesome-icon v-if="sending" icon="fa-solid fa-spinner" spin />
        {{ sending ? '正在发送…' : '立即发送模板消息' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.tpl-intro {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
</style>
