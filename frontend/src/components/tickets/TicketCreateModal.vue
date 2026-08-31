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
import { onBeforeUnmount, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { ticketService } from '@/services/tickets'
import { peopleService } from '@/services/people'
import type { PersonListItem } from '@/types/people'
import type { TicketDetail, TicketPriority } from '@/types/ticket'
import { PRIORITIES, priorityMeta } from './ticketMeta'

const props = defineProps<{
  open: boolean
  // Present when creating from a conversation: enables the AI-drafted prefill.
  sessionId?: string | null
  sessionLabel?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', detail: TicketDetail): void
}>()

const title = ref('')
const description = ref('')
const priority = ref<TicketPriority>('medium')
const fromConversation = ref(false)
const isDrafting = ref(false)
const isSubmitting = ref(false)

// Manual tickets have no conversation to deliver through — collecting an
// email gives notifications a direct-email path. Suggestions come from the
// org's identified People.
const customerEmail = ref('')
const customerName = ref('')
const customerSuggestions = ref<PersonListItem[]>([])
let suggestTimer: ReturnType<typeof setTimeout> | null = null
let suggestionRequestVersion = 0
let draftRequestVersion = 0

const invalidateSuggestions = () => {
  suggestionRequestVersion += 1
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = null
}

watch(customerEmail, (query) => {
  const requestVersion = ++suggestionRequestVersion
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = null
  const term = query.trim()
  if (term.length < 2) {
    customerSuggestions.value = []
    return
  }
  const matched = customerSuggestions.value.find((p) => p.email === term)
  if (matched && !customerName.value) customerName.value = matched.name || ''
  suggestTimer = setTimeout(async () => {
    suggestTimer = null
    try {
      const response = await peopleService.listPeople({ search: term, page_size: 8 })
      if (requestVersion !== suggestionRequestVersion || !props.open) return
      customerSuggestions.value = Array.isArray(response.items)
        ? response.items.filter((p) => p.email)
        : []
    } catch {
      if (requestVersion === suggestionRequestVersion) customerSuggestions.value = []
    }
  }, 300)
})

onBeforeUnmount(() => {
  invalidateSuggestions()
  draftRequestVersion += 1
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      title.value = ''
      description.value = ''
      priority.value = 'medium'
      fromConversation.value = false
      customerEmail.value = ''
      customerName.value = ''
      customerSuggestions.value = []
      if (props.sessionId) void useConversationDraft()
    } else {
      invalidateSuggestions()
      draftRequestVersion += 1
      isDrafting.value = false
    }
  },
  { immediate: true },
)

function useBlankTicket() {
  draftRequestVersion += 1
  fromConversation.value = false
  isDrafting.value = false
}

async function useConversationDraft() {
  if (!props.sessionId) return
  const requestVersion = ++draftRequestVersion
  const sessionId = props.sessionId
  fromConversation.value = true
  isDrafting.value = true
  try {
    const draft = await ticketService.draftFromSession(sessionId)
    if (requestVersion !== draftRequestVersion || !props.open || props.sessionId !== sessionId) return
    if (!title.value) title.value = draft.title
    if (!description.value) description.value = draft.description
  } catch {
    // Draft is best-effort; the form still works blank.
  } finally {
    if (requestVersion === draftRequestVersion) isDrafting.value = false
  }
}

