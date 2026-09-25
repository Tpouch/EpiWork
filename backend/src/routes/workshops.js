const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const router = express.Router();

router.get('/workshops', requireUser, async (req, res) => {
  const workshops = await prisma.workshop.findMany({
    include: { steps: { orderBy: { order: 'asc' } } },
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
  const { title, description } = req.body;
  const workshop = await prisma.workshop.update({
    where: { id: Number(req.params.id) },
    data: { title, description },
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
