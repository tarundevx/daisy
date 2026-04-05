const db = require('../db');

/**
 * Log a meaningful interview event to the columnar session_events table.
 * @param {string} sessionId - UUID of the session
 * @param {string} eventType - Type of event 
 * @param {object} eventData - JSON data related to the event
 */
async function logEvent(sessionId, eventType, eventData = {}) {
  try {
    const query = `
      INSERT INTO session_events (session_id, event_type, event_data)
      VALUES ($1, $2, $3)
    `;
    await db.query(query, [sessionId, eventType, eventData]);
  } catch (err) {
    console.error(`[EventLogger] Failed to log ${eventType}:`, err.message);
    // Do not throw, keep the session alive
  }
}

module.exports = { logEvent };
