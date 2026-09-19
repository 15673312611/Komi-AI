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

/**
 * Avatar initials from a display name or email ("John Doe" → "JD",
 * "john.doe@x.com" → "JD"). Single source of truth — UserList and GroupList
 * still carry older local variants that should migrate here.
 *
 * Names split on whitespace only, so "Jean-Luc Picard" stays "JP" rather than
 * losing the surname to the hyphen. The ./_/- separators apply to emails,
 * where they're the only word boundaries available.
 */
export function getInitials(name?: string | null, fallback = '?'): string {
  const value = (name || '').trim()
  if (!value) return fallback

  const isEmail = value.includes('@') && !/\s/.test(value)
  const words = isEmail ? value.split('@')[0].split(/[._-]+/) : value.split(/\s+/)

  return (
    words
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('') || fallback
  )
}

/**
 * Format bytes into human-readable file size string (e.g. 1024 -> "1 KB", 1048576 -> "1 MB").
 * Safely handles 0, negative numbers, or non-finite inputs.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Safely truncate a string to maximum length with an ellipsis suffix.
 */
export function truncateText(text?: string | null, maxLength = 100, suffix = '...'): string {
  const value = (text || '').trim()
  if (!value || value.length <= maxLength) return value
  return value.slice(0, maxLength).trimEnd() + suffix
}
