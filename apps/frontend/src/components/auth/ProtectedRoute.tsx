import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthContext } from '@/components/auth/AuthContext'

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthBootstrapped, isAuthenticated } = useAuthContext()

  if (!isAuthBootstrapped) {
    return <p>Checking session…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
