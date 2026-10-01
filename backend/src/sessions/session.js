const { ensureProgress } = require('../progress/stateMachine');
const { generateJoinCode, normalizeJoinCode } = require('./joinIdentity');
const { recordEvent, markOpenEvents } = require('./sessionEvents');

class SessionError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'SessionError';
    this.status = status;
  }
}

function currentParticipantsWhere(workshop) {
  return { workshopId: workshop.id, joinedAt: { gte: workshop.launchedAt } };
}

async function summarize(prisma, workshop) {
  const participantCount = await prisma.participation.count({ where: currentParticipantsWhere(workshop) });
  return {
    workshopId: workshop.id,
    title: workshop.title,
    icon: workshop.icon,
    launchedAt: workshop.launchedAt,
    participantCount,
  };
}

async function getSessionOverview(prisma) {
  const active = await prisma.workshop.findFirst({ where: { isActive: true } });
  const last = await prisma.workshop.findFirst({
    where: { isActive: false, launchedAt: { not: null } },
    orderBy: { launchedAt: 'desc' },
  });
  return {
    active: active ? { ...(await summarize(prisma, active)), joinCode: active.joinCode } : null,
    last: last ? await summarize(prisma, last) : null,
  };
}

async function findWorkshopOrThrow(prisma, workshopId) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: { _count: { select: { steps: true } } },
  });
  if (!workshop) throw new SessionError(404, 'Workshop not found.');
  return workshop;
}

async function launchWorkshop(prisma, workshopId, generateCode = generateJoinCode) {
  const workshop = await findWorkshopOrThrow(prisma, workshopId);
  if (workshop._count.steps === 0) {
    throw new SessionError(409, 'Add at least one step before launching this workshop.');
  }
  if (!workshop.isActive) {
    const launchedAt = new Date();
    await prisma.$transaction([
      // Launching ends whatever was live, so its run ends now too.
      prisma.workshopRun.updateMany({ where: { endedAt: null }, data: { endedAt: launchedAt } }),
      prisma.workshop.updateMany({ where: { isActive: true }, data: { isActive: false, joinCode: null } }),
      prisma.workshop.update({
        where: { id: workshopId },
        data: { isActive: true, joinCode: generateCode(), launchedAt },
      }),
      prisma.workshopRun.create({ data: { workshopId, launchedAt } }),
    ]);
  }
  const { active } = await getSessionOverview(prisma);
  return active;
}

async function endWorkshop(prisma, workshopId) {
  await findWorkshopOrThrow(prisma, workshopId);
  await prisma.$transaction([
    prisma.workshop.update({ where: { id: workshopId }, data: { isActive: false, joinCode: null } }),
    prisma.workshopRun.updateMany({ where: { workshopId, endedAt: null }, data: { endedAt: new Date() } }),
  ]);
}

async function findActiveByCode(prisma, code) {
  const joinCode = normalizeJoinCode(code);
  const workshop = joinCode ? await prisma.workshop.findFirst({ where: { isActive: true, joinCode } }) : null;
  if (!workshop) throw new SessionError(404, 'No active workshop with that code.');
  return workshop;
}

function assertStudent(student) {
  if (student.role !== 'student') throw new SessionError(403, 'Only students can join a workshop.');
}

async function checkJoinCode(prisma, { code, student }) {
  assertStudent(student);
  const workshop = await findActiveByCode(prisma, code);
  return { workshopId: workshop.id, title: workshop.title, icon: workshop.icon };
}

// A new session starts the workshop over, so nothing from an earlier run waits for the admin.
function newJoinWrites(prisma, workshopId, studentId) {
  return [
    prisma.stepProgress.deleteMany({ where: { studentId, step: { workshopId } } }),
    recordEvent(prisma, { workshopId, studentId, type: 'joined' }),
  ];
}

async function joinActiveWorkshop(prisma, { code, student }) {
  assertStudent(student);
  const workshop = await findActiveByCode(prisma, code);
  const key = { studentId_workshopId: { studentId: student.id, workshopId: workshop.id } };
  const existing = await prisma.participation.findUnique({ where: key });
  // Re-entering the code during the same session is not a new join.
  const alreadyJoined = Boolean(existing && existing.joinedAt >= workshop.launchedAt);
  // joinedAt is set explicitly (not left to @default(now())) so it has the same
  // precision as launchedAt and the ">= launchedAt" comparison stays exact.
  const joinedAt = new Date();
  await prisma.$transaction([
    prisma.participation.upsert({
      where: key,
      create: { studentId: student.id, workshopId: workshop.id, joinedAt },
      update: { joinedAt },
    }),
    ...(alreadyJoined ? [] : newJoinWrites(prisma, workshop.id, student.id)),
  ]);
  return { workshopId: workshop.id };
}

async function activeSessionProgress(prisma) {
  const workshop = await prisma.workshop.findFirst({
    where: { isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  if (!workshop) return null;
  const participants = await prisma.participation.findMany({
    where: currentParticipantsWhere(workshop),
    include: { student: true },
    orderBy: { joinedAt: 'asc' },
  });
  const students = [];
  for (const participant of participants) {
    students.push({
      student: { id: participant.student.id, name: participant.student.name },
      progress: await ensureProgress(prisma, workshop.id, participant.studentId),
    });
  }
  return {
    workshop: {
      id: workshop.id,
      title: workshop.title,
      icon: workshop.icon,
      joinCode: workshop.joinCode,
      steps: workshop.steps,
    },
    students,
  };
}

async function activeSessionEvents(prisma) {
  const workshop = await prisma.workshop.findFirst({
    where: { isActive: true },
    include: { steps: { orderBy: { order: 'asc' }, select: { id: true } } },
  });
  if (!workshop) return null;
  // Positions, not `order`: deleting a step leaves gaps in `order`.
  const stepNumbers = new Map(workshop.steps.map((step, index) => [step.id, index + 1]));
  const rows = await prisma.sessionEvent.findMany({
    where: { workshopId: workshop.id, createdAt: { gte: workshop.launchedAt } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      type: true,
      answer: true,
      createdAt: true,
      studentId: true,
      stepId: true,
      student: { select: { id: true, name: true } },
      step: { select: { id: true, title: true } },
    },
  });
  const events = rows.map((row) => ({
    ...row,
    step: row.step && { ...row.step, number: stepNumbers.get(row.step.id) },
  }));
  const run = await prisma.workshopRun.findFirst({ where: { workshopId: workshop.id, endedAt: null } });
  const feedback = run
    ? await prisma.feedback.findMany({
        where: { runId: run.id },
        select: { studentId: true, rating: true, comment: true, createdAt: true },
      })
    : [];
  return {
    launchedAt: workshop.launchedAt,
    lastStepId: workshop.steps.at(-1)?.id ?? null,
    events: markOpenEvents(events).reverse(),
    feedback,
  };
}

module.exports = {
  SessionError,
  getSessionOverview,
  launchWorkshop,
  endWorkshop,
  checkJoinCode,
  joinActiveWorkshop,
  activeSessionProgress,
  activeSessionEvents,
};
