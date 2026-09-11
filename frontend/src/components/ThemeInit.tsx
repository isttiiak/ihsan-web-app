import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('bustandeen_theme') || 'bustandeen';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return null;
}
