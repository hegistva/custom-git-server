import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { useAuthContext } from '@/components/auth/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthStore } from '@/store/auth';

const authenticatedLinks = [
  { label: 'Dashboard', path: '/dashboard', matchPrefixes: ['/dashboard', '/repositories'] },
  { label: 'SSH Keys', path: '/settings/ssh-keys', matchPrefixes: ['/settings/ssh-keys'] },
  { label: 'Tokens', path: '/settings/tokens', matchPrefixes: ['/settings/tokens'] },
];

const publicLinks = [
  { label: 'Home', path: '/', matchPrefixes: ['/'] },
  { label: 'Sign In', path: '/login', matchPrefixes: ['/login'] },
  { label: 'Register', path: '/register', matchPrefixes: ['/register'] },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated } = useAuthContext();
  const user = useAuthStore((state) => state.user);

  const navLinks = isAuthenticated ? authenticatedLinks : publicLinks;

  const isActivePath = (matchPrefixes: string[]) => {
    return matchPrefixes.some((prefix) => {
      if (prefix === '/') {
        return location.pathname === '/';
      }

      return location.pathname === prefix || location.pathname.startsWith(prefix + '/');
    });
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-40">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
        <RouterLink
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
          </svg>
          <span className="hidden sm:inline">Git Server</span>
        </RouterLink>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <RouterLink
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActivePath(link.matchPrefixes)
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {link.label}
            </RouterLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <span className="hidden lg:inline text-sm text-gray-600 dark:text-gray-400">
              Signed in as{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
            </span>
          ) : null}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 18C8.68 18 6 15.32 6 12s2.68-6 6-6 6 2.68 6 6-2.68 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zM13 2h-2v3h2V2zm0 15h-2v3h2v-3zM5 11H2v2h3v-2zm15 0h-3v2h3v-2zM6.3 5.7L3.9 3.3 1.5 5.7l2.4 2.4 2.4-2.4zm12.4 12.4l-2.4-2.4-2.4 2.4 2.4 2.4 2.4-2.4zM19 6.3l2.4-2.4-2.4-2.4-2.4 2.4 2.4 2.4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 1 1 .12-11.5 1 1 0 1 0 1.41-1.41A10 10 0 0 0 12 2h-.5A9.5 9.5 0 0 0 8 21.54 9.38 9.38 0 0 0 12 22h.5a9.48 9.48 0 0 0 8.11-4.3 1 1 0 0 0-.36-1.4zm-9.5 6.6A7.5 7.5 0 0 1 7.1 5.16a8 8 0 0 0 9.75 9.75A7.5 7.5 0 0 1 12.14 19.6z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <RouterLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActivePath(link.matchPrefixes)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {link.label}
              </RouterLink>
            ))}
            {isAuthenticated && user ? (
              <p className="px-3 pt-2 text-sm text-gray-600 dark:text-gray-400">
                Signed in as {user.username}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};

Navbar.displayName = 'Navbar';
