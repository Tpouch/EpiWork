const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(plain, salt, KEY_LENGTH);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash ?? '', 'hex');
  if (scheme !== 'scrypt' || !salt || expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(plain, salt, KEY_LENGTH);
  return timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
