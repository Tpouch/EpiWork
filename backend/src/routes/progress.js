const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');
const { ensureProgress, submitAnswer, toggleHelp } = require('../progress/stateMachine');
const router = express.Router();

router.get('/me/workshops/:id', requireUser, async (req, res) => {
  const workshopId = Number(req.params.id);
  const rows = await ensureProgress(prisma, workshopId, req.user.id);
  res.json(rows);
});

router.post('/steps/:id/submit', requireUser, async (req, res) => {
  try {
    const result = await submitAnswer(prisma, Number(req.params.id), req.user.id, req.body.answer ?? null);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/help', requireUser, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), req.user.id, true);
  res.json(result);
});

module.exports = router;
