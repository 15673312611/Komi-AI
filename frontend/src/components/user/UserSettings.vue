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
import { ref, onMounted, onBeforeUnmount, inject, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { userService } from '@/services/user'
import { meetsPasswordPolicy, validatePassword, type PasswordStrength } from '@/utils/validators'
import PasswordStrengthMeter from '@/components/common/PasswordStrengthMeter.vue'
import userAvatar from '@/assets/user.svg'
import type { User } from '@/types/user'
import { isAbsoluteUrl } from '@/utils/avatars'
import { myAvatarUrl } from '@/config/api'
import { useNotificationSettings } from '@/composables/useNotificationSettings'
import { useNotifications } from '@/composables/useNotifications'
import type { NotificationSettings } from '@/services/notification'

const { user } = useAuth()

const {
  settings: notificationSettings,
  isLoading: notificationsLoading,
  isSaving: notificationsSaving,
  save: saveNotificationSetting
} = useNotificationSettings()
const { hasPermission: hasPushPermission, enableNotifications } = useNotifications()

// One row per toggle so the markup stays a single loop.
const NOTIFICATION_TOGGLES: { key: keyof NotificationSettings; title: string; desc: string }[] = [
  {
    key: 'notify_new_chat',
    title: '新对话接入通知',
    desc: '当有新会话开始接入时（包括由 AI 正在处理中的对话）。'
  },
  {
    key: 'notify_chat_transfer',
    title: '转接至我所在分组的会话',
    desc: '当 AI 智能体或同事将对话转接至您所属的技能组时。'
  },
  {
    key: 'notify_chat_assigned',
    title: '指派给我的对话',
    desc: '当会话被明确分配给您本人处理时。'
  }
]

const profilePicFile = ref<File | null>(null)
const profilePicPreview = ref<string>('')
const formData = ref({
  full_name: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// Define the fileInput ref with proper typing
const fileInput = ref<HTMLInputElement | null>(null)

const avatarUploading = ref(false)
const profileSaving = ref(false)
const message = ref('')
const error = ref('')

const passwordTouched = ref(false)
const passwordStrength = ref<PasswordStrength>({
  score: 0,
  hasMinLength: false,
  hasUpperCase: false,
  hasLowerCase: false,
  hasNumber: false,
  hasSpecialChar: false
})


const hasChanges = computed(() => {
  if (!user.value) return false
  
  const hasProfileChanges = 
    formData.value.full_name !== user.value.full_name ||
    formData.value.email !== user.value.email

  const hasPasswordChanges = 
    formData.value.new_password || 
    formData.value.current_password ||
    formData.value.confirm_password

  return hasProfileChanges || hasPasswordChanges
})

const avatarInitial = computed(() => {
  const name = formData.value.full_name || user.value?.full_name || user.value?.email || ''
  return name.trim().charAt(0).toUpperCase() || 'U'
})

const discardChanges = () => {
  if (user.value) {
    formData.value.full_name = user.value.full_name
    formData.value.email = user.value.email
  }
  formData.value.current_password = ''
  formData.value.new_password = ''
  formData.value.confirm_password = ''
  passwordTouched.value = false
  error.value = ''
  message.value = ''
}

const userAvatarSrc = computed(() => {
  if (profilePicPreview.value) return profilePicPreview.value
  if (!user.value?.profile_pic) return userAvatar
  // Same reasoning as the header avatar: the stored URL was signed at login and
  // expires within the hour, so ask the API to sign a fresh one instead.
  return myAvatarUrl(new Date().getTime())
})

onMounted(async () => {
  // Load current user data
  if (user.value) {
    formData.value.full_name = user.value.full_name
    formData.value.email = user.value.email
  }
})

const handlePasswordInput = (password: string) => {
  if (!passwordTouched.value && password.length > 0) {
    passwordTouched.value = true
  }
  passwordStrength.value = validatePassword(password)
}

const handleFileSelect = (event: Event) => {
  if (avatarUploading.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file.type.startsWith('image/')) {
    error.value = '请选择有效的图片格式文件'
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return
  }
  
  // Clear any previous error messages
  error.value = ''
  
  if (profilePicPreview.value) {
    URL.revokeObjectURL(profilePicPreview.value)
  }

  // Set the file and create preview
  profilePicFile.value = file
  profilePicPreview.value = URL.createObjectURL(file)
}

const resetFileInput = () => {
  if (profilePicPreview.value) {
    URL.revokeObjectURL(profilePicPreview.value)
  }

  // Clear preview and file
  profilePicFile.value = null
  profilePicPreview.value = ''
  
  // Reset the file input element to allow selecting the same file again
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadProfilePic = async () => {
  if (!profilePicFile.value || avatarUploading.value) return
  
  avatarUploading.value = true
  error.value = ''
  message.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', profilePicFile.value)
    
    await userService.uploadProfilePic(formData)
    message.value = '头像上传更新成功'
    
    // Update the current user data with new profile pic and force refresh
    if (user.value) {
      const updatedUser = userService.getCurrentUser() as User
      if (updatedUser && updatedUser.profile_pic) {
        user.value = {
          ...updatedUser,
          profile_pic: isAbsoluteUrl(updatedUser.profile_pic) ? updatedUser.profile_pic : `${updatedUser.profile_pic}?t=${new Date().getTime()}`
        }
      }
    }
    
    // Reset the file input
    resetFileInput()
  } catch (err: any) {
    error.value = err.message || '上传头像失败'
  } finally {
    avatarUploading.value = false
  }
}

const updateProfile = async () => {
  if (!hasChanges.value) {
    message.value = '没有需要保存的修改'
    return
  }

  if (profileSaving.value) return
  profileSaving.value = true
  error.value = ''
  message.value = ''

  try {
    // Create update data only with changed fields
    const updateData: Record<string, string> = {}
    
    if (formData.value.email !== user.value?.email) {
      updateData.email = formData.value.email
    }

    if (formData.value.full_name !== user.value?.full_name) {
      const fullName = formData.value.full_name.trim()
      if (!fullName) throw new Error('真实姓名不能为空')
      updateData.full_name = fullName
    }
    
    if (formData.value.new_password) {
      if (formData.value.new_password !== formData.value.confirm_password) {
        throw new Error('两次输入的新密码不一致')
      }
      if (!formData.value.current_password) {
        throw new Error('修改密码需填写当前旧密码')
      }
      if (!meetsPasswordPolicy(passwordStrength.value)) {
        throw new Error('新密码未达到安全策略要求（长度至少8位，包含字母和数字）')
      }
      updateData.password = formData.value.new_password
      updateData.current_password = formData.value.current_password
    } else if (formData.value.current_password || formData.value.confirm_password) {
      throw new Error('请输入新密码')
    }

    if (Object.keys(updateData).length === 0) {
      message.value = '没有需要保存的修改'
      return
    }

    await userService.updateProfile(updateData)
    user.value = userService.getCurrentUser()
    message.value = '个人资料修改成功'
    
    // Clear password fields
    formData.value.current_password = ''
    formData.value.new_password = ''
    formData.value.confirm_password = ''
    
  } catch (err: any) {
    error.value = err.message || '更新个人资料失败'
  } finally {
    profileSaving.value = false
  }
}

// Watch for changes to profilePicFile
watch(profilePicFile, (newFile) => {
  if (newFile) {
    // Auto-upload when a file is selected
    uploadProfilePic()
  }
})

const handleProfilePicClick = () => {
  if (avatarUploading.value) return
  if (fileInput.value) {
    fileInput.value.click()
  }
}

onBeforeUnmount(() => {
  if (profilePicPreview.value) URL.revokeObjectURL(profilePicPreview.value)
})
</script>

<template>
  <div class="settings-page">
    <div class="settings-head">
      <h1>账号与个人设置</h1>
      <p>管理您的个人资料、登录密码及桌面消息通知偏好。</p>
    </div>

    <form @submit.prevent="updateProfile" class="settings-form">
      <!-- Profile card -->
      <div class="settings-card">
        <h3 class="card-title">个人基本信息</h3>

        <div class="profile-row">
          <div class="profile-pic-wrapper" @click="handleProfilePicClick">
            <img
              v-if="profilePicPreview || user?.profile_pic"
              :src="userAvatarSrc"
              alt="Profile"
              class="profile-pic"
            />
            <span v-else class="avatar-initial">{{ avatarInitial }}</span>
            <div class="profile-pic-overlay">
              <font-awesome-icon icon="fa-solid fa-camera" />
              <span>更换头像</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="file-input"
            ref="fileInput"
          >
          <div class="profile-pic-meta">
            <div class="profile-pic-title">用户头像</div>
            <div class="profile-pic-hint">支持 JPG、PNG 或 GIF 格式，文件小于 5MB。</div>
          </div>
          <div class="profile-pic-actions">
            <button
              type="button"
              class="upload-button"
              @click="handleProfilePicClick"
              :disabled="avatarUploading"
            >
              {{ avatarUploading ? '上传中…' : '更换头像' }}
            </button>
          </div>
        </div>

        <div class="field-grid">
          <div class="form-group">
            <label>真实姓名</label>
            <input
              type="text"
              v-model="formData.full_name"
              placeholder="请输入您的姓名"
            >
          </div>
          <div class="form-group">
            <label>登录邮箱</label>
            <input
              type="email"
              v-model="formData.email"
              placeholder="您的登录邮箱"
              class="input-mono"
              disabled
            >
          </div>
        </div>

        <div class="role-row">
          <span class="role-label">当前角色</span>
          <span class="role-badge">{{ user?.role?.name || '普通成员' }}</span>
          <span class="role-note">如需变更角色权限，请联系管理员。</span>
        </div>
      </div>

      <!-- Change password card -->
      <div class="settings-card">
        <h3 class="card-title">修改登录密码</h3>
        <p class="card-subtitle">密码长度至少 8 位，且包含字母与数字组合。</p>

        <div class="form-group">
          <label>当前密码</label>
          <input
            type="password"
            v-model="formData.current_password"
            placeholder="••••••••"
          >
        </div>

        <div class="field-grid">
          <div class="form-group">
            <label>新密码</label>
            <input
              type="password"
              v-model="formData.new_password"
              @input="handlePasswordInput(formData.new_password)"
              placeholder="请输入新密码"
              minlength="8"
            >
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input
              type="password"
              v-model="formData.confirm_password"
              placeholder="请再次输入新密码"
            >
          </div>
        </div>

        <PasswordStrengthMeter
          v-if="passwordTouched && formData.new_password"
          :strength="passwordStrength"
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Sticky save bar -->
      <div v-if="hasChanges" class="save-bar">
        <span class="save-bar-text">您有未保存的修改</span>
        <div class="save-bar-actions">
          <button type="button" class="discard-button" @click="discardChanges">放弃修改</button>
          <button type="submit" class="submit-button" :disabled="profileSaving">
            {{ profileSaving ? '正在保存…' : '保存修改' }}
          </button>
        </div>
      </div>
      <div v-else-if="message" class="save-bar saved-bar">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
        <span class="saved-text">{{ message }}</span>
      </div>
    </form>

    <!-- Notifications: saved on toggle, so deliberately outside the profile form -->
    <div class="settings-card notifications-card">
      <h3 class="card-title">消息通知偏好</h3>
      <p class="card-subtitle">选择哪些客户会话事件需要向您发送浏览器桌面推送通知。</p>

      <div v-if="!hasPushPermission" class="permission-notice">
        <font-awesome-icon icon="fa-solid fa-bell-slash" class="permission-icon" />
        <span class="permission-text">
          当前浏览器尚未授予通知权限，请先允许权限以便正常接收桌面推送。
        </span>
        <button type="button" class="upload-button" @click="enableNotifications">立即开启权限</button>
      </div>

      <div v-if="notificationsLoading" class="notification-hint">正在加载通知偏好…</div>

      <template v-else-if="notificationSettings">
        <div v-for="toggle in NOTIFICATION_TOGGLES" :key="toggle.key" class="notification-row">
          <div class="notification-meta">
            <div class="notification-title">{{ toggle.title }}</div>
            <div class="notification-desc">{{ toggle.desc }}</div>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              :checked="notificationSettings[toggle.key]"
              :disabled="notificationsSaving"
              @change="saveNotificationSetting({ [toggle.key]: !notificationSettings[toggle.key] })"
            >
            <span class="slider" :class="{ enabled: notificationSettings[toggle.key] }"></span>
          </label>
        </div>
        <div class="notification-hint">设置将自动保存并立即生效。</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-lg);
  padding-bottom: 80px;
}

.settings-head {
  margin-bottom: 26px;
}

.settings-head h1 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 6px;
}

