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

import { describe, it, expect } from 'vitest'
import { getInitials, formatFileSize, truncateText } from '@/utils/text'

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Maya Chen Rodriguez')).toBe('MC')
    expect(getInitials('Cher')).toBe('C')
  })

  // Hyphens are part of the name, not a word boundary — splitting on them
  // would drop the surname ("Jean-Luc Picard" → "JL" instead of "JP")
  it('keeps hyphenated and apostrophised names intact', () => {
    expect(getInitials('Jean-Luc Picard')).toBe('JP')
    expect(getInitials("Anne-Marie O'Brien")).toBe('AO')
  })

  it('derives initials from an email local part', () => {
    expect(getInitials('john.doe@example.com')).toBe('JD')
    expect(getInitials('arun_r@example.com')).toBe('AR')
    expect(getInitials('support@example.com')).toBe('S')
  })

  it('falls back when there is nothing to work with', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials(null)).toBe('?')
    expect(getInitials(undefined)).toBe('?')
    expect(getInitials('   ')).toBe('?')
    expect(getInitials('', '')).toBe('')
  })
})

describe('formatFileSize', () => {
  it('formats various byte sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(-100)).toBe('0 Bytes')
    expect(formatFileSize(NaN)).toBe('0 Bytes')
    expect(formatFileSize(500)).toBe('500 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })
})

describe('truncateText', () => {
  it('truncates strings longer than maxLength and appends suffix', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
    expect(truncateText('Short', 10)).toBe('Short')
    expect(truncateText('Custom suffix', 6, ' [more]')).toBe('Custom [more]')
  })

  it('handles null, undefined, and empty string safely', () => {
    expect(truncateText('')).toBe('')
    expect(truncateText(null)).toBe('')
    expect(truncateText(undefined)).toBe('')
  })
})

