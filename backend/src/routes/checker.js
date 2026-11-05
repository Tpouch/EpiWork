const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const { CheckerError, getMyCheckerSetup, configureFromId, listCheckerStudents, checkerTool } = require('../checker/checkerService');
const router = express.Router();

function sendCheckerError(res, err) {
  if (!(err instanceof CheckerError)) throw err;
  res.status(err.status).json({ error: err.message });
}

// Called by the student's `check` script (form body, plain text answer).
router.post('/checker/config', express.urlencoded({ extended: false }), async (req, res) => {
  res.type('text/plain');
  try {
    res.send(`OK ${await configureFromId(prisma, req.body?.id)}`);
  } catch (err) {
    if (!(err instanceof CheckerError)) throw err;
    res.status(err.status).send(`ERR ${err.message}`);
  }
});

router.get('/me/workshops/:id/checker', requireUser, async (req, res) => {
  try {
    res.json(await getMyCheckerSetup(prisma, Number(req.params.id), req.user.id));
  } catch (err) {
    sendCheckerError(res, err);
  }
});

router.get('/workshops/:id/checker', requireAdmin, async (req, res) => {
  res.json(await listCheckerStudents(prisma, Number(req.params.id)));
});

router.post('/admin/checker/tool', requireAdmin, (req, res) => {
  const { slug, login, exo } = req.body ?? {};
  try {
    res.json(checkerTool({ slug, login, exo: exo || null }));
  } catch (err) {
    sendCheckerError(res, err);
  }
});

module.exports = router;
