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

import { describe, it, expect, afterEach } from 'vitest'
import { buildUploadUrl } from '@/utils/avatars'
import { resolveUploadUrl } from '@/config/api'

const API_BASE = 'https://self.hosted.example/api/v1'

describe('buildUploadUrl', () => {
  it('does not repeat the /api/v1 prefix the stored path already carries', () => {
    // The regression this guards: store_upload returns "/api/v1/uploads/..."
    // and callers used to prepend an API base that also ends in /api/v1.
    expect(buildUploadUrl('/api/v1/uploads/agents/org/a.png', API_BASE)).toBe(
      'https://self.hosted.example/api/v1/uploads/agents/org/a.png',
    )
  })

  it('handles an API base with a trailing slash', () => {
    expect(buildUploadUrl('/api/v1/uploads/x.png', 'https://h.example/api/v1/')).toBe(
      'https://h.example/api/v1/uploads/x.png',
    )
  })

  it('leaves paths that do not carry the prefix alone', () => {
    expect(buildUploadUrl('/uploads/x.png', API_BASE)).toBe(
      'https://self.hosted.example/uploads/x.png',
    )
  })

  it('inserts the missing separator for a relative path', () => {
    expect(buildUploadUrl('uploads/x.png', API_BASE)).toBe(
      'https://self.hosted.example/uploads/x.png',
    )
  })

  it('passes absolute S3/CDN URLs through untouched', () => {
    const signed = 'https://bucket.s3.amazonaws.com/agents/a.png?X-Amz-Signature=abc'
    expect(buildUploadUrl(signed, API_BASE)).toBe(signed)
  })

  it('passes data URIs and blob previews through untouched', () => {
    expect(buildUploadUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', API_BASE)).toBe(
      'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    )
    expect(buildUploadUrl('blob:https://h.example/abc', API_BASE)).toBe('blob:https://h.example/abc')
  })

  it('returns an empty string for empty input', () => {
    expect(buildUploadUrl(null, API_BASE)).toBe('')
    expect(buildUploadUrl(undefined, API_BASE)).toBe('')
    expect(buildUploadUrl('', API_BASE)).toBe('')
  })

  it('tolerates an API base that is not suffixed with /api/v1', () => {
    expect(buildUploadUrl('/api/v1/uploads/x.png', 'https://h.example')).toBe(
      'https://h.example/api/v1/uploads/x.png',
    )
  })
})

describe('resolveUploadUrl', () => {
  afterEach(() => {
    delete (window as unknown as { APP_CONFIG?: unknown }).APP_CONFIG
  })

  it('resolves against the runtime config, not the build-time env', () => {
    // The published image bakes import.meta.env.VITE_API_URL as undefined;
    // window.APP_CONFIG is the only source that is correct at runtime.
    ;(window as unknown as { APP_CONFIG: Record<string, string> }).APP_CONFIG = {
      API_URL: 'https://runtime.example/api/v1',
    }
    expect(resolveUploadUrl('/api/v1/uploads/agents/org/a.png')).toBe(
      'https://runtime.example/api/v1/uploads/agents/org/a.png',
    )
  })

  it('never emits an "undefined" path segment', () => {
    expect(resolveUploadUrl('/api/v1/uploads/a.png')).not.toContain('undefined')
  })
})
