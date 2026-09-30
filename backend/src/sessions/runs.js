const { summarizeRun } = require('./runSummary');

const WORKSHOP_FIELDS = { id: true, title: true, icon: true };

async function loadRunData(prisma, run) {
  const steps = await prisma.step.findMany({
    where: { workshopId: run.workshopId },
    orderBy: { order: 'asc' },
    select: { id: true, title: true },
  });
  const events = await prisma.sessionEvent.findMany({
    where: {
      workshopId: run.workshopId,
      type: { in: ['joined', 'step_done'] },
      ...(run.endedAt ? { createdAt: { lte: run.endedAt } } : {}),
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { type: true, createdAt: true, studentId: true, stepId: true, student: { select: { id: true, name: true } } },
  });
  return { steps, events };
}

async function summarize(prisma, run) {
  const { steps, events } = await loadRunData(prisma, run);
  const summary = summarizeRun({
    steps,
    events,
    feedback: run.feedback,
    launchedAt: run.launchedAt,
    endedAt: run.endedAt,
  });
  return { steps, summary };
}

async function listRuns(prisma) {
  const runs = await prisma.workshopRun.findMany({
    orderBy: { launchedAt: 'desc' },
    include: { workshop: { select: WORKSHOP_FIELDS }, feedback: { select: { studentId: true, rating: true } } },
  });
  const result = [];
  for (const run of runs) {
    const { summary } = await summarize(prisma, run);
    result.push({
      id: run.id,
      launchedAt: run.launchedAt,
      endedAt: run.endedAt,
      workshop: run.workshop,
      studentCount: summary.students.length,
      finishedCount: summary.finishedCount,
      ratingCount: summary.ratingCount,
      averageRating: summary.averageRating,
    });
  }
  return result;
}

async function getRun(prisma, runId) {
  const run = await prisma.workshopRun.findUnique({
    where: { id: runId },
    include: {
      workshop: { select: WORKSHOP_FIELDS },
      feedback: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentId: true,
          rating: true,
          comment: true,
          createdAt: true,
          student: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!run) return null;
  const { steps, summary } = await summarize(prisma, run);
  return {
    id: run.id,
    launchedAt: run.launchedAt,
    endedAt: run.endedAt,
    workshop: run.workshop,
    stepCount: steps.length,
    finishedCount: summary.finishedCount,
    ratingCount: summary.ratingCount,
    averageRating: summary.averageRating,
    students: summary.students,
    feedback: run.feedback.map(({ id, student, rating, comment, createdAt }) => ({ id, student, rating, comment, createdAt })),
  };
}

module.exports = { listRuns, getRun };
