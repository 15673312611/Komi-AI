import api from './api'

export interface CannedResponse {
  id: string
  category: string
  title: string
  shortcut?: string | null
  content: string
}

export interface CannedResponseInput {
  category: string
  title: string
  shortcut?: string | null
  content: string
}

export const cannedResponsesService = {
  async list(): Promise<CannedResponse[]> {
    const response = await api.get('/canned-responses')
    return response.data as CannedResponse[]
  },

  async create(payload: CannedResponseInput): Promise<CannedResponse> {
    const response = await api.post('/canned-responses', payload)
    return response.data as CannedResponse
  },

  async update(id: string, payload: CannedResponseInput): Promise<CannedResponse> {
    const response = await api.put(`/canned-responses/${id}`, payload)
    return response.data as CannedResponse
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/canned-responses/${id}`)
  },
}
