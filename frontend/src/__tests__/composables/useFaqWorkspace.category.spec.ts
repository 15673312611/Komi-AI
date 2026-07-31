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
import { useFaqWorkspace } from '@/composables/useFaqWorkspace'
import { faqService } from '@/services/faq'
import type { FaqItem } from '@/types/faq'

vi.mock('@/services/faq', () => ({
  faqService: {
    createFaq: vi.fn(),
    updateFaq: vi.fn(),
  },
}))
vi.mock('@/services/knowledge', () => ({ knowledgeService: {} }))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

const existingFaq: FaqItem = {
  id: 'f1',
  question: 'Q?',
  answer: 'A.',
  category: 'Billing',
  status: 'draft',
  knowledge_id: null,
  source_label: null,
}

describe('useFaqWorkspace topic (category) handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(faqService.createFaq).mockResolvedValue({ ...existingFaq, id: 'new1' })
    vi.mocked(faqService.updateFaq).mockResolvedValue({ ...existingFaq })
  })

  it('creates with the typed topic', async () => {
    const ws = useFaqWorkspace(() => 'org1')
    ws.startAdd()
    ws.draftQuestion.value = 'How do refunds work?'
    ws.draftAnswer.value = 'Like this.'
    ws.draftCategory.value = ' Refunds '
    await ws.saveEdit()

    expect(faqService.createFaq).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Refunds' }),
    )
  })

  it('creates without a category when the topic is blank (server default applies)', async () => {
    const ws = useFaqWorkspace(() => 'org1')
    ws.startAdd()
    ws.draftQuestion.value = 'Q'
    ws.draftAnswer.value = 'A'
    await ws.saveEdit()

    const payload = vi.mocked(faqService.createFaq).mock.calls[0][0]
    expect(payload).not.toHaveProperty('category')
  })

  it('pre-fills the current topic on edit and sends a changed one', async () => {
    const ws = useFaqWorkspace(() => 'org1')
    ws.startEdit(existingFaq)
    expect(ws.draftCategory.value).toBe('Billing')

    ws.draftCategory.value = 'Payments'
    await ws.saveEdit()

    expect(faqService.updateFaq).toHaveBeenCalledWith(
      'f1',
      expect.objectContaining({ category: 'Payments' }),
    )
  })

  it('omits the category on edit when cleared, keeping the current topic', async () => {
    const ws = useFaqWorkspace(() => 'org1')
    ws.startEdit(existingFaq)
    ws.draftCategory.value = ''
    await ws.saveEdit()

    const payload = vi.mocked(faqService.updateFaq).mock.calls[0][1]
    expect(payload).not.toHaveProperty('category')
  })
})
