import { apiClient } from '@/lib/api'

export interface TokenItem {
  id: string
  label: string
  tokenPrefix: string
  createdAt: string
  revokedAt: string | null
}

export async function listTokens() {
  return apiClient.get('tokens').json<TokenItem[]>()
}
