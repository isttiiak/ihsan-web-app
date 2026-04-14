import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('ihsan_theme') || 'ihsan';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return null;
}
