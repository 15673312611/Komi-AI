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
import { computed } from 'vue'

interface GuardrailsNodeData {
  enabled_guardrails: string[]
  pii_action: string
  jailbreak_sensitivity: number
  text_source: string
  block_message: string
}

interface Variable {
  nodeId: string
  nodeName: string
  fieldName: string
  fieldType: string
  fieldLabel: string
}

const props = defineProps<{
  modelValue: GuardrailsNodeData
  validationErrors: Record<string, string>
  availableVariables?: Variable[]
}>()

const emit = defineEmits<{
  (e: 'update:model-value', value: GuardrailsNodeData): void
  (e: 'validate-field', field: string): void
}>()

const formData = computed({
  get: () => props.modelValue,
  set: (value: GuardrailsNodeData) => emit('update:model-value', value)
})

// Update form data
const updateFormData = (field: keyof GuardrailsNodeData, value: any) => {
  formData.value = {
    ...formData.value,
    [field]: value
  }
  
  emit('validate-field', field)
}

// Toggle guardrail type
const toggleGuardrail = (type: string) => {
  const current = formData.value.enabled_guardrails || []
  const index = current.indexOf(type)
  
  let updated: string[]
  if (index > -1) {
    // Remove if exists
    updated = current.filter(g => g !== type)
  } else {
    // Add if doesn't exist
    updated = [...current, type]
  }
  
  updateFormData('enabled_guardrails', updated)
}

const isGuardrailEnabled = (type: string) => {
  return (formData.value.enabled_guardrails || []).includes(type)
}

// Helper to get variable syntax
const getVariableSyntax = (fieldName: string) => {
  return `{{${fieldName}}}`
}

// Copy variable to clipboard
const copyVariableToClipboard = async (variable: Variable) => {
  const syntax = getVariableSyntax(variable.fieldName)
  try {
    await navigator.clipboard.writeText(syntax)
    // Could add a toast notification here if needed
  } catch (err) {
    console.error('Failed to copy variable:', err)
  }
}
</script>

<template>
  <div class="guardrails-node-config">
    <div class="info-box">
      <p>配置内容安全护栏规则，自动识别并拦截敏感数据泄露或恶意提示词越狱攻击。</p>
    </div>

    <div class="form-group">
      <label>启用的护栏规则 (Enabled Guardrails) *</label>
      <div class="guardrail-options">
        <label class="guardrail-option">
          <input
            type="checkbox"
            :checked="isGuardrailEnabled('pii')"
            @change="toggleGuardrail('pii')"
            class="form-checkbox"
          />
          <div class="guardrail-info">
            <span class="guardrail-icon">🔒</span>
            <div>
              <strong>PII 个人隐私数据检测</strong>
              <p>识别文本中的个人敏感隐私（如邮箱、电话号码、身份证/社保号、银行卡等）</p>
            </div>
          </div>
        </label>
        
        <label class="guardrail-option">
          <input
            type="checkbox"
            :checked="isGuardrailEnabled('jailbreak')"
            @change="toggleGuardrail('jailbreak')"
            class="form-checkbox"
          />
          <div class="guardrail-info">
            <span class="guardrail-icon">⚠️</span>
            <div>
              <strong>Prompt 越狱攻击防御</strong>
              <p>检测试图绕过 AI 安全准则、诱导泄露 Prompt 或操纵系统设定的对抗性攻击</p>
            </div>
          </div>
        </label>
      </div>
      <div v-if="validationErrors.enabled_guardrails" class="error-message">
        {{ validationErrors.enabled_guardrails }}
      </div>
    </div>

    <!-- PII Action -->
    <div v-if="isGuardrailEnabled('pii')" class="form-group">
      <label for="pii-action">PII 处置策略 (Action)</label>
      <select
        id="pii-action"
        :value="formData.pii_action"
        @change="updateFormData('pii_action', ($event.target as HTMLSelectElement).value)"
        class="form-select"
      >
        <option value="block">拦截阻断 (Block) - 检测到隐私信息时立即终止流程并提示</option>
        <option value="redact">脱敏替换 (Redact) - 将隐私信息自动替换为掩码占位符</option>
        <option value="warning">记录警告 (Warning) - 记录审计日志但允许继续执行</option>
        <option value="log">仅后台日志 (Log) - 仅留存检测记录</option>
      </select>
    </div>

    <!-- Jailbreak Sensitivity -->
    <div v-if="isGuardrailEnabled('jailbreak')" class="form-group">
      <label for="jailbreak-sensitivity">
        越狱检测灵敏度：{{ formData.jailbreak_sensitivity?.toFixed(1) || '0.7' }}
      </label>
      <input
        id="jailbreak-sensitivity"
        type="range"
        :value="formData.jailbreak_sensitivity || 0.7"
        @input="updateFormData('jailbreak_sensitivity', parseFloat(($event.target as HTMLInputElement).value))"
        min="0.1"
        max="1.0"
        step="0.1"
        class="form-range"
      />
      <div class="range-labels">
        <span>宽松 (0.1)</span>
        <span>严格 (1.0)</span>
      </div>
      <small class="help-text">
        灵敏度越高，越容易判定潜在的越狱尝试并进行拦截
      </small>
    </div>

    <div class="form-group">
      <label for="text-source">检测文本来源 (Text Source)</label>
      <input
        id="text-source"
        type="text"
        :value="formData.text_source"
        @input="updateFormData('text_source', ($event.target as HTMLInputElement).value)"
        class="form-input"
        placeholder="user_message 或 user_input_input"
      />
      <small class="help-text">
        指定需要进行安全检测的文本内容。填 "user_message" 代表检测用户最新发言，或填入上下文变量名
      </small>
    </div>

    <!-- Available Variables Section -->
    <div v-if="availableVariables && availableVariables.length > 0" class="variables-section">
      <div class="variables-header">
        <span class="variables-title">可用上下文变量</span>
        <span class="variables-count">{{ availableVariables.length }}</span>
      </div>
      
      <div class="variables-list">
        <div
          v-for="variable in availableVariables"
          :key="`${variable.nodeId}-${variable.fieldName}`"
          class="variable-item"
          @click="copyVariableToClipboard(variable)"
          :title="`点击复制 ${getVariableSyntax(variable.fieldName)} 到剪贴板`"
        >
          <div class="variable-info">
            <div class="variable-name">{{ variable.fieldName }}</div>
            <div class="variable-source">来源于 {{ variable.nodeName }}</div>
          </div>
          <div class="variable-syntax">
            <code>{{ getVariableSyntax(variable.fieldName) }}</code>
          </div>
        </div>
      </div>
      
      <div class="variables-help">
        <small>点击任意变量即可复制其引用语法到剪贴板</small>
      </div>
    </div>

    <div class="form-group">
      <label for="block-message">自定义拦截阻断提示语</label>
      <textarea
        id="block-message"
        :value="formData.block_message"
        @input="updateFormData('block_message', ($event.target as HTMLTextAreaElement).value)"
        class="form-textarea"
        placeholder="选填：当触发安全阻断时向用户展示的自定义友好提示语"
        rows="3"
      ></textarea>
      <small class="help-text">
        若留空，则使用系统默认的安全拦截提示
      </small>
    </div>
  </div>
