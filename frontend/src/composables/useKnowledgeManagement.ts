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

import { ref } from 'vue'
import type { KnowledgeItem, KnowledgePage, QueueItem, KnowledgeContent } from '@/types/knowledge'
import { knowledgeService } from '@/services/knowledge'

export function useKnowledgeManagement(agentId: string, organizationId: string) {
  // Knowledge list state
  const knowledgeItems = ref<KnowledgeItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Queue state
  const queueItems = ref<QueueItem[]>([])
  const isLoadingQueue = ref(false)

  // Content viewing/editing state
  const selectedKnowledge = ref<number | null>(null)
  const knowledgeContent = ref<KnowledgeContent | null>(null)
  const isLoadingContent = ref(false)
  const contentError = ref<string | null>(null)
  const isEditingContent = ref(false)
  const editedContent = ref('')
  const isSavingContent = ref(false)
  const showContentModal = ref(false)

  // Modal and upload state
  const showKnowledgeModal = ref(false)
  const activeTab = ref('pdf')
  const files = ref<File[]>([])
  const urls = ref<string[]>([])
  const newUrl = ref('')
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const successMessage = ref('')
  const fileInput = ref<HTMLInputElement | null>(null)

  // Link state
  const showLinkModal = ref(false)
  const orgKnowledgeItems = ref<KnowledgeItem[]>([])
  const orgCurrentPage = ref(1)
  const orgTotalPages = ref(0)
  const isLoadingOrg = ref(false)

  // Delete state
  const showDeleteConfirm = ref(false)
  const knowledgeToDelete = ref<number | null>(null)
  const isDeleting = ref(false)

  // Add new state for URL form errors
  const urlFormError = ref<string | null>(null)

  // Add upload error state
  const uploadError = ref<string | null>(null)

  let knowledgeRequestVersion = 0
  let queueRequestVersion = 0
  let orgRequestVersion = 0
  let contentRequestVersion = 0
  const queueDeleteIds = new Set<number>()
  const knowledgeLinkIds = new Set<number>()



  // Fetch knowledge data
  const fetchKnowledge = async () => {
    const requestVersion = ++knowledgeRequestVersion
    const orgRequest = ++orgRequestVersion
    try {
      isLoading.value = true
      isLoadingOrg.value = true
      error.value = null

      // Fetch the agent and organization lists independently so one failed
      // endpoint cannot discard a successful response from the other.
      const [agentResult, orgResult] = await Promise.allSettled([
        knowledgeService.getKnowledgeByAgent(agentId, currentPage.value, pageSize.value),
        knowledgeService.getKnowledgeByOrganization(
          organizationId,
          orgCurrentPage.value,
          pageSize.value,
        ),
        fetchQueueItems(),
      ])

      if (requestVersion === knowledgeRequestVersion) {
        if (agentResult.status === 'fulfilled') {
          const agentResponse = agentResult.value
          // Default to empty: a partial response used to leave these
          // undefined, and every later .some()/.length on them threw.
          knowledgeItems.value = Array.isArray(agentResponse?.knowledge)
            ? agentResponse.knowledge
            : []
          totalPages.value = agentResponse?.pagination?.total_pages || 0
        } else {
          error.value = 'Failed to load agent knowledge sources'
          console.error(agentResult.reason)
        }
      }

      if (orgRequest === orgRequestVersion) {
        if (orgResult.status === 'fulfilled') {
          const orgResponse = orgResult.value
          orgKnowledgeItems.value = Array.isArray(orgResponse?.knowledge)
            ? orgResponse.knowledge
            : []
          orgTotalPages.value = orgResponse?.pagination?.total_pages || 0
        } else {
          console.error(orgResult.reason)
        }
      }
    } finally {
      if (requestVersion === knowledgeRequestVersion) {
        isLoading.value = false
      }
      if (orgRequest === orgRequestVersion) isLoadingOrg.value = false
    }
  }

  // Fetch queue items
  const fetchQueueItems = async () => {
    const requestVersion = ++queueRequestVersion
    try {
      isLoadingQueue.value = true
      const response = await knowledgeService.getAgentQueueItems(agentId)
      if (requestVersion === queueRequestVersion) {
        queueItems.value = Array.isArray(response?.queue_items) ? response.queue_items : []
      }
      return response
    } catch (err) {
      console.error('Failed to load queue items:', err)
      if (requestVersion === queueRequestVersion) queueItems.value = []
      return { queue_items: [] }
    } finally {
      if (requestVersion === queueRequestVersion) isLoadingQueue.value = false
    }
  }

  const deleteQueueItem = async (queueId: number) => {
    if (queueDeleteIds.has(queueId)) return
    queueDeleteIds.add(queueId)
    try {
      await knowledgeService.deleteQueueItem(queueId)
      await fetchQueueItems() // Refresh queue
    } catch (err) {
      console.error('Failed to delete queue item:', err)
      error.value = 'Failed to delete queue item'
    } finally {
      queueDeleteIds.delete(queueId)
    }
  }



  // Pagination handler
  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, totalPages.value ? Math.min(page, totalPages.value) : page)
    if (nextPage === currentPage.value) return
    currentPage.value = nextPage
    void fetchKnowledge()
  }

  // Date formatting
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get earliest creation date
  const getFirstCreated = (pages: KnowledgePage[]): string | null => {
    return pages.reduce(
      (earliest, page) => {
        if (!page.created_at) return earliest
        if (!earliest) return page.created_at
        return page.created_at < earliest ? page.created_at : earliest
      },
      null as string | null,
    )
  }

  // People type "docs.company.com", not "https://docs.company.com". Without a
  // scheme new URL() throws and they get "Please enter a valid URL" for an
  // address that is perfectly fine, so default the scheme before validating.
  const withScheme = (url: string): string => {
    const trimmed = url.trim()
    if (!trimmed) return trimmed
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed
    // Leading slashes would produce https:////host — drop them first.
    return `https://${trimmed.replace(/^\/+/, '')}`
  }

  // URL validation
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url)
      // new URL() accepts things like "mailto:x" and "foo:bar"; a crawlable
      // source has to be http(s). Deliberately not requiring a dot in the host:
      // self-hosted installs index intranet names like https://wiki.
      return /^https?:$/.test(parsed.protocol) && !!parsed.hostname
    } catch {
      return false
    }
  }

  // File handling methods
  const triggerFileInput = () => {
    fileInput.value?.click()
  }

  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement
    const selectedFiles = Array.from(input.files || [])
    // Allow selecting the same file again after a rejected attempt.
    input.value = ''
    const invalidFiles = selectedFiles.filter(
      (file) => file.type.toLowerCase() !== 'application/pdf' && !/\.pdf$/i.test(file.name),
    )
    if (invalidFiles.length) {
      // Reject the whole selection instead of silently dropping one file and
      // uploading the rest without the user noticing.
      files.value = []
      uploadError.value = 'Only PDF files can be uploaded'
      return
    }
    files.value = selectedFiles
    uploadError.value = null
  }

  const handleFileUpload = async () => {
    if (!files.value.length || isUploading.value) return

    try {
      isUploading.value = true
      uploadError.value = null // Clear previous errors
      
      const response = await knowledgeService.uploadPdfFiles(
        files.value,
        organizationId,
        agentId,
        (progress) => {
          uploadProgress.value = progress
        },
      )
      if (response.message) {
        successMessage.value = response.message
        await fetchKnowledge() // Refresh knowledge list
      }
      files.value = []
      if (fileInput.value) fileInput.value.value = ''
    } catch (error: any) {
      console.error('Upload failed:', error)
      uploadError.value = error.message || 'Failed to upload files'
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  // URL handling methods
  const handleUrlAdd = () => {
    if (!newUrl.value) return

    // Start clean so the outcome of this attempt is the only thing on screen,
    // and so callers can read urlFormError to tell whether it succeeded.
    urlFormError.value = null

    // Clean the URL, defaulting the scheme when the user left it off
    const cleanUrl = withScheme(newUrl.value)

    // Basic URL validation
    if (!isValidUrl(cleanUrl)) {
      urlFormError.value = 'Please enter a valid URL'
      return
    }

    // Check if URL already exists in knowledgeItems or orgKnowledgeItems
    const urlExistsInAgent = knowledgeItems.value.some((item) => item.name === cleanUrl)
    const urlExistsInOrg = orgKnowledgeItems.value.some((item) => item.name === cleanUrl)

    if (urlExistsInAgent || urlExistsInOrg) {
      urlFormError.value = 'This URL already exists in your knowledge base'
      newUrl.value = ''
      return
    }

    // Check if URL is already in the current batch
    if (urls.value.includes(cleanUrl)) {
      urlFormError.value = 'This URL has already been added to the current batch'
      newUrl.value = ''
      return
    }

    // Add URL to batch
    urls.value.push(cleanUrl)
    newUrl.value = ''
    urlFormError.value = null
  }

  const removeUrl = (index: number) => {
    if (index < 0 || index >= urls.value.length) return
    urls.value.splice(index, 1)
  }

  const handleUrlUpload = async () => {
    if (!urls.value.length || isUploading.value) return

    try {
      isUploading.value = true
      uploadError.value = null // Clear previous errors
      
      const response = await knowledgeService.addUrls(
        organizationId,
        urls.value,
        agentId,
        (progress) => {
          uploadProgress.value = progress
        },
      )
      if (response.message) {
        successMessage.value = response.message
        await fetchKnowledge() // Refresh knowledge list
      }
      urls.value = []
    } catch (error: any) {
      console.error('URL upload failed:', error)
      uploadError.value = error.message || 'Failed to upload URLs'
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const fetchOrgKnowledge = async () => {
    const requestVersion = ++orgRequestVersion
    try {
      isLoadingOrg.value = true
      const response = await knowledgeService.getKnowledgeByOrganization(
        organizationId,
        orgCurrentPage.value,
        pageSize.value,
      )
      if (requestVersion !== orgRequestVersion) return
      orgKnowledgeItems.value = Array.isArray(response?.knowledge) ? response.knowledge : []
      orgTotalPages.value = response?.pagination?.total_pages || 0
    } catch (err) {
      console.error(err)
    } finally {
      if (requestVersion === orgRequestVersion) isLoadingOrg.value = false
    }
  }

  const handleOrgPageChange = (page: number) => {
    const nextPage = Math.max(1, orgTotalPages.value ? Math.min(page, orgTotalPages.value) : page)
    if (nextPage === orgCurrentPage.value) return
    orgCurrentPage.value = nextPage
    void fetchOrgKnowledge()
  }

  const linkKnowledge = async (knowledgeId: number) => {
    if (knowledgeLinkIds.has(knowledgeId)) return
    knowledgeLinkIds.add(knowledgeId)
    try {
      await knowledgeService.linkToAgent(knowledgeId, agentId)
      await fetchKnowledge() // Refresh agent knowledge
    } catch (error) {
      console.error('Error linking knowledge:', error)
    } finally {
      knowledgeLinkIds.delete(knowledgeId)
    }
  }

  const unlinkKnowledge = async (knowledgeId: number) => {
    if (knowledgeLinkIds.has(knowledgeId)) return
    knowledgeLinkIds.add(knowledgeId)
    try {
      await knowledgeService.unlinkFromAgent(knowledgeId, agentId)
      await fetchKnowledge() // Refresh agent knowledge
    } catch (error) {
      console.error('Error unlinking knowledge:', error)
    } finally {
      knowledgeLinkIds.delete(knowledgeId)
    }
  }

  // Delete methods
  const confirmDelete = (knowledgeId: number) => {
    knowledgeToDelete.value = knowledgeId
    showDeleteConfirm.value = true
  }

  const handleDelete = async () => {
    if (knowledgeToDelete.value === null || isDeleting.value) return
    const knowledgeId = knowledgeToDelete.value
    isDeleting.value = true

    try {
      await knowledgeService.deleteKnowledge(knowledgeId)
      await fetchKnowledge() // Refresh the list
      showDeleteConfirm.value = false
      knowledgeToDelete.value = null
    } catch (err) {
      console.error('Error deleting knowledge:', err)
      error.value = 'Failed to delete knowledge source'
    } finally {
      isDeleting.value = false
    }
  }

  const cancelDelete = () => {
    showDeleteConfirm.value = false
    knowledgeToDelete.value = null
  }

  // Content management methods
  const viewKnowledgeContent = async (knowledgeId: number) => {
    const requestVersion = ++contentRequestVersion
    try {
      selectedKnowledge.value = knowledgeId
      isLoadingContent.value = true
      contentError.value = null
      showContentModal.value = true
      
      const response = await knowledgeService.getKnowledgeContent(knowledgeId)
      if (requestVersion !== contentRequestVersion || selectedKnowledge.value !== knowledgeId) return
      knowledgeContent.value = { ...response, chunks: response?.chunks || [] }
      
      // Do not combine chunks - keep them separate for individual editing
      editedContent.value = ''
    } catch (err) {
      console.error('Error loading knowledge content:', err)
      if (requestVersion === contentRequestVersion) {
        knowledgeContent.value = null
        contentError.value = 'Failed to load knowledge content'
      }
    } finally {
      if (requestVersion === contentRequestVersion) isLoadingContent.value = false
    }
  }

  const enableContentEditing = () => {
    isEditingContent.value = true
  }

  const cancelContentEditing = () => {
    isEditingContent.value = false
  }

  const saveChunkContent = async (chunkId: string, content: string): Promise<boolean> => {
    const knowledgeId = selectedKnowledge.value
    if (knowledgeId === null || !content.trim() || isSavingContent.value) return false

    try {
      isSavingContent.value = true
      await knowledgeService.updateChunkContent(knowledgeId, chunkId, content)
      
      successMessage.value = 'Chunk updated successfully'
      
      // Reload the content to show updated chunk
      if (selectedKnowledge.value === knowledgeId) await viewKnowledgeContent(knowledgeId)
      return true
    } catch (err: any) {
      console.error('Error saving chunk content:', err)
      error.value = err.message || 'Failed to save chunk content'
      return false
    } finally {
      isSavingContent.value = false
    }
  }

  const closeContentModal = () => {
    contentRequestVersion += 1
    showContentModal.value = false
    isLoadingContent.value = false
    selectedKnowledge.value = null
    knowledgeContent.value = null
    contentError.value = null
    isEditingContent.value = false
    editedContent.value = ''
  }

  return {
    // State
    knowledgeItems,
    currentPage,
    pageSize,
    totalPages,
    isLoading,
    error,
    showKnowledgeModal,
    activeTab,
    files,
    urls,
    newUrl,
    isUploading,
    uploadProgress,
    successMessage,
    fileInput,
    showLinkModal,
    orgKnowledgeItems,
    orgCurrentPage,
    orgTotalPages,
    isLoadingOrg,
    showDeleteConfirm,
    knowledgeToDelete,
    isDeleting,
    urlFormError,
    uploadError,
    queueItems,
    isLoadingQueue,
    selectedKnowledge,
    knowledgeContent,
    isLoadingContent,
    contentError,
    isEditingContent,
    editedContent,
    isSavingContent,
    showContentModal,

    // Methods
    fetchKnowledge,
    fetchQueueItems,
    deleteQueueItem,
    handlePageChange,
    formatDate,

    getFirstCreated,
    isValidUrl,
    withScheme,
    triggerFileInput,
    handleFileSelect,
    handleFileUpload,
    handleUrlAdd,
    removeUrl,
    handleUrlUpload,
    fetchOrgKnowledge,
    handleOrgPageChange,
    linkKnowledge,
    unlinkKnowledge,
    confirmDelete,
    handleDelete,
    cancelDelete,
    viewKnowledgeContent,
    enableContentEditing,
    cancelContentEditing,
    saveChunkContent,
    closeContentModal,
  }
}

