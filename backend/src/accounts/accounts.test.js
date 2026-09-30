const prisma = require('../db');
const { hashPassword } = require('./passwords');
const {
  lookupEmail,
  login,
  signup,
  logout,
  findSessionByToken,
  ensureDefaultAdmin,
  DEFAULT_ADMIN_EMAIL,
} = require('./accounts');

async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser({ name = 'Alice Martin', email = 'alice.martin@epitech.eu', role = 'student', password = 'student123' } = {}) {
  const passwordHash = password ? await hashPassword(password) : null;
  return prisma.user.create({ data: { name, email, role, passwordHash } });
}

describe('accounts: authentication', () => {
  beforeEach(resetDb);

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  test('lookupEmail sends a registered user to the password step', async () => {
    await createUser();
    expect(await lookupEmail(prisma, 'alice.martin@epitech.eu')).toEqual({ next: 'login', name: 'Alice Martin' });
  });

  test('lookupEmail sends an unknown Epitech email to signup with its derived name', async () => {
    expect(await lookupEmail(prisma, ' Lea.Martin@EPITECH.eu ')).toEqual({ next: 'signup', name: 'Lea Martin' });
  });

  test('lookupEmail refuses an unknown non-Epitech email', async () => {
    await expect(lookupEmail(prisma, 'lea@gmail.com')).rejects.toMatchObject({ status: 400, code: 'STUDENT_EMAIL_REQUIRED' });
  });

  test('signup creates a student and returns a working token', async () => {
    const { token, user } = await signup(prisma, { email: 'lea.martin@epitech.eu', password: 'longenough' });
    expect(user).toEqual({ id: expect.any(Number), name: 'Lea Martin', email: 'lea.martin@epitech.eu', role: 'student', accentColor: 'lime', isProtected: false });
    expect((await findSessionByToken(prisma, token)).user).toEqual(user);
  });

  test('signup refuses an email that already has a password', async () => {
    await createUser();
    await expect(signup(prisma, { email: 'alice.martin@epitech.eu', password: 'longenough' }))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  test('signup refuses a short password without creating a user', async () => {
    await expect(signup(prisma, { email: 'lea.martin@epitech.eu', password: 'short' }))
      .rejects.toMatchObject({ status: 400, code: 'INVALID_PASSWORD' });
    expect(await prisma.user.count()).toBe(0);
  });

  test('signup with an empty body is refused with 400', async () => {
    await expect(signup(prisma, {})).rejects.toMatchObject({ status: 400, code: 'STUDENT_EMAIL_REQUIRED' });
  });

  test('signup gives a password to a legacy student and keeps their id', async () => {
    const legacy = await createUser({ password: null });
    const { user } = await signup(prisma, { email: 'alice.martin@epitech.eu', password: 'longenough' });
    expect(user.id).toBe(legacy.id);
  });

  test('login returns a token for the right password', async () => {
    const alice = await createUser();
    const { token, user } = await login(prisma, { email: 'alice.martin@epitech.eu', password: 'student123' });
    expect(user.id).toBe(alice.id);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  test('login returns the saved accent color', async () => {
    const alice = await createUser();
    await prisma.user.update({ where: { id: alice.id }, data: { accentColor: 'pink' } });
    const { user } = await login(prisma, { email: 'alice.martin@epitech.eu', password: 'student123' });
    expect(user.accentColor).toBe('pink');
  });

  test('login accepts the email with different case and spaces', async () => {
    await createUser();
    await expect(login(prisma, { email: ' Alice.Martin@EPITECH.eu ', password: 'student123' })).resolves.toHaveProperty('token');
  });

  test('login refuses a wrong password', async () => {
    await createUser();
    await expect(login(prisma, { email: 'alice.martin@epitech.eu', password: 'nope-nope' }))
      .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('login with an empty body is refused with 401', async () => {
    await expect(login(prisma, {})).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('login with a non-string password is refused with 401', async () => {
    await createUser();
    await expect(login(prisma, { email: 'alice.martin@epitech.eu', password: 12345678 }))
      .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('login refuses an unknown email with the same error', async () => {
    await expect(login(prisma, { email: 'ghost@epitech.eu', password: 'whatever1' }))
      .rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('findSessionByToken never exposes the password hash', async () => {
    await createUser();
    const { token } = await login(prisma, { email: 'alice.martin@epitech.eu', password: 'student123' });
    const session = await findSessionByToken(prisma, token);
    expect(Object.keys(session.user).sort()).toEqual(['accentColor', 'email', 'id', 'isProtected', 'name', 'role']);
  });

  test('findSessionByToken returns null for an unknown token', async () => {
    expect(await findSessionByToken(prisma, 'not-a-real-token')).toBeNull();
  });

  test('logout makes the token unusable', async () => {
    await createUser();
    const { token } = await login(prisma, { email: 'alice.martin@epitech.eu', password: 'student123' });
    const { sessionId } = await findSessionByToken(prisma, token);
    await logout(prisma, sessionId);
    expect(await findSessionByToken(prisma, token)).toBeNull();
  });

  test('ensureDefaultAdmin does nothing without a password', async () => {
    expect(await ensureDefaultAdmin(prisma, undefined)).toBe('missing-password');
    expect(await prisma.user.count()).toBe(0);
  });

  test('ensureDefaultAdmin creates the admin who can then log in', async () => {
    expect(await ensureDefaultAdmin(prisma, 'from-env-123')).toBe('created');
    const { user } = await login(prisma, { email: DEFAULT_ADMIN_EMAIL, password: 'from-env-123' });
    expect(user).toMatchObject({ name: 'Admin', role: 'admin' });
  });

  test('ensureDefaultAdmin keeps a password the admin already has', async () => {
    await ensureDefaultAdmin(prisma, 'first-password');
    expect(await ensureDefaultAdmin(prisma, 'second-password')).toBe('unchanged');
    await expect(login(prisma, { email: DEFAULT_ADMIN_EMAIL, password: 'first-password' })).resolves.toHaveProperty('token');
  });

  test('ensureDefaultAdmin sets a password on an existing admin without one', async () => {
    await createUser({ name: 'Admin', email: DEFAULT_ADMIN_EMAIL, role: 'admin', password: null });
    expect(await ensureDefaultAdmin(prisma, 'from-env-123')).toBe('password-set');
  });
});
