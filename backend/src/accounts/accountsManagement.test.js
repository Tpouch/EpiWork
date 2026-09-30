const prisma = require('../db');
const { hashPassword } = require('./passwords');
const {
  login,
  findSessionByToken,
  updateProfile,
  changePassword,
  listAccounts,
  createAdmin,
  resetPassword,
  deleteAccount,
  updateAppearance,
} = require('./accounts');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(name, email, role, password = 'password1') {
  return prisma.user.create({ data: { name, email, role, passwordHash: await hashPassword(password) } });
}

function publicOf(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accentColor: user.accentColor ?? 'lime',
    isProtected: user.email === 'admin@devgoblin.fr',
  };
}

describe('accounts: profile and management', () => {
  let admin, otherAdmin, student;

  beforeEach(async () => {
    await resetDb();
    admin = await createUser('Admin', 'admin@devgoblin.fr', 'admin');
    otherAdmin = await createUser('Sam Durand', 'sam@devgoblin.fr', 'admin');
    student = await createUser('Lea Martin', 'lea.martin@epitech.eu', 'student');
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('updateProfile renames a student', async () => {
    const updated = await updateProfile(prisma, publicOf(student), { name: '  Léa Martin ' });
    expect(updated).toEqual({ ...publicOf(student), name: 'Léa Martin' });
  });

  test('updateProfile refuses a student changing their email', async () => {
    await expect(updateProfile(prisma, publicOf(student), { name: 'Lea', email: 'lea@gmail.com' }))
      .rejects.toMatchObject({ status: 400, code: 'EMAIL_LOCKED' });
  });

  test('updateProfile lets a student resend their unchanged email', async () => {
    await expect(updateProfile(prisma, publicOf(student), { name: 'Lea', email: 'LEA.MARTIN@epitech.eu' })).resolves.toMatchObject({ name: 'Lea' });
  });

  test('updateProfile lets an admin change their email', async () => {
    const updated = await updateProfile(prisma, publicOf(otherAdmin), { name: 'Sam', email: 'Boss@DevGoblin.fr' });
    expect(updated.email).toBe('boss@devgoblin.fr');
  });

  test('updateProfile refuses an email used by someone else', async () => {
    await expect(updateProfile(prisma, publicOf(otherAdmin), { name: 'Sam', email: 'lea.martin@epitech.eu' }))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  test('updateProfile refuses any change to the protected default admin', async () => {
    await expect(updateProfile(prisma, publicOf(admin), { name: 'Boss' }))
      .rejects.toMatchObject({ status: 409, code: 'ACCOUNT_PROTECTED' });
    expect((await prisma.user.findUnique({ where: { id: admin.id } })).name).toBe('Admin');
  });

  test('updateProfile refuses a non-string email from an admin', async () => {
    await expect(updateProfile(prisma, publicOf(otherAdmin), { name: 'Sam', email: 123 }))
      .rejects.toMatchObject({ status: 400, code: 'INVALID_EMAIL' });
  });

  test('updateProfile refuses a non-string name', async () => {
    await expect(updateProfile(prisma, publicOf(student), { name: 42 })).rejects.toMatchObject({ status: 400, code: 'INVALID_NAME' });
  });

  test('updateProfile refuses a blank name', async () => {
    await expect(updateProfile(prisma, publicOf(student), { name: ' ' })).rejects.toMatchObject({ status: 400, code: 'INVALID_NAME' });
  });

  test('changePassword refuses a wrong current password', async () => {
    await expect(changePassword(prisma, { userId: student.id, sessionId: 0 }, { currentPassword: 'nope', newPassword: 'newpassword' }))
      .rejects.toMatchObject({ status: 400, code: 'WRONG_PASSWORD' });
  });

  test('updateAppearance saves the accent color and returns the updated user', async () => {
    const updated = await updateAppearance(prisma, student.id, 'violet');
    expect(updated).toMatchObject({ id: student.id, accentColor: 'violet' });
    expect((await prisma.user.findUnique({ where: { id: student.id } })).accentColor).toBe('violet');
  });

  test('updateAppearance refuses an unknown accent color', async () => {
    await expect(updateAppearance(prisma, student.id, 'blue')).rejects.toMatchObject({ status: 400, code: 'INVALID_ACCENT_COLOR' });
    expect((await prisma.user.findUnique({ where: { id: student.id } })).accentColor).toBeNull();
  });

  test('updateAppearance works for the protected default admin', async () => {
    await expect(updateAppearance(prisma, admin.id, 'orange')).resolves.toMatchObject({ accentColor: 'orange', isProtected: true });
  });

  test('changePassword with an empty body is refused with 400', async () => {
    await expect(changePassword(prisma, { userId: student.id, sessionId: 0 }, {}))
      .rejects.toMatchObject({ status: 400, code: 'WRONG_PASSWORD' });
  });

  test('changePassword works for the protected default admin', async () => {
    await changePassword(prisma, { userId: admin.id, sessionId: 0 }, { currentPassword: 'password1', newPassword: 'newpassword' });
    await expect(login(prisma, { email: admin.email, password: 'newpassword' })).resolves.toHaveProperty('token');
  });

  test('changePassword keeps the current session and ends the others', async () => {
    const current = await login(prisma, { email: student.email, password: 'password1' });
    const other = await login(prisma, { email: student.email, password: 'password1' });
    const { sessionId } = await findSessionByToken(prisma, current.token);
    await changePassword(prisma, { userId: student.id, sessionId }, { currentPassword: 'password1', newPassword: 'newpassword' });
    expect(await findSessionByToken(prisma, current.token)).not.toBeNull();
    expect(await findSessionByToken(prisma, other.token)).toBeNull();
    await expect(login(prisma, { email: student.email, password: 'newpassword' })).resolves.toHaveProperty('token');
  });

  test('listAccounts lists admins first without password hashes', async () => {
    const accounts = await listAccounts(prisma);
    expect(accounts).toEqual([publicOf(admin), publicOf(otherAdmin), publicOf(student)]);
    expect(accounts[0].isProtected).toBe(true);
  });

  test('createAdmin creates an admin who can log in', async () => {
    const created = await createAdmin(prisma, { name: 'Nora Petit', email: 'nora@devgoblin.fr', password: 'temporary1' });
    expect(created).toMatchObject({ name: 'Nora Petit', role: 'admin', isProtected: false });
    await expect(login(prisma, { email: 'nora@devgoblin.fr', password: 'temporary1' })).resolves.toHaveProperty('token');
  });

  test('createAdmin refuses an email already in use', async () => {
    await expect(createAdmin(prisma, { name: 'Dup', email: 'lea.martin@epitech.eu', password: 'temporary1' }))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  test('createAdmin refuses an invalid email', async () => {
    await expect(createAdmin(prisma, { name: 'Sam', email: 'sam', password: 'temporary1' }))
      .rejects.toMatchObject({ status: 400, code: 'INVALID_EMAIL' });
  });

  test('resetPassword logs out every session of the target', async () => {
    const { token } = await login(prisma, { email: student.email, password: 'password1' });
    await resetPassword(prisma, student.id, 'resetpass1');
    expect(await findSessionByToken(prisma, token)).toBeNull();
    await expect(login(prisma, { email: student.email, password: 'resetpass1' })).resolves.toHaveProperty('token');
  });

  test('resetPassword lets another admin reset the protected default admin', async () => {
    await resetPassword(prisma, admin.id, 'resetpass1');
    await expect(login(prisma, { email: admin.email, password: 'resetpass1' })).resolves.toHaveProperty('token');
  });

  test('resetPassword refuses an unknown account', async () => {
    await expect(resetPassword(prisma, 999999, 'resetpass1')).rejects.toMatchObject({ status: 404, code: 'ACCOUNT_NOT_FOUND' });
  });

  test('deleteAccount refuses deleting yourself', async () => {
    await expect(deleteAccount(prisma, admin.id, admin.id)).rejects.toMatchObject({ status: 409, code: 'CANNOT_DELETE_SELF' });
  });

  test("deleteAccount removes the student's progress, participations and sessions", async () => {
    const workshop = await prisma.workshop.create({ data: { title: 'Git', description: 'd' } });
    const step = await prisma.step.create({ data: { workshopId: workshop.id, order: 1, title: 'S1', content: 'c' } });
    await prisma.participation.create({ data: { studentId: student.id, workshopId: workshop.id } });
    await prisma.stepProgress.create({ data: { studentId: student.id, stepId: step.id } });
    const { token } = await login(prisma, { email: student.email, password: 'password1' });

    await deleteAccount(prisma, admin.id, student.id);

    expect(await prisma.user.findUnique({ where: { id: student.id } })).toBeNull();
    expect(await prisma.participation.count()).toBe(0);
    expect(await prisma.stepProgress.count()).toBe(0);
    expect(await findSessionByToken(prisma, token)).toBeNull();
  });

  test('deleteAccount refuses deleting the protected default admin', async () => {
    await expect(deleteAccount(prisma, otherAdmin.id, admin.id)).rejects.toMatchObject({ status: 409, code: 'PROTECTED_ACCOUNT' });
    expect(await prisma.user.findUnique({ where: { id: admin.id } })).not.toBeNull();
  });

  test('deleteAccount refuses an unknown account', async () => {
    await expect(deleteAccount(prisma, admin.id, 999999)).rejects.toMatchObject({ status: 404 });
  });
});
