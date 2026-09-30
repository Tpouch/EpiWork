const { nameFromEpitechEmail } = require('../sessions/joinIdentity');

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function validateName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  return null;
}

function isEmail(email) {
  return typeof email === 'string' && EMAIL_SHAPE.test(email);
}

function canDeleteAccount({ actorId, target, adminCount }) {
  if (target.id === actorId) return 'CANNOT_DELETE_SELF';
  if (target.role === 'admin' && adminCount <= 1) return 'LAST_ADMIN';
  return null;
}

function signupKind(email, existingUser) {
  if (existingUser?.passwordHash) return 'login';
  if (existingUser && existingUser.role !== 'student') return 'forbidden';
  return nameFromEpitechEmail(email) ? 'signup' : 'forbidden';
}

module.exports = { validatePassword, validateName, isEmail, canDeleteAccount, signupKind };
