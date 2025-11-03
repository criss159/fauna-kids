import { useContext } from 'react';
import { ThemeContext } from './ThemeProviderContext';

export function useTheme() {
  return useContext(ThemeContext);
}
