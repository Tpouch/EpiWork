const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const workshopRoutes = require('./routes/workshops');
const stepRoutes = require('./routes/steps');
const progressRoutes = require('./routes/progress');
const sessionRoutes = require('./routes/session');
const { attachUser } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', workshopRoutes);
app.use('/api', stepRoutes);
app.use('/api', progressRoutes);
app.use('/api', sessionRoutes);

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`EpiWork backend listening on :${PORT}`));
}

module.exports = app;
