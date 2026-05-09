import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

export function useTheme() {
  const { config } = useConfig();
  const theme = config?.appearance?.theme || 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  return { theme };
}

