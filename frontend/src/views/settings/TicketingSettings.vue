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
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useTicketingSettings } from '@/composables/useTicketingSettings'
import { PRIORITIES, priorityMeta } from '@/components/tickets/ticketMeta'
import TicketConnectorsSection from '@/components/tickets/TicketConnectorsSection.vue'
import TicketDbConnectorsSection from '@/components/tickets/TicketDbConnectorsSection.vue'
import { apiPath } from '@/config/api'
import { userService } from '@/services/user'
import type { SlaTarget, TicketPriority } from '@/types/ticket'

const { settings, isLoading, isSaving, error, planGated, save } = useTicketingSettings()

// Autonomy cards: each enumerates exactly what the AI may do at that level.
const AUTONOMY_CARDS = [
  {
    level: 1,
    tier: 'L1',
    title: '仅辅助调查',
    caps: [
      { label: '智能分诊与深度调查', ok: true },
      { label: '提出处置方案', ok: false },
      { label: '直接发送回复给客户', ok: false },
      { label: '自动关闭归档工单', ok: false },
    ],
    warn: false,
    disabled: false,
  },
  {
    level: 2,
    tier: 'L2',
    title: '提出预案，人工审批',
    caps: [
      { label: '智能分诊与深度调查', ok: true },
      { label: '提出处置方案', ok: true },
      { label: '直接发送回复给客户', ok: false },
      { label: '自动关闭归档工单', ok: false },
    ],
    warn: false,
    disabled: false,
  },
  {
    level: 3,
    tier: 'L3',
    title: '自主解决并通知客户',
    caps: [
      { label: '智能分诊与深度调查', ok: true },
      { label: '提出处置方案', ok: true },
      { label: '直接发送回复给客户', ok: true },
      { label: '自动关闭归档工单', ok: true },
    ],
    warn: true,
    disabled: false,
  },
]

const webhookUrl = computed(() => {
  if (!settings.value?.alert_webhook_enabled || !settings.value?.alert_webhook_secret) return null
  const orgId = userService.getCurrentUser()?.organization_id
  if (!orgId) return null
  return apiPath(`/tickets/webhooks/alerts/${orgId}/${settings.value.alert_webhook_secret}`)
})

function copyWebhookUrl() {
  if (!webhookUrl.value) return
  navigator.clipboard
    .writeText(webhookUrl.value)
    .then(() => toast.success('Webhook 告警接收地址已复制到剪贴板'))
    .catch(() => {})
}

const DEFAULT_SLA: Record<TicketPriority, SlaTarget> = {
  urgent: { first_response_minutes: 15, resolution_minutes: 120 },
  high: { first_response_minutes: 30, resolution_minutes: 240 },
  medium: { first_response_minutes: 120, resolution_minutes: 1440 },
  low: { first_response_minutes: 480, resolution_minutes: 4320 },
}

// Deep copy per priority: a shallow spread would alias the nested SlaTarget
// objects, so edits would mutate the baseline and isDirty could never fire.
const cloneSla = (targets?: Record<TicketPriority, SlaTarget> | null) =>
  Object.fromEntries(
    PRIORITIES.map((p) => [p, { ...(targets?.[p] || DEFAULT_SLA[p]) }]),
  ) as Record<TicketPriority, SlaTarget>

const slaDraft = ref<Record<TicketPriority, SlaTarget>>(cloneSla())
const createdTemplate = ref('')
const resolvedTemplate = ref('')
const confirmationTimeout = ref(72)

watch(settings, (next) => {
  if (!next) return
  slaDraft.value = cloneSla(next.sla_targets)
  createdTemplate.value = next.created_template || defaultCreated
  resolvedTemplate.value = next.resolved_template || defaultResolved
  confirmationTimeout.value = next.confirmation_timeout_hours
})

const defaultCreated =
  "尊敬的 [customer]，您好！我们已为您创建工单 [ticket]，专属技术团队已在加急跟进处理，有最新进展将第一时间通知您。"
const defaultResolved =
  "尊敬的 [customer]，您好！工单 [ticket] 已处理完成。以上是本次问题的根本原因与解决措施说明。如有任何疑问可随时回复此通知。"

const preview = (template: string) =>
  template.replace(/\[customer\]/g, '张先生').replace(/\[ticket\]/g, 'TKT-2038')

const isDirty = computed(() => {
  if (!settings.value) return false
  return (
    JSON.stringify(slaDraft.value) !== JSON.stringify(cloneSla(settings.value.sla_targets)) ||
    createdTemplate.value !== (settings.value.created_template || defaultCreated) ||
    resolvedTemplate.value !== (settings.value.resolved_template || defaultResolved) ||
    confirmationTimeout.value !== settings.value.confirmation_timeout_hours
  )
})

