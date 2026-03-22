export interface RepoOwner {
  id: string
  username: string
}

export interface Repository {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  createdAt: string
  owner?: RepoOwner
}

export interface CreateRepositoryPayload {
  name: string
  description?: string | null
  isPrivate?: boolean
}
