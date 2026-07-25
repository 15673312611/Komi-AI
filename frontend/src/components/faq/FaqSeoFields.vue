<!--
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

Per-article SEO overrides inside the FAQ editor: URL slug, meta title and meta
description. Collapsed by default — every field is optional, and leaving one
empty keeps the value the public page derives from the question and answer.
-->

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    slug?: string
    metaTitle?: string
    metaDescription?: string
    /** Shown as the placeholder for the title, so the derived default is visible. */
    question?: string
  }>(),
  { slug: '', metaTitle: '', metaDescription: '', question: '' },
)

const emit = defineEmits<{
  'update:slug': [value: string]
  'update:metaTitle': [value: string]
  'update:metaDescription': [value: string]
}>()

// Hard caps mirror the backend column widths in app/models/faq.py, which is the
// source of truth — the API rejects anything longer with a 422, so these only
// stop the user typing past the limit. The "recommended" numbers are softer:
// where search engines start truncating the tag in results.
const MAX_SLUG = 80
const MAX_TITLE = 120
const MAX_DESCRIPTION = 300
const RECOMMENDED_TITLE = 60
const RECOMMENDED_DESCRIPTION = 160

// A customised article opens the section on mount, so an override is never
// hidden behind a collapsed panel — but it stays a plain toggle afterwards, so
// the user can still fold it away. The editor mounts fresh per article, which
// is what makes the initial value correct.
const hasValues = computed(
  () => Boolean(props.metaTitle.trim() || props.metaDescription.trim()),
)
const expanded = ref(hasValues.value)

const titleCount = computed(() => props.metaTitle.trim().length)
const descriptionCount = computed(() => props.metaDescription.trim().length)

function onInput(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}
</script>

<template>
  <div class="seo">
    <button class="seo__toggle" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
      <svg
        class="seo__chevron"
        :class="{ 'seo__chevron--open': expanded }"
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
      SEO &amp; URL
      <span v-if="hasValues" class="seo__badge">customised</span>
    </button>

    <div v-if="expanded" class="seo__fields">
      <label class="seo__field">
        <span class="seo__label">URL slug</span>
        <span class="seo__slug">
          <span class="seo__prefix">/a/</span>
          <input
            type="text"
            class="seo__input seo__input--slug"
            :maxlength="MAX_SLUG"
            placeholder="auto-generated from the question"
            :value="slug"
            @input="emit('update:slug', onInput($event))"
          />
        </span>
        <span class="seo__hint">
          Changing this breaks existing links to the article. Spaces and symbols become hyphens.
        </span>
      </label>

      <label class="seo__field">
        <span class="seo__label">
          Meta title
          <span class="seo__count" :class="{ 'seo__count--over': titleCount > RECOMMENDED_TITLE }">
            {{ titleCount }}/{{ RECOMMENDED_TITLE }}
          </span>
        </span>
        <input
          type="text"
          class="seo__input"
          :maxlength="MAX_TITLE"
          :placeholder="question || 'Defaults to the question'"
          :value="metaTitle"
          @input="emit('update:metaTitle', onInput($event))"
        />
      </label>

      <label class="seo__field">
        <span class="seo__label">
          Meta description
          <span
            class="seo__count"
            :class="{ 'seo__count--over': descriptionCount > RECOMMENDED_DESCRIPTION }"
          >
            {{ descriptionCount }}/{{ RECOMMENDED_DESCRIPTION }}
          </span>
        </span>
        <textarea
          class="seo__input seo__textarea"
          rows="2"
          :maxlength="MAX_DESCRIPTION"
          placeholder="Defaults to the start of the answer"
          :value="metaDescription"
          @input="emit('update:metaDescription', onInput($event))"
        ></textarea>
      </label>
    </div>
  </div>
</template>

<style scoped>
.seo {
  margin-top: 10px;
  border-top: 1px solid var(--o08);
  padding-top: 10px;
}

.seo__toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.seo__toggle:hover {
  color: var(--text);
}

.seo__chevron {
  transition: transform 0.15s ease;
}

.seo__chevron--open {
  transform: rotate(90deg);
}

.seo__badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--o08);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--muted2);
}

.seo__fields {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.seo__field {
  display: block;
}

.seo__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.seo__count {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 400;
  color: var(--muted2);
}

.seo__count--over {
  color: var(--c-coral);
}

.seo__slug {
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--o12);
  border-radius: 9px;
  overflow: hidden;
}

.seo__prefix {
  padding: 0 2px 0 11px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--muted2);
}

.seo__input {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg);
  border: 1px solid var(--o12);
  border-radius: 9px;
  padding: 9px 11px;
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 13px;
  outline: none;
}

.seo__input:focus {
  border-color: var(--o20);
}

/* The slug input sits inside the prefixed shell, which draws the border. */
.seo__input--slug {
  border: none;
  border-radius: 0;
  padding-left: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
}

.seo__textarea {
  resize: vertical;
  line-height: 1.5;
}

.seo__hint {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: var(--muted2);
}
</style>
