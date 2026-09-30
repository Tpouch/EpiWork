const { nameFromEpitechEmail } = require('../sessions/joinIdentity');

const DEFAULT_ADMIN_EMAIL = 'admin@devgoblin.fr';
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Names only: the frontend owns the exact colors (all readable with dark text).
const ACCENT_COLORS = ['lime', 'yellow', 'orange', 'pink', 'violet', 'cyan', 'green'];

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

function validateAccentColor(color) {
  return ACCENT_COLORS.includes(color) ? null : 'Pick one of the available accent colors.';
}

// The default admin is the account of last resort: only its password may change.
function isProtectedAccount(user) {
  return user?.email === DEFAULT_ADMIN_EMAIL;
}

function canDeleteAccount({ actorId, target, adminCount }) {
  if (target.id === actorId) return 'CANNOT_DELETE_SELF';
  if (isProtectedAccount(target)) return 'PROTECTED_ACCOUNT';
  if (target.role === 'admin' && adminCount <= 1) return 'LAST_ADMIN';
  return null;
}

function signupKind(email, existingUser) {
  if (existingUser?.passwordHash) return 'login';
  if (existingUser && existingUser.role !== 'student') return 'forbidden';
  return nameFromEpitechEmail(email) ? 'signup' : 'forbidden';
}

module.exports = {
  DEFAULT_ADMIN_EMAIL,
  validatePassword,
  validateName,
  isEmail,
  isProtectedAccount,
  ACCENT_COLORS,
  validateAccentColor,
  canDeleteAccount,
  signupKind,
};
