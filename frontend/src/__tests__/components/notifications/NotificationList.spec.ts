// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearAll: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/services/notification', () => ({ notificationService: mocks }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))

import NotificationList from '@/components/notifications/NotificationList.vue'
import type { Notification } from '@/services/notification'

const notification = (patch: Partial<Notification> = {}): Notification => ({
  id: 1,
  type: 'chat',
  title: 'New conversation',
  message: 'A customer is waiting',
  notification_metadata: { session_id: 'session-1' },
  is_read: false,
  created_at: '2026-08-31T00:00:00.000Z',
  ...patch,
})

describe('NotificationList request coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getNotifications.mockResolvedValue([])
    mocks.markAsRead.mockResolvedValue(undefined)
    mocks.markAllAsRead.mockResolvedValue(undefined)
    mocks.deleteNotification.mockResolvedValue(undefined)
    mocks.clearAll.mockResolvedValue(undefined)
    mocks.push.mockResolvedValue(undefined)
  })

  it('keeps the newest fetch when an older response arrives later', async () => {
    let resolveOld: (value: Notification[]) => void = () => undefined
    mocks.getNotifications
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValueOnce([notification({ id: 2, title: 'New result' })])

    const wrapper = mount(NotificationList, { props: { isOpen: false } })
    await wrapper.setProps({ isOpen: true })
    await flushPromises()

    expect(wrapper.find('.notification-title').text()).toBe('New result')

    resolveOld([notification({ id: 1, title: 'Old result' })])
    await flushPromises()

    expect(wrapper.find('.notification-title').text()).toBe('New result')
    wrapper.unmount()
  })

  it('treats a malformed response as an empty list', async () => {
    mocks.getNotifications.mockResolvedValueOnce(null)

    const wrapper = mount(NotificationList, { props: { isOpen: true } })
    await flushPromises()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    wrapper.unmount()
  })

  it('marks a chat notification read before opening its conversation', async () => {
    mocks.getNotifications.mockResolvedValueOnce([notification()])
    const wrapper = mount(NotificationList, { props: { isOpen: true } })
    await flushPromises()

    await wrapper.find('.notification-item').trigger('click')

    expect(mocks.markAsRead).toHaveBeenCalledWith(1)
    expect(mocks.push).toHaveBeenCalledOnce()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