.settings-head p {
  font-size: 15px;
  color: var(--muted);
  margin: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-card {
  background: var(--surface);
  border: 1px solid var(--o08);
  border-radius: 18px;
  padding: 26px;
}

.card-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--text);
  margin: 0 0 20px;
}

.card-subtitle {
  font-size: 13.5px;
  color: var(--muted);
  margin: -16px 0 20px;
}

/* Notifications card */
.notifications-card {
  margin-top: 18px;
}

.permission-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border: 1px solid var(--o08);
  border-radius: var(--radius-btn);
  background: var(--bg2);
}

.permission-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.permission-text {
  flex: 1;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
}

.notification-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 0;
  border-top: 1px solid var(--o07);
}

.notification-meta {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14.5px;
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.notification-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
  margin-top: 3px;
}

.notification-hint {
  font-size: 12.5px;
  color: var(--muted);
  padding-top: 14px;
  border-top: 1px solid var(--o07);
}

/* Toggle switch (46x26) — matches the agent settings toggles */
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--toggle-track-off);
  transition: background 0.15s;
  border-radius: var(--radius-pill);
}

.slider.enabled {
  background: var(--toggle-on-teal);
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background: var(--toggle-knob);
  transition: transform 0.15s;
  border-radius: 50%;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Avatar row */
.profile-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--o07);
  margin-bottom: 22px;
}

