const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // load from root

const { initializeTenant, seedKnowledgeBase } = require('./services/hydraService');

const sessionRoutes = require('./routes/session');
const reportRoutes = require('./routes/report');
const scenarioRoutes = require('./routes/scenario');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/scenario', scenarioRoutes);

app.get('/health', (req, res) => res.send('Daisy Backend OK'));

// Server Startup
(async () => {
  try {
    console.log("Starting backend...");
    await initializeTenant();
    await seedKnowledgeBase();
    console.log("Database initialized. 5 scenarios loaded.");
  } catch (err) {
    console.error("HydraDB boot error. Server will continue.", err);
  }

  app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });
})();

// Prevent unhandled rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
