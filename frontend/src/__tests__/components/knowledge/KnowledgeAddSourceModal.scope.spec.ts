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
import KnowledgeAddSourceModal from '../../../components/knowledge/KnowledgeAddSourceModal.vue'

const mountModal = async (url: string) => {
  const wrapper = mount(KnowledgeAddSourceModal)
  await wrapper.find('#kb-add-url').setValue(url)
  return wrapper
}

const scopeTitles = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.scope__title').map((node) => node.text())

const scopeOption = (wrapper: ReturnType<typeof mount>, title: string) =>
  wrapper.findAll('.scope__opt').find((node) => node.find('.scope__title').text() === title)

describe('KnowledgeAddSourceModal crawl scope', () => {
  it('offers no section option for a homepage URL', async () => {
    // "Pages under / " is not a section — it is the whole site, which the next
    // option already covers.
    const wrapper = await mountModal('https://paywithatoa.co.uk')
    expect(scopeTitles(wrapper)).toEqual(['This page only', 'This site', 'Whole domain'])
    expect(scopeOption(wrapper, 'This site')!.text()).toContain('Every page on paywithatoa.co.uk.')
  })

  it('names the section when the URL has a path', async () => {
    const wrapper = await mountModal('https://help.example.com/hc/en')
    expect(scopeTitles(wrapper)).toContain('This section')
    expect(scopeOption(wrapper, 'This section')!.text()).toContain(
      'Only pages under /hc/en/ on help.example.com.',
    )
  })

  it('falls back to this-site when the section option disappears', async () => {
    const wrapper = await mountModal('https://help.example.com/hc/en')
    await scopeOption(wrapper, 'This section')!.trigger('click')

    await wrapper.find('#kb-add-url').setValue('https://help.example.com')
    await wrapper.find('button.btn--primary').trigger('click')

    expect(wrapper.emitted('submit')![0][0]).toMatchObject({
      type: 'website',
      url: 'https://help.example.com',
      scope: 'host',
    })
  })

  it('submits the selected scope', async () => {
    const wrapper = await mountModal('https://help.example.com/hc/en')
    await scopeOption(wrapper, 'This section')!.trigger('click')
    await wrapper.find('button.btn--primary').trigger('click')

    expect(wrapper.emitted('submit')![0][0]).toMatchObject({ scope: 'path' })
  })
})
