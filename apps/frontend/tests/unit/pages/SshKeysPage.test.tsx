import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SshKeysPage from '../../../src/pages/SshKeysPage';
import { sshKeysApi } from '../../../src/api/ssh-keys';

vi.mock('../../../src/api/ssh-keys', () => ({
  sshKeysApi: {
    list: vi.fn(),
    add: vi.fn(),
    delete: vi.fn(),
  },
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderSshKeysPage() {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings/ssh-keys']}>
        <Routes>
          <Route path="/settings/ssh-keys" element={<SshKeysPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SshKeysPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sshKeysApi.list).mockResolvedValue([]);
  });

  it('renders a link back to the dashboard', async () => {
    renderSshKeysPage();
    const link = await screen.findByRole('link', { name: /back to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders key list from api', async () => {
    vi.mocked(sshKeysApi.list).mockResolvedValueOnce([
      {
        id: '1',
        label: 'My test key',
        fingerprint: 'SHA256:abcd',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    renderSshKeysPage();

    expect(await screen.findByText('My test key')).toBeInTheDocument();
    expect(screen.getByText('SHA256:abcd')).toBeInTheDocument();
  });

  it('add key form validates and submits', async () => {
    vi.mocked(sshKeysApi.add).mockResolvedValueOnce({
      id: '2',
      label: 'New key',
      fingerprint: 'SHA256:xyz',
      createdAt: '2025-01-01T00:00:00.000Z',
    });

    renderSshKeysPage();

    const labelInput = await screen.findByLabelText(/title \/ label/i);
    const keyInput = screen.getByLabelText(/key/i);
    const submitButton = screen.getByRole('button', { name: /add key/i });

    await user.click(submitButton);
    expect(await screen.findByText('Label is required')).toBeInTheDocument();
    expect(screen.getByText('Public key is required')).toBeInTheDocument();

    await user.type(labelInput, 'New key');
    await user.type(
      keyInput,
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGo2v2d+lH2mR1mG5F/H5z6N8F4b5W5C9+0T0g/O+H/T',
    );

    await user.click(submitButton);

    await waitFor(() => {
      expect(sshKeysApi.add).toHaveBeenCalledWith({
        label: 'New key',
        publicKey:
          'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGo2v2d+lH2mR1mG5F/H5z6N8F4b5W5C9+0T0g/O+H/T',
      });
    });
  });
});
