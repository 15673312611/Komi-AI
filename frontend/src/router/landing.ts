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

import { canAccessPath } from '@/router/routePermissions'

/**
 * Where to send someone who has not asked for a particular page: after login,
 * from `/`, from the catch-all, and from the 403 page.
 *
 * Order matters — /ai-agents stays first so an admin's landing page is
 * unchanged. The list ends at /settings/user, which requires nothing, so this
 * always resolves to somewhere the user can actually open.
 */
const LANDING_CANDIDATES = [
  '/ai-agents',
  '/conversations',
  '/tickets',
  '/people',
  '/human-agents',
  '/analytics',
  '/knowledge',
  '/settings/organization',
  '/settings/ai-config',
  '/settings/user',
]

/**
 * The first landing candidate this user may open.
 *
 * Never returns /403: bouncing someone to an error page as their *destination*
 * is what made a permission denial look like a broken app.
 *
 * Call this at navigation time, never at module scope — permissions are read
 * from localStorage, which is empty when the router module is first evaluated.
 */
export function resolveLandingRoute(): string {
  return LANDING_CANDIDATES.find(canAccessPath) ?? '/settings/user'
}
