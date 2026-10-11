const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { createSection, createStepInSection, deleteSection } = require('../workshops/content');
const router = express.Router();

function titleFrom(body) {
  return String(body?.title ?? '').trim();
}

router.post('/workshops/:id/sections', requireAdmin, async (req, res) => {
  const title = titleFrom(req.body) || 'New step';
  res.status(201).json(await createSection(prisma, Number(req.params.id), title));
});

router.patch('/sections/:id', requireAdmin, async (req, res) => {
  const title = titleFrom(req.body);
  if (!title) return res.status(400).json({ error: 'Title cannot be empty.' });
  res.json(await prisma.section.update({ where: { id: Number(req.params.id) }, data: { title } }));
});

router.delete('/sections/:id', requireAdmin, async (req, res) => {
  await deleteSection(prisma, Number(req.params.id));
  res.status(204).end();
});

router.post('/sections/:id/steps', requireAdmin, async (req, res) => {
  res.status(201).json(await createStepInSection(prisma, Number(req.params.id)));
});

module.exports = router;
