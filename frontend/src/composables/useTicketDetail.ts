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

import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import { ticketService } from '@/services/tickets'
import { useTicketSocket } from '@/composables/useTicketSocket'
import type {
  InvestigationDetail,
  Ticket,
  TicketActivity,
  TicketDetail,
  TicketPriority,
  TicketStatus,
  TicketUpdatePayload,
} from '@/types/ticket'

// Poll fallback cadence: brisk while an AI run is active, relaxed otherwise.
const ACTIVE_POLL_MS = 3000
const IDLE_POLL_MS = 15000

export function useTicketDetail(ticketId: Ref<string>) {
  const detail = ref<TicketDetail | null>(null)
  const investigation = ref<InvestigationDetail | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const isSavingComment = ref(false)
  const isSavingCustomer = ref(false)
  // Covers both customer-summary actions: they write the same field, and
  // sending twice delivers the message to the customer twice.
  const isRcaBusy = ref(false)
  const isActionBusy = ref(false)
  const isPatching = ref(false)
  let refreshRequestVersion = 0
  let disposed = false
  let patchQueue: Promise<unknown> = Promise.resolve()

  const ticket = computed<Ticket | null>(() => detail.value?.ticket ?? null)
  const activities = computed<TicketActivity[]>(() => detail.value?.activities ?? [])
  const hasActiveRun = computed(() =>
    (detail.value?.runs ?? []).some((r) => r.status === 'pending' || r.status === 'running'),
  )

  async function refresh(silent = false) {
    const id = ticketId.value
    if (!id) {
      refreshRequestVersion += 1
      detail.value = null
      investigation.value = null
      isLoading.value = false
      return
    }
    const requestVersion = ++refreshRequestVersion
    if (!silent) isLoading.value = true
    try {
      // The glass box loads alongside the ticket; its failure (e.g. plan
      // gate) must never take the whole page down.
      const [detailData, investigationData] = await Promise.all([
        ticketService.getTicket(id),
        ticketService.getInvestigation(id).catch(() => null),
      ])
      if (requestVersion !== refreshRequestVersion || id !== ticketId.value || disposed) return
      detail.value = detailData
      investigation.value = investigationData
      error.value = null
    } catch (e: any) {
      if (requestVersion === refreshRequestVersion && id === ticketId.value && !disposed && !silent) {
        error.value = e?.message || 'Failed to load the ticket'
      }
    } finally {
      if (requestVersion === refreshRequestVersion && id === ticketId.value && !disposed) {
        isLoading.value = false
      }
    }
  }

  function patch(patchPayload: TicketUpdatePayload, failureMessage: string): Promise<boolean> {
    if (isPatching.value) return Promise.resolve(false)
    isPatching.value = true
    const operation = patchQueue.then(async () => {
      if (!detail.value) return false
      const previous = { ...detail.value.ticket }
      Object.assign(detail.value.ticket, patchPayload)
      try {
        await ticketService.updateTicket(previous.id, patchPayload)
        await refresh(true)
        return true
      } catch (e: any) {
        if (detail.value?.ticket.id === previous.id) detail.value.ticket = previous
        toast.error(e?.message || failureMessage)
        return false
      }
    })
    patchQueue = operation.catch(() => undefined)
    return operation.finally(() => { isPatching.value = false })
  }

  const setStatus = (status: TicketStatus) => patch({ status }, 'Failed to change the status')
  const setPriority = (priority: TicketPriority) => patch({ priority }, 'Failed to change the priority')
  const setSeverity = (severity: number) => patch({ severity }, 'Failed to change the severity')
  const setTitle = (title: string) => patch({ title }, 'Failed to rename the ticket')
  const setDescription = (description: string) =>
    patch({ description }, 'Failed to update the description')
  const setAssignee = (assignee_user_id: string | null) =>
    patch({ assignee_user_id }, 'Failed to assign the ticket')

  async function setCustomer(email: string, name?: string): Promise<boolean> {
    if (!detail.value || !email.trim() || isSavingCustomer.value) return false
    const ticketId = detail.value.ticket.id
    isSavingCustomer.value = true
    try {
      await ticketService.updateTicket(ticketId, {
        customer_email: email.trim(),
        customer_name: name?.trim() || undefined,
      })
      await refresh(true)
      toast.success('Customer linked')
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to link the customer')
      return false
    } finally {
      isSavingCustomer.value = false
    }
  }

  async function addComment(body: string, isInternal = true): Promise<boolean> {
    if (!detail.value || !body.trim() || isSavingComment.value) return false
    const ticketId = detail.value.ticket.id
    isSavingComment.value = true
    try {
      await ticketService.addComment(ticketId, body.trim(), isInternal)
      await refresh(true)
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to post the comment')
      return false
    } finally {
      isSavingComment.value = false
    }
  }

  async function resolve(payload: { outcome?: string; resolution_summary?: string; customer_message?: string }) {
    if (!detail.value || isActionBusy.value) return false
    isActionBusy.value = true
    try {
      await ticketService.resolveTicket(detail.value.ticket.id, payload)
      await refresh(true)
      toast.success('Ticket resolved — customer notified')
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to resolve the ticket')
      return false
    } finally {
      isActionBusy.value = false
    }
  }

  async function reopen(reason?: string) {
    if (!detail.value || isActionBusy.value) return false
    isActionBusy.value = true
    try {
      await ticketService.reopenTicket(detail.value.ticket.id, reason)
      await refresh(true)
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reopen the ticket')
      return false
    } finally {
      isActionBusy.value = false
    }
  }

  async function investigate(contextNote?: string) {
    if (!detail.value || isActionBusy.value) return false
    isActionBusy.value = true
    try {
      await ticketService.investigate(detail.value.ticket.id, {
        run_type: 'investigation',
        context_note: contextNote,
      })
      await refresh(true)
      toast.success('AI investigation queued')
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to start the AI run')
      return false
    } finally {
      isActionBusy.value = false
    }
  }

  async function saveRcaDraft(customerSummary: string) {
    if (!detail.value || isRcaBusy.value) return
    isRcaBusy.value = true
    try {
      await ticketService.updateRca(detail.value.ticket.id, {
        customer_summary: customerSummary,
        mark_reviewed: true,
      })
      await refresh(true)
      toast.success('Draft saved')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save the draft')
    } finally {
      isRcaBusy.value = false
    }
  }

  async function sendRcaToCustomer(customerSummary?: string) {
    // Re-entry guard, not just a disabled button: this delivers a message to
    // a real customer, so a double-click must not send it twice.
    if (!detail.value || isRcaBusy.value) return
    isRcaBusy.value = true
    try {
      // Persist any unsaved edit first so what's sent is what's shown.
      if (customerSummary !== undefined) {
        await ticketService.updateRca(detail.value.ticket.id, {
          customer_summary: customerSummary,
          mark_reviewed: true,
        })
      }
      await ticketService.sendRcaToCustomer(detail.value.ticket.id)
      await refresh(true)
      toast.success('Summary sent to the customer')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send the summary')
    } finally {
      isRcaBusy.value = false
    }
  }

  async function approveProposal() {
    if (!detail.value || isActionBusy.value) return false
    isActionBusy.value = true
    try {
      await ticketService.approveProposal(detail.value.ticket.id)
      await refresh(true)
      toast.success('Proposal approved — ticket resolved, customer notified')
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve the proposal')
      return false
    } finally {
      isActionBusy.value = false
    }
  }

  async function rejectProposal(reason?: string, reinvestigate = false) {
    if (!detail.value || isActionBusy.value) return false
    isActionBusy.value = true
    try {
      await ticketService.rejectProposal(detail.value.ticket.id, reason, reinvestigate)
      await refresh(true)
      toast.success(reinvestigate ? 'Rejected — a refined investigation is queued' : 'Proposal rejected')
      return true
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject the proposal')
      return false
    } finally {
      isActionBusy.value = false
    }
  }

  useTicketSocket((event) => {
    if (event.ticket_id === ticketId.value) refresh(true)
  })

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollGeneration = 0
  function scheduleNextPoll() {
    if (disposed) return
    const generation = ++pollGeneration
    if (pollTimer) clearTimeout(pollTimer)
    pollTimer = setTimeout(async () => {
      pollTimer = null
      if (disposed || generation !== pollGeneration) return
      await refresh(true)
      if (!disposed && generation === pollGeneration) scheduleNextPoll()
    }, hasActiveRun.value ? ACTIVE_POLL_MS : IDLE_POLL_MS)
  }

  onMounted(async () => {
    await refresh()
    scheduleNextPoll()
  })
  onBeforeUnmount(() => {
    disposed = true
    refreshRequestVersion += 1
    pollGeneration += 1
    if (pollTimer) clearTimeout(pollTimer)
  })
  watch(ticketId, () => {
    pollGeneration += 1
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    void refresh().then(() => scheduleNextPoll())
  })

  return {
    detail,
    investigation,
    ticket,
    activities,
    hasActiveRun,
    isLoading,
    isSavingComment,
    isSavingCustomer,
    isRcaBusy,
    isActionBusy,
    isPatching,
    error,
    refresh,
    setStatus,
    setPriority,
    setSeverity,
    setTitle,
    setDescription,
    setAssignee,
    setCustomer,
    addComment,
    resolve,
    reopen,
    investigate,
    saveRcaDraft,
    sendRcaToCustomer,
    approveProposal,
    rejectProposal,
  }
}
