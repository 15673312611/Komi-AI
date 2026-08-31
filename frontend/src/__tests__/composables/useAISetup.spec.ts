// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  getProviders: vi.fn(),
  getOrganizationConfig: vi.fn(),
  setupAI: vi.fn(),
  updateAI: vi.fn(),
  testAI: vi.fn(),
}))

vi.mock('@/services/ai', () => ({ aiService: mocks }))

import { useAISetup } from '@/composables/useAISetup'

const config = (patch: Record<string, unknown> = {}) => ({
  model_type: 'OPENAI',
  model_name: 'gpt-4o-mini',
  settings: { base_url: 'https://api.example.com/v1' },
  has_api_key: true,
  api_key_masked: '••••1234',
  ...patch,
})

const mountState = () => {
  const state: { current?: ReturnType<typeof useAISetup> } = {}
  const Harness = defineComponent({
    setup: () => {
      state.current = useAISetup()
      return () => null
    },
  })
  return { wrapper: mount(Harness), state: state.current! }
}

describe('useAISetup request coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getProviders.mockResolvedValue([])
    mocks.getOrganizationConfig.mockResolvedValue(config())
    mocks.setupAI.mockResolvedValue(undefined)
    mocks.updateAI.mockResolvedValue(undefined)
    mocks.testAI.mockResolvedValue({ success: true })
  })

  it('does not let an older provider response replace the newest catalog', async () => {
    let resolveOld: (value: unknown) => void = () => undefined
    mocks.getProviders
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce([{ value: 'NewProvider', label: 'New Provider' }])

    const { wrapper, state } = mountState()
    await state.loadProviders()
    resolveOld([{ value: 'OldProvider', label: 'Old Provider' }])
    await flushPromises()

    expect(state.providers.value.map(provider => provider.value)).toEqual(['newprovider'])
    wrapper.unmount()
  })

  it('does not let an older config response replace the newest config', async () => {
    let resolveOld: (value: unknown) => void = () => undefined
    mocks.getOrganizationConfig
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce(config({ model_type: 'ANTHROPIC', model_name: 'claude-3-5-sonnet' }))

    const { wrapper, state } = mountState()
    await state.loadExistingConfig()
    resolveOld(config({ model_type: 'OPENAI', model_name: 'old-model' }))
    await flushPromises()

    expect(state.setupConfig.value.provider).toBe('anthropic')
    expect(state.setupConfig.value.model).toBe('claude-3-5-sonnet')
    expect(state.isLoading.value).toBe(false)
    wrapper.unmount()
  })
})
