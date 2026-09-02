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
import type { PasswordStrength } from '@/utils/validators'

const props = defineProps<{
  strength: PasswordStrength
}>()

const TOTAL_CHECKS = 5

const strengthClass = computed(() => {
  if (props.strength.score >= 4) return 'strong'
  if (props.strength.score >= 3) return 'medium'
  return 'weak'
})

const requirements = computed(() => [
  { label: '密码长度至少 8 位', met: props.strength.hasMinLength },
  { label: '至少包含一个大写字母', met: props.strength.hasUpperCase },
  { label: '至少包含一个小写字母', met: props.strength.hasLowerCase },
  { label: '至少包含一个数字', met: props.strength.hasNumber },
  { label: '至少包含一个特殊字符', met: props.strength.hasSpecialChar },
])
</script>

<template>
  <div class="password-strength">
    <div class="strength-meter">
      <div
        class="strength-bar"
        :class="strengthClass"
        :style="{ width: `${(strength.score / TOTAL_CHECKS) * 100}%` }"
      />
    </div>
    <ul class="strength-requirements">
      <li v-for="req in requirements" :key="req.label" :class="{ met: req.met }">
        {{ req.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.password-strength {
  margin-top: var(--space-sm);
}

.strength-meter {
  height: 4px;
  background: var(--background-mute);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-sm);
}

.strength-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.strength-bar.weak {
  background: var(--error-color);
}

.strength-bar.medium {
  background: var(--warning-color);
}

.strength-bar.strong {
  background: var(--success-color);
}

.strength-requirements {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-color);
  opacity: 0.7;
}

.strength-requirements li {
  margin-bottom: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.strength-requirements li::before {
  content: '×';
  color: var(--error-color);
}

.strength-requirements li.met::before {
  content: '✓';
  color: var(--success-color);
}
</style>
