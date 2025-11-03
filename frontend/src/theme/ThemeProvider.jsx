import React, { useEffect, useMemo, useState } from 'react';
import { THEMES, DEFAULT_THEME_ID } from './themes';
import { ThemeContext } from './ThemeProviderContext';

export default function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME_ID;
    return localStorage.getItem('fauna_theme') || DEFAULT_THEME_ID;
  });

  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('fauna_mode') || 'light';
  });

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Aplicar variables de color
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('fauna_theme', theme.id);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    localStorage.setItem('fauna_mode', mode);
  }, [mode]);

  const value = useMemo(() => ({
    themeId,
    setThemeId,
    themes: THEMES,
    mode,
    setMode,
    toggleMode: () => setMode(m => (m === 'light' ? 'dark' : 'light')),
  }), [themeId, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
