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
import type { AddSourcePayload, CrawlScope } from '@/composables/useKnowledgeExplorer'

type SourceKind = 'website' | 'sitemap' | 'pdf' | 'text'

const props = withDefaults(
  defineProps<{
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: AddSourcePayload): void
}>()

const kind = ref<SourceKind>('website')
const url = ref('')
const scope = ref<CrawlScope>('host')
const files = ref<File[]>([])
const title = ref('')
const content = ref('')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const types: { key: SourceKind; title: string; sub: string }[] = [
  { key: 'website', title: '网页站点', sub: '抓取单页或整站内容' },
  { key: 'sitemap', title: '网站地图 Sitemap', sub: '索引地图包含的所有页面' },
  { key: 'pdf', title: '文档文件', sub: 'PDF 文档，最大 25 MB' },
  { key: 'text', title: '自定义文本', sub: '直接输入或粘贴正文' },
]

const willQueue = computed(() => kind.value !== 'text')
const submitLabel = computed(() => (kind.value === 'text' ? '添加知识页面' : '加入后台抓取队列'))

const canSubmit = computed(() => {
  if (props.submitting) return false
  if (kind.value === 'website' || kind.value === 'sitemap') return url.value.trim().length > 0
  if (kind.value === 'pdf') return files.value.length > 0
  return title.value.trim().length > 0 && content.value.trim().length > 0
})

function normalizeUrl(raw: string): string {
  const v = raw.trim()
  // Leave an explicit scheme alone; otherwise assume https.
  return v.includes('://') ? v : `https://${v}`
}

// Parsed form of what's typed so far, used to name the host/section in the
// scope options. Null while the URL is empty or not yet valid.
const parsedUrl = computed<URL | null>(() => {
  if (!url.value.trim()) return null
  try {
    return new URL(normalizeUrl(url.value))
  } catch {
    return null
  }
})

const seedHost = computed(() => parsedUrl.value?.hostname ?? '')
// The section is the URL's own path. Empty for a homepage URL — there is no
// section to speak of, and "pages under /" would just be "This site" again.
const seedSection = computed(() => parsedUrl.value?.pathname.replace(/\/$/, '') ?? '')

const scopes = computed<{ key: CrawlScope; title: string; sub: string }[]>(() => {
  const host = seedHost.value
  const section = seedSection.value
  return [
    { key: 'page', title: '仅抓取此单页', sub: '仅解析并索引上方输入的这一个 URL。' },
    ...(section
      ? [
          {
            key: 'path' as CrawlScope,
            title: '当前栏目/路径',
            sub: `仅抓取 ${host} 域名下以 ${section}/ 开头的所有子页面。`,
          },
        ]
      : []),
    {
      key: 'host',
      title: '当前子域整站',
      sub: host ? `抓取 ${host} 下的所有页面。` : '抓取相同主机名下的所有页面。',
    },
    {
      key: 'domain',
      title: '主域名全站及子域',
      sub: '包含所有二级子域名 — blog、docs、app 等。',
    },
  ]
})

// Editing the URL down to a homepage removes the section option; don't leave a
// scope selected that is no longer on screen.
watch(scopes, (options) => {
  if (!options.some((option) => option.key === scope.value)) scope.value = 'host'
})

function pickFiles() {
  fileInput.value?.click()
}

const isPdf = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) files.value = Array.from(input.files).filter(isPdf)
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  const dropped = event.dataTransfer?.files
  if (!dropped) return
  // Only accept PDFs — the backend upload endpoint validates PDF magic bytes.
  const pdfs = Array.from(dropped).filter(isPdf)
  if (pdfs.length) files.value = pdfs
}

