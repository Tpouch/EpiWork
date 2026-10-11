const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { checkFields } = require('../workshops/checkFields');
const { deleteStep } = require('../workshops/content');
const router = express.Router();

router.patch('/steps/:id', requireAdmin, async (req, res) => {
  const { data, error } = checkFields(req.body ?? {});
  if (error) return res.status(400).json({ error });
  res.json(await prisma.step.update({ where: { id: Number(req.params.id) }, data }));
});

router.delete('/steps/:id', requireAdmin, async (req, res) => {
  await deleteStep(prisma, Number(req.params.id));
  res.status(204).end();
});

module.exports = router;
