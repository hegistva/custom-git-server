import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TokensPage from '../../../src/pages/TokensPage';
import { tokensApi } from '../../../src/api/tokens';

vi.mock('../../../src/api/tokens', () => ({
  tokensApi: {
    list: vi.fn(),
    generate: vi.fn(),
    revoke: vi.fn(),
  },
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderTokensPage() {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings/tokens']}>
        <Routes>
          <Route path="/settings/tokens" element={<TokensPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TokensPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokensApi.list).mockResolvedValue([]);
  });

  it('renders a link back to the dashboard', async () => {
    renderTokensPage();
    const link = await screen.findByRole('link', { name: /back to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders token list from api', async () => {
    vi.mocked(tokensApi.list).mockResolvedValueOnce([
      {
        id: '1',
        label: 'My test pat',
        tokenPrefix: 'abcdefgh',
        createdAt: '2025-01-01T00:00:00.000Z',
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      },
    ]);

    renderTokensPage();

    expect(await screen.findByText('My test pat')).toBeInTheDocument();
    expect(screen.getByText(/abcdefgh/)).toBeInTheDocument();
  });

  it('add token form validates and submits', async () => {
    vi.mocked(tokensApi.generate).mockResolvedValueOnce({
      token: {
        id: '2',
        label: 'New PAT',
        tokenPrefix: '12345678',
        createdAt: '2025-01-01T00:00:00.000Z',
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: null,
      },
      rawToken: 'secret_raw_token_xyz',
    });

    renderTokensPage();

    const labelInput = await screen.findByLabelText(/token note \/ label/i);
    const submitButton = screen.getByRole('button', { name: /generate token/i });

    await user.click(submitButton);
    expect(await screen.findByText('Label is required')).toBeInTheDocument();

    await user.type(labelInput, 'New PAT');
    await user.click(submitButton);

    // Assert one-time reveal first to ensure React Query fully settled
    expect(await screen.findByText('secret_raw_token_xyz')).toBeInTheDocument();

    expect(tokensApi.generate).toHaveBeenCalledWith({ label: 'New PAT' }, expect.anything());

    // Dismiss
    await user.click(screen.getByRole('button', { name: /i have copied it/i }));
    expect(screen.queryByText('secret_raw_token_xyz')).not.toBeInTheDocument();
  });
});
