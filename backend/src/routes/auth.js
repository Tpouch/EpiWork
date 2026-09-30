const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');
const { lookupEmail, login, signup, logout } = require('../accounts/accounts');
const { sendAccountError } = require('./sendAccountError');

const router = express.Router();

router.post('/auth/lookup', async (req, res) => {
  try {
    res.json(await lookupEmail(prisma, req.body?.email));
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  try {
    res.json(await login(prisma, { email, password }));
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body ?? {};
  try {
    res.status(201).json(await signup(prisma, { email, password }));
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.post('/auth/logout', requireUser, async (req, res) => {
  await logout(prisma, req.sessionId);
  res.status(204).end();
});

module.exports = router;
