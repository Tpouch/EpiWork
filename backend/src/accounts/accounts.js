const { hashPassword, verifyPassword } = require('./passwords');
const { newToken, hashToken } = require('./tokens');
const { validatePassword, signupKind } = require('./rules');
const { normalizeEmail, nameFromEpitechEmail } = require('../sessions/joinIdentity');

const DEFAULT_ADMIN_EMAIL = 'admin@devgoblin.fr';
const PUBLIC_FIELDS = { id: true, name: true, email: true, role: true };

class AccountError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AccountError';
    this.status = status;
    this.code = code;
  }
}

function toPublic(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function findByEmail(prisma, email) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

function assertValid(code, message) {
  if (message) throw new AccountError(400, code, message);
}

async function assertEmailFree(prisma, email, exceptUserId = null) {
  const owner = await findByEmail(prisma, email);
  if (owner && owner.id !== exceptUserId) {
    throw new AccountError(409, 'EMAIL_TAKEN', 'This email is already in use.');
  }
}

function studentEmailRequired() {
  return new AccountError(
    400,
    'STUDENT_EMAIL_REQUIRED',
    'Students sign up with firstname.lastname@epitech.eu. Admin accounts are created by an admin.',
  );
}

async function startSession(prisma, user) {
  const token = newToken();
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId: user.id } });
  return { token, user: toPublic(user) };
}

async function lookupEmail(prisma, email) {
  const normalized = normalizeEmail(email);
  const user = await findByEmail(prisma, normalized);
  const next = signupKind(normalized, user);
  if (next === 'forbidden') throw studentEmailRequired();
  return { next, name: user?.name ?? nameFromEpitechEmail(normalized) };
}

async function login(prisma, { email, password }) {
  const user = await findByEmail(prisma, normalizeEmail(email));
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!valid) {
    throw new AccountError(401, 'INVALID_CREDENTIALS', 'Wrong email or password. Ask a teacher if you forgot it.');
  }
  return startSession(prisma, user);
}

async function signup(prisma, { email, password }) {
  const normalized = normalizeEmail(email);
  const existing = await findByEmail(prisma, normalized);
  const kind = signupKind(normalized, existing);
  if (kind === 'login') throw new AccountError(409, 'EMAIL_TAKEN', 'This email already has an account. Log in instead.');
  if (kind === 'forbidden') throw studentEmailRequired();
  assertValid('INVALID_PASSWORD', validatePassword(password));
  const passwordHash = await hashPassword(password);
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
    : await prisma.user.create({
        data: { name: nameFromEpitechEmail(normalized), email: normalized, role: 'student', passwordHash },
      });
  return startSession(prisma, user);
}

async function logout(prisma, sessionId) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

async function findSessionByToken(prisma, token) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, user: { select: PUBLIC_FIELDS } },
  });
  return session ? { sessionId: session.id, user: session.user } : null;
}

// ADMIN_PASSWORD is only the *initial* password: once the admin has one
// (possibly changed from My account), startup must not overwrite it.
async function ensureDefaultAdmin(prisma, password) {
  if (!password) return 'missing-password';
  const existing = await findByEmail(prisma, DEFAULT_ADMIN_EMAIL);
  if (existing?.passwordHash) return 'unchanged';
  const passwordHash = await hashPassword(password);
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    return 'password-set';
  }
  await prisma.user.create({ data: { name: 'Admin', email: DEFAULT_ADMIN_EMAIL, role: 'admin', passwordHash } });
  return 'created';
}

module.exports = {
  AccountError,
  DEFAULT_ADMIN_EMAIL,
  PUBLIC_FIELDS,
  findByEmail,
  assertValid,
  assertEmailFree,
  lookupEmail,
  login,
  signup,
  logout,
  findSessionByToken,
  ensureDefaultAdmin,
};
