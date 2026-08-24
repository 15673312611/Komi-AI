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
import { toast } from 'vue-sonner'
import type { Agent } from '@/types/agent'
import { buildWidgetEmbed } from '@/utils/widgetEmbed'

interface Widget {
  id: string;
  [key: string]: any;
}

const props = defineProps({
  widget: {
    type: Object as () => Widget | null,
    required: true
  },
  widgetUrl: {
    type: String,
    required: true
  },
  widgetLoading: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object as () => Agent,
    required: true
  }
})

const emit = defineEmits(['copy-widget-code', 'copy-iframe-code', 'copy-backend-code'])

// Check if token authentication is required
const requiresTokenAuth = computed(() => {
  return props.agent?.require_token_auth ?? false
})

// The exact snippet the Copy button produces (see buildWidgetEmbed) — rendered
// in the preview so what you see always matches what you copy.
const embedCode = computed(() => buildWidgetEmbed(props.widget?.id ?? '', requiresTokenAuth.value))

const copyWidgetCode = () => {
  emit('copy-widget-code')
}

const copyIframeCode = () => {
  emit('copy-iframe-code')
}

const copyBackendCode = () => {
  emit('copy-backend-code')
}

// Check if this is an "Ask Anything" style agent
const isAskAnythingStyle = computed(() => {
  return props.agent?.customization?.chat_style === 'ASK_ANYTHING'
})

// Per-page overrides + JS control examples. Placement defaults live in the
// Customization tab; these snippets are for developers who need more.
const configExampleCode = `<script>
  window.chattermateConfig = {
    displayMode: 'sidebar-right', // 'floating' | 'sidebar-left' | 'sidebar-right' | 'search-bar'
    position: { side: 'right', bottom: 20, offset: 20 },
    width: 400,                   // floating window size
    height: 560,
    launcher: false,              // hide the built-in launcher
    trigger: '#my-chat-button',   // your own element opens the chat
    zIndex: 999999
  };
<\/script>`

const jsApiExampleCode = `// From your own code:
ChatterMate.open();                  // open({ message: 'Hi!' }) prefills the input
ChatterMate.close();
ChatterMate.toggle();
ChatterMate.on('unread', (count) => { /* badge your own button */ });
ChatterMate.on('ready', () => { /* widget loaded */ });

// Or with no JavaScript at all:
<button data-chattermate-open>Chat with us</button>`

const copyText = (text: string) => {
  if (!navigator.clipboard) {
    toast.error('Clipboard unavailable — copy the snippet manually')
    return
  }
  navigator.clipboard.writeText(text)
    .then(() => toast.success('Copied to clipboard'))
    .catch(() => toast.error('Copy failed — copy the snippet manually'))
}

// Generate iframe URL
const iframeUrl = computed(() => {
  if (!props.widget?.id) return ''
  return `${props.widgetUrl}/api/v1/widgets/${props.widget.id}/data`
})

// Generate iframe embed code
const iframeEmbedCode = computed(() => {
  if (!props.widget?.id) return ''
  return `<iframe src="${iframeUrl.value}" width="100%" height="600" frameborder="0" title="AI Assistant" allow="clipboard-write"></iframe>`
})
</script>

<template>
  <div class="widget-tab">
    <section class="detail-section">
      <h3 class="section-title">网页挂件集成与部署</h3>
      <p class="section-description">
        只需将下方代码片段复制并粘贴到您网站的 HTML 源码中，即可让智能客服立即在您的网站上线运行。
      </p>

      <div class="widget-info">
        <h4 class="widget-section-title">挂件嵌入代码</h4>
        <div v-if="widgetLoading" class="loading-indicator">
          <div class="loading-spinner"></div>
          正在加载挂件配置...
        </div>
        <div v-else-if="widget" class="widget-code-section">
          <!-- Token-based authentication (when require_token_auth is enabled) -->
          <template v-if="requiresTokenAuth">
            <div class="auth-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              已开启安全令牌 (Token) 身份认证
            </div>

            <p class="code-description">
              该智能体开启了安全认证。在前端加载挂件前，您的后端服务必须先调用 ChatterMate API 签发临时安全 Token。
            </p>

            <!-- Step 1: Get API Key -->
            <div class="setup-step">
              <div class="step-header">
                <span class="step-number">1</span>
                <h5 class="step-title">获取 API Key 密钥</h5>
              </div>
              <p class="step-description">
                前往 <strong>系统设置 &gt; 挂件应用</strong> 创建挂件应用并获取专属 API Key。请妥善保管此密钥，仅在您的后端服务器中使用。
              </p>
            </div>

            <!-- Step 2: Backend Token Generation -->
            <div class="setup-step">
              <div class="step-header">
                <span class="step-number">2</span>
                <h5 class="step-title">后端生成访问令牌 (服务端接口)</h5>
              </div>
              <p class="step-description">
                在您的服务端创建一个接口，调用 ChatterMate 鉴权接口生成临时访问 Token：
              </p>
              <div class="code-block">
                <pre><code>// 您的后端接口 (例如 /api/chat-token)
