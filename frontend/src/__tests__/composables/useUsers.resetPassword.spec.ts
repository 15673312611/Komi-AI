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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@/types/user'

const resetUserPassword = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('@/services/users', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  resetUserPassword: (...args: unknown[]) => resetUserPassword(...args),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

const { useUsers } = await import('@/composables/useUsers')

const agent = { id: 'agent-1', full_name: 'Agent One', email: 'agent@test.com' } as User

describe('useUsers – admin password reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the modal for the selected user', () => {
    const users = useUsers()
    users.handleResetPassword(agent)

    expect(users.showResetPasswordModal.value).toBe(true)
    expect(users.selectedUser.value).toEqual(agent)
  })

  it('resets the password and closes the modal', async () => {
    resetUserPassword.mockResolvedValueOnce(undefined)
    const users = useUsers()
    users.handleResetPassword(agent)

    await users.confirmResetPassword('NewPassw0rd!')

    expect(resetUserPassword).toHaveBeenCalledWith('agent-1', 'NewPassw0rd!')
    expect(users.showResetPasswordModal.value).toBe(false)
    expect(users.selectedUser.value).toBeNull()
    expect(toastSuccess).toHaveBeenCalled()
    expect(users.resettingPassword.value).toBe(false)
  })

  it('keeps the modal open and surfaces the API message on failure', async () => {
    resetUserPassword.mockRejectedValueOnce({
      response: { data: { detail: [{ msg: 'Password must be at least 8 characters long' }] } },
    })
    const users = useUsers()
    users.handleResetPassword(agent)

    await users.confirmResetPassword('short')

    expect(users.showResetPasswordModal.value).toBe(true)
    expect(toastError).toHaveBeenCalledWith(
      'Error',
      expect.objectContaining({
        description: 'Failed to reset password - Password must be at least 8 characters long',
      }),
    )
    expect(users.resettingPassword.value).toBe(false)
  })
})
