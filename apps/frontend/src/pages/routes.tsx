import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthContext } from '@/components/auth/AuthContext'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const SshKeysPage = lazy(() => import('@/pages/SshKeysPage'))
const TokensPage = lazy(() => import('@/pages/TokensPage'))
const NewRepositoryPage = lazy(() => import('@/pages/NewRepositoryPage'))
const RepositoryPage = lazy(() => import('@/pages/RepositoryPage'))

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p>Loading page…</p>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings/ssh-keys" element={<SshKeysPage />} />
            <Route path="/settings/tokens" element={<TokensPage />} />
            <Route path="/repositories/new" element={<NewRepositoryPage />} />
            <Route path="/repositories/:name" element={<RepositoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
