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
import type { User, UserGroup } from '@/types/user'
import { listGroups, createGroup, updateGroup, deleteGroup, addUserToGroup, removeUserFromGroup } from '@/services/groups'
import { listUsers } from '@/services/users'
import { toast } from 'vue-sonner'

export function useGroups() {
  const groups = ref<UserGroup[]>([])
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const showMembersModal = ref(false)
  const showDeleteModal = ref(false)
  const selectedGroup = ref<UserGroup | null>(null)
  const selectedUsers = ref<string[]>([])
  const usersLoading = ref(false)
  const actionBusy = ref<string | null>(null)
  let groupsRequestVersion = 0
  let usersRequestVersion = 0

  const fetchGroups = async () => {
    const requestVersion = ++groupsRequestVersion
    try {
      loading.value = true
      error.value = ''
      const result = await listGroups()
      if (requestVersion !== groupsRequestVersion) return false
      groups.value = result
      return true
    } catch (err) {
      if (requestVersion !== groupsRequestVersion) return false
      console.error('Failed to load groups:', err)
      error.value = 'Failed to load groups'
      return false
    } finally {
      if (requestVersion === groupsRequestVersion) loading.value = false
    }
  }

  const fetchUsers = async () => {
    const requestVersion = ++usersRequestVersion
    usersLoading.value = true
    try {
      const response = await listUsers()
      if (requestVersion !== usersRequestVersion) return false
      users.value = response
      return true
    } catch (err) {
      if (requestVersion !== usersRequestVersion) return false
      console.error('Failed to load users:', err)
      toast.error('Error loading users', {
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      if (requestVersion === usersRequestVersion) usersLoading.value = false
    }
  }

  const handleCreateGroup = async (groupData: Partial<UserGroup>) => {
    if (actionBusy.value) return false
    actionBusy.value = 'create'
    try {
      loading.value = true
      error.value = ''
      const newGroup = await createGroup(groupData)
      groups.value.unshift(newGroup)
      showCreateModal.value = false
      toast.success('Success', {
        description: 'Group created successfully',
        duration: 4000,
        closeButton: true
      })
      return true
    } catch (err) {
      console.error('Error creating group:', err)
      toast.error('Error', {
        description: 'Failed to create group',
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      loading.value = false
      actionBusy.value = null
    }
  }

  const handleEditGroup = (group: UserGroup) => {
    selectedGroup.value = group
    showEditModal.value = true
  }

  const handleUpdateGroup = async (groupData: Partial<UserGroup>) => {
    if (!selectedGroup.value || actionBusy.value) return false
    const groupId = selectedGroup.value.id
    actionBusy.value = 'update'
    
    try {
      loading.value = true
      error.value = ''
      const updatedGroup = await updateGroup(groupId, groupData)
      const index = groups.value.findIndex(g => g.id === updatedGroup.id)
      if (index !== -1) {
        groups.value[index] = updatedGroup
      }
      showEditModal.value = false
      toast.success('Group updated successfully', {
        duration: 4000,
        closeButton: true
      })
      return true
    } catch (err) {
      console.error('Error updating group:', err)
      toast.error('Failed to update group', {
        duration: 4000,
        closeButton: true
      })
      return false
    } finally {
      loading.value = false
      actionBusy.value = null
    }
  }

  const handleManageMembers = async (group: UserGroup) => {
    if (loading.value || usersLoading.value || actionBusy.value) return false
    actionBusy.value = 'members'
    selectedGroup.value = group
    selectedUsers.value = group.users?.map(u => u.id) || []
    const loaded = await fetchUsers()
    if (loaded) showMembersModal.value = true
    actionBusy.value = null
    return loaded
  }

  const handleUserSelection = async (userId: string, checked: boolean) => {
    if (!selectedGroup.value || actionBusy.value) return false
    const groupId = selectedGroup.value.id
    actionBusy.value = 'member'
    
    try {
      loading.value = true
      if (checked) {
        await addUserToGroup(groupId, userId)
        if (selectedGroup.value?.id === groupId && !selectedUsers.value.includes(userId)) {
          selectedUsers.value.push(userId)
        }
      } else {
        await removeUserFromGroup(groupId, userId)
        if (selectedGroup.value?.id === groupId) {
          selectedUsers.value = selectedUsers.value.filter(id => id !== userId)
        }
      }
      await fetchGroups() // Refresh groups to get updated members
      return true
    } catch (err) {
      console.error('Error managing members:', err)
      toast.error(checked ? 'Failed to add member' : 'Failed to remove member')
      return false
    } finally {
      loading.value = false
      actionBusy.value = null
    }
  }

  const handleDeleteGroup = (group: UserGroup) => {
    selectedGroup.value = group
    showDeleteModal.value = true
  }

  const handleDeleteConfirm = async () => {
    if (!selectedGroup.value || actionBusy.value) return false
    const groupId = selectedGroup.value.id
    actionBusy.value = 'delete'
    
    try {
      loading.value = true
      error.value = ''
      await deleteGroup(groupId)
      groups.value = groups.value.filter(g => g.id !== groupId)
      showDeleteModal.value = false
      toast.success('Group deleted successfully')
      return true
    } catch (err) {
      console.error('Error deleting group:', err)
      toast.error('Failed to delete group')
      return false
    } finally {
      loading.value = false
      actionBusy.value = null
    }
  }

  return {
    groups,
    users,
    loading,
    usersLoading,
    actionBusy,
    error,
    showCreateModal,
    showEditModal,
    showMembersModal,
    showDeleteModal,
    selectedGroup,
    selectedUsers,
    fetchGroups,
    fetchUsers,
    handleCreateGroup,
    handleEditGroup,
    handleUpdateGroup,
    handleManageMembers,
    handleUserSelection,
    handleDeleteGroup,
    handleDeleteConfirm
  }
}
