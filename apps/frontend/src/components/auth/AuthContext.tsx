import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { getMe, refreshSession } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

interface AuthContextValue {
  isAuthBootstrapped: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setTokens = useAuthStore((state) => state.setTokens)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const setUser = useAuthStore((state) => state.setUser)
  const [isAuthBootstrapped, setIsAuthBootstrapped] = useState(false)

  const bootstrapAuth = useCallback(async () => {
    try {
      const response = await refreshSession()
      setTokens(response.accessToken)
      const user = await getMe()
      setUser(user)
    } catch {
      clearAuth()
    } finally {
      setIsAuthBootstrapped(true)
    }
  }, [clearAuth, setTokens, setUser])

  useEffect(() => {
    void bootstrapAuth()
  }, [bootstrapAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthBootstrapped,
      isAuthenticated: Boolean(accessToken),
    }),
    [accessToken, isAuthBootstrapped],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }

  return context
}
