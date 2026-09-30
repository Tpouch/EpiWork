const prisma = require('../db');
const { launchWorkshop, endWorkshop, joinActiveWorkshop } = require('./session');
const { ensureProgress, submitAnswer } = require('../progress/stateMachine');
const { submitFeedback } = require('../feedback/feedback');
const { listRuns, getRun } = require('./runs');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function createWorkshop(title) {
  const workshop = await prisma.workshop.create({ data: { title, description: 'd', icon: '🐙' } });
  const steps = [];
  for (let order = 1; order <= 2; order++) {
    steps.push(await prisma.step.create({ data: { workshopId: workshop.id, order, title: `Step ${order}`, content: 'c' } }));
  }
  return { workshop, steps };
}

describe('workshop runs', () => {
  let git, gitSteps, maya, tom;

  beforeEach(async () => {
    await resetDb();
    ({ workshop: git, steps: gitSteps } = await createWorkshop('Intro to Git'));
    maya = await prisma.user.create({ data: { name: 'Maya Lopez', role: 'student', passwordHash: 'secret' } });
    tom = await prisma.user.create({ data: { name: 'Tom Martin', role: 'student', passwordHash: 'secret' } });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: tom });
    await ensureProgress(prisma, git.id, maya.id);
    await submitAnswer(prisma, gitSteps[0].id, maya.id, null);
    await submitAnswer(prisma, gitSteps[1].id, maya.id, null);
    await submitFeedback(prisma, git.id, maya.id, { rating: 4, comment: 'Nice' });
    await endWorkshop(prisma, git.id);
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('listRuns summarizes each run', async () => {
    const [run] = await listRuns(prisma);
    expect(run).toMatchObject({
      workshop: { id: git.id, title: 'Intro to Git', icon: '🐙' },
      studentCount: 2,
      finishedCount: 1,
      ratingCount: 1,
      averageRating: 4,
    });
    expect(run.endedAt).toBeInstanceOf(Date);
  });

  test('listRuns puts the newest run first', async () => {
    const { workshop: css } = await createWorkshop('CSS Basics');
    await launchWorkshop(prisma, css.id, () => 'CSS234');
    const runs = await listRuns(prisma);
    expect(runs.map((run) => run.workshop.title)).toEqual(['CSS Basics', 'Intro to Git']);
    expect(runs[0].endedAt).toBeNull();
  });

  test('getRun lists students with the step they reached, and the feedback', async () => {
    const [{ id }] = await listRuns(prisma);
    const run = await getRun(prisma, id);
    expect(run.stepCount).toBe(2);
    expect(run.students).toEqual([
      { id: maya.id, name: 'Maya Lopez', reached: { finished: true, number: 2, title: 'Step 2' }, rating: 4 },
      { id: tom.id, name: 'Tom Martin', reached: { finished: false, number: 1, title: 'Step 1' }, rating: null },
    ]);
    expect(run.feedback).toEqual([
      { id: expect.any(Number), student: { id: maya.id, name: 'Maya Lopez' }, rating: 4, comment: 'Nice', createdAt: expect.any(Date) },
    ]);
    expect(JSON.stringify(run)).not.toContain('passwordHash');
    expect(JSON.stringify(await listRuns(prisma))).not.toContain('passwordHash');
  });

  test('getRun returns null for an unknown run', async () => {
    expect(await getRun(prisma, 999999)).toBeNull();
  });
});
