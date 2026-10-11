const { summarizeProgress } = require('./progressSummary');
const { participantStep } = require('../progress/stepVisibility');

class MyWorkshopsError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'MyWorkshopsError';
    this.status = status;
  }
}

const WORKSHOP_FIELDS = { id: true, title: true, description: true, icon: true };
const FINISHING_EVENTS = ['step_done', 'checkpoint_submitted'];

// A new session wipes the progress rows, but the event log still remembers a finished workshop.
function cardProgress(steps) {
  const summary = summarizeProgress(steps.map((step) => step.progress[0]?.status ?? 'locked'));
  const finishedBefore = steps.at(-1)?.sessionEvents.length > 0;
  if (summary.finished || !finishedBefore) return summary;
  return { doneCount: steps.length, finished: true };
}

// Read-only on purpose: unlike ensureProgress, it never creates StepProgress rows.
async function listMyWorkshops(prisma, studentId) {
  const participations = await prisma.participation.findMany({
    where: { studentId },
    orderBy: { joinedAt: 'desc' },
    select: {
      joinedAt: true,
      workshop: {
        select: {
          ...WORKSHOP_FIELDS,
          steps: {
            orderBy: { order: 'asc' },
            select: {
              progress: { where: { studentId }, select: { status: true } },
              sessionEvents: { where: { studentId, type: { in: FINISHING_EVENTS } }, select: { id: true }, take: 1 },
            },
          },
        },
      },
    },
  });
  return participations.map(({ joinedAt, workshop: { steps, ...workshop } }) => ({
    ...workshop,
    joinedAt,
    stepCount: steps.length,
    ...cardProgress(steps),
  }));
}

const RECAP_STEP_FIELDS = {
  id: true,
  order: true,
  title: true,
  content: true,
  hint: true,
  solution: true,
  section: { select: { id: true, title: true, order: true } },
};

// Question and checkpoint fields stay on the server; solutions only once this participant's session is over.
async function getMyWorkshopRecap(prisma, workshopId, studentId) {
  const participation = await prisma.participation.findUnique({
    where: { studentId_workshopId: { studentId, workshopId } },
    select: {
      joinedAt: true,
      workshop: {
        select: {
          ...WORKSHOP_FIELDS,
          isActive: true,
          launchedAt: true,
          steps: { orderBy: { order: 'asc' }, select: RECAP_STEP_FIELDS },
        },
      },
    },
  });
  if (!participation) throw new MyWorkshopsError(404, 'You have not joined this workshop.');
  const { isActive, launchedAt, steps, ...workshop } = participation.workshop;
  const sessionOver = !isActive || participation.joinedAt < launchedAt;
  return {
    ...workshop,
    joinedAt: participation.joinedAt,
    steps: steps.map((step) => participantStep(step, { sessionOver })),
  };
}

module.exports = { MyWorkshopsError, listMyWorkshops, getMyWorkshopRecap };
