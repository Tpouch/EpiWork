const crypto = require('node:crypto');

// Scheme shared with the student's `check` script. Do not change the formats:
//   ID   = HMAC(secret, "id|<slug>|<login>")   hex[:12] upper
//   K    = HMAC(secret, "key|<ID>")            hex[:32]
//   flag = HMAC(K, "flag|<slug>|<exo>")        hex[:16], printed as EPI{...}

function hmacHex(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

function normalizeId(code) {
  return String(code ?? '').replaceAll(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

function groupsOf(text, size) {
  return text.match(new RegExp(`.{1,${size}}`, 'g')).join('-');
}

function makeId(secret, slug, login) {
  return hmacHex(secret, `id|${slug}|${login.trim().toLowerCase()}`).slice(0, 12).toUpperCase();
}

function makeKey(secret, id) {
  return hmacHex(secret, `key|${normalizeId(id)}`).slice(0, 32);
}

function makeFlag(key, slug, exo) {
  return `EPI{${hmacHex(key, `flag|${slug}|${exo}`).slice(0, 16)}}`;
}

function formatId(id) {
  return groupsOf(id, 4);
}

function formatPair(key) {
  return groupsOf(key, 8);
}

function sameText(expected, submitted) {
  const a = Buffer.from(expected);
  const b = Buffer.from(submitted);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyFlag(secret, slug, login, exo, submitted) {
  const key = makeKey(secret, makeId(secret, slug, login));
  return sameText(makeFlag(key, slug, exo), String(submitted ?? '').trim());
}

module.exports = { normalizeId, makeId, makeKey, makeFlag, formatId, formatPair, verifyFlag };
