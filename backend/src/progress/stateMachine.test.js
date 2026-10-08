const prisma = require('../db');
const { ensureProgress, submitAnswer, unlockStep, toggleHelp } = require('./stateMachine');

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('progress state machine', () => {
  let workshop, student, stepA, stepB, stepC;

  beforeEach(async () => {
    await resetDb();
    student = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    workshop = await prisma.workshop.create({ data: { title: 'Networking', description: 'desc' } });
    stepA = await prisma.step.create({
      data: { workshopId: workshop.id, order: 1, title: 'Step A', content: 'do A', isCheckpoint: false },
    });
    stepB = await prisma.step.create({
      data: {
        workshopId: workshop.id,
        order: 2,
        title: 'Step B',
        content: 'do B',
        isCheckpoint: true,
        questionType: 'text',
        questionPrompt: 'Explain B',
      },
    });
    stepC = await prisma.step.create({
      data: { workshopId: workshop.id, order: 3, title: 'Step C', content: 'do C', isCheckpoint: false },
    });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('ensureProgress creates first step available, rest locked', async () => {
    const rows = await ensureProgress(prisma, workshop.id, student.id);
    expect(rows.map((r) => r.status)).toEqual(['available', 'locked', 'locked']);
  });

  test('submitAnswer on non-checkpoint step marks it done and unlocks next', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r.status]));
    expect(byStep[stepA.id]).toBe('done');
    expect(byStep[stepB.id]).toBe('available');
  });

  test('submitAnswer on checkpoint step sets pending_review and does not unlock next', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'my answer');
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r]));
    expect(byStep[stepB.id].status).toBe('pending_review');
    expect(byStep[stepB.id].submittedAnswer).toBe('my answer');
    expect(byStep[stepC.id].status).toBe('locked');
  });

  test('submitAnswer throws if step is not available (e.g. still locked)', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await expect(submitAnswer(prisma, stepB.id, student.id, 'too early')).rejects.toThrow();
  });

  test('unlockStep moves pending_review to done and unlocks next step', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await unlockStep(prisma, stepB.id, student.id);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    const byStep = Object.fromEntries(rows.map((r) => [r.stepId, r.status]));
    expect(byStep[stepB.id]).toBe('done');
    expect(byStep[stepC.id]).toBe('available');
  });

  test('unlockStep throws if step is not pending_review', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await expect(unlockStep(prisma, stepA.id, student.id)).rejects.toThrow();
  });

  test('unlocking the last step does not create a phantom next-step row', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await unlockStep(prisma, stepB.id, student.id);
    await submitAnswer(prisma, stepC.id, student.id, null);
    const rows = await prisma.stepProgress.findMany({ where: { studentId: student.id } });
    expect(rows).toHaveLength(3);
  });

  test('toggleHelp sets and clears helpRequested independent of status', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await toggleHelp(prisma, stepA.id, student.id, true);
    let row = await prisma.stepProgress.findFirst({ where: { stepId: stepA.id, studentId: student.id } });
    expect(row.helpRequested).toBe(true);
    expect(row.status).toBe('available');
    await toggleHelp(prisma, stepA.id, student.id, false);
    row = await prisma.stepProgress.findFirst({ where: { stepId: stepA.id, studentId: student.id } });
    expect(row.helpRequested).toBe(false);
  });

  test('helpRequested survives unlockStep — only an explicit toggle clears it', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await toggleHelp(prisma, stepB.id, student.id, true);
    await unlockStep(prisma, stepB.id, student.id);
    const row = await prisma.stepProgress.findFirst({ where: { stepId: stepB.id, studentId: student.id } });
    expect(row.status).toBe('done');
    expect(row.helpRequested).toBe(true);
  });

  async function loggedEvents() {
    const events = await prisma.sessionEvent.findMany({ where: { studentId: student.id }, orderBy: { id: 'asc' } });
    return events.map((e) => [e.type, e.stepId, e.answer]);
  }

  test('finishing a normal step logs step_done with the answer', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, 'B');
    expect(await loggedEvents()).toEqual([['step_done', stepA.id, 'B']]);
    const [row] = await prisma.sessionEvent.findMany();
    expect(row.workshopId).toBe(workshop.id);
  });

  test('submitting a checkpoint logs checkpoint_submitted, not step_done', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'my answer');
    expect(await loggedEvents()).toEqual([
      ['step_done', stepA.id, null],
      ['checkpoint_submitted', stepB.id, 'my answer'],
    ]);
  });

  test('approving a checkpoint logs step_done for it', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, stepA.id, student.id, null);
    await submitAnswer(prisma, stepB.id, student.id, 'answer');
    await unlockStep(prisma, stepB.id, student.id);
    expect((await loggedEvents()).at(-1)).toEqual(['step_done', stepB.id, null]);
  });

  test('a refused submit logs nothing', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await expect(submitAnswer(prisma, stepB.id, student.id, 'too early')).rejects.toThrow();
    expect(await loggedEvents()).toEqual([]);
  });

  test('help logs help_requested once and help_resolved when cleared', async () => {
    await ensureProgress(prisma, workshop.id, student.id);
    await toggleHelp(prisma, stepA.id, student.id, true);
    await toggleHelp(prisma, stepA.id, student.id, true);
    await toggleHelp(prisma, stepA.id, student.id, false);
    expect(await loggedEvents()).toEqual([
      ['help_requested', stepA.id, null],
      ['help_resolved', stepA.id, null],
    ]);
  });
});
