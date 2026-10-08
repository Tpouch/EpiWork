const prisma = require('../db');
const { listMyWorkshops, getMyWorkshopRecap } = require('./myWorkshops');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

function addStep(workshop, order, extra = {}) {
  return prisma.step.create({
    data: { workshopId: workshop.id, order, title: `Step ${order}`, content: `Content ${order}`, ...extra },
  });
}

function join(student, workshop, joinedAt = new Date()) {
  return prisma.participation.create({ data: { studentId: student.id, workshopId: workshop.id, joinedAt } });
}

function setStatus(student, step, status) {
  return prisma.stepProgress.create({ data: { studentId: student.id, stepId: step.id, status } });
}

function logEvent(student, workshop, step, type) {
  return prisma.sessionEvent.create({ data: { workshopId: workshop.id, studentId: student.id, stepId: step.id, type } });
}

describe('my workshops', () => {
  let maya, tom, git, docker;

  beforeEach(async () => {
    await resetDb();
    maya = await prisma.user.create({ data: { name: 'Maya Lopez', role: 'student' } });
    tom = await prisma.user.create({ data: { name: 'Tom Martin', role: 'student' } });
    git = await prisma.workshop.create({ data: { title: 'Intro to Git', description: 'Branches', icon: '🌿' } });
    docker = await prisma.workshop.create({ data: { title: 'Docker', description: 'Containers' } });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('lists only the workshops the student joined, newest first', async () => {
    const other = await prisma.workshop.create({ data: { title: 'Not joined', description: '' } });
    await join(maya, git, new Date('2026-09-20T10:00:00Z'));
    await join(maya, docker, new Date('2026-09-28T10:00:00Z'));
    await join(tom, other);
    const list = await listMyWorkshops(prisma, maya.id);
    expect(list.map((workshop) => workshop.title)).toEqual(['Docker', 'Intro to Git']);
  });

  test('returns the card fields for each workshop', async () => {
    const joinedAt = new Date('2026-09-20T10:00:00Z');
    await addStep(git, 1);
    await join(maya, git, joinedAt);
    expect(await listMyWorkshops(prisma, maya.id)).toEqual([
      { id: git.id, title: 'Intro to Git', description: 'Branches', icon: '🌿', joinedAt, stepCount: 1, doneCount: 0, finished: false },
    ]);
  });

  test('marks a workshop finished when every step is done', async () => {
    const first = await addStep(git, 1);
    const second = await addStep(git, 2);
    await join(maya, git);
    await setStatus(maya, first, 'done');
    await setStatus(maya, second, 'done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ stepCount: 2, doneCount: 2, finished: true });
  });

  test('counts steps without a progress row as not done', async () => {
    const first = await addStep(git, 1);
    await addStep(git, 2);
    await addStep(git, 3);
    await join(maya, git);
    await setStatus(maya, first, 'done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ stepCount: 3, doneCount: 1, finished: false });
  });

  test("ignores other students' progress", async () => {
    const first = await addStep(git, 1);
    await join(maya, git);
    await join(tom, git);
    await setStatus(tom, first, 'done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ doneCount: 0, finished: false });
  });

  test('stays finished while the student redoes a workshop finished in an earlier session', async () => {
    const first = await addStep(git, 1);
    const second = await addStep(git, 2);
    await join(maya, git);
    await setStatus(maya, first, 'available');
    await logEvent(maya, git, second, 'step_done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ stepCount: 2, doneCount: 2, finished: true });
  });

  test('a last checkpoint submitted in an earlier session counts as finished', async () => {
    await addStep(git, 1);
    const second = await addStep(git, 2);
    await join(maya, git);
    await logEvent(maya, git, second, 'checkpoint_submitted');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ doneCount: 2, finished: true });
  });

  test('an earlier session that stopped before the last step does not count as finished', async () => {
    const first = await addStep(git, 1);
    await addStep(git, 2);
    await join(maya, git);
    await logEvent(maya, git, first, 'step_done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ doneCount: 0, finished: false });
  });

  test("ignores other students' earlier sessions", async () => {
    await addStep(git, 1);
    const second = await addStep(git, 2);
    await join(maya, git);
    await logEvent(tom, git, second, 'step_done');
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ doneCount: 0, finished: false });
  });

  test('reports a workshop with no steps as not finished', async () => {
    await join(maya, docker);
    const [workshop] = await listMyWorkshops(prisma, maya.id);
    expect(workshop).toMatchObject({ stepCount: 0, doneCount: 0, finished: false });
  });

  test('returns the recap with steps in order and without question fields', async () => {
    const second = await addStep(git, 2, {
      isCheckpoint: true,
      questionType: 'multiple_choice',
      questionPrompt: 'Which command?',
      questionOptions: JSON.stringify(['merge', 'rebase']),
    });
    const first = await addStep(git, 1);
    const joinedAt = new Date('2026-09-20T10:00:00Z');
    await join(maya, git, joinedAt);
    expect(await getMyWorkshopRecap(prisma, git.id, maya.id)).toEqual({
      id: git.id,
      title: 'Intro to Git',
      description: 'Branches',
      icon: '🌿',
      joinedAt,
      steps: [
        { id: first.id, order: 1, title: 'Step 1', content: 'Content 1' },
        { id: second.id, order: 2, title: 'Step 2', content: 'Content 2' },
      ],
    });
  });

  test('refuses the recap of a workshop the student did not join', async () => {
    await join(tom, git);
    await expect(getMyWorkshopRecap(prisma, git.id, maya.id)).rejects.toMatchObject({
      status: 404,
      message: 'You have not joined this workshop.',
    });
  });

  test('refuses the recap of a workshop that does not exist', async () => {
    await expect(getMyWorkshopRecap(prisma, 999999, maya.id)).rejects.toMatchObject({ status: 404 });
  });
});
