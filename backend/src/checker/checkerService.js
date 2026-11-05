const { normalizeId, makeId, makeKey, makeFlag, formatId, formatPair, verifyFlag } = require('./flagCrypto');

class CheckerError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'CheckerError';
    this.status = status;
  }
}

function workshopSecret() {
  const secret = process.env.WORKSHOP_SECRET;
  if (!secret) throw new CheckerError(500, 'The flag checker is not configured on the server.');
  return secret;
}

function codesFor(secret, slug, login) {
  const id = makeId(secret, slug, login);
  return { id: formatId(id), pair: formatPair(makeKey(secret, id)) };
}

// What a student sees on the workshop setup page.
async function getMyCheckerSetup(prisma, workshopId, studentId) {
  const participation = await prisma.participation.findUnique({
    where: { studentId_workshopId: { studentId, workshopId } },
    select: { workshop: { select: { slug: true } }, student: { select: { email: true } } },
  });
  const { slug } = participation?.workshop ?? {};
  const { email } = participation?.student ?? {};
  if (!slug || !email) throw new CheckerError(404, 'This workshop has no checker to set up.');
  const config = await prisma.checkerConfig.findUnique({ where: { workshopId_studentId: { workshopId, studentId } } });
  return {
    slug,
    ...codesFor(workshopSecret(), slug, email),
    apiUrl: process.env.PUBLIC_API_URL ?? null,
    configuredAt: config?.configuredAt ?? null,
  };
}

// The id is not stored: it is recomputed for each participant of a workshop that has a slug.
async function configureFromId(prisma, rawId) {
  const secret = workshopSecret();
  const wanted = normalizeId(rawId);
  const participations = await prisma.participation.findMany({
    where: { workshop: { slug: { not: null } }, student: { email: { not: null } } },
    select: { workshopId: true, studentId: true, workshop: { select: { slug: true } }, student: { select: { email: true } } },
  });
  const match = wanted && participations.find((p) => makeId(secret, p.workshop.slug, p.student.email) === wanted);
  if (!match) throw new CheckerError(404, 'unknown code');
  const { workshopId, studentId } = match;
  await prisma.checkerConfig.upsert({
    where: { workshopId_studentId: { workshopId, studentId } },
    create: { workshopId, studentId, configuredAt: new Date() },
    update: { configuredAt: new Date() },
  });
  return formatPair(makeKey(secret, wanted));
}

async function listCheckerStudents(prisma, workshopId) {
  const participations = await prisma.participation.findMany({
    where: { workshopId },
    select: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { student: { name: 'asc' } },
  });
  const configs = await prisma.checkerConfig.findMany({ where: { workshopId } });
  const configuredAt = new Map(configs.map((c) => [c.studentId, c.configuredAt]));
  return participations.map(({ student }) => ({ ...student, configuredAt: configuredAt.get(student.id) ?? null }));
}

// Support tool: what the student should see, without needing a database row.
function checkerTool({ slug, login, exo }) {
  if (!slug || !login) throw new CheckerError(400, 'Give a slug and a login.');
  const secret = workshopSecret();
  const id = makeId(secret, slug, login);
  const key = makeKey(secret, id);
  return { id: formatId(id), pair: formatPair(key), flag: exo ? makeFlag(key, slug, exo) : null };
}

async function isRightFlag(prisma, step, studentId, submitted) {
  if (!step.flagExoId) throw new CheckerError(500, 'This step has no exercise id for its flag.');
  const { slug } = await prisma.workshop.findUniqueOrThrow({ where: { id: step.workshopId }, select: { slug: true } });
  const { email } = await prisma.user.findUniqueOrThrow({ where: { id: studentId }, select: { email: true } });
  if (!slug || !email) throw new CheckerError(500, 'This workshop has no slug, its flags cannot be checked.');
  return verifyFlag(workshopSecret(), slug, email, step.flagExoId, submitted);
}

module.exports = { CheckerError, getMyCheckerSetup, configureFromId, listCheckerStudents, checkerTool, isRightFlag };
