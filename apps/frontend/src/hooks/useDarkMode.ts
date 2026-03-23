import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

/**
 * Hook to manage dark mode theme preference.
 * Persists user preference to localStorage with key 'theme-preference'.
 * Falls back to system preference (prefers-color-scheme) if auto.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme-preference') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let shouldBeDark = false;

    if (storedTheme === 'dark') {
      shouldBeDark = true;
    } else if (storedTheme === 'light') {
      shouldBeDark = false;
    } else {
      // Auto: use system preference
      shouldBeDark = prefersDark;
    }

    setIsDarkMode(shouldBeDark);
    applyTheme(shouldBeDark);
    setIsHydrated(true);
  }, []);

  const applyTheme = (dark: boolean) => {
    const htmlElement = document.documentElement;
    if (dark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      applyTheme(newValue);
      localStorage.setItem('theme-preference', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const setTheme = (theme: Theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (theme === 'auto' && prefersDark);

    setIsDarkMode(shouldBeDark);
    applyTheme(shouldBeDark);
    localStorage.setItem('theme-preference', theme);
  };

  return {
    isDarkMode,
    toggleDarkMode,
    setTheme,
    isHydrated,
  };
}