function submit() {
  if (!canSubmit.value) return
  if (kind.value === 'website') {
    emit('submit', { type: 'website', url: normalizeUrl(url.value), scope: scope.value })
  } else if (kind.value === 'sitemap') {
    emit('submit', { type: 'sitemap', url: normalizeUrl(url.value) })
  } else if (kind.value === 'pdf') {
    emit('submit', { type: 'pdf', files: files.value })
  } else {
    emit('submit', { type: 'text', title: title.value.trim(), content: content.value })
  }
}
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-label="添加知识源">
      <div class="modal__head">
        <div>
          <h3 class="modal__title">添加知识源</h3>
          <p class="modal__sub">选择知识源类型 — 系统将在后台自动抓取、分块并建立向量索引。</p>
        </div>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="types">
        <button
          v-for="t in types"
          :key="t.key"
          type="button"
          class="type"
          :class="{ 'type--active': kind === t.key }"
          @click="kind = t.key"
        >
          <span class="type__title">{{ t.title }}</span>
          <span class="type__sub">{{ t.sub }}</span>
        </button>
      </div>

      <div class="body">
        <!-- website -->
        <template v-if="kind === 'website'">
          <label class="field-label" for="kb-add-url">页面地址 URL</label>
          <input id="kb-add-url" v-model="url" class="text-input" type="text"
            placeholder="https://docs.yourcompany.com/help" @keyup.enter="submit" />
          <label class="field-label">抓取覆盖范围</label>
          <div class="scope">
            <button v-for="opt in scopes" :key="opt.key" type="button" class="scope__opt"
              :class="{ 'scope__opt--active': scope === opt.key }" @click="scope = opt.key">
              <span class="radio" :class="{ 'radio--on': scope === opt.key }"></span>
              <span>
                <span class="scope__title">{{ opt.title }}</span>
                <span class="scope__sub">{{ opt.sub }}</span>
              </span>
            </button>
          </div>
          <p v-if="scope !== 'page'" class="scope__hint">
            系统将自动检索页面中引用的子链接并排队抓取，受套餐页面上限限制。
          </p>
        </template>

        <!-- sitemap -->
        <template v-else-if="kind === 'sitemap'">
          <label class="field-label" for="kb-add-sitemap">SITEMAP 网站地图地址</label>
          <input id="kb-add-sitemap" v-model="url" class="text-input" type="text"
            placeholder="https://yourcompany.com/sitemap.xml" @keyup.enter="submit" />
          <div class="note note--teal">
            系统将解析 Sitemap 文件，并将其中包含的所有网址加入异步抓取队列。大型地图将分批并发处理。
          </div>
        </template>

        <!-- document -->
        <template v-else-if="kind === 'pdf'">
          <div
            class="drop"
            :class="{ 'drop--over': dragOver }"
            @click="pickFiles"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <input ref="fileInput" type="file" accept="application/pdf" multiple class="hidden-file"
              @change="onFilesSelected" />
            <span v-if="files.length" class="drop__name">{{ files.map((f) => f.name).join(', ') }}</span>
            <span v-else class="drop__name">拖拽 PDF 文件至此，或点击浏览选择</span>
            <span class="drop__hint">支持 PDF 文件 · 单个文件最大 25 MB</span>
          </div>
          <div class="note note--coral">
            系统将提取文本、智能分块并建立语义向量索引。扫描件 PDF 将自动执行 OCR 文字识别。
          </div>
        </template>

        <!-- text -->
        <template v-else>
          <label class="field-label" for="kb-add-title">知识标题</label>
          <input id="kb-add-title" v-model="title" class="text-input" type="text" placeholder="例如：退换货服务政策与流程" />
          <label class="field-label" for="kb-add-content">知识正文内容</label>
          <textarea id="kb-add-content" v-model="content" class="textarea"
            placeholder="输入或粘贴希望 AI 智能体掌握学习的知识正文…"></textarea>
        </template>
      </div>

      <div class="foot">
        <span class="foot__note">
          <span class="foot__dot" :class="willQueue ? 'foot__dot--queue' : 'foot__dot--instant'"></span>
          <template v-if="willQueue">已加入抓取队列 — 索引完成后将自动就绪。</template>
          <template v-else>立即生效 — 无需等待抓取。</template>
        </span>
        <div class="foot__actions">
          <button class="btn btn--ghost" type="button" :disabled="submitting" @click="emit('close')">取消</button>
          <button class="btn btn--primary" type="button" :disabled="!canSubmit" @click="submit">
            {{ submitting ? '正在添加…' : submitLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--scrim);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 20px;
  overflow-y: auto;
}

