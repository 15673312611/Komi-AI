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

/**
 * The footer line disclosing that replies are AI-generated.
 *
 * Copy and visibility rule live here, not in each template, so the live widget,
 * the dashboard preview and the settings description cannot drift apart.
 */
export const AI_DISCLAIMER_TEXT = 'AI 生成内容仅供参考，请核对重要信息。'

/**
 * Whether the disclosure should be rendered.
 *
 * Two deliberate choices:
 *
 * - `!== false` rather than `=== true`. A widget served before this setting
 *   existed sends no value at all, and missing configuration must fail towards
 *   disclosing rather than towards hiding.
 * - Hidden once a human agent takes the conversation over. From that point the
 *   replies are written by a person, so the line would simply be untrue.
 */
export function shouldShowAiDisclaimer(
  enabled: boolean | undefined | null,
  handedOverToHuman = false,
): boolean {
  return enabled !== false && !handedOverToHuman
}
