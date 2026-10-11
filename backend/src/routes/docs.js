const express = require('express');
const prisma = require('../db');
const { requireAdmin, requireUser } = require('../middleware/auth');
const router = express.Router();

async function canRead(user, workshopId) {
  if (user.role === 'admin') return true;
  const participation = await prisma.participation.findUnique({
    where: { studentId_workshopId: { studentId: user.id, workshopId } },
  });
  return Boolean(participation);
}

router.get('/workshops/:id/docs', requireUser, async (req, res) => {
  const workshopId = Number(req.params.id);
  if (!(await canRead(req.user, workshopId))) return res.status(404).json({ error: 'Workshop not found.' });
  res.json(await prisma.docPage.findMany({ where: { workshopId }, orderBy: { order: 'asc' } }));
});

router.post('/workshops/:id/docs', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.id);
  const order = (await prisma.docPage.count({ where: { workshopId } })) + 1;
  const title = String(req.body?.title ?? '').trim() || 'New page';
  const content = String(req.body?.content ?? '');
  res.status(201).json(await prisma.docPage.create({ data: { workshopId, order, title, content } }));
});

router.patch('/docs/:id', requireAdmin, async (req, res) => {
  const { title, content } = req.body ?? {};
  if (title !== undefined && !String(title).trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
  const data = {};
  if (title !== undefined) data.title = String(title).trim();
  if (content !== undefined) data.content = String(content);
  res.json(await prisma.docPage.update({ where: { id: Number(req.params.id) }, data }));
});

router.delete('/docs/:id', requireAdmin, async (req, res) => {
  const page = await prisma.docPage.delete({ where: { id: Number(req.params.id) } });
  const rest = await prisma.docPage.findMany({ where: { workshopId: page.workshopId }, orderBy: { order: 'asc' } });
  await prisma.$transaction(rest.map((doc, index) => prisma.docPage.update({ where: { id: doc.id }, data: { order: index + 1 } })));
  res.status(204).end();
});

module.exports = router;
