import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from '@/pages/LoginPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(
    (
      selector: (state: {
        accessToken: null;
        user: null;
        setTokens: () => void;
        setUser: () => void;
      }) => unknown,
    ) =>
      selector({
        accessToken: null,
        user: null,
        setTokens: vi.fn(),
        setUser: vi.fn(),
      }),
  ),
}));

import { login } from '@/api/auth';
const mockLogin = vi.mocked(login);

// ─── Render helpers ───────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderLoginPage(initialPath = '/login') {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading and form fields', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a link to the register page', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login API with form values on valid submission', async () => {
    mockLogin.mockResolvedValueOnce({
      accessToken: 'tok',
      user: { id: '1', username: 'alice', email: 'alice@example.com' },
    });
    renderLoginPage();

    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice', 'SecretPass1');
    });
  });

  it('shows an error message on 401 response', async () => {
    mockLogin.mockRejectedValueOnce({ status: 401, message: 'Invalid username or password' });
    renderLoginPage();

    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
  });

  it('disables the submit button while pending', async () => {
    // Never resolves — simulates loading state
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLoginPage();

    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });
});
