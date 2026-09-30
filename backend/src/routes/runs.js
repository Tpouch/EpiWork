const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { listRuns, getRun } = require('../sessions/runs');

const router = express.Router();

router.get('/runs', requireAdmin, async (req, res) => {
  res.json(await listRuns(prisma));
});

router.get('/runs/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid run id.' });
  const run = await getRun(prisma, id);
  if (!run) return res.status(404).json({ error: 'Run not found.' });
  res.json(run);
});

module.exports = router;
