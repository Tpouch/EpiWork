const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const router = express.Router();

router.get('/workshops', requireUser, async (req, res) => {
  const workshops = await prisma.workshop.findMany({
    include: {
      steps: { orderBy: { order: 'asc' } },
      _count: { select: { participations: true } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(workshops);
});

router.post('/workshops', requireAdmin, async (req, res) => {
  const { title, description } = req.body;
  const workshop = await prisma.workshop.create({ data: { title, description: description || '' } });
  res.status(201).json(workshop);
});

router.patch('/workshops/:id', requireAdmin, async (req, res) => {
  const { title, description, icon } = req.body ?? {};
  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }
  if (icon !== undefined && (typeof icon !== 'string' || !icon.trim() || icon.length > 16)) {
    return res.status(400).json({ error: 'Icon must be a single emoji.' });
  }
  const workshop = await prisma.workshop.update({
    where: { id: Number(req.params.id) },
    data: { title, description, icon },
  });
  res.json(workshop);
});

router.delete('/workshops/:id', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.id);
  await prisma.participation.deleteMany({ where: { workshopId } });
  await prisma.stepProgress.deleteMany({ where: { step: { workshopId } } });
  await prisma.step.deleteMany({ where: { workshopId } });
  await prisma.workshop.delete({ where: { id: workshopId } });
  res.status(204).end();
});

module.exports = router;
