const { createHash, randomBytes } = require('node:crypto');

function newToken() {
  return randomBytes(32).toString('hex');
}

// Only the hash is stored, so a leaked database does not leak usable tokens.
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

module.exports = { newToken, hashToken };
