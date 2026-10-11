const prisma = require('../db');
const { createSection, createStepInSection, deleteStep, deleteSection } = require('./content');
const { ensureProgress } = require('../progress/stateMachine');

async function resetDb() {
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.section.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function orderedTitles(workshopId) {
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  return steps.map((s) => `${s.order}:${s.title}`);
}

describe('workshop content ordering', () => {
  let workshop, first, second;

  beforeEach(async () => {
    await resetDb();
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd' } });
    first = await createSection(prisma, workshop.id, 'Intro');
    second = await createSection(prisma, workshop.id, 'Branches');
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('creates each section with a first sub step at the end', async () => {
    expect(await orderedTitles(workshop.id)).toEqual(['1:New sub step', '2:New sub step']);
    expect(second.order).toBe(2);
  });

  it('inserts a sub step at the end of its section and shifts later ones', async () => {
    await createStepInSection(prisma, first.id, { title: 'Configure' });
    expect(await orderedTitles(workshop.id)).toEqual(['1:New sub step', '2:Configure', '3:New sub step']);
  });

  it('keeps the order contiguous after deleting a sub step', async () => {
    const extra = await createStepInSection(prisma, first.id, { title: 'Configure' });
    await deleteStep(prisma, first.steps[0].id);
    expect(await orderedTitles(workshop.id)).toEqual(['1:Configure', '2:New sub step']);
    expect(extra.id).toBeDefined();
  });

  it('deletes a section with its sub steps and their progress', async () => {
    const student = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
    await ensureProgress(prisma, workshop.id, student.id);
    await deleteSection(prisma, first.id);
    expect(await orderedTitles(workshop.id)).toEqual(['1:New sub step']);
    expect(await prisma.stepProgress.count({ where: { studentId: student.id } })).toBe(1);
    const sections = await prisma.section.findMany({ where: { workshopId: workshop.id } });
    expect(sections.map((s) => s.order)).toEqual([1]);
  });
});