function saveAll() {
  save({
    sla_targets: slaDraft.value,
    created_template: createdTemplate.value,
    resolved_template: resolvedTemplate.value,
    confirmation_timeout_hours: confirmationTimeout.value,
  })
}
</script>

<template>
  <DashboardLayout>
  <div class="ticketing-settings">
    <div class="page-header">
      <h1 class="page-title">工单与 AI 自动化设置</h1>
      <p class="page-subtitle">
        精确控制 AI 智能体的自主权限边界 — 所有高危操作均受自治等级与风控规则严格约束。
      </p>
    </div>

    <div v-if="isLoading" class="state-msg">正在加载配置…</div>
    <div v-else-if="planGated || error" class="state-msg">{{ error }}</div>

    <template v-else-if="settings">
      <!-- AUTONOMY -->
      <section class="section">
        <h2 class="section-title">AI 自治等级 (Autonomy Level)</h2>
        <p class="section-hint">
          AI 绝不会超出设定的权限范围执行动作，所有推理与操作均记录不可篡改的审计日志。
        </p>
        <div class="autonomy-grid">
          <div
            v-for="card in AUTONOMY_CARDS"
            :key="card.level"
            class="autonomy-card"
            :class="{
              selected: settings.autonomy_level === card.level,
              disabled: card.disabled,
            }"
            @click="!card.disabled && save({ autonomy_level: card.level })"
          >
            <div class="card-head">
              <span class="radio" :class="{ on: settings.autonomy_level === card.level }">
                <span class="radio-dot"></span>
              </span>
              <span class="tier">{{ card.tier }}</span>
              <span v-if="card.disabled" class="soon-tag">敬请期待</span>
            </div>
            <div class="card-title">{{ card.title }}</div>
            <div class="caps">
              <div v-for="cap in card.caps" :key="cap.label" class="cap" :class="{ off: !cap.ok }">
                <span class="cap-icon" :class="cap.ok ? 'yes' : 'no'">
                  <font-awesome-icon :icon="['fas', cap.ok ? 'check' : 'xmark']" />
                </span>
                {{ cap.label }}
              </div>
            </div>
            <div
              v-if="card.warn && settings.autonomy_level === card.level"
              class="warn-note"
            >
              ⚠ 在此等级下 AI 将直接向客户发送解决答复并自动关单。请仅在流程标准化、低风险的业务队列中开启。
            </div>
          </div>
        </div>
        <label class="toggle-row">
          <input
            type="checkbox"
            :checked="settings.auto_investigate_on_create"
            @change="save({ auto_investigate_on_create: ($event.target as HTMLInputElement).checked })"
          />
          工单创建后自动启动 AI 智能分诊与深度调查
        </label>
      </section>

      <!-- SLA -->
      <section class="section">
        <h2 class="section-title">SLA 服务等级承诺考核指标</h2>
        <div class="sla-table">
          <div class="sla-head">
            <span>优先级</span><span>首次响应时效目标 (分钟)</span><span>最终解决时效目标 (分钟)</span>
          </div>
          <div v-for="p in PRIORITIES" :key="p" class="sla-row">
            <span class="sla-priority" :style="{ color: priorityMeta(p).color }">
              <span class="dot" :style="{ background: priorityMeta(p).color }"></span>
              {{ priorityMeta(p).label }}
            </span>
            <input v-model.number="slaDraft[p].first_response_minutes" type="number" min="1" class="sla-input" />
            <input v-model.number="slaDraft[p].resolution_minutes" type="number" min="1" class="sla-input" />
          </div>
        </div>
      </section>

      <!-- CUSTOMER COMMS -->
      <section class="section">
        <div class="section-head-row">
          <h2 class="section-title">客户通知与消息模板</h2>
          <label class="toggle-row inline">
            <input
              type="checkbox"
              :checked="settings.csat_enabled"
              @change="save({ csat_enabled: ($event.target as HTMLInputElement).checked })"
            />
            工单解决后自动向客户发起满意度评价 (CSAT)
          </label>
        </div>
        <p class="section-hint">
          邮件通知将通过您已连接的发信邮箱发出 — 可在
          <router-link to="/settings/integrations" class="hint-link">渠道与集成</router-link>
          中绑定企业自定义域名邮箱；未配置时将使用平台系统发信地址。
        </p>
        <div class="template-grid">
          <div class="template-card">
            <div class="card-label">模板 · 工单创建通知</div>
            <textarea v-model="createdTemplate" class="template-input"></textarea>
            <div class="card-label">效果预览</div>
            <div class="template-preview">{{ preview(createdTemplate) }}</div>
          </div>
          <div class="template-card">
            <div class="card-label">模板 · 工单解决通知</div>
            <textarea v-model="resolvedTemplate" class="template-input"></textarea>
            <div class="card-label">效果预览</div>
            <div class="template-preview">{{ preview(resolvedTemplate) }}</div>
          </div>
        </div>
        <div class="timeout-row">
          <span class="timeout-label">
            在客户未回复的情况下，解决后等待
          </span>
          <input v-model.number="confirmationTimeout" type="number" min="1" max="720" class="sla-input" />
          <span class="timeout-label">小时后自动关闭归档工单</span>
        </div>
      </section>

      <!-- CONNECTORS -->
      <section class="section">
        <div class="section-head-row">
          <h2 class="section-title">遥测与监控数据源连接器</h2>
          <span class="mcp-tag">基于 MCP 协议</span>
        </div>
        <p class="section-hint">
          为 AI 提供只读访问日志、监控指标与错误堆栈的能力。选中的连接器将在每次 AI 深度调查中自动挂载。
        </p>
        <TicketConnectorsSection
          :selected-ids="settings.investigation_mcp_tool_ids || []"
          @update:selected-ids="(ids: number[]) => save({ investigation_mcp_tool_ids: ids })"
        />
      </section>

      <!-- GUARDRAILED DATABASE ACCESS -->
      <section class="section">
        <div class="section-head-row">
          <h2 class="section-title">业务数据库连接器</h2>
          <span class="lock-chip">
            <font-awesome-icon :icon="['fas', 'lock']" />
            严格只读 — AI 绝无写入或修改权限
          </span>
        </div>
        <p class="section-hint">
          允许 AI 调查员直接在业务数据库中核验客观事实。仅支持白名单数据表只读 SELECT，敏感字段由脱敏掩码拦截，所有 SQL 均经过 AST 校验、强制 LIMIT 与审计留痕。
        </p>
        <TicketDbConnectorsSection />
      </section>

      <!-- ALERT WEBHOOK -->
      <section class="section">
        <div class="section-head-row">
          <h2 class="section-title">监控告警 Webhook 接入</h2>
          <label class="toggle-row inline">
            <input
              type="checkbox"
              :checked="settings.alert_webhook_enabled"
              @change="save({ alert_webhook_enabled: ($event.target as HTMLInputElement).checked })"
            />
            已启用
          </label>
        </div>
        <p class="section-hint">
          可将 Grafana、Datadog、CloudWatch 等系统的告警 Webhook 指向此处 — 产生告警时将自动创建工单并发起主动调查，在客户报障前先发处置。
        </p>
        <div v-if="webhookUrl" class="webhook-row">
          <code class="webhook-url">{{ webhookUrl }}</code>
          <button class="copy-webhook" @click="copyWebhookUrl">复制</button>
        </div>
      </section>

      <!-- JIRA ESCALATION -->
      <section class="section">
        <div class="section-head-row">
          <h2 class="section-title">Jira 缺陷同步升级</h2>
          <label class="toggle-row inline">
            <input
              type="checkbox"
              :checked="settings.jira_escalation_enabled"
              @change="save({ jira_escalation_enabled: ($event.target as HTMLInputElement).checked })"
            />
            已启用
          </label>
        </div>
        <p class="section-hint">
          单向同步：达到或超过指定优先级的工单将自动同步创建 Jira Issue 任务。
        </p>
        <div v-if="settings.jira_escalation_enabled" class="jira-row">
          <span class="timeout-label">同步升级触发条件：工单优先级达到</span>
          <select
            class="sla-input jira-select"
            :value="settings.jira_escalation_priority || 'urgent'"
            @change="save({ jira_escalation_priority: ($event.target as HTMLSelectElement).value as TicketPriority })"
          >
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ priorityMeta(p).label }} 及以上</option>
          </select>
        </div>
      </section>

      <div class="save-bar" v-if="isDirty">
        <button class="save-btn" :disabled="isSaving" @click="saveAll">
          {{ isSaving ? '正在保存…' : '保存设置更改' }}
        </button>
      </div>
    </template>
  </div>
  </DashboardLayout>
