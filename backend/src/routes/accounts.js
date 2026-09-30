const express = require('express');
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { listAccounts, createAdmin, resetPassword, deleteAccount } = require('../accounts/accounts');
const { sendAccountError } = require('./sendAccountError');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function invalidId(res) {
  res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid account id.' } });
}

router.get('/accounts', requireAdmin, async (req, res) => {
  res.json(await listAccounts(prisma));
});

router.post('/accounts', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body ?? {};
  try {
    res.status(201).json(await createAdmin(prisma, { name, email, password }));
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.post('/accounts/:id/password', requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return invalidId(res);
  try {
    await resetPassword(prisma, id, req.body?.password);
    res.status(204).end();
  } catch (err) {
    sendAccountError(res, err);
  }
});

router.delete('/accounts/:id', requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return invalidId(res);
  try {
    await deleteAccount(prisma, req.user.id, id);
    res.status(204).end();
  } catch (err) {
    sendAccountError(res, err);
  }
});

module.exports = router;
