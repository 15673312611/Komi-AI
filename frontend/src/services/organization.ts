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

import api from './api'
import type { OrganizationUpdate } from '@/types/organization'
import type { Organization } from '@/types/organization'

export const organizationService = {
  async getOrganization(id: string): Promise<Organization> {
    const response = await api.get(`/organizations/${id}`)
    return response.data
  },

  async updateOrganization(id: string, data: OrganizationUpdate): Promise<Organization> {
    const response = await api.patch(`/organizations/${id}`, data)
    return response.data
  },

  async getOrganizationStats(id: string) {
    const response = await api.get(`/organizations/${id}/stats`)
    return response.data
  }
}
