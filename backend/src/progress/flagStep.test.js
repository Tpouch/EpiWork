const prisma = require('../db');
const { ensureProgress, submitAnswer, resolveFlagLock } = require('./stateMachine');
const { makeId, makeKey, makeFlag } = require('../checker/flagCrypto');
const { FLAG_MAX_ATTEMPTS } = require('./stepVisibility');

const SECRET = 'test-secret';
const SLUG = 'git-workshop';

function flagOf(login, exo) {
  return makeFlag(makeKey(SECRET, makeId(SECRET, SLUG, login)), SLUG, exo);
}

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function statusOf(stepId, studentId) {
  return (await prisma.stepProgress.findFirst({ where: { stepId, studentId } })).status;
}

describe('flag steps', () => {
  let workshop, alice, bob, flagStep, next;

  beforeEach(async () => {
    process.env.WORKSHOP_SECRET = SECRET;
    await resetDb();
    alice = await prisma.user.create({ data: { name: 'Alice', email: 'alice@epitech.eu', role: 'student' } });
    bob = await prisma.user.create({ data: { name: 'Bob', email: 'bob@epitech.eu', role: 'student' } });
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd', slug: SLUG } });
    flagStep = await prisma.step.create({
      data: { workshopId: workshop.id, order: 1, title: 'Flag', content: 'c', questionType: 'flag', flagExoId: '02' },
    });
    next = await prisma.step.create({ data: { workshopId: workshop.id, order: 2, title: 'End', content: 'c' } });
    await ensureProgress(prisma, workshop.id, alice.id);
    await ensureProgress(prisma, workshop.id, bob.id);
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  async function failTimes(count, student = alice) {
    for (let i = 0; i < count; i++) await submitAnswer(prisma, flagStep.id, student.id, 'EPI{0000000000000000}');
  }

  it('accepts the flag computed for the logged-in student and unlocks the next step', async () => {
    const result = await submitAnswer(prisma, flagStep.id, alice.id, flagOf('alice@epitech.eu', '02'));
    expect(result).toMatchObject({ correct: true, status: 'done' });
    expect(await statusOf(next.id, alice.id)).toBe('available');
  });

  it('accepts the flag pasted with spaces around it', async () => {
    const result = await submitAnswer(prisma, flagStep.id, alice.id, ` ${flagOf('alice@epitech.eu', '02')}\n`);
    expect(result.correct).toBe(true);
  });

  it('rejects the flag of another student', async () => {
    const result = await submitAnswer(prisma, flagStep.id, alice.id, flagOf('bob@epitech.eu', '02'));
    expect(result).toMatchObject({ correct: false, status: 'available' });
  });

  it('rejects the flag of another exercise', async () => {
    const result = await submitAnswer(prisma, flagStep.id, alice.id, flagOf('alice@epitech.eu', '01'));
    expect(result.correct).toBe(false);
  });

  it('tells the student when the last allowed attempt is used', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS - 1);
    const result = await submitAnswer(prisma, flagStep.id, alice.id, 'x');
    expect(result).toMatchObject({ correct: false, locked: true });
  });

  it('does not lock before the limit', async () => {
    expect(await submitAnswer(prisma, flagStep.id, alice.id, 'x')).toMatchObject({ correct: false, locked: false });
  });

  it('rejects a missing answer', async () => {
    expect((await submitAnswer(prisma, flagStep.id, alice.id, null)).correct).toBe(false);
  });

  it('logs every submission with its result', async () => {
    await failTimes(1);
    await submitAnswer(prisma, flagStep.id, alice.id, flagOf('alice@epitech.eu', '02'));
    const rows = await prisma.flagSubmission.findMany({ orderBy: { id: 'asc' } });
    expect(rows.map((r) => [r.studentId, r.stepId, r.ok])).toEqual([
      [alice.id, flagStep.id, false],
      [alice.id, flagStep.id, true],
    ]);
  });

  it('does not store the submitted flag', async () => {
    await failTimes(1);
    const row = await prisma.flagSubmission.findFirst();
    expect(Object.keys(row).sort()).toEqual(['createdAt', 'id', 'ok', 'stepId', 'studentId']);
  });

  it('counts the failures of each student separately', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS - 1);
    const result = await submitAnswer(prisma, flagStep.id, bob.id, flagOf('bob@epitech.eu', '02'));
    expect(result.correct).toBe(true);
  });

  it('raises one alert for the admins when the limit is reached', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS - 1);
    expect(await prisma.sessionEvent.count({ where: { type: 'flag_locked' } })).toBe(0);
    await failTimes(1);
    const alerts = await prisma.sessionEvent.findMany({ where: { type: 'flag_locked' } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ studentId: alice.id, stepId: flagStep.id, answer: null });
  });

  it('refuses any submission once locked, even the right flag, with a 429', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS);
    await expect(submitAnswer(prisma, flagStep.id, alice.id, flagOf('alice@epitech.eu', '02'))).rejects.toMatchObject({ status: 429 });
    expect(await statusOf(flagStep.id, alice.id)).toBe('available');
  });

  it('does not log the refused submissions', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS);
    await submitAnswer(prisma, flagStep.id, alice.id, 'x').catch(() => {});
    expect(await prisma.flagSubmission.count()).toBe(FLAG_MAX_ATTEMPTS);
  });

  it('lets the student try again once an admin unlocked the step', async () => {
    await failTimes(FLAG_MAX_ATTEMPTS);
    const row = await resolveFlagLock(prisma, flagStep.id, alice.id);
    expect(row.failedAttempts).toBe(0);
    expect(await prisma.sessionEvent.count({ where: { type: 'flag_unlocked' } })).toBe(1);
    const result = await submitAnswer(prisma, flagStep.id, alice.id, flagOf('alice@epitech.eu', '02'));
    expect(result.correct).toBe(true);
  });

  it('refuses to unlock a step that is not locked', async () => {
    await failTimes(1);
    await expect(resolveFlagLock(prisma, flagStep.id, alice.id)).rejects.toThrow('This step is not locked');
  });

  it('fails with a 500 when the step has no exercise id', async () => {
    await prisma.step.update({ where: { id: flagStep.id }, data: { flagExoId: null } });
    await expect(submitAnswer(prisma, flagStep.id, alice.id, 'x')).rejects.toMatchObject({ status: 500 });
  });

  it('fails with a 500 when the workshop has no slug', async () => {
    await prisma.workshop.update({ where: { id: workshop.id }, data: { slug: null } });
    await expect(submitAnswer(prisma, flagStep.id, alice.id, 'x')).rejects.toMatchObject({ status: 500 });
  });

  it('fails with a 500 and no flag check when the secret is missing', async () => {
    delete process.env.WORKSHOP_SECRET;
    await expect(submitAnswer(prisma, flagStep.id, alice.id, 'x')).rejects.toMatchObject({ status: 500 });
    expect(await prisma.flagSubmission.count()).toBe(0);
  });
});
