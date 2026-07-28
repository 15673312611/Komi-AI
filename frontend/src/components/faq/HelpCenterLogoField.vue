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
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

// Generic image field (logo or favicon): file pick → square-optional crop →
// PNG export. Configurable size caps and crop aspect so one component serves both.
const props = withDefaults(
  defineProps<{
    imageUrl: string | null
    kind?: 'logo' | 'favicon'
    maxBytes?: number
    outputMax?: number
    square?: boolean
  }>(),
  { kind: 'logo', maxBytes: 2 * 1024 * 1024, outputMax: 512, square: false },
)

const emit = defineEmits<{
  upload: [file: File]
  remove: []
}>()

// Raster only — SVG is rejected (it would be active markup on the public site).
const ACCEPT = 'image/png,image/jpeg,image/webp'

const maxMbLabel = computed(() => `${Math.round(props.maxBytes / (1024 * 1024))} MB`)
const stencilProps = computed(() => (props.square ? { aspectRatio: 1 } : {}))

const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')

const showCropper = ref(false)
const cropperImage = ref('')
const cropper = ref<any>(null)
const saving = ref(false)

const imageName = computed(() => {
  if (!props.imageUrl) return ''
  return props.imageUrl.split('/').pop()?.split('?')[0] || props.kind
})

function pick() {
  error.value = ''
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    error.value = 'Use a PNG, JPG or WebP image.'
    return
  }
  if (file.size > props.maxBytes) {
    error.value = `Image must be ${maxMbLabel.value} or smaller.`
    return
  }
  error.value = ''
  cropperImage.value = URL.createObjectURL(file)
  showCropper.value = true
}

async function confirmCrop() {
  if (!cropper.value || saving.value) return
  saving.value = true
  try {
    const { canvas } = cropper.value.getResult()
    if (!canvas) throw new Error('no canvas')
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b: Blob | null) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png')
    })
    emit('upload', new File([blob], `${props.kind}.png`, { type: 'image/png' }))
    closeCropper()
  } catch {
    error.value = 'Could not process that image. Try another one.'
  } finally {
    saving.value = false
  }
}

function closeCropper() {
  showCropper.value = false
  if (cropperImage.value) URL.revokeObjectURL(cropperImage.value)
  cropperImage.value = ''
}
</script>

<template>
  <div>
    <input ref="fileInput" class="file-input" type="file" :accept="ACCEPT" @change="onFileChange" />
    <div v-if="imageUrl" class="logo-row">
      <div class="logo-chip">
        <img class="logo-chip__img" :src="imageUrl" :alt="kind" />
        <div class="logo-chip__name">{{ imageName }}</div>
      </div>
      <button class="btn-sm" type="button" @click="pick">Replace</button>
      <button class="icon-btn" type="button" :title="`Remove ${kind}`" @click="$emit('remove')">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
      </button>
    </div>
    <button v-else class="upload-btn" type="button" @click="pick">
      <span class="upload-btn__icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M4 20h16" /></svg>
      </span>
      <span>
        <span class="upload-btn__title">Upload your {{ kind }}</span>
        <span class="upload-btn__sub">PNG, JPG or WebP, up to {{ maxMbLabel }} · crop it to fit</span>
      </span>
    </button>

    <p v-if="error" class="logo-error">{{ error }}</p>

    <!-- Crop modal: the cropped canvas is exported as a fresh PNG, so nothing
         from the original file (metadata, oversized pixels) reaches the server. -->
    <div v-if="showCropper" class="crop-modal" @click.self="closeCropper">
      <div class="crop-panel">
        <div class="crop-head">Crop your {{ kind }}</div>
        <div class="crop-stage">
          <Cropper
            ref="cropper"
            :src="cropperImage"
            :canvas="{ maxWidth: outputMax, maxHeight: outputMax }"
            :stencil-props="stencilProps"
            image-restriction="fit-area"
            background="var(--o05)"
          />
        </div>
        <div class="crop-actions">
          <button class="btn-cancel" type="button" @click="closeCropper">Cancel</button>
          <button class="btn-save" type="button" :disabled="saving" @click="confirmCrop">
            {{ saving ? 'Saving…' : `Save ${kind}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-input {
  display: none;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--o10);
  border-radius: 11px;
  margin-right: 6px;
  min-width: 0;
}

.logo-chip__img {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-chip__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-sm {
  padding: 9px 13px;
  background: var(--o05);
  border: 1px solid var(--o12);
  border-radius: 9px;
  color: var(--text2);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-sm:hover {
  background: var(--o08);
}

.icon-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: var(--o05);
  border: 1px solid var(--o12);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--coral-bg);
  color: var(--c-coral);
  border-color: var(--coral-border);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: var(--bg);
  border: 1.5px dashed var(--o16);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
}

.upload-btn:hover {
  border-color: var(--o30);
}

.upload-btn__icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--o05);
  border: 1px solid var(--o10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.upload-btn__title {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text2);
}

.upload-btn__sub {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.logo-error {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--c-coral);
}

/* ---- crop modal ---- */
.crop-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 12, 16, 0.55);
}

.crop-panel {
  width: 100%;
  max-width: 460px;
  background: var(--surface, var(--bg));
  border: 1px solid var(--o12);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(10, 12, 16, 0.35);
  overflow: hidden;
}

.crop-head {
  padding: 16px 18px;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 600;
  color: var(--text2);
  border-bottom: 1px solid var(--o10);
}

.crop-stage {
  height: 320px;
  background: var(--o05);
}

.crop-stage :deep(.vue-advanced-cropper) {
  height: 100%;
}

.crop-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--o10);
}

.btn-cancel {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--o12);
  border-radius: 10px;
  color: var(--muted);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save {
  padding: 10px 18px;
  background: var(--purple-bg);
  border: 1px solid var(--purple-border);
  border-radius: 10px;
  color: var(--c-purple);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
