require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const importRoutes = require('./routes/importRoutes');
const liveSessionRoutes = require('./routes/liveSessionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const worshipFlowRoutes = require('./routes/worshipFlowRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/import', importRoutes);
app.use('/api/live', liveSessionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/flows', worshipFlowRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: 'v3'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'Psalms API v3' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Psalms API v3' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
