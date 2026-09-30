const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');
const { updateProfile, changePassword } = require('../accounts/accounts');
const { sendAccountError } = require('./sendAccountError');

const router = express.Router();

router.get('/me', requireUser, (req, res) => {
  res.json(req.user);
});

router.patch('/me', requireUser, async (req, res) => {
  const { name, email } = req.body ?? {};
  try {
    res.json(await updateProfile(prisma, req.user, { name, email }));
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.post('/me/password', requireUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  try {
    await changePassword(prisma, { userId: req.user.id, sessionId: req.sessionId }, { currentPassword, newPassword });
    res.status(204).end();
  } catch (err) {
    sendAccountError(res, err);
  }
});

module.exports = router;
