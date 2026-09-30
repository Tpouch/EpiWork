const { ensureProgress } = require('../progress/stateMachine');
const { generateJoinCode, normalizeJoinCode } = require('./joinIdentity');

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
    await prisma.$transaction([
      prisma.workshop.updateMany({ where: { isActive: true }, data: { isActive: false, joinCode: null } }),
      prisma.workshop.update({
        where: { id: workshopId },
        data: { isActive: true, joinCode: generateCode(), launchedAt: new Date() },
      }),
    ]);
  }
  const { active } = await getSessionOverview(prisma);
  return active;
}

async function endWorkshop(prisma, workshopId) {
  await findWorkshopOrThrow(prisma, workshopId);
  await prisma.workshop.update({ where: { id: workshopId }, data: { isActive: false, joinCode: null } });
}

async function findActiveByCode(prisma, code) {
  const joinCode = normalizeJoinCode(code);
  const workshop = joinCode ? await prisma.workshop.findFirst({ where: { isActive: true, joinCode } }) : null;
  if (!workshop) throw new SessionError(404, 'No active workshop with that code.');
  return workshop;
}

async function checkJoinCode(prisma, code) {
  const workshop = await findActiveByCode(prisma, code);
  return { workshopId: workshop.id, title: workshop.title, icon: workshop.icon };
}

async function joinActiveWorkshop(prisma, { code, student }) {
  if (student.role !== 'student') throw new SessionError(403, 'Only students can join a workshop.');
  const workshop = await findActiveByCode(prisma, code);
  // joinedAt is set explicitly (not left to @default(now())) so it has the same
  // precision as launchedAt and the ">= launchedAt" comparison stays exact.
  const joinedAt = new Date();
  await prisma.participation.upsert({
    where: { studentId_workshopId: { studentId: student.id, workshopId: workshop.id } },
    create: { studentId: student.id, workshopId: workshop.id, joinedAt },
    update: { joinedAt },
  });
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

module.exports = {
  SessionError,
  getSessionOverview,
  launchWorkshop,
  endWorkshop,
  checkJoinCode,
  joinActiveWorkshop,
  activeSessionProgress,
};
