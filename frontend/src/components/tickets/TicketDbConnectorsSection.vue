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
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { dbConnectorService } from '@/services/tickets'
import type { DbConnector, DbConnectorTable } from '@/types/ticket'

const connectors = ref<DbConnector[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const connectorActionId = ref<string | null>(null)
let connectorsRequestVersion = 0

const showForm = ref(false)
// When set, the picker edits this saved connector instead of the draft form.
const editingConnector = ref<DbConnector | null>(null)

const form = reactive({
  name: '',
  engine: 'postgresql' as 'postgresql' | 'mysql',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  max_rows: 100,
  // SSH tunnel — production databases are usually behind a bastion.
  ssh_enabled: false,
  ssh_host: '',
  ssh_port: 22,
  ssh_username: '',
  ssh_auth: 'key' as 'key' | 'password',
  ssh_password: '',
  ssh_private_key: '',
  ssh_private_key_passphrase: '',
})

// Only the tunnel fields the API accepts, with the chosen auth method.
function sshPayload() {
  if (!form.ssh_enabled) return { ssh_enabled: false }
  const base = {
    ssh_enabled: true,
    ssh_host: form.ssh_host.trim(),
    ssh_port: form.ssh_port,
    ssh_username: form.ssh_username.trim(),
  }
  return form.ssh_auth === 'password'
    ? { ...base, ssh_password: form.ssh_password || undefined }
    : {
        ...base,
        ssh_private_key: form.ssh_private_key || undefined,
        ssh_private_key_passphrase: form.ssh_private_key_passphrase || undefined,
      }
}

const isDiscovering = ref(false)
const discoveredTables = ref<DbConnectorTable[] | null>(null)
const discoverError = ref<string | null>(null)
const selectedTables = ref<Set<string>>(new Set())
const maskedColumns = ref<Set<string>>(new Set())
// { "schema.table": "customer_column" } — a scoped table only ever returns the
// ticket customer's own rows. Absent = readable in full.
const rowScope = ref<Record<string, string>>({})
const rowScopeKey = ref<'email' | 'phone'>('email')
const expandedTable = ref<string | null>(null)
const isSaving = ref(false)

const scopedTableCount = computed(() => Object.keys(rowScope.value).length)

function setRowScope(table: DbConnectorTable, column: string) {
  const next = { ...rowScope.value }
  if (column) next[tableKey(table)] = column
  else delete next[tableKey(table)]
  rowScope.value = next
}

const tablesBySchema = computed(() => {
  const groups: Record<string, DbConnectorTable[]> = {}
  for (const table of discoveredTables.value || []) {
    ;(groups[table.schema] ||= []).push(table)
  }
  return groups
})

function tableKey(table: DbConnectorTable): string {
  return `${table.schema}.${table.table}`.toLowerCase()
}

function resetPicker() {
  discoveredTables.value = null
  discoverError.value = null
  selectedTables.value = new Set()
  maskedColumns.value = new Set()
  rowScope.value = {}
  rowScopeKey.value = 'email'
  expandedTable.value = null
}

function openCreateForm() {
  if (connectorActionId.value || isDiscovering.value || isSaving.value) return
  editingConnector.value = null
  Object.assign(form, {
    name: '', engine: 'postgresql', host: '', port: 5432,
    database: '', username: '', password: '', max_rows: 100,
    ssh_enabled: false, ssh_host: '', ssh_port: 22, ssh_username: '',
    ssh_auth: 'key', ssh_password: '', ssh_private_key: '', ssh_private_key_passphrase: '',
  })
  resetPicker()
  showForm.value = true
}

async function fetchConnectors() {
  const requestVersion = ++connectorsRequestVersion
  isLoading.value = true
  try {
    loadError.value = null
    const result = await dbConnectorService.list()
    if (requestVersion !== connectorsRequestVersion) return
    connectors.value = result
    loadError.value = null
  } catch (err: any) {
    if (requestVersion !== connectorsRequestVersion) return
    loadError.value = err.response?.data?.detail || 'Failed to load database connectors'
  } finally {
    if (requestVersion === connectorsRequestVersion) isLoading.value = false
  }
}

function validateDraft(): boolean {
  const required: Array<[string, string]> = [
    ['连接名称', form.name],
    ['主机地址', form.host],
    ['数据库名', form.database],
    ['用户名', form.username],
    ['数据库密码', form.password],
  ]
  const missing = required.find(([, value]) => !value.trim())
  if (missing) {
    toast.error(`${missing[0]}不能为空`)
    return false
  }
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    toast.error('数据库端口必须是 1-65535 之间的整数')
    return false
  }
  if (!Number.isInteger(form.max_rows) || form.max_rows < 1 || form.max_rows > 1000) {
    toast.error('单次查询最大行数必须是 1-1000 之间的整数')
    return false
  }
  if (form.ssh_enabled) {
    if (!form.ssh_host.trim() || !form.ssh_username.trim()) {
      toast.error('启用 SSH 隧道时必须填写堡垒机主机和用户名')
      return false
    }
    if (!Number.isInteger(form.ssh_port) || form.ssh_port < 1 || form.ssh_port > 65535) {
      toast.error('SSH 端口必须是 1-65535 之间的整数')
      return false
    }
    if (form.ssh_auth === 'password' && !form.ssh_password.trim()) {
      toast.error('密码认证需要填写 SSH 登录密码')
      return false
    }
    if (form.ssh_auth === 'key' && !form.ssh_private_key.trim()) {
      toast.error('私钥认证需要填写 SSH 私钥文本')
      return false
    }
  }
  return true
}

