'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Проверяем сохранённую тему при загрузке
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDarkMode = saved === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition bg-white/20 hover:bg-white/30 text-white"
      aria-label="Переключить тему"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}