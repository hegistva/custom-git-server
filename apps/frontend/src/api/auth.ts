import { apiClient } from '@/lib/api';
import type { AuthUser, LoginResponse, RefreshResponse } from '@/types/auth';
import type { RegisterInput } from '@/lib/schemas/auth';

export async function refreshSession(): Promise<RefreshResponse> {
  return apiClient.post('auth/refresh').json<RefreshResponse>();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiClient.post('auth/login', { json: { username, password } }).json<LoginResponse>();
}

export async function register(
  data: Omit<RegisterInput, 'confirmPassword'>,
): Promise<LoginResponse> {
  return apiClient.post('auth/register', { json: data }).json<LoginResponse>();
}

export async function logout(): Promise<void> {
  await apiClient.post('auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  return apiClient.get('auth/me').json<AuthUser>();
}
