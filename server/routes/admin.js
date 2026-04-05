const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admin role required' });
  }
};

// Apply auth AND checkAdmin to all routes in this router
router.use(auth);
router.use(checkAdmin);

// 1. Fetch All Sessions (with candidate details)
router.get('/sessions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, u.name as candidate_name, u.email as candidate_email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.started_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Sessions Error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// 2. Fetch User Summary (Candidates)
router.get('/candidates', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.created_at,
             COUNT(s.id) as total_sessions,
             AVG(s.score) FILTER (WHERE s.status = 'completed') as avg_score,
             (SELECT id FROM sessions WHERE user_id = u.id ORDER BY started_at DESC LIMIT 1) as latest_session_id
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      WHERE u.role = 'candidate'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Fetch Candidates Error:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// 3. Live Monitoring (Now strictly for candidates)
router.get('/live', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.id, u.name as candidate_name, s.scenario_id, s.started_at,
             (SELECT event_type FROM session_events WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_event,
             (SELECT created_at FROM session_events WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_event_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'in_progress'
      AND u.role = 'candidate'
      AND EXISTS (
        SELECT 1 FROM session_events 
        WHERE session_id = s.id 
        AND created_at > NOW() - INTERVAL '10 minutes'
      )
      ORDER BY s.started_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Live Monitor Error:', err);
    res.status(500).json({ error: 'Failed to fetch live data' });
  }
});

module.exports = router;
