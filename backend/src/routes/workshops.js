const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

const ORDERED = { orderBy: { order: 'asc' } };

function isValidIcon(icon) {
  return typeof icon === 'string' && icon.trim() !== '' && icon.length <= 16;
}

router.get('/workshops', requireAdmin, async (req, res) => {
  const workshops = await prisma.workshop.findMany({
    include: {
      steps: ORDERED,
      sections: ORDERED,
      docPages: { select: { id: true } },
      _count: { select: { participations: true } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(workshops);
});

router.get('/workshops/:id', requireAdmin, async (req, res) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id: Number(req.params.id) },
    include: { steps: ORDERED, sections: ORDERED, docPages: ORDERED },
  });
  if (!workshop) return res.status(404).json({ error: 'Workshop not found.' });
  res.json(workshop);
});

router.post('/workshops', requireAdmin, async (req, res) => {
  const { title, description, icon } = req.body ?? {};
  if (!String(title ?? '').trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
  if (icon !== undefined && !isValidIcon(icon)) return res.status(400).json({ error: 'Icon must be a single emoji.' });
  const workshop = await prisma.workshop.create({
    data: { title: title.trim(), description: description?.trim() || '', ...(icon ? { icon } : {}) },
  });
  res.status(201).json(workshop);
});

router.patch('/workshops/:id', requireAdmin, async (req, res) => {
  const { title, description, icon } = req.body ?? {};
  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }
  if (icon !== undefined && !isValidIcon(icon)) {
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
  await prisma.$transaction([
    prisma.participation.deleteMany({ where: { workshopId } }),
    prisma.stepProgress.deleteMany({ where: { step: { workshopId } } }),
    prisma.step.deleteMany({ where: { workshopId } }),
    prisma.workshop.delete({ where: { id: workshopId } }),
  ]);
  res.status(204).end();
});

module.exports = router;
