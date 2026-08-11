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

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import FaqSeoFields from '../../../components/faq/FaqSeoFields.vue'

const createWrapper = (props = {}) => mount(FaqSeoFields, { props })

// The meta-title input is the only plain .seo__input without a modifier class.
const titleInput = (wrapper: ReturnType<typeof createWrapper>) =>
  wrapper.findAll('input.seo__input').filter((i) => !i.classes().some((c) => c.includes('--')))[0]

describe('FaqSeoFields', () => {
  it('stays collapsed until opened when nothing is customised', async () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.seo__fields').exists()).toBe(false)

    await wrapper.find('.seo__toggle').trigger('click')
    expect(wrapper.find('.seo__fields').exists()).toBe(true)
  })

  it('opens itself when the article already has overrides', () => {
    // A customised value must never be hidden behind a collapsed panel.
    const wrapper = createWrapper({ metaTitle: 'Custom title' })
    expect(wrapper.find('.seo__fields').exists()).toBe(true)
    expect(wrapper.find('.seo__badge').exists()).toBe(true)
  })

  it('can still be collapsed after opening itself', async () => {
    const wrapper = createWrapper({ metaTitle: 'Custom title' })
    await wrapper.find('.seo__toggle').trigger('click')
    expect(wrapper.find('.seo__fields').exists()).toBe(false)
  })

  it('does not treat a slug alone as customised', () => {
    // Every article gets a generated slug, so its presence says nothing about
    // whether the org edited anything.
    const wrapper = createWrapper({ slug: 'auto-generated-slug' })
    expect(wrapper.find('.seo__badge').exists()).toBe(false)
  })

  it('emits updates for each field', async () => {
    const wrapper = createWrapper({ metaTitle: 'x' })

    await wrapper.find('.seo__input--slug').setValue('custom-slug')
    await wrapper.find('.seo__input--path').setValue('/hc/articles/1')
    await titleInput(wrapper).setValue('New title')
    await wrapper.find('textarea').setValue('New description')

    expect(wrapper.emitted('update:slug')?.[0]).toEqual(['custom-slug'])
    expect(wrapper.emitted('update:urlPath')?.[0]).toEqual(['/hc/articles/1'])
    expect(wrapper.emitted('update:metaTitle')?.at(-1)).toEqual(['New title'])
    expect(wrapper.emitted('update:metaDescription')?.[0]).toEqual(['New description'])
  })

  it('treats a preserved URL path as a customisation', () => {
    // A migrated article's URL must not be hidden behind a collapsed panel.
    const wrapper = createWrapper({ urlPath: '/hc/en-us/articles/360012-reset' })
    expect(wrapper.find('.seo__fields').exists()).toBe(true)
    expect(wrapper.find('.seo__badge').exists()).toBe(true)
    expect((wrapper.find('.seo__input--path').element as HTMLInputElement).value).toBe(
      '/hc/en-us/articles/360012-reset',
    )
  })

  it('flags a title past the length search engines truncate at', () => {
    const wrapper = createWrapper({ metaTitle: 'a'.repeat(61) })
    expect(wrapper.find('.seo__count--over').exists()).toBe(true)
  })

  it('shows the question as the title placeholder so the default is visible', () => {
    const wrapper = createWrapper({ metaTitle: 'x', question: 'How do I sign up?' })
    expect(titleInput(wrapper).attributes('placeholder')).toBe('How do I sign up?')
  })
})