async function discover() {
  if (isDiscovering.value || isSaving.value) return
  if (!editingConnector.value && !validateDraft()) return
  isDiscovering.value = true
  discoverError.value = null
  discoveredTables.value = null
  try {
    const result = editingConnector.value
      ? await dbConnectorService.test(editingConnector.value.id)
      : await dbConnectorService.discover({
          name: form.name.trim(), engine: form.engine, host: form.host.trim(), port: form.port,
          database: form.database.trim(), username: form.username.trim(), password: form.password,
          ...sshPayload(),
        })
    if (!result.ok) {
      discoverError.value = result.error || 'Connection failed'
      discoveredTables.value = null
    } else {
      discoveredTables.value = result.tables || []
      toast.success(`Connected — ${discoveredTables.value.length} tables discovered`)
    }
  } catch (err: any) {
    discoveredTables.value = null
    discoverError.value = err.response?.data?.detail || 'Connection failed'
  } finally {
    isDiscovering.value = false
  }
}

function toggleTable(table: DbConnectorTable, checked: boolean) {
  const next = new Set(selectedTables.value)
  if (checked) {
    next.add(tableKey(table))
  } else {
    next.delete(tableKey(table))
    // Don't leave a scope rule behind on a table that is no longer allowed —
    // re-adding it later would silently restore a filter nobody chose.
    setRowScope(table, '')
  }
  selectedTables.value = next
}

function toggleMask(columnName: string, masked: boolean) {
  const next = new Set(maskedColumns.value)
  if (masked) next.add(columnName.toLowerCase())
  else next.delete(columnName.toLowerCase())
  maskedColumns.value = next
}

async function saveConnector() {
  if (isSaving.value || isDiscovering.value || connectorActionId.value) return
  if (!Number.isInteger(form.max_rows) || form.max_rows < 1 || form.max_rows > 1000) {
    toast.error('单次查询最大行数必须是 1-1000 之间的整数')
    return
  }
  if (!selectedTables.value.size) {
    toast.error('Select at least one table — nothing is queryable otherwise')
    return
  }
  if (!editingConnector.value && !validateDraft()) return
  isSaving.value = true
  try {
    const editingId = editingConnector.value?.id
    const allowed = new Set(selectedTables.value)
    const policy = {
      allowed_tables: [...selectedTables.value],
      masked_columns: [...maskedColumns.value],
      row_scope: Object.fromEntries(
        Object.entries(rowScope.value).filter(([table]) => allowed.has(table)),
      ),
      row_scope_key: rowScopeKey.value,
      max_rows: form.max_rows,
    }
    if (editingId) {
      await dbConnectorService.update(editingId, policy)
      toast.success('已成功更新数据库连接器')
    } else {
      await dbConnectorService.create({
        name: form.name.trim(), engine: form.engine, host: form.host.trim(), port: form.port,
        database: form.database.trim(), username: form.username.trim(), password: form.password,
        enabled: true, ...sshPayload(), ...policy,
      })
      toast.success('已成功创建数据库连接器')
    }
    showForm.value = false
    editingConnector.value = null
    resetPicker()
    await fetchConnectors()
  } catch (err: any) {
    toast.error(err.response?.data?.detail || '保存数据库连接器失败')
  } finally {
    isSaving.value = false
  }
}