const response = await fetch('{{ widgetUrl }}/api/v1/generate-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 您的_API_KEY'  // 来自系统设置中的挂件应用
  },
  body: JSON.stringify({
    widget_id: '{{ widget.id }}',
    customer_email: 'user@example.com',  // 可选：当前登录客户邮箱
    ttl_seconds: 3600  // 令牌有效期 (默认 1 小时)
  })
});

const { data } = await response.json();
// 将 data.token 返回给前端客户端</code></pre>
                <button class="copy-button" @click="copyBackendCode" title="复制后端示例代码">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Step 3: Frontend Integration -->
            <div class="setup-step">
              <div class="step-header">
                <span class="step-number">3</span>
                <h5 class="step-title">嵌入您的网站前端 (客户端)</h5>
              </div>
              <p class="step-description">
                将以下代码添加到 HTML 页面中，并将 <code>/api/chattermate</code> 替换为您在第 2 步中创建的服务端鉴权接口路径：
              </p>
              <div class="code-block">
                <pre><code>{{ embedCode }}</code></pre>
                <button class="copy-button" @click="copyWidgetCode" title="复制前端嵌入代码">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="info-box warning">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="info-content">
                <p><strong>安全提示：</strong> 切勿在前端页面代码中直接暴露您的 API Key。令牌签发必须在安全的服务端执行。</p>
              </div>
            </div>
          </template>

          <!-- Simple integration (no token auth required) -->
          <template v-else>
            <p class="code-description">
              将以下代码片段直接粘贴到您网站 HTML 的 <code>&lt;/body&gt;</code> 结束标签之前即可：
            </p>
            <div class="code-block">
              <pre><code>{{ embedCode }}</code></pre>
              <button class="copy-button" @click="copyWidgetCode" title="复制挂件代码">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <div class="info-box">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="info-content">
                <p>挂件将以对话气泡按钮的形式呈现在您网站右下角。无需任何复杂服务端鉴权即可开箱即用。</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Per-page overrides + JS API -->
      <div class="widget-info">
        <h4 class="widget-section-title">个性化高级定制与 JS 接口控制 (可选)</h4>
        <div class="widget-code-section">
          <p class="code-description">
            挂件的默认外观与弹出位置可在 <strong>挂件外观定制</strong> 标签页中直观设置。
            若您需要在特定单页覆盖默认样式，可在挂件脚本加载前声明 <code>window.chattermateConfig</code>：
          </p>
          <div class="code-block">
            <pre><code>{{ configExampleCode }}</code></pre>
            <button class="copy-button" @click="copyText(configExampleCode)" title="复制代码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <p class="code-description">
            通过 JavaScript 编程或自定义网页按钮控制挂件开启、关闭与消息监听：
          </p>
          <div class="code-block">
            <pre><code>{{ jsApiExampleCode }}</code></pre>
            <button class="copy-button" @click="copyText(jsApiExampleCode)" title="复制代码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Iframe Integration Section for Ask Anything Style -->
      <div v-if="isAskAnythingStyle && !requiresTokenAuth" class="widget-info">
        <h4 class="widget-section-title">Iframe 嵌入集成</h4>
        <div v-if="widgetLoading" class="loading-indicator">
          <div class="loading-spinner"></div>
          正在加载 Iframe 信息...
        </div>
        <div v-else-if="widget" class="widget-code-section">
          <p class="code-description">
            针对「全知问答 (Ask Anything)」形态的智能体，您可以将对话界面以内嵌 Iframe 的形式直接嵌入到页面主体内容中：
          </p>

          <!-- Iframe Preview -->
          <div class="iframe-preview-section">
            <h5 class="preview-title">嵌入预览效果</h5>
            <div class="iframe-preview-container">
              <iframe
                :src="iframeUrl"
                class="iframe-preview"
                frameborder="0"
                title="AI 助手嵌入预览"
                allow="clipboard-write"
              ></iframe>
            </div>
          </div>

          <!-- Iframe Code -->
          <div class="code-block">
            <pre><code>{{ iframeEmbedCode }}</code></pre>
            <button class="copy-button" @click="copyIframeCode" title="复制 Iframe 代码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.41421C20 6.88378 19.7893 6.37507 19.4142 6L16 2.58579C15.6249 2.21071 15.1162 2 14.5858 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="info-box">
            <div class="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="info-content">
              <p><strong>使用技巧：</strong> 非常适合直接嵌入帮助中心文档页、独立客服专区或营销落地页中。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.widget-tab {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--space-lg);
}

