// Same rule as the student StepPage: every step done, or only the last checkpoint awaiting review.
function summarizeProgress(statuses) {
  const doneCount = statuses.filter((status) => status === 'done').length;
  if (statuses.length === 0) return { doneCount, finished: false };
  const last = statuses.at(-1);
  const restDone = statuses.slice(0, -1).every((status) => status === 'done');
  return { doneCount, finished: restDone && (last === 'done' || last === 'pending_review') };
}

module.exports = { summarizeProgress };
