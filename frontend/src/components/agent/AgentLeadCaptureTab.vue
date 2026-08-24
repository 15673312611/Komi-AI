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
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { leadCaptureService } from '@/services/leadCapture'
import crmService, { type CrmConnection } from '@/services/crm'
import type { LeadCaptureConfig, LeadField } from '@/types/leadCapture'

const props = defineProps<{ agentId: string }>()

const loading = ref(true)
const saving = ref(false)

const enabled = ref(false)
const requireConsent = ref(true)
const guidance = ref('')
const fields = ref<LeadField[]>([])
const assignmentMode = ref('none')
const crmSyncTarget = ref('none')
const slackNotifyEnabled = ref(false)

// Org-level CRM connections, to warn when the chosen target isn't connected.
// Loaded best-effort: a 403 (plan) or error just means no warning is shown.
const crmConnections = ref<CrmConnection[]>([])
const crmTargetUnconnected = computed(() =>
  crmSyncTarget.value !== 'none' &&
  !crmConnections.value.some(c => c.provider === crmSyncTarget.value && c.status === 'active')
)
const crmTargetName = computed(() =>
  ({ hubspot: 'HubSpot', pipedrive: 'Pipedrive' } as Record<string, string>)[crmSyncTarget.value] || crmSyncTarget.value
)

const STANDARD_FIELDS: { key: string; label: string }[] = [
  { key: 'email', label: '电子邮箱 (Email)' },
  { key: 'name', label: '联系人姓名 (Name)' },
  { key: 'company', label: '所属企业/店铺 (Company)' },
  { key: 'phone', label: '手机电话 (Phone)' },
]

// --- Fields ---
function isStandardEnabled(key: string) {
  return fields.value.some(f => f.standard && f.key === key && f.enabled)
}
function toggleStandard(key: string) {
  const existing = fields.value.find(f => f.standard && f.key === key)
  if (existing) existing.enabled = !existing.enabled
  else fields.value.push({ key, standard: true, enabled: true, required: key === 'email' })
}
function isRequired(key: string) {
  return !!fields.value.find(f => f.key === key)?.required
}
// Toggle a field's "required" flag. Email is always required (the minimum needed
// to record a lead) and cannot be made optional.
function toggleRequired(key: string) {
  if (key === 'email') return
  const f = fields.value.find(x => x.key === key)
  if (f) f.required = !f.required
}
const customFields = computed(() => fields.value.filter(f => !f.standard))
const newFieldLabel = ref('')
const newFieldOptions = ref('')
function addCustomField() {
  const label = newFieldLabel.value.trim()
  if (!label) { toast.error('Enter a field label'); return }
  // Slug from the label; fall back to an index when the label has no a–z0–9 chars
  // (e.g. non-Latin scripts) so the key is never a bare "custom_". Ensure uniqueness
  // since record_lead_capture keys off field.key and duplicates would overwrite.
  let slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  let key = 'custom_' + (slug || 'field')
  if (fields.value.some(f => f.key === key)) {
    let n = 2
    while (fields.value.some(f => f.key === `${key}_${n}`)) n++
    key = `${key}_${n}`
  }
  const field: LeadField = { key, standard: false, enabled: true, required: false, label }
  const opts = newFieldOptions.value.split(',').map(s => s.trim()).filter(Boolean)
  if (opts.length) field.options = opts
  fields.value.push(field)
  newFieldLabel.value = ''; newFieldOptions.value = ''
}
function removeCustomField(key: string) {
  const i = fields.value.findIndex(f => f.key === key && !f.standard)
  if (i >= 0) fields.value.splice(i, 1)
}
function seedDefaultsIfEmpty() {
  if (fields.value.length === 0) {
    fields.value = [
      { key: 'email', standard: true, enabled: true, required: true },
      { key: 'name', standard: true, enabled: true, required: false },
      { key: 'company', standard: true, enabled: false, required: false },
      { key: 'phone', standard: true, enabled: false, required: false },
    ]
  }
}

