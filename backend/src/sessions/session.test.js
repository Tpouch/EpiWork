const prisma = require('../db');
const {
  getSessionOverview,
  launchWorkshop,
  endWorkshop,
  checkJoinCode,
  joinActiveWorkshop,
  activeSessionProgress,
} = require('./session');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function createWorkshop(title, stepCount = 2) {
  const workshop = await prisma.workshop.create({ data: { title, description: 'desc', icon: '🐙' } });
  for (let order = 1; order <= stepCount; order++) {
    await prisma.step.create({ data: { workshopId: workshop.id, order, title: `Step ${order}`, content: 'do it' } });
  }
  return workshop;
}

describe('workshop sessions', () => {
  let git, css;

  beforeEach(async () => {
    await resetDb();
    git = await createWorkshop('Intro to Git');
    css = await createWorkshop('CSS Basics');
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('launchWorkshop activates the workshop with a fresh code', async () => {
    const session = await launchWorkshop(prisma, git.id, () => 'ABC234');
    expect(session).toMatchObject({ workshopId: git.id, title: 'Intro to Git', icon: '🐙', joinCode: 'ABC234', participantCount: 0 });
    const stored = await prisma.workshop.findUnique({ where: { id: git.id } });
    expect(stored.isActive).toBe(true);
    expect(stored.launchedAt).toBeInstanceOf(Date);
  });

  test('launching another workshop ends the previous one and kills its code', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await launchWorkshop(prisma, css.id, () => 'CSS234');
    const previous = await prisma.workshop.findUnique({ where: { id: git.id } });
    expect(previous).toMatchObject({ isActive: false, joinCode: null });
    await expect(checkJoinCode(prisma, 'GIT234')).rejects.toMatchObject({ status: 404 });
  });

  test('relaunching the active workshop keeps its code', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const again = await launchWorkshop(prisma, git.id, () => 'NEW234');
    expect(again.joinCode).toBe('GIT234');
  });

  test('launchWorkshop refuses a workshop without steps', async () => {
    const empty = await createWorkshop('Empty', 0);
    await expect(launchWorkshop(prisma, empty.id)).rejects.toMatchObject({ status: 409 });
  });

  test('launchWorkshop refuses an unknown workshop', async () => {
    await expect(launchWorkshop(prisma, 999999)).rejects.toMatchObject({ status: 404 });
  });

  test('endWorkshop clears the session but keeps step progress', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const { user } = await joinActiveWorkshop(prisma, { code: 'GIT234', email: 'maya.lopez@epitech.eu' });
    await activeSessionProgress(prisma);
    await endWorkshop(prisma, git.id);
    const stored = await prisma.workshop.findUnique({ where: { id: git.id } });
    expect(stored).toMatchObject({ isActive: false, joinCode: null });
    expect(await prisma.stepProgress.count({ where: { studentId: user.id } })).toBe(2);
    await expect(checkJoinCode(prisma, 'GIT234')).rejects.toMatchObject({ status: 404 });
  });

  test('getSessionOverview reports the active session, then the last one once ended', async () => {
    expect(await getSessionOverview(prisma)).toEqual({ active: null, last: null });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', email: 'maya.lopez@epitech.eu' });
    expect((await getSessionOverview(prisma)).active).toMatchObject({ workshopId: git.id, joinCode: 'GIT234', participantCount: 1 });
    await endWorkshop(prisma, git.id);
    const overview = await getSessionOverview(prisma);
    expect(overview.active).toBeNull();
    expect(overview.last).toMatchObject({ workshopId: git.id, title: 'Intro to Git', participantCount: 1 });
  });

  test('checkJoinCode accepts a lowercase code with spaces', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    expect(await checkJoinCode(prisma, ' git234 ')).toEqual({ workshopId: git.id, title: 'Intro to Git', icon: '🐙' });
  });

  test('joinActiveWorkshop creates a student named from the email', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const result = await joinActiveWorkshop(prisma, { code: 'git234', email: ' Jean-Pierre.Dupont@EPITECH.EU ' });
    expect(result.workshopId).toBe(git.id);
    expect(result.user).toMatchObject({ name: 'Jean-Pierre Dupont', email: 'jean-pierre.dupont@epitech.eu', role: 'student' });
  });

  test('joining twice reuses the same student and participation', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const first = await joinActiveWorkshop(prisma, { code: 'GIT234', email: 'maya.lopez@epitech.eu' });
    const second = await joinActiveWorkshop(prisma, { code: 'GIT234', email: 'MAYA.LOPEZ@epitech.eu' });
    expect(second.user.id).toBe(first.user.id);
    expect(await prisma.user.count({ where: { email: 'maya.lopez@epitech.eu' } })).toBe(1);
    expect(await prisma.participation.count()).toBe(1);
  });

  test('joinActiveWorkshop rejects a non-Epitech email without creating a user', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await expect(joinActiveWorkshop(prisma, { code: 'GIT234', email: 'maya@gmail.com' })).rejects.toMatchObject({ status: 400 });
    expect(await prisma.user.count()).toBe(0);
  });

  test('joinActiveWorkshop rejects a wrong code', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await expect(joinActiveWorkshop(prisma, { code: 'NOPE22', email: 'maya.lopez@epitech.eu' })).rejects.toMatchObject({ status: 404 });
  });

  test('activeSessionProgress lists only students who joined this session', async () => {
    const seeded = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    const firstStep = await prisma.step.findFirst({ where: { workshopId: git.id } });
    await prisma.stepProgress.create({ data: { studentId: seeded.id, stepId: firstStep.id, status: 'available' } });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', email: 'maya.lopez@epitech.eu' });
    const live = await activeSessionProgress(prisma);
    expect(live.workshop).toMatchObject({ id: git.id, joinCode: 'GIT234' });
    expect(live.workshop.steps).toHaveLength(2);
    expect(live.students.map((s) => s.student.name)).toEqual(['Maya Lopez']);
    expect(live.students[0].progress.map((row) => row.status)).toEqual(['available', 'locked']);
  });

  test('activeSessionProgress returns null when nothing is live', async () => {
    expect(await activeSessionProgress(prisma)).toBeNull();
  });
});
