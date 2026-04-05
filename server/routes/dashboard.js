const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');

// Get Dashboard Stats 
router.get('/stats', auth, async (req, res) => {
  const userId = req.user.userId;
  try {
    // 1. Avg score by Topic (Scenario)
    const topicStatsQuery = `
      SELECT scenario_id, AVG(score) as avg_score, COUNT(*) as session_count
      FROM sessions
      WHERE user_id = $1 AND status = 'completed'
      GROUP BY scenario_id
    `;
    const topicStats = await db.query(topicStatsQuery, [userId]);

    // 2. Weekly Progress (Sessions by day/week)
    const progressQuery = `
      SELECT DATE_TRUNC('day', started_at) as day, AVG(score) as avg_score, COUNT(*) as sessions
      FROM sessions
      WHERE user_id = $1 AND status = 'completed' AND score IS NOT NULL
      GROUP BY day
      ORDER BY day ASC
      LIMIT 14
    `;
    const progressStats = await db.query(progressQuery, [userId]);

    // 3. Event Summary (Demonstrating columnar access)
    // Querying session_events for hint usage
    const hintUsageQuery = `
      SELECT COUNT(*) as total_hints
      FROM session_events
      WHERE event_type = 'hint_requested'
      AND session_id IN (SELECT id FROM sessions WHERE user_id = $1)
    `;
    const hintUsage = await db.query(hintUsageQuery, [userId]);

    res.json({
      topics: topicStats.rows,
      progress: progressStats.rows,
      hints: hintUsage.rows[0]?.total_hints || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get Session History
router.get('/history', auth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 20',
      [userId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
