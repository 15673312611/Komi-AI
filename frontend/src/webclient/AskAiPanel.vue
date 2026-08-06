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

<!--
  The Ask AI surface used by the ASK_ANYTHING and AURORA chat styles: a command
  palette, not a chat bubble. One input pinned at the top, suggested questions while
  it's empty, and answers streaming underneath with their sources — the shape people
  know from every "Ask AI" search box.

  Presentational only: all state and socket work stays in WidgetBuilder, which passes
  it in and handles the emitted intents. Colours come from the --cm-* theme tokens
  (widget-theme.ts), so both styles and any custom accent are handled for free.
-->

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderMarkdown } from './markdown'
import type { Message } from '../types/chat'

const props = defineProps<{
    messages: Message[]
    draft: string
    agentName: string
    suggestions: string[]
    welcomeTitle?: string
    welcomeSubtitle?: string
    placeholder: string
    inputEnabled: boolean
    loading: boolean
    showCitations: boolean
    disclaimer?: string
    /** Whether the embedder is actually showing the widget — gates autofocus. */
    active: boolean
    /** False when the site disabled the ⌘K chord. */
    hotkey: boolean
    citationLabel: (source: any) => string
    citationTooltip: (source: any) => string
}>()

const emit = defineEmits<{
    (e: 'update:draft', value: string): void
    (e: 'send'): void
    (e: 'ask', question: string): void
    (e: 'close'): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)

// Questions, answers and system notes. Interactive kinds (forms, ratings, product
// cards) never reach here: WidgetBuilder falls the whole conversation back to the
// chat panel rather than let this surface drop them.
const RENDERABLE = ['user', 'bot', 'agent', 'system']
const turns = computed(() => props.messages.filter(m => RENDERABLE.includes(m.message_type)))

const hasConversation = computed(() => turns.value.length > 0)

const onInput = (event: Event) => {
    emit('update:draft', (event.target as HTMLInputElement).value)
}

const submit = () => {
    if (!props.inputEnabled || !props.draft.trim()) return
    emit('send')
}

const askSuggestion = (question: string) => {
    if (!props.inputEnabled) return
    emit('ask', question)
}

// Esc closes from inside the palette. The loader's own handler lives on the host page
// and can't see keys pressed in this iframe, so without this the shortcut would die
// the moment the input takes focus — which is immediately.
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')

const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        event.preventDefault()
        emit('close')
        return
    }
    // Same chord that opened it closes it. Platform-specific on purpose: Ctrl+K on
    // macOS is kill-to-end-of-line inside a text field, and this listener sits on a
    // surface whose input is focused.
    const chord = isMac ? (event.metaKey && !event.ctrlKey) : (event.ctrlKey && !event.metaKey)
    if (props.hotkey && chord && !event.altKey && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        emit('close')
    }
}

const focusInput = () => {
    nextTick(() => inputEl.value?.focus())
}

// Keep the newest answer in view as it grows. Watches total answer length, not just
// the turn count, so a streaming reply keeps the tail visible.
const contentLength = computed(() => turns.value.reduce((n, m) => n + (m.message?.length || 0), 0))

watch(
    () => [turns.value.length, contentLength.value, props.loading] as const,
    () => nextTick(() => {
        if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
    })
)

// Focus only once the embedder actually shows the widget: the iframe is created
// eagerly at page load, so focusing on mount would steal it from the host page.
watch(() => props.active, (visible) => {
    if (visible) focusInput()
})

onMounted(() => {
    if (props.active) focusInput()
    window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
    <div class="askai">
        <!-- Ask bar: stays at the top, follow-ups are typed here too. -->
        <div class="askai__bar">
            <svg class="askai__bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 4.9L19 9.8l-4.9 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3z" />
            </svg>
            <input
                ref="inputEl"
                type="text"
                class="askai__input"
                :value="draft"
                :placeholder="placeholder"
                :disabled="!inputEnabled"
                :aria-label="placeholder"
                autocomplete="off"
                spellcheck="false"
                @input="onInput"
                @keydown.enter.prevent="submit"
            >
            <button type="button" class="askai__close" aria-label="Close" title="Close (Esc)" @click="emit('close')">
                <span class="askai__kbd">Esc</span>
            </button>
        </div>

        <div ref="bodyEl" class="askai__body">
            <!-- Empty state. A blank panel is the one thing an answer surface must
                 never show: give people something to click. -->
            <template v-if="!hasConversation">
                <div class="askai__intro">
                    <h2 class="askai__title">{{ welcomeTitle || `Ask ${agentName}` }}</h2>
                    <p v-if="welcomeSubtitle" class="askai__subtitle">{{ welcomeSubtitle }}</p>
                </div>
                <!-- Hidden once the visitor starts typing: picking a suggestion
                     replaces the draft, so offering both would discard their text. -->
                <div v-if="suggestions.length && !draft.trim()" class="askai__suggestions">
                    <p class="askai__label">Suggested</p>
                    <button
                        v-for="question in suggestions"
                        :key="question"
                        type="button"
                        class="askai__suggestion"
                        :disabled="!inputEnabled"
                        @click="askSuggestion(question)"
                    >
                        <span>{{ question }}</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                    </button>
                </div>
            </template>

            <!-- Answers. Questions read as headings, answers as prose — a document,
                 not a back-and-forth of bubbles. -->
            <template v-else>
                <div v-for="(message, index) in turns" :key="index" class="askai__turn" aria-live="polite">
                    <p v-if="message.message_type === 'user'" class="askai__question">{{ message.message }}</p>
                    <p v-else-if="message.message_type === 'system'" class="askai__system">{{ message.message }}</p>
                    <template v-else>
                        <div class="askai__answer" v-html="renderMarkdown(message.message || '')"></div>
                        <div v-if="showCitations && message.sources && message.sources.length" class="askai__sources">
                            <span class="askai__label">Sources</span>
                            <span
                                v-for="(source, sourceIndex) in message.sources"
                                :key="sourceIndex"
                                class="askai__source"
                                :title="citationTooltip(source)"
                            >{{ citationLabel(source) }}</span>
                        </div>
                    </template>
                </div>
                <div v-if="loading" class="askai__thinking" role="status" aria-live="polite">
                    <span class="askai__dot"></span><span class="askai__dot"></span><span class="askai__dot"></span>
                    <span class="askai__thinking-text">{{ showCitations ? 'Searching the knowledge base' : 'Thinking' }}</span>
                </div>
            </template>
        </div>

        <div class="askai__foot">
            <span v-if="disclaimer">{{ disclaimer }}</span>
            <a class="askai__brand" href="https://chattermate.chat" target="_blank" rel="noopener noreferrer">Powered by ChatterMate</a>
        </div>
    </div>
</template>

<style scoped>
/* Every colour is a --cm-* theme token, so light (Ask Anything) and dark (Aurora)
   both work, and a custom accent_color flows through untouched. */
.askai {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--cm-card);
    color: var(--cm-text);
    font-family: var(--cm-body-font, inherit);
}

.askai__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 14px 14px 16px;
    border-bottom: 1px solid var(--cm-border);
    flex-shrink: 0;
}

