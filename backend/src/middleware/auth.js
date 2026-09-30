const prisma = require('../db');
const { findSessionByToken } = require('../accounts/accounts');

function bearerToken(header) {
  const match = /^Bearer (\S+)$/.exec(header ?? '');
  return match ? match[1] : null;
}

async function attachUser(req, res, next) {
  const token = bearerToken(req.header('authorization'));
  const session = token ? await findSessionByToken(prisma, token) : null;
  req.user = session?.user ?? null;
  req.sessionId = session?.sessionId ?? null;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
}

module.exports = { attachUser, requireAdmin, requireUser };
