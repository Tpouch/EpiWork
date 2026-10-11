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

describe('my workshops routes', () => {
  let server, base, token, git;

  beforeAll(async () => {
    await resetDb();
    const passwordHash = await hashPassword('password1');
    const maya = await prisma.user.create({
      data: { name: 'Maya Lopez', email: 'maya.lopez@epitech.eu', role: 'student', passwordHash },
    });
    git = await prisma.workshop.create({ data: { title: 'Intro to Git', description: 'd' } });
    await prisma.step.create({
      data: {
        workshopId: git.id,
        order: 1,
        title: 'S1',
        content: 'c',
        questionType: 'checkpoint',
        questionPrompt: 'Why?',
      },
    });
    await prisma.participation.create({ data: { studentId: maya.id, workshopId: git.id } });
    ({ token } = await login(prisma, { email: 'maya.lopez@epitech.eu', password: 'password1' }));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  afterAll(async () => {
    server.close();
    await resetDb();
    await prisma.$disconnect();
  });

  async function getAsMaya(path) {
    const res = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
    return { status: res.status, body: await res.json() };
  }

  test('lists the workshops the student joined', async () => {
    const { status, body } = await getAsMaya('/me/workshops');
    expect(status).toBe(200);
    expect(body).toEqual([expect.objectContaining({ id: git.id, stepCount: 1, doneCount: 0, finished: false })]);
  });

  test('returns the recap without question fields', async () => {
    const { status, body } = await getAsMaya(`/me/workshops/${git.id}/recap`);
    expect(status).toBe(200);
    expect(Object.keys(body.steps[0]).sort((a, b) => a.localeCompare(b))).toEqual(['content', 'hasSolution', 'hint', 'id', 'order', 'section', 'solution', 'title']);
  });

  test('answers 404 for a workshop the student did not join', async () => {
    const other = await prisma.workshop.create({ data: { title: 'Other', description: '' } });
    const { status, body } = await getAsMaya(`/me/workshops/${other.id}/recap`);
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'You have not joined this workshop.' });
  });

  test('answers 400 for an invalid workshop id', async () => {
    const { status, body } = await getAsMaya('/me/workshops/abc/recap');
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Invalid workshop id.' });
  });
});
