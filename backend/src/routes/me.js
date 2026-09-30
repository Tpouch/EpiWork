const express = require('express');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireUser, (req, res) => {
  res.json(req.user);
});

module.exports = router;
