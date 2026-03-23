import { create } from 'zustand';

import type { AuthUser } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setTokens: (accessToken: string) => {
    set({ accessToken });
  },
  setUser: (user: AuthUser | null) => {
    set({ user });
  },
  clearAuth: () => {
    set({ accessToken: null, user: null });
  },
}));
