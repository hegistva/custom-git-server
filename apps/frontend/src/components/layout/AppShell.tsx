import React from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Navbar } from './Navbar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isHydrated } = useDarkMode();

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      <footer className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-8">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Git Server. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

AppShell.displayName = 'AppShell';
