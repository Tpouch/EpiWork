const prisma = require('../db');
const { launchWorkshop, endWorkshop, joinActiveWorkshop } = require('../sessions/session');
const { getMyFeedback, submitFeedback } = require('./feedback');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('workshop feedback', () => {
  let git, maya, tom;

  beforeEach(async () => {
    await resetDb();
    git = await prisma.workshop.create({ data: { title: 'Intro to Git', description: 'd' } });
    await prisma.step.create({ data: { workshopId: git.id, order: 1, title: 'Step 1', content: 'c' } });
    maya = await prisma.user.create({ data: { name: 'Maya Lopez', role: 'student' } });
    tom = await prisma.user.create({ data: { name: 'Tom Martin', role: 'student' } });
    await launchWorkshop(prisma, git.id, () => 'GIT234');
    await joinActiveWorkshop(prisma, { code: 'GIT234', student: maya });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('saves the rating and a trimmed comment', async () => {
    const saved = await submitFeedback(prisma, git.id, maya.id, { rating: 4, comment: '  Nice pace  ' });
    expect(saved).toEqual({ rating: 4, comment: 'Nice pace' });
    expect(await prisma.feedback.count({ where: { studentId: maya.id } })).toBe(1);
  });

  test('stores an empty comment as null', async () => {
    const saved = await submitFeedback(prisma, git.id, maya.id, { rating: 5, comment: '   ' });
    expect(saved.comment).toBeNull();
  });

  test.each([0, 6, 3.5, '4', null])('refuses the rating %p', async (rating) => {
    await expect(submitFeedback(prisma, git.id, maya.id, { rating })).rejects.toMatchObject({ status: 400 });
    expect(await prisma.feedback.count()).toBe(0);
  });

  test('refuses a comment over 1000 characters', async () => {
    const comment = 'a'.repeat(1001);
    await expect(submitFeedback(prisma, git.id, maya.id, { rating: 3, comment })).rejects.toMatchObject({ status: 400 });
  });

  test('refuses feedback when the session has ended', async () => {
    await endWorkshop(prisma, git.id);
    await expect(submitFeedback(prisma, git.id, maya.id, { rating: 3 })).rejects.toMatchObject({
      status: 409,
      message: 'This session has ended.',
    });
  });

  test('refuses a student who did not join this session', async () => {
    await expect(submitFeedback(prisma, git.id, tom.id, { rating: 3 })).rejects.toMatchObject({ status: 403 });
  });

  test('refuses a second rating for the same session', async () => {
    await submitFeedback(prisma, git.id, maya.id, { rating: 3 });
    await expect(submitFeedback(prisma, git.id, maya.id, { rating: 5 })).rejects.toMatchObject({ status: 409 });
  });

  test('getMyFeedback lets a student who joined the open run rate it', async () => {
    expect(await getMyFeedback(prisma, git.id, maya.id)).toEqual({
      workshopTitle: 'Intro to Git',
      canRate: true,
      feedback: null,
    });
    await submitFeedback(prisma, git.id, maya.id, { rating: 5 });
    expect(await getMyFeedback(prisma, git.id, maya.id)).toMatchObject({ canRate: false, feedback: { rating: 5, comment: null } });
  });

  test('getMyFeedback does not offer rating once the session has ended', async () => {
    await endWorkshop(prisma, git.id);
    expect(await getMyFeedback(prisma, git.id, maya.id)).toMatchObject({ canRate: false, feedback: null });
  });

  test('getMyFeedback does not offer rating to a student who did not join', async () => {
    expect(await getMyFeedback(prisma, git.id, tom.id)).toMatchObject({ canRate: false, feedback: null });
  });

  test('getMyFeedback refuses an unknown workshop', async () => {
    await expect(getMyFeedback(prisma, 999999, maya.id)).rejects.toMatchObject({ status: 404 });
  });
});
