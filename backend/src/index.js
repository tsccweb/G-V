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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
  res.json({ message: 'Psalms API v3' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
