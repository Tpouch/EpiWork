const prisma = require('../db');
const {
  getSessionOverview,
  launchWorkshop,
  endWorkshop,
  checkJoinCode,
  joinActiveWorkshop,
  activeSessionProgress,
  activeSessionEvents,
} = require('./session');
const { ensureProgress, toggleHelp } = require('../progress/stateMachine');

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
  let git, css, maya;

  beforeEach(async () => {
    await resetDb();
    git = await createWorkshop('Intro to Git');
    css = await createWorkshop('CSS Basics');
    maya = await prisma.user.create({ data: { name: 'Maya Lopez', email: 'maya.lopez@epitech.eu', role: 'student' } });
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
    await expect(checkJoinCode(prisma, { code: 'GIT234', student: maya })).rejects.toMatchObject({ status: 404 });
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
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    await activeSessionProgress(prisma);
    await endWorkshop(prisma, git.id);
    const stored = await prisma.workshop.findUnique({ where: { id: git.id } });
    expect(stored).toMatchObject({ isActive: false, joinCode: null });
    expect(await prisma.stepProgress.count({ where: { studentId: maya.id } })).toBe(2);
    await expect(checkJoinCode(prisma, { code: 'GIT234', student: maya })).rejects.toMatchObject({ status: 404 });
  });

  test('getSessionOverview reports the active session, then the last one once ended', async () => {
    expect(await getSessionOverview(prisma)).toEqual({ active: null, last: null });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    expect((await getSessionOverview(prisma)).active).toMatchObject({ workshopId: git.id, joinCode: 'GIT234', participantCount: 1 });
    await endWorkshop(prisma, git.id);
    const overview = await getSessionOverview(prisma);
    expect(overview.active).toBeNull();
    expect(overview.last).toMatchObject({ workshopId: git.id, title: 'Intro to Git', participantCount: 1 });
  });

  test('checkJoinCode accepts a lowercase code with spaces', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    expect(await checkJoinCode(prisma, { code: ' git234 ', student: maya })).toEqual({ workshopId: git.id, title: 'Intro to Git', icon: '🐙' });
  });

  test('checkJoinCode refuses an admin', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@devgoblin.fr', role: 'admin' } });
    await expect(checkJoinCode(prisma, { code: 'GIT234', student: admin })).rejects.toMatchObject({ status: 403 });
  });

  test('joinActiveWorkshop records the participation and returns the workshop', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    expect(await joinActiveWorkshop(prisma, { code: 'git234', student: maya })).toEqual({ workshopId: git.id });
    expect(await prisma.participation.count({ where: { studentId: maya.id, workshopId: git.id } })).toBe(1);
  });

  test('joining twice reuses the same participation', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    expect(await prisma.participation.count()).toBe(1);
  });

  test('joinActiveWorkshop refuses an admin', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@devgoblin.fr', role: 'admin' } });
    await expect(joinActiveWorkshop(prisma, { code: 'GIT234', student: admin })).rejects.toMatchObject({ status: 403 });
  });

  test('joinActiveWorkshop rejects a wrong code', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await expect(joinActiveWorkshop(prisma, { code: 'NOPE22', student: maya })).rejects.toMatchObject({ status: 404 });
  });

  test('activeSessionProgress lists only students who joined this session', async () => {
    const seeded = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    const firstStep = await prisma.step.findFirst({ where: { workshopId: git.id } });
    await prisma.stepProgress.create({ data: { studentId: seeded.id, stepId: firstStep.id, status: 'available' } });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    const live = await activeSessionProgress(prisma);
    expect(live.workshop).toMatchObject({ id: git.id, joinCode: 'GIT234' });
    expect(live.workshop.steps).toHaveLength(2);
    expect(live.students.map((s) => s.student.name)).toEqual(['Maya Lopez']);
    expect(live.students[0].progress.map((row) => row.status)).toEqual(['available', 'locked']);
  });

  test('activeSessionProgress returns null when nothing is live', async () => {
    expect(await activeSessionProgress(prisma)).toBeNull();
  });

  test('activeSessionEvents returns null when nothing is live', async () => {
    expect(await activeSessionEvents(prisma)).toBeNull();
  });

  test('joining logs one joined event, even when the student re-enters the code', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    const { events } = await activeSessionEvents(prisma);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'joined',
      student: { id: maya.id, name: 'Maya Lopez' },
      step: null,
      open: false,
      closedAt: null,
    });
  });

  test('activeSessionEvents gives launchedAt, the last step and newest events first', async () => {
    const session = await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    const steps = await prisma.step.findMany({ where: { workshopId: git.id }, orderBy: { order: 'asc' } });
    await ensureProgress(prisma, git.id, maya.id);
    await toggleHelp(prisma, steps[0].id, maya.id, true);
    const result = await activeSessionEvents(prisma);
    expect(result.launchedAt).toEqual(session.launchedAt);
    expect(result.lastStepId).toBe(steps[1].id);
    expect(result.events.map((e) => e.type)).toEqual(['help_requested', 'joined']);
    expect(result.events[0]).toMatchObject({ open: true, step: { id: steps[0].id, number: 1, title: 'Step 1' } });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  test('events from an earlier run of the workshop are left out', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await prisma.sessionEvent.create({
      data: { workshopId: git.id, studentId: maya.id, type: 'joined', createdAt: new Date(Date.now() - 60_000) },
    });
    const { events } = await activeSessionEvents(prisma);
    expect(events).toEqual([]);
  });

  test('step numbers follow step position even when orders have gaps', async () => {
    const gappy = await prisma.workshop.create({ data: { title: 'Gappy', description: 'd' } });
    await prisma.step.create({ data: { workshopId: gappy.id, order: 1, title: 'First', content: 'c' } });
    const second = await prisma.step.create({ data: { workshopId: gappy.id, order: 3, title: 'Was third', content: 'c' } });
    await launchWorkshop(prisma, gappy.id, () => 'ABC234');
    await joinActiveWorkshop(prisma, { code: 'ABC234', student: maya });
    await ensureProgress(prisma, gappy.id, maya.id);
    await toggleHelp(prisma, second.id, maya.id, true);
    const result = await activeSessionEvents(prisma);
    expect(result.events[0].step).toMatchObject({ id: second.id, number: 2 });
    expect(result.lastStepId).toBe(second.id);
  });

  test('help and checkpoints left from an earlier run show up again when the student joins', async () => {
    const [first] = await ensureProgress(prisma, git.id, maya.id);
    await prisma.stepProgress.update({
      where: { id: first.id },
      data: { status: 'pending_review', submittedAnswer: 'old answer', helpRequested: true },
    });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    const { events } = await activeSessionEvents(prisma);
    expect(events.map((e) => [e.type, e.stepId, e.answer, e.open])).toEqual([
      ['help_requested', first.stepId, null, true],
      ['checkpoint_submitted', first.stepId, 'old answer', true],
      ['joined', null, null, false],
    ]);
  });

  test('deleting a student also deletes their events', async () => {
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    await prisma.participation.deleteMany({ where: { studentId: maya.id } });
    await prisma.user.delete({ where: { id: maya.id } });
    expect(await prisma.sessionEvent.count()).toBe(0);
  });
});