.askai__bar-icon {
    color: var(--cm-accent);
    flex-shrink: 0;
}

.askai__input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--cm-text);
    font-size: 16px;
    font-family: inherit;
    padding: 2px 0;
}

.askai__input::placeholder { color: var(--cm-muted); }
.askai__input:disabled { opacity: 0.6; }

.askai__close {
    border: 1px solid var(--cm-border);
    background: transparent;
    border-radius: 6px;
    padding: 3px 7px;
    cursor: pointer;
    color: var(--cm-muted);
    flex-shrink: 0;
    transition: color 0.15s ease, border-color 0.15s ease;
}

.askai__close:hover {
    color: var(--cm-text);
    border-color: var(--cm-accent);
}

.askai__kbd {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    font-family: inherit;
}

.askai__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 20px 22px;
}

.askai__intro { margin-bottom: 18px; }

.askai__title {
    margin: 0 0 4px;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.askai__subtitle {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--cm-muted);
}

.askai__label {
    display: block;
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--cm-muted);
}

.askai__suggestions { display: flex; flex-direction: column; gap: 6px; }

.askai__suggestion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 11px 13px;
    border: 1px solid var(--cm-border);
    border-radius: 10px;
    background: var(--cm-agent-bg);
    color: var(--cm-text);
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease;
}

.askai__suggestion:hover:not(:disabled) {
    border-color: var(--cm-accent);
    transform: translateX(2px);
}

.askai__suggestion:disabled { opacity: 0.55; cursor: default; }
.askai__suggestion svg { color: var(--cm-muted); flex-shrink: 0; }

.askai__turn + .askai__turn { margin-top: 20px; }

.askai__question {
    margin: 0 0 10px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
}

.askai__answer {
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--cm-text);
    overflow-wrap: break-word;
}

.askai__answer :deep(p) { margin: 0 0 10px; }
.askai__answer :deep(p:last-child) { margin-bottom: 0; }
.askai__answer :deep(ul),
.askai__answer :deep(ol) { margin: 0 0 10px; padding-left: 20px; }
.askai__answer :deep(li) { margin-bottom: 4px; }
.askai__answer :deep(a) { color: var(--cm-accent); }
.askai__answer :deep(code) {
    background: var(--cm-agent-bg);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.9em;
}
.askai__answer :deep(pre) {
    background: var(--cm-agent-bg);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
}
.askai__answer :deep(pre code) { background: none; padding: 0; }

.askai__sources {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
}

.askai__sources .askai__label { margin: 0 2px 0 0; }

.askai__source {
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--cm-border);
    color: var(--cm-muted);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.askai__thinking {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 16px;
    color: var(--cm-muted);
    font-size: 13px;
}

.askai__thinking-text { margin-left: 4px; }

.askai__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--cm-accent);
    animation: askai-pulse 1.4s ease-in-out infinite;
}

.askai__dot:nth-child(2) { animation-delay: 0.18s; }
.askai__dot:nth-child(3) { animation-delay: 0.36s; }

@keyframes askai-pulse {
    0%, 100% { opacity: 0.35; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
    .askai__dot { animation: none; }
    .askai__suggestion:hover:not(:disabled) { transform: none; }
}

.askai__system {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    color: var(--cm-muted);
}

.askai__foot {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin: 0;
    padding: 10px 16px 12px;
    border-top: 1px solid var(--cm-border);
    font-size: 11.5px;
    text-align: center;
    color: var(--cm-muted);
    flex-shrink: 0;
}

.askai__brand {
    color: inherit;
    text-decoration: none;
    opacity: 0.8;
}

.askai__brand:hover { text-decoration: underline; }

@media (max-width: 768px) {
    .askai__body { padding: 16px 16px 20px; }
    /* 16px keeps iOS from zooming the page when the input takes focus. */
    .askai__input { font-size: 16px; }
}
</style>