</template>

<style scoped>
.guardrails-node-config {
  width: 100%;
}

.info-box {
  background: var(--color-bg-tertiary, #f8f9fa);
  border-left: 3px solid var(--color-primary, #3b82f6);
  padding: var(--space-xs);
  margin-bottom: var(--space-sm);
  border-radius: 4px;
}

.info-box p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary, #6b7280);
}

.info-box ul {
  margin: var(--space-xs) 0 0 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.25rem 0;
  font-size: 0.85rem;
}

.routing-info {
  border-left-color: var(--color-accent, #ec4899);
}

.form-group {
  margin-bottom: var(--space-sm);
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: var(--space-xs);
}

.guardrail-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.guardrail-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-xs);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.guardrail-option:hover {
  background: var(--color-bg-secondary, #f9fafb);
  border-color: var(--color-primary, #3b82f6);
}

.guardrail-option input[type="checkbox"] {
  margin-top: 0.2rem;
}

.guardrail-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  flex: 1;
}

.guardrail-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.guardrail-info strong {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.guardrail-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: normal;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: var(--space-xs);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 4px;
  font-size: 0.85rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
}

.form-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-tertiary, #e5e7eb);
  outline: none;
  -webkit-appearance: none;
}

.form-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary, #3b82f6);
  cursor: pointer;
}

.form-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary, #3b82f6);
  cursor: pointer;
  border: none;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.range-labels span {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin-top: 0.25rem;
}

.error-message {
  color: var(--color-error, #ef4444);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-checkbox {
  cursor: pointer;
}

/* Variables Section */
.variables-section {
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: var(--background-soft);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.variables-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.variables-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
}

.variables-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.variable-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.variable-item:hover {
  background: var(--background-alt);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.variable-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.variable-name {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--text-color);
  word-break: break-word;
}

.variable-source {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 2px 0;
}

.variable-syntax {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 2px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.variable-syntax code {
  background: var(--background-soft);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.variables-help {
  padding: var(--space-sm);
  background: var(--background-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  margin-top: var(--space-xs);
}

.variables-help small {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.3;
}
</style>
