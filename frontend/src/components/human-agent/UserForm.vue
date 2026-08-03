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
import { computed, ref, onMounted, watch } from 'vue'
import type { ChatScopeFields, Role, User } from '@/types/user'
import { meetsPasswordPolicy, validatePassword, type PasswordStrength } from '@/utils/validators'
import { listRoles } from '@/services/roles'
import PasswordStrengthMeter from '@/components/common/PasswordStrengthMeter.vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  user?: User | null
}>()

const emit = defineEmits<{
  submit: [userData: Partial<User> & ChatScopeFields & { password?: string, role_id?: number }]
  cancel: []
}>()

const fullName = ref(props.user?.full_name || '')
const email = ref(props.user?.email || '')
const isActive = ref(props.user?.is_active ?? true)
const password = ref('')
const confirmPassword = ref('')
const showPasswordFields = ref(!props.user)
const passwordTouched = ref(false)
const error = ref('')
const roles = ref<Role[]>([])
const selectedRole = ref(props.user?.role?.id || '')
const loadingRoles = ref(false)

// Chat scope. A new agent starts able to pick up whatever the AI is still
// handling, and unable to read colleagues' conversations — tick the second one
// to let someone cover a teammate's inbox. Once roles load these re-derive from
// whichever role is selected, so they always show what that role actually does.
const seeAllAiChats = ref(true)
const seeAllOrgChats = ref(false)

const permissionsOfSelectedRole = computed(
  () => roles.value.find(role => String(role.id) === String(selectedRole.value))
    ?.permissions?.map(permission => permission.name) ?? []
)

// super_admin passes every check, so the toggles would be decorative.
const scopeApplies = computed(
  () => !permissionsOfSelectedRole.value.includes('super_admin')
)

const syncScopeFromRole = () => {
  const permissions = permissionsOfSelectedRole.value
  if (!permissions.length) return
  seeAllAiChats.value = permissions.includes('view_unassigned_chats')
  seeAllOrgChats.value = permissions.includes('view_all_chats')
}

watch(selectedRole, syncScopeFromRole)

const passwordStrength = ref<PasswordStrength>({
  score: 0,
  hasMinLength: false,
  hasUpperCase: false,
  hasLowerCase: false,
  hasNumber: false,
  hasSpecialChar: false
})

const handlePasswordInput = (password: string) => {
  if (!passwordTouched.value && password.length > 0) {
    passwordTouched.value = true
  }
  passwordStrength.value = validatePassword(password)
  error.value = ''
}

const handleConfirmPasswordInput = () => {
  if (confirmPassword.value && password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
  } else {
    error.value = ''
  }
}

const fetchRoles = async () => {
  try {
    loadingRoles.value = true
    roles.value = await listRoles()
    syncScopeFromRole()
  } catch (err) {
    console.error('Error loading roles:', err)
    toast.error('Error', {
      description: 'Failed to load roles',
      duration: 4000,
      closeButton: true
    })
  } finally {
    loadingRoles.value = false
  }
}

onMounted(fetchRoles)

const handleSubmit = () => {
  if (showPasswordFields.value) {
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match'
      return
    }
    // The initial password an admin picks clears the same bar as a reset —
    // three surfaces used to disagree on what "strong enough" meant.
    if (!meetsPasswordPolicy(passwordStrength.value)) {
      error.value = 'Password is not strong enough'
      return
    }
  }

  if (!selectedRole.value) {
    error.value = 'Please select a role'
    return
  }

  const userData = {
    full_name: fullName.value,
    email: email.value,
    is_active: isActive.value,
    role_id: Number(selectedRole.value),
    ...(scopeApplies.value && {
      see_all_ai_chats: seeAllAiChats.value,
      see_all_org_chats: seeAllOrgChats.value
    }),
    ...(showPasswordFields.value && { password: password.value })
  }

  emit('submit', userData)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="user-form">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input
        id="fullName"
        v-model="fullName"
        type="text"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="role">Role</label>
      <select 
        id="role"
        v-model="selectedRole"
        required
        class="form-input"
        :disabled="loadingRoles"
      >
        <option value="" disabled>Select a role</option>
        <option 
          v-for="role in roles" 
          :key="role.id" 
          :value="role.id"
        >
          {{ role.name }}
        </option>
      </select>
      <span v-if="loadingRoles" class="loading-text">Loading roles...</span>
    </div>

    <div v-if="scopeApplies" class="form-group">
      <label>Which chats can they see?</label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="seeAllAiChats" />
        <span>
          All AI chats
          <small>Conversations the AI is handling that nobody has picked up.</small>
        </span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="seeAllOrgChats" />
        <span>
          All chats in the organization
          <small>Including other people's conversations — useful for covering leave.</small>
        </span>
      </label>
    </div>

    <template v-if="showPasswordFields">
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          class="form-input"
          autocomplete="new-password"
          @input="handlePasswordInput(password)"
        />
        <PasswordStrengthMeter v-if="passwordTouched" :strength="passwordStrength" />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          class="form-input"
          autocomplete="new-password"
          @input="handleConfirmPasswordInput"
          :class="{ 'error': error && error.includes('match') }"
        />
      </div>
    </template>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="isActive"
        />
        Active User
      </label>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        {{ props.user ? 'Update' : 'Create' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* The global .form-group already adds margin-bottom: var(--space-lg); combined
   with the flex gap above that doubled the spacing between every field. Zero
   it and let the single flex gap own the vertical rhythm. */
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

/* Inputs deliberately inherit the app-wide .form-input styling from
   components.css (padding, radius, hover + focus ring) so they match every
   other form — only the <select> chevron is added below. */

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text);
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
}

.checkbox-label small {
  display: block;
  color: var(--text3);
  font-size: var(--text-xs);
  margin-top: 2px;
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
  margin-bottom: var(--space-md);
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

.loading-text {
  font-size: var(--text-sm);
  color: var(--text-color);
  opacity: 0.7;
  margin-top: var(--space-xs);
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

select.form-input:disabled {
  background-color: var(--background-mute);
  cursor: not-allowed;
}
</style> 