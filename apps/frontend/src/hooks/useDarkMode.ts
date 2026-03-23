import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  const storedTheme = window.localStorage.getItem('theme-preference');

  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'auto') {
    return storedTheme;
  }

  return 'auto';
};

const getSystemPrefersDark = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const resolveDarkMode = (theme: Theme) => {
  return theme === 'dark' || (theme === 'auto' && getSystemPrefersDark());
};

/**
 * Hook to manage dark mode theme preference.
 * Persists user preference to localStorage with key 'theme-preference'.
 * Falls back to system preference (prefers-color-scheme) if auto.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => resolveDarkMode(getStoredTheme()));

  const applyTheme = (dark: boolean) => {
    const htmlElement = document.documentElement;
    if (dark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme-preference', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const setTheme = (theme: Theme) => {
    const shouldBeDark = resolveDarkMode(theme);

    setIsDarkMode(shouldBeDark);
    localStorage.setItem('theme-preference', theme);
  };

  return {
    isDarkMode,
    toggleDarkMode,
    setTheme,
    isHydrated: true,
  };
}
