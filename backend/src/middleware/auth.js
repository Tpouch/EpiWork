const prisma = require('../db');

async function attachUser(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    req.user = null;
    return next();
  }
  req.user = await prisma.user.findUnique({ where: { id: Number(userId) } });
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
