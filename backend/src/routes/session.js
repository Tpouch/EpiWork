const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const {
  SessionError,
  getSessionOverview,
  launchWorkshop,
  endWorkshop,
  checkJoinCode,
  joinActiveWorkshop,
  activeSessionProgress,
} = require('../sessions/session');

const router = express.Router();

function sendSessionError(res, err) {
  if (!(err instanceof SessionError)) throw err;
  res.status(err.status).json({ error: err.message });
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/session', requireAdmin, async (req, res) => {
  res.json(await getSessionOverview(prisma));
});

router.get('/session/progress', requireAdmin, async (req, res) => {
  res.json(await activeSessionProgress(prisma));
});

router.post('/workshops/:id/launch', requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid workshop id.' });
  try {
    res.json(await launchWorkshop(prisma, id));
  } catch (err) {
    sendSessionError(res, err);
  }
});

router.post('/workshops/:id/end', requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid workshop id.' });
  try {
    await endWorkshop(prisma, id);
    res.status(204).end();
  } catch (err) {
    sendSessionError(res, err);
  }
});

router.get('/join/:code', requireUser, async (req, res) => {
  try {
    res.json(await checkJoinCode(prisma, { code: req.params.code, student: req.user }));
  } catch (err) {
    sendSessionError(res, err);
  }
});

router.post('/join', requireUser, async (req, res) => {
  try {
    res.json(await joinActiveWorkshop(prisma, { code: req.body?.code, student: req.user }));
  } catch (err) {
    sendSessionError(res, err);
  }
});

module.exports = router;
