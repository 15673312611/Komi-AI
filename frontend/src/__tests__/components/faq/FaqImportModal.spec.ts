/*
Copyright 2024-2026 Komi AI

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

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import FaqImportModal from '../../../components/faq/FaqImportModal.vue'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const createWrapper = () =>
  mount(FaqImportModal, {
    props: { open: true },
    global: {
      stubs: {
        Modal: { template: '<div><slot name="title" /><slot name="content" /></div>' },
        FaqOrb: true,
      },
    },
  })

/** Pick an import mode by its radio value. */
const chooseMode = (wrapper: ReturnType<typeof createWrapper>, mode: string) =>
  wrapper.find(`input[value="${mode}"]`).setValue(true)

describe('FaqImportModal', () => {
  const fileWithSize = (name: string, type: string, size: number) => {
    const file = new File(['pdf'], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('offers the preserve-URLs option only for an article migration', async () => {
    const wrapper = createWrapper()
    // Q&A and PDF modes extract answers from one document — there are no
    // per-article source URLs to preserve.
    expect(wrapper.find('.preserve').exists()).toBe(false)

    await chooseMode(wrapper, 'articles')
    expect(wrapper.find('.preserve').exists()).toBe(true)

    await chooseMode(wrapper, 'pdf')
    expect(wrapper.find('.preserve').exists()).toBe(false)
  })

  it('preserves URLs by default, since that is what a migration wants', async () => {
    const wrapper = createWrapper()
    await chooseMode(wrapper, 'articles')
    await wrapper.find('#faq-import-url').setValue('support.acme.com/help')

    await wrapper.find('.btn-import').trigger('click')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'https://support.acme.com/help',
      'articles',
      true,
    ])
  })

  it('submits the opt-out when the box is unticked', async () => {
    const wrapper = createWrapper()
    await chooseMode(wrapper, 'articles')
    await wrapper.find('#faq-import-url').setValue('support.acme.com/help')
    await wrapper.find('.preserve__box').setValue(false)

    await wrapper.find('.btn-import').trigger('click')

    expect(wrapper.emitted('submit')?.[0]?.[2]).toBe(false)
  })

  it('never claims to preserve URLs in a mode that has none', async () => {
    const wrapper = createWrapper()
    await wrapper.find('#faq-import-url').setValue('support.acme.com/faq')

    await wrapper.find('.btn-import').trigger('click')

    expect(wrapper.emitted('submit')?.[0]).toEqual(['https://support.acme.com/faq', 'qa', false])
  })

  it('resets the choice when the mode changes, so it cannot go stale', async () => {
    const wrapper = createWrapper()
    await chooseMode(wrapper, 'articles')
    await wrapper.find('.preserve__box').setValue(false)

    await chooseMode(wrapper, 'qa')
    await chooseMode(wrapper, 'articles')

    expect((wrapper.find('.preserve__box').element as HTMLInputElement).checked).toBe(true)
  })

  it('accepts a dragged PDF when the browser leaves the MIME type blank', async () => {
    const wrapper = createWrapper()
    await chooseMode(wrapper, 'pdf')
    const input = wrapper.find('#faq-import-pdf')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [fileWithSize('guide.PDF', '', 100)],
    })
    await input.trigger('change')

    expect((wrapper.find('.btn-import').element as HTMLButtonElement).disabled).toBe(false)
    await wrapper.find('.btn-import').trigger('click')
    expect(wrapper.emitted('submit-pdf')?.[0]?.[0]).toMatchObject({ name: 'guide.PDF' })
  })

  it('rejects a PDF larger than the advertised 25 MB limit', async () => {
    const wrapper = createWrapper()
    await chooseMode(wrapper, 'pdf')
    const input = wrapper.find('#faq-import-pdf')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [fileWithSize('large.pdf', 'application/pdf', 25 * 1024 * 1024 + 1)],
    })
    await input.trigger('change')

    expect((wrapper.find('.btn-import').element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.emitted('submit-pdf')).toBeUndefined()
  })

  it('does not enable import for a non-HTTP URL', async () => {
    const wrapper = createWrapper()
    await wrapper.find('#faq-import-url').setValue('ftp://support.acme.com/faq')

    expect((wrapper.find('.btn-import').element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.find('.btn-import').trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
