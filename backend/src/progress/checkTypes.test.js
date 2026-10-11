const prisma = require('../db');
const { ensureProgress, submitAnswer, unlockSolution, resolveQcmAlert, toggleHelp } = require('./stateMachine');

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function statusOf(stepId, studentId) {
  const row = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  return row.status;
}

describe('check types', () => {
  let workshop, student, question, qcm, last;

  beforeEach(async () => {
    await resetDb();
    student = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd' } });
    question = await prisma.step.create({
      data: { workshopId: workshop.id, order: 1, title: 'Q', content: 'c', questionType: 'question', questionPrompt: 'Why?' },
    });
    qcm = await prisma.step.create({
      data: {
        workshopId: workshop.id,
        order: 2,
        title: 'QCM',
        content: 'c',
        solution: 'git revert',
        questionType: 'qcm',
        questionPrompt: 'Which one?',
        questionOptions: JSON.stringify(['git reset', 'git revert']),
        questionAnswer: 'git revert',
        questionFeedback: 'Think about history.',
      },
    });
    last = await prisma.step.create({ data: { workshopId: workshop.id, order: 3, title: 'End', content: 'c' } });
    await ensureProgress(prisma, workshop.id, student.id);
    await submitAnswer(prisma, question.id, student.id, 'Because');
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('completes a question step right away', async () => {
    expect(await statusOf(question.id, student.id)).toBe('done');
    expect(await statusOf(qcm.id, student.id)).toBe('available');
  });

  it('completes a QCM on the right answer and unlocks the next step', async () => {
    const result = await submitAnswer(prisma, qcm.id, student.id, 'git revert');
    expect(result.correct).toBe(true);
    expect(await statusOf(last.id, student.id)).toBe('available');
  });

  it('keeps a QCM available on a wrong answer and returns the host message', async () => {
    const result = await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    expect(result).toMatchObject({ correct: false, message: 'Think about history.', status: 'available' });
  });

  it('records one qcm_failed event on the second wrong answer', async () => {
    await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    const alerts = await prisma.sessionEvent.findMany({ where: { stepId: qcm.id, type: 'qcm_failed' } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].answer).toBe('git reset');
  });

  it('resolving the alert resets the failure count', async () => {
    await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    await submitAnswer(prisma, qcm.id, student.id, 'git reset');
    const row = await resolveQcmAlert(prisma, qcm.id, student.id);
    expect(row.failedAttempts).toBe(0);
  });

  it('refuses to resolve when there is no alert', async () => {
    await expect(resolveQcmAlert(prisma, qcm.id, student.id)).rejects.toThrow('No QCM alert to resolve');
  });

  it('unlocking the solution also resolves the open help request', async () => {
    await toggleHelp(prisma, qcm.id, student.id, true);
    const row = await unlockSolution(prisma, qcm.id, student.id);
    expect(row).toMatchObject({ solutionUnlocked: true, helpRequested: false });
    const types = (await prisma.sessionEvent.findMany({ where: { stepId: qcm.id } })).map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['help_resolved', 'solution_unlocked']));
  });
});
