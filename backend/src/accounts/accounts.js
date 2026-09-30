const { hashPassword, verifyPassword } = require('./passwords');
const { newToken, hashToken } = require('./tokens');
const {
  DEFAULT_ADMIN_EMAIL,
  validatePassword,
  validateName,
  isEmail,
  isProtectedAccount,
  canDeleteAccount,
  signupKind,
} = require('./rules');
const { normalizeEmail, nameFromEpitechEmail } = require('../sessions/joinIdentity');

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
  return { id: user.id, name: user.name, email: user.email, role: user.role, isProtected: isProtectedAccount(user) };
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
  return session ? { sessionId: session.id, user: toPublic(session.user) } : null;
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

function invalidEmail() {
  return new AccountError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
}

async function updateProfile(prisma, user, { name, email }) {
  if (isProtectedAccount(user)) {
    throw new AccountError(409, 'ACCOUNT_PROTECTED', "The base admin account can't be renamed. Only its password can change.");
  }
  assertValid('INVALID_NAME', validateName(name));
  const data = { name: name.trim() };
  const newEmail = email === undefined ? user.email : normalizeEmail(email);
  if (newEmail !== user.email) {
    if (user.role !== 'admin') throw new AccountError(400, 'EMAIL_LOCKED', "Your Epitech email can't be changed.");
    if (!isEmail(newEmail)) throw invalidEmail();
    await assertEmailFree(prisma, newEmail, user.id);
    data.email = newEmail;
  }
  return toPublic(await prisma.user.update({ where: { id: user.id }, data, select: PUBLIC_FIELDS }));
}

async function changePassword(prisma, { userId, sessionId }, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // 400, not 401: the frontend treats any 401 as "your session is gone".
  if (!(await verifyPassword(currentPassword, user?.passwordHash))) {
    throw new AccountError(400, 'WRONG_PASSWORD', 'Current password is wrong.');
  }
  assertValid('INVALID_PASSWORD', validatePassword(newPassword));
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId, id: { not: sessionId } } }),
  ]);
}

async function listAccounts(prisma) {
  const users = await prisma.user.findMany({ select: PUBLIC_FIELDS, orderBy: [{ role: 'asc' }, { name: 'asc' }] });
  return users.map(toPublic);
}

async function createAdmin(prisma, { name, email, password }) {
  assertValid('INVALID_NAME', validateName(name));
  const normalized = normalizeEmail(email);
  if (!isEmail(normalized)) throw invalidEmail();
  assertValid('INVALID_PASSWORD', validatePassword(password));
  await assertEmailFree(prisma, normalized);
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalized, role: 'admin', passwordHash },
    select: PUBLIC_FIELDS,
  });
  return toPublic(user);
}

async function findAccountOrThrow(prisma, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AccountError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');
  return user;
}

async function resetPassword(prisma, userId, password) {
  await findAccountOrThrow(prisma, userId);
  assertValid('INVALID_PASSWORD', validatePassword(password));
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
}

const DELETE_REFUSALS = {
  CANNOT_DELETE_SELF: "You can't delete your own account.",
  PROTECTED_ACCOUNT: "The base admin account can't be deleted.",
  LAST_ADMIN: "You can't delete the last admin.",
};

async function deleteAccount(prisma, actorId, targetId) {
  const target = await findAccountOrThrow(prisma, targetId);
  const adminCount = await prisma.user.count({ where: { role: 'admin' } });
  const refusal = canDeleteAccount({ actorId, target, adminCount });
  if (refusal) throw new AccountError(409, refusal, DELETE_REFUSALS[refusal]);
  await prisma.$transaction([
    prisma.stepProgress.deleteMany({ where: { studentId: targetId } }),
    prisma.participation.deleteMany({ where: { studentId: targetId } }),
    prisma.session.deleteMany({ where: { userId: targetId } }),
    prisma.user.delete({ where: { id: targetId } }),
  ]);
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
  updateProfile,
  changePassword,
  listAccounts,
  createAdmin,
  resetPassword,
  deleteAccount,
};
