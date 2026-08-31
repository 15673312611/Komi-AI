import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/knowledge', () => ({
  knowledgeService: {
    getKnowledgeByAgent: vi.fn().mockResolvedValue({ knowledge: [], pagination: { total_pages: 0 } }),
    getKnowledgeByOrganization: vi
      .fn()
      .mockResolvedValue({ knowledge: [], pagination: { total_pages: 0 } }),
    getAgentQueueItems: vi.fn().mockResolvedValue({ queue_items: [] })
  }
}))

import { useKnowledgeManagement } from '@/composables/useKnowledgeManagement'
import { knowledgeService } from '@/services/knowledge'

const setup = () => useKnowledgeManagement('agent-1', 'org-1')

describe('useKnowledgeManagement - URL handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('withScheme', () => {
    const { withScheme } = setup()

    it.each([
      ['docs.company.com', 'https://docs.company.com'],
      ['company.co.uk', 'https://company.co.uk'],
      ['  spaced.com  ', 'https://spaced.com'],
      ['//protocol-relative.com', 'https://protocol-relative.com']
    ])('defaults the scheme: %s -> %s', (input, expected) => {
      expect(withScheme(input)).toBe(expected)
    })

    it.each([
      'https://already.com',
      'http://plain.com',
      'HTTPS://shouty.com'
    ])('leaves an existing scheme alone: %s', (input) => {
      expect(withScheme(input)).toBe(input)
    })

    it('leaves an empty value empty', () => {
      expect(withScheme('   ')).toBe('')
    })
  })

  describe('isValidUrl', () => {
    const { isValidUrl } = setup()

    it.each(['https://docs.company.com', 'http://a.co', 'https://x.com/path?q=1'])(
      'accepts %s',
      (url) => expect(isValidUrl(url)).toBe(true)
    )

    it.each(['mailto:someone@x.com', 'foo:bar', 'not a url', 'https://'])(
      'rejects %s',
      (url) => expect(isValidUrl(url)).toBe(false)
    )

    it.each(['https://localhost', 'https://wiki', 'http://intranet:8080'])(
      'accepts the intranet hostnames a self-hosted install indexes: %s',
      (url) => expect(isValidUrl(url)).toBe(true)
    )
  })

  describe('handleUrlAdd', () => {
    it('stages a scheme-less URL instead of rejecting it', () => {
      const { newUrl, urls, urlFormError, handleUrlAdd } = setup()
      newUrl.value = 'docs.company.com'

      handleUrlAdd()

      expect(urls.value).toEqual(['https://docs.company.com'])
      expect(urlFormError.value).toBeNull()
      expect(newUrl.value).toBe('')
    })

    it('still rejects input that is not a URL at all', () => {
      const { newUrl, urls, urlFormError, handleUrlAdd } = setup()
      newUrl.value = 'not a url'

      handleUrlAdd()

      expect(urls.value).toEqual([])
      expect(urlFormError.value).toBe('Please enter a valid URL')
    })

    it('clears a previous error when a later attempt succeeds', () => {
      const { newUrl, urls, urlFormError, handleUrlAdd } = setup()

      newUrl.value = 'not a url'
      handleUrlAdd()
      expect(urlFormError.value).toBe('Please enter a valid URL')

      newUrl.value = 'docs.company.com'
      handleUrlAdd()

      expect(urlFormError.value).toBeNull()
      expect(urls.value).toEqual(['https://docs.company.com'])
    })

    it('does not stage the same URL twice', () => {
      const { newUrl, urls, urlFormError, handleUrlAdd } = setup()

      newUrl.value = 'docs.company.com'
      handleUrlAdd()
      newUrl.value = 'https://docs.company.com'
      handleUrlAdd()

      expect(urls.value).toEqual(['https://docs.company.com'])
      expect(urlFormError.value).toBe('This URL has already been added to the current batch')
    })
  })

  it('does not let an older full refresh overwrite a newer organization page', async () => {
    let resolveOldOrganization: (value: unknown) => void = () => undefined
    vi.mocked(knowledgeService.getKnowledgeByOrganization)
      .mockImplementationOnce(() => new Promise(resolve => { resolveOldOrganization = resolve }))
      .mockResolvedValueOnce({
        knowledge: [{ id: 2, name: 'new-page', type: 'website', pages: [] }],
        pagination: { total_pages: 2 },
      })
    const state = setup()

    const oldRefresh = state.fetchKnowledge()
    state.orgCurrentPage.value = 2
    await state.fetchOrgKnowledge()
    resolveOldOrganization({
      knowledge: [{ id: 1, name: 'old-page', type: 'website', pages: [] }],
      pagination: { total_pages: 1 },
    })
    await oldRefresh

    expect(state.orgKnowledgeItems.value.map(item => item.name)).toEqual(['new-page'])
    expect(state.orgCurrentPage.value).toBe(2)
  })
})
