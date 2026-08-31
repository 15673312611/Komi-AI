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

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routeChatToHuman } from '@/utils/chatActions'
import { chatService } from '@/services/chat'

vi.mock('@/services/chat', () => ({
  chatService: { routeToHuman: vi.fn() },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('vue-sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

describe('routeChatToHuman', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the updated chat the endpoint sends back', async () => {
    const updated = { session_id: 's1', status: 'transferred', user_id: null }
    vi.mocked(chatService.routeToHuman).mockResolvedValue(updated as never)

    await expect(routeChatToHuman('s1')).resolves.toBe(updated)
    expect(toastSuccess).toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })

  it('surfaces the server reason and returns null on failure', async () => {
    vi.mocked(chatService.routeToHuman).mockRejectedValue({
      response: { data: { detail: 'A human is already handling this chat' } },
    })

    await expect(routeChatToHuman('s1')).resolves.toBeNull()
    expect(toastError).toHaveBeenCalledWith(
      '转交人工团队失败',
      expect.objectContaining({ description: 'A human is already handling this chat' })
    )
  })
})