</template>

<style scoped>
.ticketing-settings {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 30px 70px;
}
.page-header {
  margin-bottom: 26px;
}
.page-title {
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  font-size: 25px;
  letter-spacing: var(--tracking-display);
  margin: 0 0 4px;
  color: var(--text);
}
.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.state-msg {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 15px;
}
.section {
  margin-bottom: 34px;
}
.section-title {
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  margin: 0 0 4px;
  color: var(--text);
}
.section-hint {
  margin: 0 0 16px;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.5;
}
.hint-link {
  color: var(--accent-ink);
  text-decoration: none;
}
.hint-link:hover {
  text-decoration: underline;
}
.section-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.autonomy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.autonomy-card {
  border: 1.5px solid var(--o08);
  background: var(--surface);
  border-radius: 15px;
  padding: 17px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.autonomy-card.selected {
  border-color: var(--accent-ink);
  background: var(--accent-bg-06);
}
.autonomy-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}
.radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--o20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.radio.on {
  border-color: var(--accent-ink);
}
.radio-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: transparent;
}
.radio.on .radio-dot {
  background: var(--accent-ink);
}
.tier {
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  font-size: 13px;
  color: var(--muted2);
}
.autonomy-card.selected .tier {
  color: var(--accent-ink);
}
.soon-tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--faint);
  background: var(--o05);
  border: 1px solid var(--o08);
  padding: 2px 7px;
  border-radius: 20px;
}
.card-title {
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  font-size: 15px;
  margin-bottom: 12px;
  color: var(--text);
}
.caps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text3);
}
.cap.off {
  color: var(--faint);
}
.cap-icon {
  width: 15px;
  height: 15px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}
