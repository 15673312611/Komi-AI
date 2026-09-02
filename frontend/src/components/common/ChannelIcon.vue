<!--
Copyright 2024-2026 Komi AI

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

interface ChannelVisual {
  icon: string[]
  color: string
}

const props = withDefaults(
  defineProps<{
    channel?: string | null
    size?: number
  }>(),
  { channel: '', size: 14 },
)

// Brand-colored channel marks. Kept as one source of truth so the list rows,
// chat header and inbox sidebar all render channels identically.
const CHANNEL_VISUALS: Record<string, ChannelVisual> = {
  whatsapp: { icon: ['fab', 'whatsapp'], color: '#25D366' },
  telegram: { icon: ['fab', 'telegram'], color: '#26A5E4' },
  email: { icon: ['fas', 'envelope'], color: '#9CA3B0' },
  instagram: { icon: ['fab', 'instagram'], color: '#E1306C' },
  messenger: { icon: ['fab', 'facebook-messenger'], color: '#0084FF' },
  slack: { icon: ['fab', 'slack'], color: '#E01E5A' },
  line: { icon: ['fab', 'line'], color: '#06C755' },
  shopify: { icon: ['fab', 'shopify'], color: '#95BF47' },
  web: { icon: ['fas', 'globe'], color: '#8A93A3' },
  sms: { icon: ['fas', 'comment-sms'], color: '#8A93A3' },
  api: { icon: ['fas', 'bolt'], color: '#8A93A3' },
}

const FALLBACK: ChannelVisual = { icon: ['fas', 'comment'], color: '#8A93A3' }

const visual = computed<ChannelVisual>(() =>
  (props.channel && CHANNEL_VISUALS[props.channel]) || FALLBACK,
)

const visible = computed(() => !!props.channel)
</script>

<template>
  <span v-if="visible" class="channel-icon" :title="channel || undefined">
    <font-awesome-icon :icon="visual.icon" :style="{ fontSize: `${size}px` }" />
  </span>
</template>

<style scoped>
.channel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  color: v-bind('visual.color');
}
</style>