async function editTables(connector: DbConnector) {
  if (connectorActionId.value || isDiscovering.value || isSaving.value) return
  editingConnector.value = connector
  form.max_rows = connector.max_rows
  resetPicker()
  selectedTables.value = new Set((connector.allowed_tables || []).map((t) => t.toLowerCase()))
  maskedColumns.value = new Set((connector.masked_columns || []).map((c) => c.toLowerCase()))
  rowScope.value = { ...(connector.row_scope || {}) }
  rowScopeKey.value = connector.row_scope_key || 'email'
  showForm.value = true
  await discover()
}

async function toggleEnabled(connector: DbConnector, enabled: boolean) {
  if (connectorActionId.value || isDiscovering.value || isSaving.value) return
  connectorActionId.value = connector.id
  try {
    await dbConnectorService.update(connector.id, { enabled })
    await fetchConnectors()
  } catch (err: any) {
    toast.error(err.response?.data?.detail || '更新数据库连接器状态失败')
  } finally {
    connectorActionId.value = null
  }
}

async function removeConnector(connector: DbConnector) {
  if (!confirm(`确认删除连接器 "${connector.name}"？删除后 AI 将无法再查询该数据库。`)) return
  if (connectorActionId.value || isDiscovering.value || isSaving.value) return
  connectorActionId.value = connector.id
  try {
    await dbConnectorService.remove(connector.id)
    await fetchConnectors()
    toast.success('连接器已删除')
  } catch (err: any) {
    toast.error(err.response?.data?.detail || '删除连接器失败')
  } finally {
    connectorActionId.value = null
  }
}

function closeForm() {
  if (isSaving.value || isDiscovering.value) return
  showForm.value = false
  editingConnector.value = null
  resetPicker()
}

onMounted(fetchConnectors)
</script>