.detail-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
}

.section-description {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 22px;
  line-height: 1.6;
}

.widget-section-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-md);
}

.widget-info {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  width: 100%;
  border: 1px solid var(--o08);
  margin-bottom: var(--space-xl);
}

.widget-code-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Auth badge for token authentication */
.auth-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--accent-bg-12);
  color: var(--accent-ink);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-chip);
  font-size: var(--text-sm);
  font-weight: 500;
  width: fit-content;
  margin-bottom: var(--space-md);
}

.code-description {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.code-description code {
  background: var(--o06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--accent-ink);
}

/* Setup steps */
.setup-step {
  background: var(--bg-deep);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  border: 1px solid var(--o08);
}

.step-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border-radius: 50%;
  font-size: var(--text-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.step-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.step-description {
  color: var(--muted);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin: 0 0 var(--space-md) 0;
  padding-left: calc(28px + var(--space-md));
}

.step-description strong {
  color: var(--text);
}

/* Code block styling */
.code-block {
  position: relative;
  background: var(--bg-deep);
  border: 1px solid var(--o10);
  border-radius: 14px;
  overflow: hidden;
}

.code-block pre {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
}

.code-block code {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--code);
  white-space: pre;
  display: block;
}

.code-block .copy-button {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: var(--o06);
  border: 1px solid var(--o14);
  border-radius: var(--radius-chip);
  color: var(--muted);
}

.code-block .copy-button:hover {
  background: var(--o14);
  color: var(--text);
}

.copy-button {
  background: var(--o06);
  border: 1px solid var(--o14);
  padding: var(--space-sm);
  border-radius: var(--radius-chip);
  cursor: pointer;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: var(--o14);
  color: var(--text);
}

.loading-indicator {
  font-size: var(--text-sm);
  color: var(--muted);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--bg-deep);
  border-radius: var(--radius-md);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--o10);
  border-radius: 50%;
  border-top-color: var(--accent-ink);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Info box */
.info-box {
  display: flex;
  background: var(--bg-deep);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-ink);
  gap: var(--space-md);
  align-items: flex-start;
}

.info-box.warning {
  border-left-color: var(--c-teal);
  background: var(--teal-bg);
}

.info-box .info-icon {
  flex-shrink: 0;
  color: var(--accent-ink);
}

.info-box.warning .info-icon {
  color: var(--c-teal);
}

.info-content p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted);
  line-height: 1.6;
}

.info-content strong {
  color: var(--text);
}

/* Iframe integration styles */
.iframe-preview-section {
  margin-bottom: var(--space-lg);
}

.preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.iframe-preview-container {
  background: var(--bg-deep);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  border: 1px solid var(--o08);
}

.iframe-preview {
  width: 100%;
  height: 450px;
  border-radius: var(--radius-md);
  background: var(--bg2);
  display: block;
}

@media (max-width: 768px) {
  .widget-tab {
    padding: 0 var(--space-md);
  }

  .widget-info {
    padding: var(--space-lg);
  }

  .step-description {
    padding-left: 0;
    margin-top: var(--space-sm);
  }

  .code-block pre {
    padding: var(--space-md);
  }

  .code-block code {
    font-size: 12px;
  }

  .iframe-preview {
    height: 350px;
  }
}
</style> 