function inWindow(date, launchedAt, endedAt) {
  return date >= launchedAt && (!endedAt || date <= endedAt);
}

function joinedStudents(events, launchedAt, endedAt) {
  const students = new Map();
  for (const event of events) {
    if (event.type !== 'joined' || !inWindow(event.createdAt, launchedAt, endedAt)) continue;
    if (!students.has(event.studentId)) students.set(event.studentId, event.student);
  }
  return [...students.values()];
}

// Joining a new run starts the workshop over, so only steps done inside this run count.
function reachedStep(steps, events, studentId, launchedAt, endedAt) {
  if (steps.length === 0) return { finished: false, number: null, title: null };
  const positions = new Map(steps.map((step, index) => [step.id, index]));
  let highest = -1;
  for (const event of events) {
    if (event.type !== 'step_done' || event.studentId !== studentId) continue;
    if (!inWindow(event.createdAt, launchedAt, endedAt)) continue;
    highest = Math.max(highest, positions.get(event.stepId) ?? -1);
  }
  const last = steps.length - 1;
  if (highest === last) return { finished: true, number: last + 1, title: steps[last].title };
  return { finished: false, number: highest + 2, title: steps[highest + 1].title };
}

function averageOf(feedback) {
  if (feedback.length === 0) return null;
  const total = feedback.reduce((sum, item) => sum + item.rating, 0);
  return Math.round((total / feedback.length) * 10) / 10;
}

function summarizeRun({ steps, events, feedback, launchedAt, endedAt }) {
  const ratings = new Map(feedback.map((item) => [item.studentId, item.rating]));
  const students = joinedStudents(events, launchedAt, endedAt).map((student) => ({
    id: student.id,
    name: student.name,
    reached: reachedStep(steps, events, student.id, launchedAt, endedAt),
    rating: ratings.get(student.id) ?? null,
  }));
  return {
    students,
    finishedCount: students.filter((student) => student.reached.finished).length,
    ratingCount: feedback.length,
    averageRating: averageOf(feedback),
  };
}

module.exports = { summarizeRun };
