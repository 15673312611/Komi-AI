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

import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { organizationService } from '@/services/organization'
import type { Organization, BusinessHoursDict } from '@/types/organization'
import { validateDomain } from '@/utils/validators'

export function useOrganizationSettings() {
  const { user } = useAuth()

  const defaultBusinessHours = (): BusinessHoursDict => ({
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '09:00', end: '17:00', enabled: false },
    sunday: { start: '09:00', end: '17:00', enabled: false }
  })

  // Server-stored business_hours may be empty or missing days; merge over the
  // full default so every day key is present (presets + day-rows assume this).
  const normalizeBusinessHours = (raw: unknown): BusinessHoursDict => {
    const normalized = defaultBusinessHours()
    const source = raw && typeof raw === 'object' ? raw as Partial<BusinessHoursDict> : {}
    for (const day of Object.keys(normalized) as (keyof BusinessHoursDict)[]) {
      const value = source[day]
      if (value && typeof value === 'object') {
        normalized[day] = { ...normalized[day], ...value }
      }
    }
    return normalized
  }

  const formData = ref({
    name: '',
    domain: '',
    timezone: '',
    business_hours: defaultBusinessHours(),
    settings: {} as Record<string, any>
  })

  // Add helper functions for business hours
  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ] as const

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const loading = ref(false)
  const message = ref('')
  const error = ref('')
  const stats = ref<any>(null)
  let loadVersion = 0
  let mutationVersion = 0

  const originalData = ref({
    name: '',
    domain: '',
    timezone: '',
    business_hours: {} as BusinessHoursDict,
    settings: {}
  })

  const hasChanges = computed(() => {
    return formData.value.name !== originalData.value.name ||
           formData.value.domain !== originalData.value.domain ||
           formData.value.timezone !== originalData.value.timezone ||
           JSON.stringify(formData.value.business_hours) !== JSON.stringify(originalData.value.business_hours) ||
           JSON.stringify(formData.value.settings) !== JSON.stringify(originalData.value.settings)
  })

  const loadOrganizationData = async () => {
    if (user.value?.organization_id) {
      const version = ++loadVersion
      const mutationAtStart = mutationVersion
      try {
        loading.value = true
        const [org, orgStats] = await Promise.all([
          organizationService.getOrganization(user.value.organization_id),
          organizationService.getOrganizationStats(user.value.organization_id)
        ])
        
        if (version !== loadVersion || mutationAtStart !== mutationVersion) return
        formData.value = {
          name: org.name,
          domain: org.domain,
          timezone: org.timezone,
          business_hours: normalizeBusinessHours(org.business_hours),
          settings: org.settings ? JSON.parse(JSON.stringify(org.settings)) : {}
        }
        
        originalData.value = JSON.parse(JSON.stringify(formData.value))
        
        stats.value = orgStats
        error.value = ''
      } catch (err: any) {
        if (version !== loadVersion) return
        error.value = err.message || 'Failed to load organization data'
      } finally {
        if (version === loadVersion) loading.value = false
      }
    }
  }

  const updateOrganization = async () => {
    if (loading.value) return
    if (!user.value?.organization_id || !hasChanges.value) {
      message.value = 'No changes to save'
      return
    }

    const name = formData.value.name.trim()
    const domain = formData.value.domain.trim()
    if (name.length < 2 || name.length > 100) {
      error.value = '组织名称长度须在 2-100 个字符之间'
      return
    }
    if (!validateDomain(domain)) {
      error.value = '请输入有效的主业务域名，例如 example.com'
      return
    }
    if (!formData.value.timezone.trim()) {
      error.value = '请选择企业默认时区'
      return
    }
    for (const day of Object.keys(formData.value.business_hours) as (keyof BusinessHoursDict)[]) {
      const hours = formData.value.business_hours[day]
      const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
      if (!validTime(hours.start) || !validTime(hours.end)) {
        error.value = '工作时间必须使用 HH:MM 格式'
        return
      }
      if (hours.enabled && hours.start >= hours.end) {
        error.value = '每个工作日的开始时间必须早于结束时间'
        return
      }
    }

    const mutation = ++mutationVersion
    loading.value = true
    error.value = ''
    message.value = ''

    try {
      const updateData: Partial<Organization> = {}
      
      if (formData.value.name !== originalData.value.name) {
        updateData.name = name
      }
      
      if (formData.value.domain !== originalData.value.domain) {
        updateData.domain = domain
      }
      
      if (formData.value.timezone !== originalData.value.timezone) {
        updateData.timezone = formData.value.timezone
      }

      if (JSON.stringify(formData.value.business_hours) !== JSON.stringify(originalData.value.business_hours)) {
        updateData.business_hours = JSON.parse(JSON.stringify(formData.value.business_hours))
      }

      if (JSON.stringify(formData.value.settings) !== JSON.stringify(originalData.value.settings)) {
        updateData.settings = JSON.parse(JSON.stringify(formData.value.settings))
      }

      await organizationService.updateOrganization(user.value.organization_id, updateData)
      if (mutation !== mutationVersion) return
      formData.value.name = name
      formData.value.domain = domain
      message.value = 'Organization updated successfully'
      
      originalData.value = JSON.parse(JSON.stringify(formData.value))
    } catch (err: any) {
      if (mutation === mutationVersion) error.value = err.message || 'Failed to update organization'
    } finally {
      if (mutation === mutationVersion) loading.value = false
    }
  }

  return {
    formData,
    loading,
    message,
    error,
    stats,
    hasChanges,
    days,
    timeOptions,
    loadOrganizationData,
    updateOrganization
  }
}
