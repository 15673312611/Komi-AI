<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { ticketService } from '@/services/tickets'
import { chatService } from '@/services/chat'
import type { ChatDetail } from '@/types/chat'
import type { TicketPriority, TicketCreatePayload } from '@/types/ticket'

const props = defineProps<{
  show: boolean
  chatInfo?: ChatDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ticket-created', ticketId: string): void
}>()

const isSubmitting = ref(false)

const title = ref('')
const customerEmail = ref('')
const customerName = ref('')
const priority = ref<TicketPriority>('medium')
const description = ref('')
const tags = ref<string[]>(['会话转工单'])
const newTagInput = ref('')

const priorities: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: '低优先级', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  { value: 'medium', label: '中等优先级', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { value: 'high', label: '高优先级', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'urgent', label: '紧急加急', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
]

watch(
  () => props.show,
  (val) => {
    if (val && props.chatInfo) {
      const cName = props.chatInfo.customer?.full_name || props.chatInfo.customer?.email || '买家'
      const cEmail = props.chatInfo.customer?.email || ''
      const storeName = (props.chatInfo.customer?.meta_data as any)?.store_name || '主店铺'
      const lastMsg = props.chatInfo.messages && props.chatInfo.messages.length > 0
        ? props.chatInfo.messages[props.chatInfo.messages.length - 1].message || ''
        : ''

      customerEmail.value = cEmail
      customerName.value = cName
      title.value = `[售后流转] 来自 ${cName} 的咨询工单`
      priority.value = 'medium'
      tags.value = ['会话转工单', '售后处理']

      description.value = [
        `【来源会话】Session ID: ${props.chatInfo.session_id}`,
        `【所属店铺】${storeName}`,
        `【客户名称】${cName} (${cEmail || '无邮箱'})`,
        `【最近留言】${lastMsg ? lastMsg.slice(0, 150) : '（无留言）'}`,
        '',
        '【详细诉求与工单处理说明】',
        '',
      ].join('\n')
    }
  },
  { immediate: true }
)

const addTag = () => {
  const val = newTagInput.value.trim()
  if (val && !tags.value.includes(val)) {
    tags.value.push(val)
    newTagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((t) => t !== tag)
}

const handleCreateTicket = async () => {
  if (!title.value.trim()) {
    toast.error('请输入工单标题')
    return
  }

  try {
    isSubmitting.value = true

    const payload: TicketCreatePayload = {
      title: title.value.trim(),
      description: description.value.trim(),
      priority: priority.value,
      customer_email: customerEmail.value.trim() || undefined,
      customer_name: customerName.value.trim() || undefined,
      session_id: props.chatInfo?.session_id,
      tags: tags.value,
    }

    const res = await ticketService.createTicket(payload)
    const ticketObj = res.ticket || (res as any)
    const ticketId = ticketObj?.id || ''
    const displayNum = ticketObj?.display_number || ticketId.slice(0, 8) || '新工单'
    
    // Auto-stamp "已转工单" tag onto the conversation
    if (props.chatInfo?.session_id) {
      try {
        const existingTags = props.chatInfo.tags || []
        if (!existingTags.includes('已转工单')) {
          await chatService.updateTags(props.chatInfo.session_id, [...existingTags, '已转工单'])
        }
      } catch {
        // non-blocking
      }
    }

    toast.success(`工单「#${displayNum}」创建成功！`)
    emit('ticket-created', ticketId)
    emit('close')
  } catch (error: any) {
    console.error('Failed to create ticket from chat:', error)
    toast.error(error.message || '创建工单失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="ticket-modal-backdrop" @click.self="emit('close')">
    <div class="ticket-modal-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon">
            <i class="fa-solid fa-ticket"></i>
          </div>
          <div>
            <h3>从当前会话创建工单</h3>
            <p>将复杂售后、物流理赔或技术争议一键流转为内部处理工单</p>
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <div class="form-item">
          <label class="form-label required">工单标题</label>
          <input
            v-model="title"
            type="text"
            placeholder="简要概括问题，如：买家要求修改收件地址/货物破损理赔"
            class="form-input"
          />
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label">客户邮箱</label>
            <input
              v-model="customerEmail"
              type="email"
              placeholder="customer@example.com"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label class="form-label">客户姓名</label>
            <input
              v-model="customerName"
              type="text"
              placeholder="客户姓名/昵称"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">工单优先级</label>
          <div class="priority-pills">
            <button
              v-for="p in priorities"
              :key="p.value"
              type="button"
              class="priority-btn"
              :class="[p.color, { selected: priority === p.value }]"
              @click="priority = p.value"
            >
              <span class="dot"></span>
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">工单分类标签</label>
          <div class="tags-container">
            <div v-for="tag in tags" :key="tag" class="tag-chip">
              <span>{{ tag }}</span>
              <button type="button" class="remove-tag" @click="removeTag(tag)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="tag-input-wrapper">
              <input
                v-model="newTagInput"
                type="text"
                placeholder="+ 添加标签 (回车)"
                class="tag-input"
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">工单描述与会话上下文</label>
          <textarea
            v-model="description"
            rows="6"
            placeholder="详细描述买家的问题诉求、订单号及需要的协作动作..."
            class="form-textarea"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')" :disabled="isSubmitting">
          取消
        </button>
        <button class="btn-submit" @click="handleCreateTicket" :disabled="isSubmitting">
          <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
          <span>{{ isSubmitting ? '正在创建...' : '确认创建工单' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ticket-modal-card {
  background: #141a24;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
  color: #fff;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: rgba(201, 242, 78, 0.12);
  color: var(--accent-ink, #C9F24E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}

.modal-header h3 {
  font-size: 16.5px;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: #fff;
}

.modal-header p {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.close-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-label.required::after {
  content: ' *';
  color: #f87171;
}

.form-input,
.form-textarea {
  background: #0b0f15;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 9px 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--accent-ink, #C9F24E);
}

.priority-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.priority-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0.6;
}

.priority-btn .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.priority-btn.selected {
  opacity: 1;
  box-shadow: 0 0 0 1px currentColor;
}

.tags-container {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 10px;
  background: #0b0f15;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  min-height: 40px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(201, 242, 78, 0.12);
  border: 1px solid rgba(201, 242, 78, 0.25);
  color: var(--accent-ink, #C9F24E);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.remove-tag {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 2px;
  font-size: 11px;
}

.tag-input-wrapper {
  flex: 1;
  min-width: 120px;
}

.tag-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 12.5px;
  outline: none;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.15);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-submit {
  background: var(--accent-ink, #C9F24E);
  color: #0b0f14;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-submit:hover {
  background: #d8fa67;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
