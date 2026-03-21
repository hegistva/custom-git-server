import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import RegisterPage from '@/pages/RegisterPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/api/auth', () => ({
  register: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn((selector: (state: { accessToken: null; user: null; setTokens: () => void; setUser: () => void }) => unknown) =>
    selector({
      accessToken: null,
      user: null,
      setTokens: vi.fn(),
      setUser: vi.fn(),
    }),
  ),
}))

import { register as registerApi } from '@/api/auth'
const mockRegister = vi.mocked(registerApi)

// ─── Render helpers ───────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderRegisterPage() {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the heading and all form fields', () => {
    renderRegisterPage()
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows a link to the login page', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    renderRegisterPage()
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/username must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/email must be valid/i)).toBeInTheDocument()
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows an error when passwords do not match', async () => {
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await user.type(screen.getByLabelText('Confirm password'), 'DifferentPass1!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('calls register API with form values on valid submission', async () => {
    mockRegister.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '1', username: 'newuser', email: 'new@example.com' } })
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await user.type(screen.getByLabelText('Confirm password'), 'SecurePass1!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'SecurePass1!',
      })
    })
  })

  it('shows a field error when username is already taken (409)', async () => {
    mockRegister.mockRejectedValueOnce({ status: 409, message: 'username already in use', field: 'username' })
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'taken')
    await user.type(screen.getByLabelText('Email'), 'free@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await user.type(screen.getByLabelText('Confirm password'), 'SecurePass1!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/username is already taken/i)).toBeInTheDocument()
  })

  it('shows a field error when email is already registered (409)', async () => {
    mockRegister.mockRejectedValueOnce({ status: 409, message: 'email already in use', field: 'email' })
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'freshuser')
    await user.type(screen.getByLabelText('Email'), 'dupe@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await user.type(screen.getByLabelText('Confirm password'), 'SecurePass1!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/email is already registered/i)).toBeInTheDocument()
  })

  it('disables the submit button while pending', async () => {
    mockRegister.mockReturnValue(new Promise(() => {}))
    renderRegisterPage()

    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await user.type(screen.getByLabelText('Confirm password'), 'SecurePass1!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })
  })
})
