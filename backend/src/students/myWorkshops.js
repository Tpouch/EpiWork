const { summarizeProgress } = require('./progressSummary');

class MyWorkshopsError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'MyWorkshopsError';
    this.status = status;
  }
}

const WORKSHOP_FIELDS = { id: true, title: true, description: true, icon: true };

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
            select: { progress: { where: { studentId }, select: { status: true } } },
          },
        },
      },
    },
  });
  return participations.map(({ joinedAt, workshop: { steps, ...workshop } }) => {
    const statuses = steps.map((step) => step.progress[0]?.status ?? 'locked');
    return { ...workshop, joinedAt, stepCount: steps.length, ...summarizeProgress(statuses) };
  });
}

// The step select is the whole point of the recap: question and checkpoint fields stay on the server.
async function getMyWorkshopRecap(prisma, workshopId, studentId) {
  const participation = await prisma.participation.findUnique({
    where: { studentId_workshopId: { studentId, workshopId } },
    select: {
      joinedAt: true,
      workshop: {
        select: {
          ...WORKSHOP_FIELDS,
          steps: { orderBy: { order: 'asc' }, select: { id: true, order: true, title: true, content: true } },
        },
      },
    },
  });
  if (!participation) throw new MyWorkshopsError(404, 'You have not joined this workshop.');
  return { ...participation.workshop, joinedAt: participation.joinedAt };
}

module.exports = { MyWorkshopsError, listMyWorkshops, getMyWorkshopRecap };
