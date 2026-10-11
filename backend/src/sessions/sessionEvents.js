// An open event waits for an admin; this later event type closes it.
const CLOSED_BY = {
  help_requested: 'help_resolved',
  checkpoint_submitted: 'step_done',
  qcm_failed: 'qcm_resolved',
};

// createdAt is set explicitly (like Participation.joinedAt) so it compares
// exactly against workshop.launchedAt.
function recordEvent(prisma, { workshopId, studentId, stepId = null, type, answer = null }) {
  return prisma.sessionEvent.create({
    data: { workshopId, studentId, stepId, type, answer, createdAt: new Date() },
  });
}

function findCloser(events, index) {
  const event = events[index];
  const closerType = CLOSED_BY[event.type];
  return events
    .slice(index + 1)
    .find((later) => later.type === closerType && later.studentId === event.studentId && later.stepId === event.stepId);
}

// Expects events oldest first.
function markOpenEvents(events) {
  return events.map((event, index) => {
    if (!CLOSED_BY[event.type]) return { ...event, open: false, closedAt: null };
    const closer = findCloser(events, index);
    return { ...event, open: !closer, closedAt: closer ? closer.createdAt : null };
  });
}

module.exports = { recordEvent, markOpenEvents };
