function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function stepsSummary(workshop) {
  const checkpoints = workshop.steps.filter((step) => step.isCheckpoint).length;
  return `${plural(workshop.steps.length, 'step')} · ${plural(checkpoints, 'checkpoint')}`;
}

export function historySummary(workshop) {
  if (workshop.isActive) return 'live now';
  if (!workshop.launchedAt) return 'not run yet';
  return `${plural(workshop._count.participations, 'student')} all-time`;
}
