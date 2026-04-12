import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('bct0902_theme');
    if (savedTheme) {
      return savedTheme;
    }
    return 'dark'; // Ưu tiên giao diện tối mặc định
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('bct0902_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
