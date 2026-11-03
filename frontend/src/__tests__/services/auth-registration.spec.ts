import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/services/user', () => ({ userService: { setCurrentUser: vi.fn() } }))

import api from '@/services/api'
import { registrationService } from '@/services/auth'

describe('registration service', () => {
  it('enables registration only when the backend explicitly allows it', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { enabled: true } })
    expect(await registrationService.isEnabled()).toBe(true)
  })

  it('keeps registration hidden when the backend setting is false', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { enabled: false } })
    expect(await registrationService.isEnabled()).toBe(false)
  })

  it('keeps registration hidden if the backend status cannot be checked', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('HTTP 500'))
    expect(await registrationService.isEnabled()).toBe(false)
  })

  it('registers a new organization and stores the owner session', async () => {
    const user = { id: 'owner-1', email: 'owner@example.com' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access_token: 'access', user } })

    await expect(registrationService.register('Example Company', 'owner@example.com', 'Good-pass1')).resolves.toEqual(user)

    expect(api.post).toHaveBeenCalledWith('/users/register', {
      organization_name: 'Example Company',
      email: 'owner@example.com',
      password: 'Good-pass1',
    })
    expect(localStorage.getItem('access_token')).toBe('access')
  })
})
