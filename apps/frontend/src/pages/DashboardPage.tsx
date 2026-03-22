import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { logout } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const user = useAuthStore((state) => state.user)

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth()
      navigate('/login', { replace: true })
    },
  })

  return (
    <main>
      <nav style={{ marginBottom: '2rem' }}>
        <Link to="/settings/ssh-keys">Manage SSH Keys</Link>
      </nav>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
      <p>Repository list appears here in Phase 7.</p>
      <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
        {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
      </button>
    </main>
  )
}
