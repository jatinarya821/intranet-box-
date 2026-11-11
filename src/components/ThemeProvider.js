'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    setTheme((current) => {
      // Preserve a tap that happens before this effect runs on a slower device.
      const next = current === 'dark' && (stored === 'light' || stored === 'dark')
        ? stored
        : current;
      applyTheme(next);
      return next;
    });
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('theme', next);
      applyTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
