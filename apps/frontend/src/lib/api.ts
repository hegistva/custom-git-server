import ky, {
  HTTPError,
  type BeforeRequestHook,
  type BeforeRetryState,
  type KyInstance,
} from 'ky'

import { useAuthStore } from '@/store/auth'
import type { ApiError } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost/api'

const refreshClient = ky.create({
  prefixUrl: API_BASE_URL,
  credentials: 'include',
  throwHttpErrors: false,
  retry: 0,
})

const beforeRequestHook: BeforeRequestHook = (request) => {
  const accessToken = useAuthStore.getState().accessToken

  if (accessToken) {
    request.headers.set('Authorization', `Bearer ${accessToken}`)
  }
}

const refreshTokenRequest = async () => {
  const response = await refreshClient.post('auth/refresh')

  if (!response.ok) {
    useAuthStore.getState().clearAuth()
    return null
  }

  const payload = (await response.json()) as { accessToken: string }
  useAuthStore.getState().setTokens(payload.accessToken)

  return payload.accessToken
}

const shouldRetryOnce = (state: BeforeRetryState) => {
  if (!(state.error instanceof HTTPError) || state.error.response.status !== 401) {
    return false
  }

  if (state.request.url.includes('/auth/refresh')) {
    return false
  }

  return Number(state.retryCount) === 1
}

export const apiClient: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [beforeRequestHook],
    beforeRetry: [
      async (state) => {
        if (!shouldRetryOnce(state)) {
          return
        }

        const refreshedToken = await refreshTokenRequest()

        if (!refreshedToken) {
          return
        }

        state.request.headers.set('Authorization', `Bearer ${refreshedToken}`)
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.ok) {
          return response
        }

        let errorMessage = response.statusText
        let errorField: string | undefined

        try {
          const payload = (await response.clone().json()) as {
            message?: string
            field?: string
          }

          if (payload.message) {
            errorMessage = payload.message
          }

          if (payload.field) {
            errorField = payload.field
          }
        } catch {
          // no-op for non-JSON error bodies
        }

        throw {
          status: response.status,
          message: errorMessage,
          field: errorField,
        } satisfies ApiError
      },
    ],
  },
  retry: {
    limit: 1,
    methods: ['get', 'post', 'put', 'patch', 'delete'],
    statusCodes: [401],
  },
})
