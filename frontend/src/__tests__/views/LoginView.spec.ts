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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createWebHistory, Router } from 'vue-router'
import LoginView from '../../views/LoginView.vue'
import { createPinia, setActivePinia } from 'pinia'

// Mock the services
vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn()
  }
}))

// The landing route is resolved from the real permission checks reading the
// cached user, so this drives the user rather than mocking the checks away.
const currentUser = vi.hoisted(() => ({ value: null as unknown }))

vi.mock('@/services/user', () => ({
  userService: {
    getCurrentUser: () => currentUser.value,
    setCurrentUser: vi.fn(),
    getUserId: () => 'user-1',
  },
}))

// Mock enterprise features
vi.mock('@/composables/useEnterpriseFeatures', () => ({
  useEnterpriseFeatures: vi.fn(() => ({
    hasEnterpriseModule: false,
    loadModule: vi.fn().mockResolvedValue(null)
  }))
}))

// Mock forgot password composable
vi.mock('@/composables/useForgotPassword', () => ({
  useForgotPassword: vi.fn(() => ({
    isLoading: { value: false },
    error: { value: '' },
    success: { value: '' },
    currentStep: { value: 1 },
    email: { value: '' },
    otp: { value: '' },
    newPassword: { value: '' },
    confirmPassword: { value: '' },
    passwordValidation: { value: { score: 0, hasMinLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false } },
    requestPasswordReset: vi.fn(),
    verifyAndResetPassword: vi.fn(),
    resetForm: vi.fn(),
    goBackToEmailStep: vi.fn()
  }))
}))

// Mock Firebase services
vi.mock('@/services/firebase', () => ({
  messaging: {},
  requestNotificationPermission: vi.fn()
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    requestPermission: vi.fn(),
    hasPermission: { value: false }
  }))
}))

// Import the mocked modules
import { authService } from '@/services/auth'
import { userWithPermissions } from '../fixtures/permissions'

describe('LoginView', () => {
  let wrapper: VueWrapper
  let router: Router

  beforeEach(async () => {
    // Create a fresh router instance for each test
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/ai-agents', name: 'ai-agents', component: { template: '<div>AI Agents</div>' } },
        { path: '/conversations', name: 'conversations', component: { template: '<div>Conversations</div>' } },
        { path: '/human-agents', name: 'human-agents', component: { template: '<div>Human Agents</div>' } },
        { path: '/settings/organization', name: 'org-settings', component: { template: '<div>Organization Settings</div>' } },
        { path: '/settings/ai-config', name: 'ai-config', component: { template: '<div>AI Config</div>' } },
        { path: '/settings/user', name: 'user-settings', component: { template: '<div>User Settings</div>' } },
        { path: '/403', name: 'forbidden', component: { template: '<div>403</div>' } }
      ]
    })

    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // Reset router to initial state and wait for it to be ready
    await router.push('/')
    await router.isReady()
    
    // A user with no grants unless a test says otherwise
    currentUser.value = userWithPermissions([])
    
    wrapper = mount(LoginView, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true
        }
      }
    })

    // Wait for component to be ready
    await nextTick()
  })

  it('renders login form properly', () => {
    expect(wrapper.find('.auth-page').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('updates email and password inputs', async () => {
    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password123')

    expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
    expect((passwordInput.element as HTMLInputElement).value).toBe('password123')
  })

  it('shows loading state during login', async () => {
    const mockLogin = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    ;(authService.login as any) = mockLogin

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    const submitButton = wrapper.find('button[type="submit"]')
    await submitButton.trigger('submit')

    expect(submitButton.text()).toBe('正在登录…')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('handles successful login and redirects based on permissions', async () => {
    // Mock successful login
    ;(authService.login as any).mockResolvedValue({ id: 1, email: 'test@example.com' })
    
    // User can manage agents
    currentUser.value = userWithPermissions(['manage_agents'])

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')

    // Verify login was called
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
    
    // Wait for all promises to resolve
    await flushPromises()
    
    expect(router.currentRoute.value.path).toBe('/ai-agents')
  })

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials'
    ;(authService.login as any).mockRejectedValue({
      response: {
        data: {
          detail: errorMessage
        }
      }
    })

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('wrong-password')
    await wrapper.find('form').trigger('submit')

    // Wait for error to be displayed
    await flushPromises()
    expect(wrapper.find('.auth-error').text()).toBe(errorMessage)
  })

  it('redirects to correct route based on permissions', async () => {
    ;(authService.login as any).mockResolvedValue({ id: 1, email: 'test@example.com' })

    const testCases = [
      { permission: 'manage_agents', route: '/ai-agents' },
      { permission: 'view_assigned_chats', route: '/conversations' },
      { permission: 'manage_users', route: '/human-agents' },
      { permission: 'view_organization', route: '/settings/organization' },
      { permission: 'view_ai_config', route: '/settings/ai-config' },
    ]

    for (const testCase of testCases) {
      currentUser.value = userWithPermissions([testCase.permission])

      // Reset router and wait for it to be ready
      await router.push('/')
      await router.isReady()
      await nextTick()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.find('form').trigger('submit')

      // Wait for all promises to resolve
      await flushPromises()
      
      expect(router.currentRoute.value.path).toBe(testCase.route)
    }
  })

  // Used to land on /403 — which was not a registered route, so the user
  // silently ended up on /ai-agents, a page they had just been refused.
  it('lands a permissionless user on their own settings, never on 403', async () => {
    ;(authService.login as any).mockResolvedValue({ id: 1, email: 'test@example.com' })
    currentUser.value = userWithPermissions([])

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')

    // Wait for all promises to resolve
    await flushPromises()
    
    expect(router.currentRoute.value.path).toBe('/settings/user')
  })
})
