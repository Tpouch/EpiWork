const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const accountRoutes = require('./routes/accounts');
const workshopRoutes = require('./routes/workshops');
const stepRoutes = require('./routes/steps');
const sectionRoutes = require('./routes/sections');
const docRoutes = require('./routes/docs');
const uploadRoutes = require('./routes/uploads');
const progressRoutes = require('./routes/progress');
const sessionRoutes = require('./routes/session');
const runRoutes = require('./routes/runs');
const { attachUser } = require('./middleware/auth');
const { ensureDefaultAdmin } = require('./accounts/accounts');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', meRoutes);
app.use('/api', accountRoutes);
app.use('/api', workshopRoutes);
app.use('/api', stepRoutes);
app.use('/api', sectionRoutes);
app.use('/api', docRoutes);
app.use('/api', uploadRoutes);
app.use('/api', progressRoutes);
app.use('/api', sessionRoutes);
app.use('/api', runRoutes);

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