.cap-icon.yes {
  background: color-mix(in srgb, var(--c-positive) 15%, transparent);
  color: var(--c-positive);
}
.cap-icon.no {
  background: color-mix(in srgb, var(--c-danger) 12%, transparent);
  color: var(--c-danger);
}
.warn-note {
  margin-top: 13px;
  display: flex;
  gap: 8px;
  padding: 9px 11px;
  background: color-mix(in srgb, var(--c-warn) 12%, transparent);
  border: 1px solid var(--c-warn);
  border-radius: 10px;
  font-size: 11.5px;
  color: var(--c-warn);
  line-height: 1.45;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: var(--text3);
  cursor: pointer;
}
.toggle-row.inline {
  font-size: 12.5px;
  color: var(--muted);
}
.sla-table {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 14px;
  overflow: hidden;
}
.sla-head,
.sla-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  padding: 11px 18px;
  align-items: center;
}
.sla-head {
  border-bottom: 1px solid var(--o07);
  background: var(--o03);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
}
.sla-row {
  border-bottom: 1px solid var(--o06);
}
.sla-row:last-child {
  border-bottom: none;
}
.sla-priority {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
}
.sla-input {
  width: 100px;
  padding: 7px 10px;
  background: var(--bg2);
  border: 1px solid var(--o08);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  outline: none;
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}
.template-card {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 14px;
  padding: 16px;
}
.card-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 10px;
}
.template-input {
  width: 100%;
  min-height: 76px;
  resize: vertical;
  background: var(--bg2);
  border: 1px solid var(--o08);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 12.5px;
  line-height: 1.5;
  outline: none;
  margin-bottom: 12px;
}
.template-preview {
  background: var(--bubble-ai-bg, var(--bg2));
  border: 1px solid var(--o07);
  border-radius: 10px 10px 10px 3px;
  padding: 11px 13px;
  font-size: 12.5px;
  color: var(--text3);
  line-height: 1.5;
}
.timeout-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.timeout-label {
  font-size: 13px;
  color: var(--text3);
}
.mcp-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  color: var(--c-teal);
  background: var(--teal-bg-10);
  padding: 2px 8px;
  border-radius: 20px;
}
.lock-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted2);
  background: var(--o05);
  border: 1px solid var(--o08);
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.webhook-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.webhook-url {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 9px;
  padding: 9px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-webhook {
  padding: 8px 14px;
  background: var(--accent-bg-08);
  border: none;
  color: var(--accent-ink);
  border-radius: 9px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.jira-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.jira-select {
  width: auto;
  font-family: inherit;
}
.save-bar {
  position: sticky;
  bottom: 20px;
  display: flex;
  justify-content: flex-end;
}
.save-btn {
  padding: 11px 22px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: 0 8px 30px -8px rgba(0, 0, 0, 0.4);
}
.save-btn:disabled {
  opacity: 0.5;
}
@media (max-width: 800px) {
  .autonomy-grid,
  .template-grid {
    grid-template-columns: 1fr;
  }
}
</style>
