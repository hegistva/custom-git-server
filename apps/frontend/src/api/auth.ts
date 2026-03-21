import { apiClient } from '@/lib/api'
import type { LoginResponse, RefreshResponse } from '@/types/auth'

export async function refreshSession() {
  return apiClient.post('auth/refresh').json<RefreshResponse>()
}

export async function login(username: string, password: string) {
  return apiClient.post('auth/login', { json: { username, password } }).json<LoginResponse>()
}
