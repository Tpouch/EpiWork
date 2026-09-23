const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/workshops/:workshopId/steps', requireAdmin, async (req, res) => {
  const workshopId = Number(req.params.workshopId);
  const { title, content, isCheckpoint, questionType, questionPrompt, questionOptions } = req.body;
  const count = await prisma.step.count({ where: { workshopId } });
  const step = await prisma.step.create({
    data: {
      workshopId,
      order: count + 1,
      title,
      content: content || '',
      isCheckpoint: !!isCheckpoint,
      questionType: questionType || null,
      questionPrompt: questionPrompt || null,
      questionOptions: questionOptions ? JSON.stringify(questionOptions) : null,
    },
  });
  res.status(201).json(step);
});

router.patch('/steps/:id', requireAdmin, async (req, res) => {
  const { title, content, isCheckpoint, questionType, questionPrompt, questionOptions } = req.body;
  const step = await prisma.step.update({
    where: { id: Number(req.params.id) },
    data: {
      title,
      content,
      isCheckpoint,
      questionType: questionType || null,
      questionPrompt: questionPrompt || null,
      questionOptions: questionOptions ? JSON.stringify(questionOptions) : null,
    },
  });
  res.json(step);
});

router.delete('/steps/:id', requireAdmin, async (req, res) => {
  await prisma.stepProgress.deleteMany({ where: { stepId: Number(req.params.id) } });
  await prisma.step.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;
