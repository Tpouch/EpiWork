const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const { ensureProgress, submitAnswer, unlockStep, toggleHelp } = require('../progress/stateMachine');
const { PUBLIC_FIELDS } = require('../accounts/accounts');
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

router.post('/steps/:id/unlock', requireAdmin, async (req, res) => {
  try {
    const result = await unlockStep(prisma, Number(req.params.id), Number(req.body.studentId));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/steps/:id/resolve-help', requireAdmin, async (req, res) => {
  const result = await toggleHelp(prisma, Number(req.params.id), Number(req.body.studentId), false);
  res.json(result);
});

router.get('/workshops/:id/progress', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.id);
  const students = await prisma.user.findMany({ where: { role: 'student' }, select: PUBLIC_FIELDS });
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  const data = await Promise.all(
    students.map(async (student) => ({
      student,
      progress: await ensureProgress(prisma, workshopId, student.id),
    }))
  );
  res.json({ steps, students: data });
});

router.get('/admin/feed', requireAdmin, async (req, res) => {
  const rows = await prisma.stepProgress.findMany({
    where: { OR: [{ status: 'pending_review' }, { helpRequested: true }] },
    include: { step: { include: { workshop: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  const students = await prisma.user.findMany({ where: { role: 'student' }, select: PUBLIC_FIELDS });
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const feed = rows.map((row) => ({
    student: byId[row.studentId],
    workshopTitle: row.step.workshop.title,
    stepTitle: row.step.title,
    type: row.helpRequested ? 'help' : 'review',
    updatedAt: row.updatedAt,
  }));
  res.json(feed);
});

module.exports = router;
