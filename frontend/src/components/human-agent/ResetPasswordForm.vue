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
import { ref } from 'vue'
import type { User } from '@/types/user'
import { meetsPasswordPolicy, validatePassword, type PasswordStrength } from '@/utils/validators'
import PasswordStrengthMeter from '@/components/common/PasswordStrengthMeter.vue'

const props = defineProps<{
  user: User
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [newPassword: string]
  cancel: []
}>()

const password = ref('')
const confirmPassword = ref('')
const passwordTouched = ref(false)
const error = ref('')

const passwordStrength = ref<PasswordStrength>({
  score: 0,
  hasMinLength: false,
  hasUpperCase: false,
  hasLowerCase: false,
  hasNumber: false,
  hasSpecialChar: false,
})

const handlePasswordInput = () => {
  passwordTouched.value = passwordTouched.value || password.value.length > 0
  passwordStrength.value = validatePassword(password.value)
  error.value = ''
}

const handleConfirmPasswordInput = () => {
  error.value =
    confirmPassword.value && password.value !== confirmPassword.value
      ? '两次输入的密码不一致'
      : ''
}

const handleSubmit = () => {
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (!meetsPasswordPolicy(passwordStrength.value)) {
    error.value = '密码强度不足，请包含大小写字母、数字或特殊符号'
    return
  }

  emit('submit', password.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="reset-password-form">
    <p class="intro">
      正在为坐席 <strong>{{ props.user.full_name }}</strong>
      ({{ props.user.email }}) 设置新登录密码。系统不会发送自动通知邮件，请将新密码直接告知该坐席，并建议其登录后自行修改。
    </p>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-group">
      <label for="newPassword">新密码</label>
      <input
        id="newPassword"
        v-model="password"
        type="password"
        placeholder="请输入至少8位安全密码"
        required
        class="form-input"
        autocomplete="new-password"
        @input="handlePasswordInput"
      />
      <PasswordStrengthMeter v-if="passwordTouched" :strength="passwordStrength" />
    </div>

    <div class="form-group">
      <label for="confirmNewPassword">确认新密码</label>
      <input
        id="confirmNewPassword"
        v-model="confirmPassword"
        type="password"
        placeholder="再次输入新密码"
        required
        class="form-input"
        autocomplete="new-password"
        :class="{ error: error.includes('不一致') }"
        @input="handleConfirmPasswordInput"
      />
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">
        取消
      </button>
      <button type="submit" class="btn btn-primary" :disabled="props.submitting">
        {{ props.submitting ? '正在重置...' : '确认重置密码' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.intro {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text3);
}

/* Matches UserForm: the global .form-group margin plus the flex gap above
   would otherwise double the spacing between fields. */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0;
}

.form-group label {
  font-size: 13.5px;
  font-weight: var(--font-weight-medium);
  color: var(--text3);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.error-message {
  color: var(--error-color);
  font-size: var(--text-sm);
  padding: var(--space-sm);
  background: var(--error-soft);
  border-radius: var(--radius-sm);
}

.form-input.error {
  border-color: var(--error-color);
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px var(--error-soft);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
