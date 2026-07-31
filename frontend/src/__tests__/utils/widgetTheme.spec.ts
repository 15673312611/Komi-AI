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

import { describe, expect, it } from 'vitest'

import { themeCssVars } from '@/webclient/widget-theme'

// --cm-presence: the accent when readable on the card, the muted colour when
// the two are both light or both dark (e.g. lime on the white Sunrise header).
describe('themeCssVars --cm-presence', () => {
    it('falls back to muted on a light preset whose accent is light', () => {
        // Sunrise: white card, coral accent — both light.
        const vars = themeCssVars(undefined)
        expect(vars['--cm-presence']).toBe(vars['--cm-muted'])
        expect(vars['--cm-presence']).not.toBe(vars['--cm-accent'])
    })

    it('keeps the accent on a dark preset with a light accent', () => {
        // Terminal: near-black card, lime accent.
        const vars = themeCssVars('TERMINAL')
        expect(vars['--cm-presence']).toBe('#C9F24E')
        expect(vars['--cm-presence']).toBe(vars['--cm-accent'])
    })

    it('falls back to muted for a light custom accent on a light custom background', () => {
        const vars = themeCssVars('TERMINAL', {
            chat_background_color: '#FFFFFF',
            accent_color: '#C9F24E',
        })
        expect(vars['--cm-presence']).toBe(vars['--cm-muted'])
    })

    it('keeps a light custom accent on a dark custom background', () => {
        const vars = themeCssVars(undefined, {
            chat_background_color: '#111111',
            accent_color: '#C9F24E',
        })
        expect(vars['--cm-presence']).toBe('#C9F24E')
    })

    it('keeps a dark custom accent on a light card', () => {
        const vars = themeCssVars(undefined, { accent_color: '#7A2E1F' })
        expect(vars['--cm-presence']).toBe('#7A2E1F')
    })

    it('falls back to muted for a dark custom accent on a dark background', () => {
        const vars = themeCssVars(undefined, {
            chat_background_color: '#111111',
            accent_color: '#222222',
        })
        expect(vars['--cm-presence']).toBe(vars['--cm-muted'])
    })
})
