const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const workshopRoutes = require('./routes/workshops');
const stepRoutes = require('./routes/steps');
const progressRoutes = require('./routes/progress');
const sessionRoutes = require('./routes/session');
const { attachUser } = require('./middleware/auth');
const { ensureDefaultAdmin } = require('./accounts/accounts');

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', meRoutes);
app.use('/api', workshopRoutes);
app.use('/api', stepRoutes);
app.use('/api', progressRoutes);
app.use('/api', sessionRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  const result = await ensureDefaultAdmin(prisma, process.env.ADMIN_PASSWORD);
  if (result === 'missing-password') {
    console.warn('ADMIN_PASSWORD is not set: the default admin account was not created.');
  }
  app.listen(PORT, () => console.log(`EpiWork backend listening on :${PORT}`));
}

if (require.main === module) {
  start();
}

module.exports = app;
