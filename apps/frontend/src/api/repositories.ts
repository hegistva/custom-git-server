import { apiClient } from '@/lib/api'
import type { Repository, CreateRepositoryPayload } from '../types/repositories'

export async function listRepositories() {
  return apiClient.get('repositories').json<Repository[]>()
}

export async function createRepository(payload: CreateRepositoryPayload) {
  return apiClient.post('repositories', { json: payload }).json<Repository>()
}

export async function getRepository(owner: string, name: string) {
  return apiClient.get(`repositories/${owner}/${name}`).json<Repository>()
}

export async function deleteRepository(owner: string, name: string) {
  return apiClient.delete(`repositories/${owner}/${name}`).json<void>()
}