async function submit() {
  if (!title.value.trim() || isSubmitting.value) return
  const linkSession = fromConversation.value && props.sessionId
  const email = customerEmail.value.trim()
  if (!linkSession && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error('请输入有效的客户邮箱地址')
    return
  }
  isSubmitting.value = true
  try {
    const detail = await ticketService.createTicket({
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      priority: priority.value,
      session_id: linkSession ? props.sessionId! : undefined,
      customer_email: !linkSession ? email || undefined : undefined,
      customer_name: !linkSession ? customerName.value.trim() || undefined : undefined,
    })
    toast.success(`已成功创建工单 ${detail.ticket.display_number}`)
    emit('created', detail)
    emit('close')
  } catch (e: any) {
    toast.error(e?.message || '创建工单失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click="emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">新建工单</div>
          <button class="close-btn" @click="emit('close')" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">
          <div v-if="sessionId" class="source-toggle">
            <button
              class="source-option"
              :class="{ active: !fromConversation }"
              @click="useBlankTicket"
            >
              空白工单
            </button>
            <button
              class="source-option"
              :class="{ active: fromConversation }"
              @click="useConversationDraft"
            >
              从会话提炼
            </button>
          </div>

          <div v-if="fromConversation" class="draft-note">
            <span class="draft-glyph">✎</span>
            <span v-if="isDrafting">AI 正在根据当前会话分析生成工单草稿…</span>
            <span v-else>
              已根据
              <span class="mono">{{ sessionLabel || '当前会话' }}</span>
              自动提炼草稿 — 可自由编辑修改。
            </span>
          </div>

          <label class="field-label">工单主题</label>
          <input
            v-model="title"
            class="field-input"
            placeholder="简要概括问题的核心主题…"
            maxlength="500"
          />

          <label class="field-label">详细描述</label>
          <textarea
            v-model="description"
            class="field-textarea"
            placeholder="描述具体问题、报错信息、对客户造成的影响及复现步骤…"
          ></textarea>

          <template v-if="!fromConversation">
            <label class="field-label">客户邮箱 <span class="optional">(选填 — 用于发送进展邮件通知)</span></label>
            <input
              v-model="customerEmail"
              class="field-input"
              type="email"
              list="ticket-customer-suggestions"
              placeholder="customer@company.com"
              maxlength="320"
            />
            <datalist id="ticket-customer-suggestions">
              <option
                v-for="person in customerSuggestions"
                :key="person.id"
                :value="person.email || ''"
              >
                {{ person.name || person.email }}
              </option>
            </datalist>

            <template v-if="customerEmail.trim()">
              <label class="field-label">客户姓名 <span class="optional">(选填)</span></label>
              <input
                v-model="customerName"
                class="field-input"
                placeholder="客户称呼或姓名"
                maxlength="200"
              />
            </template>
          </template>

          <label class="field-label">优先级</label>
          <div class="priority-pills">
            <button
              v-for="p in PRIORITIES"
              :key="p"
              class="priority-pill"
              :class="{ active: priority === p }"
              :style="{ '--pill-color': priorityMeta(p).color }"
              @click="priority = p"
            >
              <span class="dot"></span>{{ priorityMeta(p).label }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">取消</button>
          <button class="btn-primary" :disabled="!title.trim() || isSubmitting" @click="submit">
            {{ isSubmitting ? '正在创建…' : '确认创建工单' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--scrim, rgba(4, 5, 8, 0.62));
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 8vh 20px 20px;
}
.modal {
  width: 560px;
  max-width: 100%;
  background: var(--bg2);
  border: 1px solid var(--o12);
  border-radius: 18px;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--o07);
}
.modal-title {
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  font-size: 17px;
  color: var(--text);
}
.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
}
.modal-body {
  padding: 22px;
}
.source-toggle {
  display: flex;
  gap: 5px;
  padding: 3px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 10px;
  margin-bottom: 18px;
}
.source-option {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  cursor: pointer;
  background: transparent;
  color: var(--muted);
}
.source-option.active {
  background: var(--o08);
  color: var(--text);
  font-weight: var(--font-weight-semibold);
}
.draft-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  background: var(--accent-bg-08);
  border: 1px solid var(--accent-border);
  border-radius: 11px;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--text3);
  line-height: 1.4;
}
.draft-glyph {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.mono {
  font-family: var(--font-mono);
  color: var(--text);
}
.field-label {
  display: block;
  font-size: 11.5px;
  color: var(--faint);
  margin-bottom: 6px;
}
.optional {
  color: var(--muted2);
  font-weight: var(--font-weight-normal);
}
.field-input,
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--o10);
  border-radius: 10px;
  color: var(--text);
  font-size: 13.5px;
  outline: none;
  margin-bottom: 16px;
}
.field-textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.5;
}
.priority-pills {
  display: flex;
  gap: 8px;
}
.priority-pill {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  border: 1px solid var(--o10);
  background: var(--surface);
  color: var(--muted);
}
.priority-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--pill-color);
}
.priority-pill.active {
  border-color: var(--pill-color);
  color: var(--pill-color);
  background: var(--o05);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--o07);
  background: var(--surface);
}
.btn-secondary {
  padding: 9px 17px;
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--text);
  border-radius: 9px;
  font-size: 13px;
  cursor: pointer;
}
.btn-primary {
  padding: 9px 20px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