<template>
  <div class="db-connectors">
    <div v-if="isLoading" class="state-note">正在加载数据库连接器…</div>
    <div v-else-if="loadError" class="state-note">
      <span>{{ loadError }}</span>
      <button class="small-btn" type="button" @click="fetchConnectors" :disabled="isLoading">重试</button>
    </div>

    <template v-else>
      <div v-if="connectors.length" class="connector-list">
        <div v-for="connector in connectors" :key="connector.id" class="connector-card">
          <div class="connector-main">
            <div class="connector-name">
              {{ connector.name }}
              <span class="engine-tag mono">{{ connector.engine }}</span>
              <span
                v-if="connector.last_test_ok != null"
                class="test-tag mono"
                :class="{ ok: connector.last_test_ok }"
              >
                {{ connector.last_test_ok ? '已连通' : '连接失败' }}
              </span>
            </div>
            <div class="connector-sub mono">
              {{ connector.username }}@{{ connector.host }}:{{ connector.port }}/{{ connector.database }}
              · 允许查询 {{ (connector.allowed_tables || []).length }} 张表
              · {{ (connector.masked_columns || []).length }} 个脱敏字段
              · {{ Object.keys(connector.row_scope || {}).length }} 张客户行隔离表
            </div>
          </div>
          <label class="enable-toggle">
              <input
                type="checkbox"
                :checked="connector.enabled"
                @change="toggleEnabled(connector, ($event.target as HTMLInputElement).checked)"
                :disabled="!!connectorActionId || isDiscovering || isSaving"
              />
            已启用
          </label>
          <button class="small-btn" @click="editTables(connector)" :disabled="!!connectorActionId || isDiscovering || isSaving">配置数据表权限</button>
          <button class="small-btn danger" @click="removeConnector(connector)" :disabled="!!connectorActionId || isDiscovering || isSaving">删除</button>
        </div>
      </div>

      <button v-if="!showForm" class="add-connector" @click="openCreateForm" :disabled="!!connectorActionId || isDiscovering || isSaving">
        ＋ 连接业务数据库
      </button>

      <div v-if="showForm" class="create-form">
        <template v-if="!editingConnector">
          <div class="form-grid">
            <label class="form-field">
              <span class="field-label">连接名称</span>
              <input v-model="form.name" class="field-input" placeholder="例如：生产环境只读从库" />
            </label>
            <label class="form-field">
              <span class="field-label">数据库引擎</span>
              <select
                v-model="form.engine"
                class="field-input"
                @change="form.port = form.engine === 'mysql' ? 3306 : 5432"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </label>
            <label class="form-field">
              <span class="field-label">主机地址 (Host)</span>
              <input v-model="form.host" class="field-input mono" placeholder="db-replica.internal" />
            </label>
            <label class="form-field">
              <span class="field-label">端口 (Port)</span>
              <input v-model.number="form.port" type="number" class="field-input mono" />
            </label>
            <label class="form-field">
              <span class="field-label">数据库名 (Database)</span>
              <input v-model="form.database" class="field-input mono" />
            </label>
            <label class="form-field">
              <span class="field-label">用户名 (Username)</span>
              <input v-model="form.username" class="field-input mono" placeholder="readonly_user" />
            </label>
            <label class="form-field">
              <span class="field-label">密码 (Password)</span>
              <input v-model="form.password" type="password" class="field-input mono" />
            </label>
            <label class="form-field">
              <span class="field-label">单次查询最大行数限制</span>
              <input v-model.number="form.max_rows" type="number" min="1" max="1000" class="field-input mono" />
            </label>
          </div>
          <!-- SSH TUNNEL -->
          <div class="ssh-block">
            <label class="ssh-toggle">
              <input v-model="form.ssh_enabled" type="checkbox" />
              <span>
                通过 SSH 堡垒机/跳板机隧道连接
                <span class="ssh-hint">— 适用于位于私有 VPC 内网的生产数据库</span>
              </span>
            </label>
            <div v-if="form.ssh_enabled" class="ssh-fields">
              <p class="ssh-note">
                上方的数据库主机与端口将由 SSH 堡垒机内网环境进行寻址解析。
              </p>
              <div class="form-grid">
                <label class="form-field">
                  <span class="field-label">SSH 堡垒机主机</span>
                  <input v-model="form.ssh_host" class="field-input mono" placeholder="bastion.example.com" />
                </label>
                <label class="form-field">
                  <span class="field-label">SSH 端口</span>
                  <input v-model.number="form.ssh_port" type="number" class="field-input mono" />
                </label>
                <label class="form-field">
                  <span class="field-label">SSH 用户名</span>
                  <input v-model="form.ssh_username" class="field-input mono" placeholder="ec2-user" />
                </label>
                <label class="form-field">
                  <span class="field-label">认证方式</span>
                  <select v-model="form.ssh_auth" class="field-input">
                    <option value="key">私钥证书 (Private Key)</option>
                    <option value="password">账号密码 (Password)</option>
                  </select>
                </label>
                <label v-if="form.ssh_auth === 'password'" class="form-field wide">
                  <span class="field-label">SSH 登录密码</span>
                  <input v-model="form.ssh_password" type="password" class="field-input mono" />
                </label>
                <template v-else>
                  <label class="form-field wide">
                    <span class="field-label">私钥文本 (PEM / OpenSSH 格式)</span>
                    <textarea
                      v-model="form.ssh_private_key"
                      class="field-input mono key-input"
                      rows="4"
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;…"
                    ></textarea>
                  </label>
                  <label class="form-field">
                    <span class="field-label">私钥密码短语 Passphrase (选填)</span>
                    <input v-model="form.ssh_private_key_passphrase" type="password" class="field-input mono" />
                  </label>
                </template>
              </div>
            </div>
          </div>

          <p class="tip-note">
            建议：使用只读副本库 (Read-only Replica) 及仅授予 SELECT 权限的专用数据库账号 — 与系统的安全围栏形成双重防护。
          </p>
        </template>
        <div v-else class="editing-note">
          正在配置 <strong>{{ editingConnector.name }}</strong> 的数据表白名单与字段权限
        </div>

        <div class="discover-row">
          <button
            class="small-btn"
            :disabled="isDiscovering"
            @click="discover"
          >
            {{ isDiscovering ? '正在连接…' : discoveredTables ? '重新测试连接' : '测试连通性并获取数据字典' }}
          </button>
          <span v-if="discoveredTables" class="discover-result">
            <font-awesome-icon :icon="['fas', 'check']" />
            成功发现 {{ discoveredTables.length }} 张数据表 — 请勾选允许 AI 只读查询的表
          </span>
          <span v-else-if="discoverError" class="discover-error">{{ discoverError }}</span>
        </div>

        <div v-if="discoveredTables && scopedTableCount" class="scope-key-row">
          <label class="scope-label">
            客户身份匹配依据字段
            <select v-model="rowScopeKey" class="scope-select">
              <option value="email">客户邮箱地址 (Email)</option>
              <option value="phone">客户联系电话 (Phone)</option>
            </select>
          </label>
          <span class="scope-key-hint">
            <template v-if="rowScopeKey === 'email'">
              将工单客户的邮箱与所选数据表字段进行不区分大小写的匹配过滤。
            </template>
            <template v-else>
              将工单客户的电话号码与所选数据表字段进行精确匹配过滤。
            </template>
          </span>
        </div>

        <!-- ALLOWLIST TREE -->
        <div v-if="discoveredTables" class="table-tree">
          <div v-for="(tables, schema) in tablesBySchema" :key="schema" class="schema-group">
            <div class="schema-label mono">{{ schema }}</div>
            <div v-for="table in tables" :key="tableKey(table)" class="table-row-wrap">
              <div class="table-row">
                <label class="table-check">
                  <input
                    type="checkbox"
                    :checked="selectedTables.has(tableKey(table))"
                    @change="toggleTable(table, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="table-name mono">{{ table.table }}</span>
                  <span class="col-count">{{ table.columns.length }} 列</span>
                  <span v-if="rowScope[tableKey(table)]" class="scope-chip mono">
                    <font-awesome-icon :icon="['fas', 'user-shield']" />
                    {{ rowScope[tableKey(table)] }}
                  </span>
                </label>
                <button
                  v-if="selectedTables.has(tableKey(table))"
                  class="mask-toggle"
                  @click="expandedTable = expandedTable === tableKey(table) ? null : tableKey(table)"
                >
                  {{ expandedTable === tableKey(table) ? '收起字段' : '字段脱敏配置' }}
                </button>
              </div>
              <div v-if="expandedTable === tableKey(table)" class="column-list">
                <div v-for="column in table.columns" :key="column.name" class="column-row">
                  <span class="column-name mono">{{ column.name }}</span>
                  <span class="column-type">{{ column.type }}</span>
                  <button
                    class="mask-pill"
                    :class="{ masked: maskedColumns.has(column.name.toLowerCase()) }"
                    @click="toggleMask(column.name, !maskedColumns.has(column.name.toLowerCase()))"
                  >
                    {{ maskedColumns.has(column.name.toLowerCase()) ? '已脱敏' : '只读可见' }}
                  </button>
                </div>
                <p class="mask-hint">
                  脱敏字段将在数据返回给 AI 前自动掩码隐藏 — 涉及该字段的直接查询也将被拒绝。
                </p>

                <div class="scope-row">
                  <label class="scope-label">
                    按工单客户进行行级数据隔离 (Row-Level Security)
                    <select
                      class="scope-select mono"
                      :value="rowScope[tableKey(table)] || ''"
                      @change="setRowScope(table, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">不限行范围 — 允许读取整张表的只读行</option>
                      <option v-for="column in table.columns" :key="column.name" :value="column.name">
                        {{ column.name }}
                      </option>
                    </select>
                  </label>
                  <p class="mask-hint">
                    选择存储客户唯一标识的列。AI 查询将被底层改写为仅读取当前工单客户的数据行 — 无法越权查询其他客户数据。公共基础字典表可保持不限制。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" type="button" @click="closeForm" :disabled="isDiscovering || isSaving">取消</button>
          <button
            v-if="discoveredTables"
            class="save-btn"
            :disabled="isSaving || isDiscovering"
            @click="saveConnector"
          >
            {{ isSaving ? '正在保存…' : editingConnector ? '保存权限更改' : '确认添加并保存' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.db-connectors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.state-note {
  font-size: 12.5px;
  color: var(--muted);
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--o07);
  border-radius: 11px;
}
.connector-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.connector-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 12px;
}
.connector-main {
  flex: 1;
  min-width: 0;
}
.connector-name {
  font-size: 13.5px;
  font-weight: var(--font-weight-semibold);
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.engine-tag {
  font-size: 9.5px;
  color: var(--c-teal);
  background: var(--teal-bg-10);
  padding: 1px 7px;
  border-radius: 6px;
  text-transform: uppercase;
}
.test-tag {
  font-size: 9.5px;
  color: var(--c-danger);
  background: color-mix(in srgb, var(--c-danger) 10%, transparent);
  padding: 1px 7px;
  border-radius: 6px;
}
.test-tag.ok {
  color: var(--c-positive);
  background: color-mix(in srgb, var(--c-positive) 10%, transparent);
}
.connector-sub {
  margin-top: 3px;
  font-size: 10.5px;
  color: var(--faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mono {
  font-family: var(--font-mono);
}
.enable-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text3);
  cursor: pointer;
  flex-shrink: 0;
}
.small-btn {
  padding: 6px 12px;
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--text);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.small-btn.danger {
  color: var(--c-danger);
  border-color: color-mix(in srgb, var(--c-danger) 35%, transparent);
}
.small-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.add-connector {
  align-self: flex-start;
  padding: 9px 16px;
  background: transparent;
  border: 1.5px dashed var(--o14);
  color: var(--muted);
  border-radius: 11px;
  font-size: 13px;
  cursor: pointer;
}
.add-connector:hover {
  border-color: var(--accent-ink);
  color: var(--text);
}
.create-form {
  background: var(--surface);
  border: 1px solid var(--o10);
  border-radius: 13px;
  padding: 16px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 11px;
  color: var(--faint);
}
.field-input {
  padding: 8px 11px;
  background: var(--bg2);
  border: 1px solid var(--o10);
  border-radius: 9px;
  color: var(--text);
  font-size: 12.5px;
  outline: none;
}
.tip-note {
  margin: 12px 0 0;
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.5;
}
.ssh-block {
  margin-top: 14px;
  border-top: 1px solid var(--o07);
  padding-top: 13px;
}
.ssh-toggle {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13px;
  color: var(--text3);
  cursor: pointer;
}
.ssh-hint {
  color: var(--faint);
  font-size: 12px;
}
.ssh-fields {
  margin-top: 12px;
}
.ssh-note {
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--faint);
}
.key-input {
  resize: vertical;
  line-height: 1.4;
}
.editing-note {
  font-size: 13px;
  color: var(--text3);
}
.discover-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 13px;
  flex-wrap: wrap;
}
.discover-result {
  font-size: 12px;
  color: var(--c-positive);
}
.discover-error {
  font-size: 12px;
  color: var(--c-danger);
}
.table-tree {
  margin-top: 13px;
  border: 1px solid var(--o07);
  border-radius: 11px;
  max-height: 420px;
  overflow-y: auto;
}
.schema-group {
  padding: 6px 0;
}
.schema-label {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 6px 14px 4px;
}
.table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 14px;
}
.table-row:hover {
  background: var(--o03);
}
.table-check {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  min-width: 0;
}
.table-name {
  font-size: 12px;
  color: var(--text);
}
.col-count {
  font-size: 10.5px;
  color: var(--faint);
}
.mask-toggle {
  font-size: 11px;
  color: var(--accent-ink);
  background: var(--accent-bg-08);
  border: none;
  padding: 3px 9px;
  border-radius: 7px;
  cursor: pointer;
  flex-shrink: 0;
}
.column-list {
  margin: 4px 14px 10px 34px;
  border-left: 2px solid var(--o07);
  padding-left: 12px;
}
.column-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
}
.column-name {
  font-size: 11.5px;
  color: var(--text3);
  min-width: 140px;
}
.column-type {
  font-size: 10.5px;
  color: var(--faint);
  flex: 1;
}
.mask-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 9px;
  border-radius: 20px;
  border: 1px solid var(--o10);
  background: transparent;
  color: var(--muted2);
  cursor: pointer;
}
.mask-pill.masked {
  color: var(--c-warn);
  border-color: var(--c-warn);
  background: color-mix(in srgb, var(--c-warn) 10%, transparent);
}
.mask-hint {
  margin: 8px 0 0;
  font-size: 10.5px;
  color: var(--faint);
  line-height: 1.5;
}
.scope-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--o08);
}
.scope-label {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11.5px;
  color: var(--muted2);
}
.scope-select {
  flex: 1;
  min-width: 0;
  padding: 6px 9px;
  background: var(--surface);
  border: 1px solid var(--o10);
  color: var(--text);
  border-radius: 8px;
  font-size: 11.5px;
}
.scope-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 20px;
  font-size: 10px;
  color: var(--c-teal);
  background: color-mix(in srgb, var(--c-teal) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-teal) 30%, transparent);
}
.scope-key-row {
  margin: 14px 0 4px;
  padding: 11px 13px;
  background: var(--o05);
  border: 1px solid var(--o08);
  border-radius: 10px;
}
.scope-key-hint {
  display: block;
  margin-top: 7px;
  font-size: 10.5px;
  color: var(--faint);
  line-height: 1.5;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 14px;
}
.cancel-btn {
  padding: 8px 14px;
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--muted);
  border-radius: 9px;
  font-size: 12.5px;
  cursor: pointer;
}
.save-btn {
  padding: 8px 17px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.save-btn:disabled {
  opacity: 0.5;
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .connector-card {
    flex-wrap: wrap;
  }
}
</style>
