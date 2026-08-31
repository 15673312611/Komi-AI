/*
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
*/

import { ref } from 'vue'
import type { ChatScopeFields, User } from '@/types/user'
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from '@/services/users'
import { toast } from 'vue-sonner'

export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showEditModal = ref(false)
  const showDeleteModal = ref(false)
  const selectedUser = ref<User | null>(null)
  const showCreateModal = ref(false)
  const showResetPasswordModal = ref(false)
  const resettingPassword = ref(false)
  let usersRequestVersion = 0

  const getErrorDetail = (err: any): string => {
    const detail = err?.response?.data?.detail
    if (Array.isArray(detail)) {
      return detail.map(item => item?.msg || item?.message).filter(Boolean).join('; ')
    }
    return detail || err?.message || '未知错误'
  }

  const fetchUsers = async () => {
    const requestVersion = ++usersRequestVersion
    try {
      loading.value = true
      const result = await listUsers()
      if (requestVersion === usersRequestVersion) {
        users.value = Array.isArray(result) ? result : []
        error.value = null
      }
    } catch (err: any) {
      const detail = getErrorDetail(err)
      if (requestVersion === usersRequestVersion) error.value = `加载坐席列表失败：${detail}`
      console.error('Error loading users:', detail)
    } finally {
      if (requestVersion === usersRequestVersion) loading.value = false
    }
  }

  const handleEditUser = (user: User) => {
    error.value = null
    selectedUser.value = user
    showEditModal.value = true
  }

  const handleUpdateUser = async (userData: Partial<User> & ChatScopeFields): Promise<boolean> => {
    if (!selectedUser.value || loading.value) return false
    const userId = selectedUser.value.id

    try {
      loading.value = true
      error.value = null
      const updatedUser = await updateUser(userId, userData)
      
      // Update local users list
      const index = users.value.findIndex(u => u.id === updatedUser.id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      
      showEditModal.value = false
      selectedUser.value = null
      toast.success('Success', {
        description: 'User updated successfully',
        duration: 4000,
        closeButton: true
      })
      return true
    } catch (err: any) {
      const detail = getErrorDetail(err)
      error.value = 'Failed to update user'
      console.error('Error updating user:', detail)
      toast.error('Error', {
        description: 'Failed to update user - ' + detail,
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const handleResetPassword = (user: User) => {
    selectedUser.value = user
    showResetPasswordModal.value = true
  }

  const confirmResetPassword = async (newPassword: string) => {
    if (!selectedUser.value || resettingPassword.value) return

    try {
      resettingPassword.value = true
      error.value = null
      await resetUserPassword(selectedUser.value.id, newPassword)

      showResetPasswordModal.value = false
      selectedUser.value = null
      toast.success('Success', {
        description: 'Password reset successfully',
        duration: 4000,
        closeButton: true
      })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      // A rejected password comes back as FastAPI's validation-error array.
      const description = Array.isArray(detail) ? detail[0]?.msg : detail
      error.value = 'Failed to reset password'
      // Never the raw axios error: its `config.data` carries the plaintext
      // password, which would land in the browser console on a network failure.
      console.error('Error resetting password:', description ?? err.message)
      toast.error('Error', {
        description: 'Failed to reset password' + (description ? ' - ' + description : ''),
        duration: 4000,
        closeButton: true
      })
    } finally {
      resettingPassword.value = false
    }
  }

  const handleDeleteUser = async (user: User) => {
    selectedUser.value = user
    showDeleteModal.value = true
  }

  const confirmDeleteUser = async (): Promise<boolean> => {
    if (!selectedUser.value || loading.value) return false
    const userId = selectedUser.value.id

    try {
      loading.value = true
      error.value = null
      await deleteUser(userId)
      
      // Remove user from local list
      users.value = users.value.filter(u => u.id !== userId)
      
      showDeleteModal.value = false
      selectedUser.value = null
      toast.success('Success', {
        description: 'User deleted successfully',
        duration: 4000,
        closeButton: true
      })
      return true
    } catch (err: any) {
      const detail = getErrorDetail(err)
      error.value = 'Failed to delete user'
      console.error('Error deleting user:', detail)
      toast.error('Error', {
        description: 'Failed to delete user - ' + detail,
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const handleCreateUser = async (userData: Partial<User> & ChatScopeFields & { password?: string }): Promise<boolean> => {
    if (loading.value) return false
    try {
      loading.value = true
      error.value = null
      const newUser = await createUser(userData)
      users.value.unshift(newUser) // Add to start of list
      showCreateModal.value = false
      toast.success('Success', {
        description: 'User created successfully',
        duration: 4000,
        closeButton: true
      })
      return true
    } catch (err: any) {
      const detail = getErrorDetail(err)
      error.value = 'Failed to create user'
      console.error('Error creating user:', detail)
      toast.error('Error', {
        description: 'Failed to create user - ' + detail,
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    showEditModal,
    showDeleteModal,
    selectedUser,
    showCreateModal,
    showResetPasswordModal,
    resettingPassword,
    fetchUsers,
    handleEditUser,
    handleUpdateUser,
    handleDeleteUser,
    confirmDeleteUser,
    handleCreateUser,
    handleResetPassword,
    confirmResetPassword
  }
}
