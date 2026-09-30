// index.html applies the same rule before the first paint; keep the two in sync.
const STORAGE_KEY = 'epiwork_theme';

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentTheme() {
  return localStorage.getItem(STORAGE_KEY) ?? systemTheme();
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
