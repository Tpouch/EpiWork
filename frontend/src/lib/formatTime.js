export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatRunWindow(run) {
  const end = run.endedAt ? formatTime(run.endedAt) : 'still live';
  return `${formatDay(run.launchedAt)} · ${formatTime(run.launchedAt)} → ${end}`;
}

export function formatShortDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
