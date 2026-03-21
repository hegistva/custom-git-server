import { apiClient } from '@/lib/api'

export interface RepositoryItem {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  createdAt: string
}

export async function listRepositories() {
  return apiClient.get('repositories').json<RepositoryItem[]>()
}