.modal {
  width: 560px;
  max-width: 100%;
  background: var(--bg2);
  border: 1px solid var(--o12);
  border-radius: 20px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--o08);
}

.modal__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 19px;
  color: var(--text);
  margin: 0 0 4px;
}

.modal__sub {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.icon-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: var(--o05);
  border: 1px solid var(--o10);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--o08);
  color: var(--text2);
}

.types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  padding: 18px 24px 4px;
}

.type {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 13px;
  border-radius: 11px;
  cursor: pointer;
  text-align: left;
  background: transparent;
  border: 1.5px solid var(--o10);
}

.type:hover {
  background: var(--o04);
}

.type--active {
  background: var(--accent-bg-06);
  border-color: var(--accent-solid);
}

.type__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text2);
}

.type__sub {
  font-size: 11.5px;
  color: var(--muted2);
  line-height: 1.3;
}

.body {
  padding: 16px 24px 4px;
  min-height: 172px;
}

.field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.07em;
  color: var(--muted2);
  margin-bottom: 8px;
}

.field-label:not(:first-child) {
  margin-top: 16px;
}

.text-input,
.textarea {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--o12);
  border-radius: 11px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  font-family: var(--font-sans);
}

.textarea {
  min-height: 120px;
  line-height: 1.6;
  color: var(--text3);
  resize: vertical;
}

.text-input:focus,
.textarea:focus {
  border-color: var(--accent-border, var(--accent-ink));
}

.scope {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scope__opt {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  width: 100%;
  padding: 12px 13px;
  border-radius: 11px;
  cursor: pointer;
  text-align: left;
  background: transparent;
  border: 1.5px solid var(--o10);
}

.scope__opt--active {
  background: var(--accent-bg-06);
  border-color: var(--accent-solid);
}

.radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
  border-radius: 50%;
  border: 2px solid var(--o20);
}

.radio--on {
  border-color: var(--accent-solid);
  background: radial-gradient(circle, var(--accent-solid) 0 45%, transparent 48%);
}

.scope__title {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text2);
}

.scope__sub {
  display: block;
  font-size: 12px;
  color: var(--muted2);
  margin-top: 1px;
  overflow-wrap: anywhere;
}

.scope__hint {
  margin: 8px 2px 0;
  font-size: 12px;
  color: var(--muted2);
}

.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 20px;
  background: var(--bg);
  border: 1.5px dashed var(--o20);
  border-radius: 14px;
  cursor: pointer;
  text-align: center;
}

.drop--over {
  border-color: var(--c-coral);
  background: var(--coral-bg);
}

.hidden-file {
  display: none;
}

.drop__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
  word-break: break-word;
}

.drop__hint {
  font-size: 12px;
  color: var(--muted2);
}

.note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 11px;
  font-size: 12.5px;
  color: var(--text3);
  line-height: 1.5;
  margin-top: 14px;
}

.note--teal {
  background: var(--teal-bg);
  border: 1px solid var(--teal-border);
}

.note--coral {
  background: var(--coral-bg);
  border: 1px solid var(--coral-border);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 24px;
  border-top: 1px solid var(--o08);
  background: var(--surface);
}

.foot__note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.4;
}

.foot__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.foot__dot--queue {
  background: var(--c-purple);
}

.foot__dot--instant {
  background: var(--c-teal);
}

.foot__actions {
  display: flex;
  gap: 9px;
  flex-shrink: 0;
}

.btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  border-color: var(--o12);
  color: var(--muted);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--o05);
}

.btn--primary {
  background: var(--accent-solid);
  color: var(--on-accent-solid);
}

.btn--primary:hover:not(:disabled) {
  filter: brightness(1.05);
}
</style>
