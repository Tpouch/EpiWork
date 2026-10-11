const prisma = require('../db');
const app = require('../index');
const { hashPassword } = require('../accounts/passwords');
const { login } = require('../accounts/accounts');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

describe('solution visibility over HTTP', () => {
  let server, base, token, workshop, step, student;

  beforeAll(async () => {
    await resetDb();
    const passwordHash = await hashPassword('password1');
    student = await prisma.user.create({
      data: { name: 'Maya Lopez', email: 'maya@epitech.eu', role: 'student', passwordHash },
    });
    const launchedAt = new Date();
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd', isActive: true, launchedAt } });
    step = await prisma.step.create({
      data: {
        workshopId: workshop.id,
        order: 1,
        title: 'S1',
        content: 'c',
        solution: 'SECRET SOLUTION',
        questionType: 'qcm',
        questionPrompt: 'Which?',
        questionOptions: JSON.stringify(['a', 'b']),
        questionAnswer: 'SECRET ANSWER',
      },
    });
    await prisma.participation.create({ data: { studentId: student.id, workshopId: workshop.id, joinedAt: launchedAt } });
    ({ token } = await login(prisma, { email: 'maya@epitech.eu', password: 'password1' }));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  afterAll(async () => {
    server.close();
    await resetDb();
    await prisma.$disconnect();
  });

  function get(path) {
    return fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
  }

  it('hides the locked solution and the QCM answer from the progress rows', async () => {
    const body = await (await get(`/me/workshops/${workshop.id}`)).text();
    expect(body).not.toContain('SECRET SOLUTION');
    expect(body).not.toContain('SECRET ANSWER');
    expect(JSON.parse(body)[0].step.hasSolution).toBe(true);
  });

  it('hides them from the recap while the session runs', async () => {
    const body = await (await get(`/me/workshops/${workshop.id}/recap`)).text();
    expect(body).not.toContain('SECRET SOLUTION');
    expect(body).not.toContain('SECRET ANSWER');
  });

  it('shows the solution in the progress rows once unlocked', async () => {
    await prisma.stepProgress.updateMany({ where: { stepId: step.id }, data: { solutionUnlocked: true } });
    const rows = await (await get(`/me/workshops/${workshop.id}`)).json();
    expect(rows[0].step.solution).toBe('SECRET SOLUTION');
  });

  it('refuses the full workshop list to participants', async () => {
    expect((await get('/workshops')).status).toBe(403);
  });
});