.profile-pic-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: var(--grad-purple-teal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-pic-wrapper:hover .profile-pic-overlay {
  opacity: 1;
}

.avatar-initial {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 26px;
  color: var(--on-accent-solid);
}

.profile-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-pic-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 10px;
  gap: 2px;
}

.profile-pic-overlay svg {
  font-size: 1rem;
}

.profile-pic-meta {
  flex: 1;
  min-width: 0;
}

.profile-pic-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text2);
  margin-bottom: 3px;
}

.profile-pic-hint {
  font-size: 12.5px;
  color: var(--muted2);
}

.profile-pic-actions {
  flex-shrink: 0;
}

.file-input {
  opacity: 0;
  width: 0;
  height: 0;
  cursor: pointer;
  position: absolute;
}

.upload-button {
  padding: 9px 16px;
  background: var(--o06);
  border: 1px solid var(--o14);
  border-radius: 10px;
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background 0.2s ease;
}

.upload-button:hover:not(:disabled) {
  background: var(--o10);
}

.upload-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Inputs */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group + .form-group,
.form-group + .field-grid,
.field-grid + .form-group {
  margin-top: 16px;
}

/* Form-groups inside a 2-col grid align at the top — the grid gap handles spacing */
.field-grid > .form-group + .form-group {
  margin-top: 0;
}

