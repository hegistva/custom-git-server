import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import { QueryClientProvider } from '@tanstack/react-query';

import { App } from '@/App';
import { AuthProvider } from '@/components/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
