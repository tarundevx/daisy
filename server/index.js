const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initSocket } = require('./services/socketService');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initializeTenant, seedKnowledgeBase } = require('./services/hydraService');

const sessionRoutes = require('./routes/session');
const reportRoutes = require('./routes/report');
const scenarioRoutes = require('./routes/scenario');
const dashboardRoutes = require('./routes/dashboard');
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/scenario', scenarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.send('Daisy Backend OK'));

// Server Startup visualization
(async () => {
  if (process.env.SKIP_INIT !== 'true') {
    try {
      console.log("Starting backend initialization...");
      await initializeTenant();
      // Run seeding in background so server can start immediately
      seedKnowledgeBase().then(() => console.log("Knowledge base seeded."));
      console.log("Database initialized (seeding in background).");
    } catch (err) {
      console.error("HydraDB boot error. Server will continue.", err);
    }
  }

  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`Server ready on port ${PORT} (WebSockets enabled)`);
    });
  }
})();

// Export for Vercel Serverless Functions
module.exports = app;