.field-grid {
  align-items: start;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text3);
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 13px 15px;
  background: var(--bg);
  border: 1px solid var(--o12);
  border-radius: 11px;
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14.5px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: var(--accent-ink);
  box-shadow: var(--ring-focus);
}

.form-group input.input-mono,
.form-group input:disabled {
  background: var(--o03);
  border: 1px solid var(--o08);
  color: var(--muted);
  font-family: var(--font-mono);
  cursor: not-allowed;
}

/* Role badge */
.role-row {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.role-label {
  font-size: 13px;
  color: var(--muted);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--accent-bg-12);
  border: 1px solid var(--accent-border);
  color: var(--accent-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.role-note {
  font-size: 12px;
  color: var(--faint);
}

/* Sticky save bar */
.save-bar {
  position: fixed;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 14px 12px 22px;
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--o12);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.save-bar-text {
  font-size: 13.5px;
  color: var(--text3);
}

.save-bar-actions {
  display: flex;
  gap: 10px;
}

.discard-button {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--o14);
  border-radius: 10px;
  color: var(--text3);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background 0.2s ease;
}

.discard-button:hover {
  background: var(--o06);
}

.submit-button {
  padding: 10px 20px;
  background: var(--accent-solid);
  color: var(--on-accent-solid);
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: filter 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  filter: brightness(1.05);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.saved-bar {
  gap: 10px;
  padding: 12px 20px;
  border-color: var(--accent-border);
  color: var(--accent-ink);
}

.saved-text {
  font-size: 13.5px;
  color: var(--accent-ink);
  font-weight: 500;
}

.error-message {
  color: var(--error-color);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .settings-page {
    padding: var(--space-md);
    padding-bottom: 90px;
  }

  .settings-card {
    padding: var(--space-lg);
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .save-bar {
    left: var(--space-md);
    right: var(--space-md);
    transform: none;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

</style>
