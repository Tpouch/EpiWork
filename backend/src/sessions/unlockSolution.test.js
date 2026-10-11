const prisma = require('../db');
const { unlockSolutionForAll } = require('./session');

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('unlockSolutionForAll', () => {
  let workshop, step, alice, bob, late;

  beforeEach(async () => {
    await resetDb();
    const launchedAt = new Date();
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd', isActive: true, launchedAt } });
    step = await prisma.step.create({ data: { workshopId: workshop.id, order: 1, title: 'S', content: 'c', solution: 'answer' } });
    alice = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    bob = await prisma.user.create({ data: { name: 'Bob', role: 'student' } });
    late = await prisma.user.create({ data: { name: 'Old run', role: 'student' } });
    await prisma.participation.create({ data: { studentId: alice.id, workshopId: workshop.id, joinedAt: launchedAt } });
    await prisma.participation.create({ data: { studentId: bob.id, workshopId: workshop.id, joinedAt: launchedAt } });
    await prisma.participation.create({ data: { studentId: late.id, workshopId: workshop.id, joinedAt: new Date(launchedAt.getTime() - 60000) } });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('unlocks the step for every participant of the running session', async () => {
    const { count } = await unlockSolutionForAll(prisma, step.id);
    expect(count).toBe(2);
    const rows = await prisma.stepProgress.findMany({ where: { stepId: step.id, solutionUnlocked: true } });
    expect(rows.map((r) => r.studentId).sort()).toEqual([alice.id, bob.id].sort());
  });

  it('refuses when the workshop is not live', async () => {
    await prisma.workshop.update({ where: { id: workshop.id }, data: { isActive: false } });
    await expect(unlockSolutionForAll(prisma, step.id)).rejects.toThrow('not live');
  });

  it('refuses when the step has no solution', async () => {
    await prisma.step.update({ where: { id: step.id }, data: { solution: null } });
    await expect(unlockSolutionForAll(prisma, step.id)).rejects.toThrow('no solution');
  });
});
