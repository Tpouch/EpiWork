// Every preset keeps dark ink text readable (contrast >= 5.8:1). The backend
// only stores the name, so the exact colors can change here without a migration.
export const ACCENTS = [
  { name: 'lime', label: 'Lime', hex: '#b7ff4c' },
  { name: 'yellow', label: 'Yellow', hex: '#ffd23f' },
  { name: 'orange', label: 'Orange', hex: '#ff5f3a' },
  { name: 'pink', label: 'Pink', hex: '#ff1ef7' },
  { name: 'violet', label: 'Violet', hex: '#b18cff' },
  { name: 'cyan', label: 'Cyan', hex: '#29d9ff' },
  { name: 'green', label: 'Green', hex: '#00ff97' },
];

export function applyAccent(name) {
  const accent = ACCENTS.find((a) => a.name === name) ?? ACCENTS[0];
  document.documentElement.style.setProperty('--color-brutal-accent', accent.hex);
}
