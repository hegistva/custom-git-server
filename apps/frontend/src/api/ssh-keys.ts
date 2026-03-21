import { apiClient } from '@/lib/api'

export interface SshKeyItem {
  id: string
  label: string
  fingerprint: string
  createdAt: string
}

export async function listSshKeys() {
  return apiClient.get('ssh-keys').json<SshKeyItem[]>()
}
