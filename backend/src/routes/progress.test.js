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

describe('admin progress routes', () => {
  let server, base, token, workshop;

  beforeAll(async () => {
    await resetDb();
    const passwordHash = await hashPassword('password1');
    await prisma.user.create({ data: { name: 'Admin', email: 'admin@devgoblin.fr', role: 'admin', passwordHash } });
    const student = await prisma.user.create({ data: { name: 'Lea Martin', email: 'lea.martin@epitech.eu', role: 'student', passwordHash } });
    workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd' } });
    const step = await prisma.step.create({ data: { workshopId: workshop.id, order: 1, title: 'S1', content: 'c' } });
    await prisma.stepProgress.create({ data: { studentId: student.id, stepId: step.id, status: 'pending_review' } });
    ({ token } = await login(prisma, { email: 'admin@devgoblin.fr', password: 'password1' }));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  afterAll(async () => {
    server.close();
    await resetDb();
    await prisma.$disconnect();
  });

  async function getAsAdmin(path) {
    const res = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  }

  test('the admin feed never exposes student password hashes', async () => {
    const feed = await getAsAdmin('/admin/feed');
    expect(feed[0].student).toMatchObject({ name: 'Lea Martin' });
    expect(JSON.stringify(feed)).not.toContain('passwordHash');
  });

  test('workshop progress never exposes student password hashes', async () => {
    const progress = await getAsAdmin(`/workshops/${workshop.id}/progress`);
    expect(progress.students[0].student).toMatchObject({ name: 'Lea Martin' });
    expect(JSON.stringify(progress)).not.toContain('passwordHash');
  });
});
