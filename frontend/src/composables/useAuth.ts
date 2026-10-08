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

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '@/services/user'
import { unregisterFCMToken } from '@/services/firebase'
import { authService } from '@/services/auth'

export function useAuth() {
  const router = useRouter()
  const user = ref(userService.getCurrentUser())
  const isLoggingOut = ref(false)
  const error = ref('')

  const logout = async () => {
    if (isLoggingOut.value) return

    isLoggingOut.value = true
    error.value = ''
    try {
      // Unregister this device's push token first — only this one, so the
      // user's other signed-in devices keep receiving notifications.
      try {
        await unregisterFCMToken()
      } catch (err) {
        // Push cleanup is best-effort and must never strand the user on the
        // dashboard when the notification provider is unavailable.
        console.error('FCM cleanup during logout failed:', err)
      }
      // Then proceed with normal logout
      await authService.logout()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to logout'
      console.error('Logout failed:', err)
    } finally {
      isLoggingOut.value = false
    }

    // authService clears the local session even when the API request fails, so
    // always leave the authenticated area after a logout attempt.
    try {
      await router.push('/login')
    } catch (err) {
      console.error('Failed to navigate to login after logout:', err)
    }
  }

  return {
    user,
    logout,
    isLoggingOut,
    error,
  }
}
