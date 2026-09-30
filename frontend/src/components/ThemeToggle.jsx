import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { currentTheme, setTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(currentTheme);
  const isDark = theme === 'dark';

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  }

  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className="flex size-9 cursor-pointer items-center justify-center border-2 border-brutal-line bg-brutal-surface shadow-brutal-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
