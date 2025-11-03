import { createContext } from 'react';

export const ThemeContext = createContext({
  themeId: 'ocean',
  setThemeId: () => {},
  themes: [],
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
});