// --- Preview derivations ---
const enabledFieldLabels = computed(() =>
  fields.value.filter(f => f.enabled).map(f => {
    if (f.standard) return (STANDARD_FIELDS.find(s => s.key === f.key)?.label) || f.key
    return f.label || f.key
  })
)
const firstAskLabel = computed(() => (enabledFieldLabels.value[0] || 'email').toLowerCase())

async function load() {
  loading.value = true
  try {
    const cfg = await leadCaptureService.getConfig(props.agentId)
    enabled.value = !!cfg.enabled
    requireConsent.value = cfg.require_consent !== false
    guidance.value = cfg.guidance || ''
    fields.value = cfg.fields || []
    assignmentMode.value = cfg.assignment_mode || 'none'
    crmSyncTarget.value = cfg.crm_sync_target || 'none'
    slackNotifyEnabled.value = !!cfg.slack_notify_enabled
    seedDefaultsIfEmpty()
  } catch {
    toast.error('Failed to load lead capture settings')
  } finally {
    loading.value = false
  }
  try {
    crmConnections.value = await crmService.listConnections()
  } catch {
    crmConnections.value = []  // plan-gated or unavailable — just no warning
  }
}

async function save() {
  saving.value = true
  try {
    const updated: LeadCaptureConfig = await leadCaptureService.updateConfig(props.agentId, {
      enabled: enabled.value,
      require_consent: requireConsent.value,
      guidance: guidance.value.trim() || null,
      fields: fields.value,
      assignment_mode: assignmentMode.value as any,
      assignment_target_user_id: null,
      crm_sync_target: crmSyncTarget.value as any,
      slack_notify_enabled: slackNotifyEnabled.value,
    })
    enabled.value = !!updated.enabled
    toast.success('Lead capture settings saved')
  } catch {
    toast.error('Failed to save lead capture settings')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="lead-capture-tab" v-if="!loading">
    <div class="lc-header">
      <div>
        <h3 class="lc-title">线索收集与意向留资 (Lead capture)</h3>
        <p class="lc-sub">开启后，智能体将在对话交流中自然挖掘意向并引导客户留资 — 先帮客户解决问题，再在最恰当的时机询问联系方式，无感高效，无需繁琐表单。</p>
      </div>
      <button class="lc-save" :disabled="saving" @click="save">{{ saving ? '正在保存…' : '保存线索配置' }}</button>
    </div>

    <div class="lc-grid">
      <!-- LEFT: config -->
      <div class="lc-left">
        <!-- Master toggle -->
        <section class="lc-card">
          <div class="lc-toggle-row">
            <div>
              <div class="lc-toggle-title">启用智能线索收集</div>
              <div class="lc-toggle-desc">智能体将根据上下文自主判断留资时机，以自然对话的形式收集买家或访客信息。</div>
            </div>
            <button class="lc-switch" :class="{ on: enabled }" @click="enabled = !enabled" :aria-pressed="enabled">
              <span class="lc-knob"></span>
            </button>
          </div>
        </section>

        <template v-if="enabled">
          <!-- What to collect -->
          <section class="lc-card">
            <h4 class="lc-card-title">需要收集的信息字段</h4>
            <p class="lc-card-sub">智能客服将在对话中循序渐进地询问这些信息，并转化为结构化线索记录。您也可以随时添加自定义字段。</p>
            <div class="lc-chips">
              <button
                v-for="sf in STANDARD_FIELDS" :key="sf.key"
                class="lc-chip" :class="{ on: isStandardEnabled(sf.key) }"
                @click="toggleStandard(sf.key)"
              >
                <span class="lc-cbox" :class="{ on: isStandardEnabled(sf.key) }">
                  <svg v-if="isStandardEnabled(sf.key)" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span class="lc-chip-label">{{ sf.label }}</span>
                <span v-if="sf.key === 'email'" class="lc-req">必填</span>
                <span
                  v-else-if="isStandardEnabled(sf.key)"
                  class="lc-req-toggle" :class="{ on: isRequired(sf.key) }"
                  @click.stop="toggleRequired(sf.key)"
                  :title="isRequired(sf.key) ? '当前为必填 — 点击设为选填' : '当前为选填 — 点击设为必填'"
                >{{ isRequired(sf.key) ? '必填' : '选填' }}</span>
              </button>
              <span v-for="cf in customFields" :key="cf.key" class="lc-chip on custom">
                <span class="lc-cbox purple on">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span class="lc-chip-label">{{ cf.label }}</span>
                <span v-if="cf.options && cf.options.length" class="lc-type" :title="cf.options.join(', ')">{{ cf.options.length }} 个选项</span>
                <span
                  class="lc-req-toggle" :class="{ on: cf.required }"
                  @click="toggleRequired(cf.key)"
                  :title="cf.required ? '当前为必填 — 点击设为选填' : '当前为选填 — 点击设为必填'"
                >{{ cf.required ? '必填' : '选填' }}</span>
                <button class="lc-chip-x" title="删除字段" @click="removeCustomField(cf.key)">✕</button>
              </span>
            </div>
            <p class="lc-chip-hint">点击字段上的 <b>选填 / 必填</b> 可控制智能客服是否必须获得该项信息才生成有效线索（邮箱默认为核心必填项）。</p>
            <div class="lc-custom-add">
              <input class="lc-input" v-model="newFieldLabel" placeholder="自定义字段标签 (例如：采购预算/店铺规模)" />
              <input class="lc-input" v-model="newFieldOptions" placeholder="可选候选值列表，英文逗号分隔 (可选)" />
              <button class="lc-add" @click="addCustomField">＋ 添加字段</button>
            </div>
          </section>

          <!-- Behaviour: consent + guidance -->
          <section class="lc-card">
            <h4 class="lc-card-title">互动与收集方式</h4>
            <div class="lc-toggle-row bordered">
              <div>
                <div class="lc-toggle-title">收集前征得客户同意 <span class="lc-badge">GDPR 合规</span></div>
                <div class="lc-toggle-desc">智能体在记录联系方式前会礼貌询问客户是否同意销售专员联系。强烈建议开启。</div>
              </div>
              <button class="lc-switch" :class="{ on: requireConsent }" @click="requireConsent = !requireConsent" :aria-pressed="requireConsent">
                <span class="lc-knob"></span>
              </button>
            </div>
            <label class="lc-guidance-label">留资指引策略 Prompt <span class="lc-optional">可选</span></label>
            <textarea
              class="lc-input lc-textarea"
              v-model="guidance"
              rows="3"
              placeholder="引导智能体在何时以何种语气索取联系方式 — 例如：“优先关注浏览了批量批发页面的访客；非工作时间提高留资主动性。”"
            ></textarea>
          </section>

          <!-- When a lead qualifies (CRM sync live; routing coming soon) -->
          <section class="lc-card">
            <h4 class="lc-card-title">线索达标后的自动化动作</h4>
            <p class="lc-card-sub">将合格线索实时推送到您的企业 CRM 客户关系管理系统中。</p>
            <div class="lc-route-row">
              <span>同步至 CRM 系统</span>
              <select class="lc-input lc-input-sm" v-model="crmSyncTarget">
                <option value="none">暂不同步</option>
                <option value="hubspot">HubSpot</option>
                <option value="pipedrive">Pipedrive</option>
                <option value="salesforce" disabled>Salesforce (即将上线)</option>
              </select>
            </div>
            <p v-if="crmTargetUnconnected" class="lc-crm-warning">
              {{ crmTargetName }} 尚未完成授权连接 — 请先前往
              <RouterLink to="/settings/integrations">系统设置 → 渠道集成</RouterLink> 进行连接。
            </p>
            <div class="lc-route-row">
              <span>线索自动分流指派 <span class="lc-soon">即将上线</span></span>
              <select class="lc-input lc-input-sm" v-model="assignmentMode" disabled>
                <option value="none">仅记录归档，不自动分派</option>
                <option value="sales_team">售前销售团队</option>
                <option value="round_robin">轮询均分给在线客服</option>
              </select>
            </div>
            <div class="lc-route-row">
              <span>在 Slack 频道实时通知 <span class="lc-soon">即将上线</span></span>
              <input type="checkbox" v-model="slackNotifyEnabled" disabled />
            </div>
          </section>
        </template>

        <div v-else class="lc-off">
          当前已关闭线索收集 — 智能客服仅执行问答咨询。开启开关即可开始在会话中自动挖掘商业销售线索。
        </div>
      </div>

      <!-- RIGHT: live preview (conversational) -->
      <div class="lc-right">
        <div class="lc-preview-head">
          <span class="lc-preview-tag">实时模拟预览</span>
          <span class="lc-preview-mode">{{ enabled ? '会话中智能留资' : '仅基础问答' }}</span>
        </div>
        <div class="lc-pv-widget">
          <div class="lc-pv-topbar">
            <span class="lc-pv-logo"><i></i><i></i><i></i></span>
            <span>
              <span class="lc-pv-name">专属商务顾问</span>
              <span class="lc-pv-online"><i></i>当前在线</span>
            </span>
          </div>
          <div class="lc-pv-body">
            <div class="lc-pv-msg user">你们支持接入 Shopify 吗？我们店铺每周大概 800 单。</div>
            <div class="lc-pv-msg bot">支持的！我们提供 Shopify 一键安装插件，且智能体能在聊天中实时查询订单与物流履约。</div>
            <template v-if="enabled">
              <div class="lc-pv-msg bot">很乐意协助您完成店铺接入 — 方便留一下您的{{ firstAskLabel }}吗？稍后专属技术顾问将为您跟进方案。</div>
              <div class="lc-pv-msg user">好的，我的邮箱是 service@company.com</div>
              <div v-if="requireConsent" class="lc-pv-msg bot">收到！稍后会有顾问通过此邮箱与您联系，请问可以吗？</div>
              <div v-if="requireConsent" class="lc-pv-msg user">没问题，发给我就好。</div>
              <div class="lc-pv-msg bot">太棒了！我们已安排资深顾问联系您，祝您生意兴隆！👍</div>
            </template>
            <div v-else class="lc-pv-tagline">留资已停用 · 仅提供基础应答</div>
          </div>
          <div class="lc-pv-inputbar">
            <span class="lc-pv-typebox">输入咨询内容…</span>
            <span class="lc-pv-send">↑</span>
          </div>
        </div>

        <div v-if="enabled" class="lc-pv-captured">
          <div class="lc-pv-captured-label">已捕获为高价值线索 →</div>
          <div class="lc-pv-chips">
            <span v-for="l in enabledFieldLabels" :key="l" class="lc-pv-fchip">{{ l }}</span>
            <span class="lc-pv-fchip summary">＋ AI 意图智能摘要</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="lc-loading">正在加载线索收集设置…</div>
</template>

<style scoped>
.lead-capture-tab { display: flex; flex-direction: column; gap: 18px; padding: 0 var(--space-lg); max-width: 1208px; container-type: inline-size; }
.lc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.lc-title { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
.lc-sub { font-size: 14px; color: var(--muted); margin: 0; max-width: 560px; line-height: 1.5; }
.lc-save { flex-shrink: 0; padding: 10px 18px; background: var(--accent-solid); color: var(--on-accent-solid); border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.lc-save:disabled { opacity: .6; cursor: default; }

.lc-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
.lc-left { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.lc-right { min-width: 0; }
@container (min-width: 880px) {
  .lc-grid { grid-template-columns: minmax(0, 1fr) 360px; }
  .lc-right { position: sticky; top: 20px; }
}

.lc-card { background: var(--surface); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; }
.lc-card-title { font-size: 15px; font-weight: 600; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
.lc-card-sub { font-size: 13px; color: var(--muted); margin: 0 0 14px; }

/* Toggle rows */
.lc-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.lc-toggle-row.bordered { padding-bottom: 16px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); }
.lc-toggle-title { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.lc-toggle-desc { font-size: 13px; color: var(--muted); margin-top: 3px; max-width: 460px; line-height: 1.45; }
.lc-switch { flex-shrink: 0; width: 46px; height: 26px; border-radius: 999px; border: none; background: var(--o12); padding: 3px; cursor: pointer; transition: background .16s ease; }
.lc-switch.on { background: var(--accent-solid); }
.lc-knob { display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .16s ease; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
.lc-switch.on .lc-knob { transform: translateX(20px); }
.lc-badge { font-size: 9px; letter-spacing: .05em; padding: 3px 7px; border-radius: 999px; background: var(--purple-bg); color: var(--c-purple); font-weight: 600; }

.lc-input { width: 100%; margin-top: 10px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 9px; font-size: 14px; background: var(--bg); color: var(--text); }
.lc-input-sm { width: auto; min-width: 120px; }
.lc-textarea { resize: vertical; line-height: 1.5; }
.lc-guidance-label { display: block; font-size: 13px; font-weight: 500; color: var(--text3); margin-top: 4px; }
.lc-optional { font-size: 11px; font-weight: 400; color: var(--muted2); margin-left: 4px; }
.lc-add { margin-top: 6px; padding: 8px 14px; background: transparent; border: 1px dashed var(--border-color); border-radius: 9px; font-size: 13px; cursor: pointer; color: var(--muted); }

/* Field chips */
.lc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lc-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px 8px 9px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--o05); font-size: 13.5px; cursor: pointer; color: var(--text); line-height: 1; }
.lc-chip.on { border-color: var(--accent-border); background: var(--accent-bg-08); }
.lc-chip.custom { cursor: default; border-color: var(--purple-border, var(--o12)); background: var(--purple-bg); }
.lc-cbox { width: 18px; height: 18px; flex-shrink: 0; border-radius: 5px; border: 1.5px solid var(--o25); background: transparent; display: flex; align-items: center; justify-content: center; color: var(--on-accent-solid); }
.lc-cbox.on { background: var(--accent-solid); border-color: var(--accent-solid); }
.lc-cbox.purple.on { background: var(--c-purple); border-color: var(--c-purple); color: #fff; }
.lc-chip-label { font-weight: 500; }
.lc-type { font-size: 10px; padding: 2px 6px; border-radius: 5px; background: var(--o08); color: var(--muted); }
.lc-req { font-size: 10.5px; color: var(--c-coral); }
/* Clickable required/optional pill on each enabled field. */
.lc-req-toggle { font-size: 10px; font-weight: 600; letter-spacing: .02em; padding: 2px 7px; border-radius: 999px; cursor: pointer; background: var(--o08); color: var(--muted); border: 1px solid transparent; user-select: none; }
.lc-req-toggle:hover { border-color: var(--o25); }
.lc-req-toggle.on { background: color-mix(in srgb, var(--c-coral) 16%, transparent); color: var(--c-coral); }
.lc-chip-hint { font-size: 12px; color: var(--muted2); margin: 12px 0 0; line-height: 1.45; }
.lc-chip-x { border: none; background: none; cursor: pointer; color: var(--muted); padding: 0 2px; font-size: 12px; }
.lc-custom-add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 14px; }
.lc-custom-add .lc-input { margin-top: 0; flex: 1; min-width: 160px; }

.lc-route-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; }
.lc-route-row:last-child { border-bottom: none; }
.lc-soon { font-size: 10px; padding: 2px 8px; border-radius: 999px; background: var(--o08); color: var(--muted); font-weight: 500; }
.lc-crm-warning { font-size: 12.5px; color: var(--c-coral); background: var(--coral-bg); border: 1px solid var(--coral-border); border-radius: var(--radius-md); padding: 8px 12px; margin: -4px 0 12px; }
.lc-crm-warning a { color: inherit; font-weight: 600; }
.lc-off { background: var(--o05); border: 1px dashed var(--border-color); border-radius: 14px; padding: 24px; text-align: center; font-size: 14px; color: var(--muted); }
.lc-loading { padding: 40px; text-align: center; color: var(--muted); }

input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; margin: 0; flex-shrink: 0; border-radius: 5px; border: 1.5px solid var(--o25); background: transparent; cursor: pointer; position: relative; }
input[type="checkbox"]:checked { background: var(--accent-solid); border-color: var(--accent-solid); }
input[type="checkbox"]:checked::after { content: ''; position: absolute; left: 5px; top: 2px; width: 4px; height: 8px; border: solid var(--on-accent-solid); border-width: 0 2px 2px 0; transform: rotate(45deg); }
input[type="checkbox"]:disabled { opacity: .5; cursor: default; }

/* Live preview */
.lc-preview-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.lc-preview-tag { font-family: monospace; font-size: 11px; letter-spacing: .07em; color: var(--muted2); }
.lc-preview-mode { font-size: 12px; color: var(--muted2); }
.lc-pv-widget { background: var(--surface); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; min-height: 380px; }
.lc-pv-topbar { display: flex; align-items: center; gap: 11px; padding: 14px 15px; border-bottom: 1px solid var(--border-color); }
.lc-pv-logo { width: 32px; height: 32px; border-radius: 10px 10px 10px 3px; background: var(--accent-solid); display: flex; align-items: center; justify-content: center; gap: 2.5px; flex-shrink: 0; }
.lc-pv-logo i { width: 3.5px; height: 3.5px; border-radius: 50%; background: var(--on-accent-solid); }
.lc-pv-name { display: block; font-weight: 600; font-size: 13.5px; color: var(--text); }
.lc-pv-online { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--c-teal, #0E8C8C); margin-top: 2px; }
.lc-pv-online i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.lc-pv-body { flex: 1; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.lc-pv-msg { max-width: 88%; padding: 9px 12px; font-size: 12.5px; line-height: 1.5; }
.lc-pv-msg.user { align-self: flex-end; background: var(--o08); border-radius: 14px 14px 4px 14px; color: var(--text2); }
.lc-pv-msg.bot { align-self: flex-start; background: var(--o05); border: 1px solid var(--border-color); border-radius: 14px 14px 14px 4px; color: var(--text2); }
.lc-pv-tagline { align-self: center; margin-top: 6px; padding: 8px 14px; border-radius: 999px; background: var(--o05); border: 1px solid var(--border-color); font-size: 11.5px; color: var(--muted); }
.lc-pv-inputbar { padding: 11px 13px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 9px; }
.lc-pv-typebox { flex: 1; padding: 9px 12px; background: var(--bg); border: 1px solid var(--border-color); border-radius: 10px; font-size: 12.5px; color: var(--muted2); }
.lc-pv-send { width: 36px; height: 36px; border-radius: 10px; background: var(--accent-bg-12); display: flex; align-items: center; justify-content: center; color: var(--accent-ink); font-size: 15px; flex-shrink: 0; }
.lc-pv-captured { margin-top: 14px; background: var(--surface); border: 1px solid var(--border-color); border-radius: 13px; padding: 14px 16px; }
.lc-pv-captured-label { font-family: monospace; font-size: 10px; letter-spacing: .07em; color: var(--muted2); margin-bottom: 9px; }
.lc-pv-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.lc-pv-fchip { padding: 5px 11px; border-radius: 999px; background: var(--accent-bg-08); border: 1px solid var(--accent-border); font-size: 11.5px; color: var(--text3); }
.lc-pv-fchip.summary { background: var(--purple-bg); border-color: var(--purple-border, var(--o12)); }
</style>
