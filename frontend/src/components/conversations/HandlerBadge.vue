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
import { chatHandler, type ChatHandlerKind, type HandlerCandidate } from '@/utils/chatState'

const props = defineProps<{
  chat?: HandlerCandidate | null
  currentUserId?: string | null
}>()

const HANDLER_ICONS: Record<ChatHandlerKind, string> = {
  ai: 'fa-solid fa-robot',
  waiting: 'fa-solid fa-user-clock',
  human: 'fa-solid fa-user',
  closed: 'fa-solid fa-lock',
}

const handler = computed(() => chatHandler(props.chat, props.currentUserId))

// A closed chat has nobody handling it, and the status pill beside this badge
// already says so — saying it twice is noise.
const visible = computed(() => handler.value.kind !== 'closed')
</script>

<template>
  <span v-if="visible" class="handler-badge" :class="`handler-${handler.kind}`">
    <font-awesome-icon :icon="HANDLER_ICONS[handler.kind]" />
    <span class="handler-label">{{ handler.label }}</span>
  </span>
</template>

<style scoped>
.handler-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* The name can be long; the badge shrinks rather than pushing the row wider. */
.handler-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.handler-ai {
  background: var(--accent-bg-12);
  color: var(--accent-ink);
}

.handler-waiting {
  background: var(--warning-color-soft);
  color: var(--warning-color);
}

.handler-human {
  background: var(--success-color-soft);
  color: var(--success-color);
}
</style>
