const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  res.json(users);
});

router.post('/login', async (req, res) => {
  const { userId } = req.body;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
