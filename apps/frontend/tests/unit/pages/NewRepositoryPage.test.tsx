import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NewRepositoryPage from '@/pages/NewRepositoryPage';

vi.mock('@/api/repositories', () => ({
  createRepository: vi.fn(),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
    }),
  ),
}));

import { createRepository } from '@/api/repositories';
const mockCreateRepository = vi.mocked(createRepository);

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function renderNewRepositoryPage() {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/repositories/new']}>
        <Routes>
          <Route path="/repositories/new" element={<NewRepositoryPage />} />
          <Route path="/repositories/:name" element={<p>RepoPage</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NewRepositoryPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create repository form and heading', () => {
    renderNewRepositoryPage();
    expect(screen.getByRole('heading', { name: /Create a new repository/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Repository name \*/i)).toBeInTheDocument();
  });

  it('shows validation errors for invalid name', async () => {
    renderNewRepositoryPage();
    
    const submitBtn = screen.getByRole('button', { name: /Create repository/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Repository name is required/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Repository name \*/i);
    await user.type(nameInput, 'inv@lid name!');
    await user.click(submitBtn);
    
    expect(await screen.findByText(/Invalid name format/i)).toBeInTheDocument();
  });

  it('submits successfully with valid data', async () => {
    mockCreateRepository.mockResolvedValueOnce({
      id: '1', name: 'my-repo', description: null, isPrivate: true, createdAt: new Date().toISOString()
    });

    renderNewRepositoryPage();
    
    const nameInput = screen.getByLabelText(/Repository name \*/i);
    await user.type(nameInput, 'my-repo');

    const submitBtn = screen.getByRole('button', { name: /Create repository/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateRepository.mock.calls[0][0]).toEqual({
        name: 'my-repo',
        description: '',
        isPrivate: true,
      });
    });

    expect(await screen.findByText('RepoPage')).toBeInTheDocument();
  });
});
