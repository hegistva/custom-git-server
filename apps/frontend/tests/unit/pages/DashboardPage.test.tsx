import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import DashboardPage from '@/pages/DashboardPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/api/auth', () => ({
  logout: vi.fn(),
}))

const mockClearAuth = vi.fn()
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      accessToken: 'dummy_token',
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      setTokens: vi.fn(),
      setUser: vi.fn(),
      clearAuth: mockClearAuth,
    }),
  ),
}))

import { logout } from '@/api/auth'
const mockLogout = vi.mocked(logout)

// ─── Render helpers ───────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderDashboardPage() {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<div>LoginPage</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dashboard with personalized welcome message', () => {
    renderDashboardPage()
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/welcome, testuser!/i)).toBeInTheDocument()
  })

  it('renders a log out button', () => {
    renderDashboardPage()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('calls the logout API, clears auth state, and redirects when logged out', async () => {
    mockLogout.mockResolvedValueOnce(undefined)
    renderDashboardPage()

    await user.click(screen.getByRole('button', { name: /log out/i }))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledOnce()
    })

    expect(mockClearAuth).toHaveBeenCalledOnce()
    // By checking if the LoginPage fallback route is rendered, we ensure the redirect took place.
    expect(await screen.findByText('LoginPage')).toBeInTheDocument()
  })

  it('disables the log out button while the request is pending', async () => {
    mockLogout.mockReturnValue(new Promise(() => {}))
    renderDashboardPage()

    await user.click(screen.getByRole('button', { name: /log out/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging out/i })).toBeDisabled()
    })
  })
})
