const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { requireAdmin } = require('../middleware/auth');
const { ALLOWED_TYPES, MAX_BYTES, newUploadName, isUploadName, uploadError } = require('../uploads/uploads');
const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

router.post(
  '/uploads',
  requireAdmin,
  express.raw({ type: ALLOWED_TYPES, limit: MAX_BYTES }),
  async (req, res) => {
    const contentType = req.headers['content-type'];
    const size = Buffer.isBuffer(req.body) ? req.body.length : 0;
    const error = uploadError(contentType, size);
    if (error) return res.status(400).json({ error });
    const name = newUploadName(contentType);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), req.body);
    res.status(201).json({ url: `/api/uploads/${name}` });
  },
);

// Public on purpose: <img> tags cannot send the bearer token, and names are unguessable.
router.get('/uploads/:name', (req, res) => {
  if (!isUploadName(req.params.name)) return res.status(404).json({ error: 'Image not found.' });
  res.sendFile(path.join(UPLOAD_DIR, req.params.name), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: 'Image not found.' });
  });
});

module.exports = router;
