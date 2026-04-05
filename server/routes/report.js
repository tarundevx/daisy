const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Generate and Fetch Report
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  // Validate UUID format to prevent Postgres errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!sessionId || sessionId === "null" || !uuidRegex.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }

  try {
    // 1. Fetch existing session data
    const sessionRes = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessionRes.rows[0];

    // If report already generated and NOT refreshing, return it
    if (session.summary_json && req.query.refresh !== 'true') return res.json(session.summary_json);

    // 2. Fetch all events for AI analysis
    const eventsRes = await db.query(
      'SELECT event_type, event_data, created_at FROM session_events WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const events = eventsRes.rows;

    // 3. AI Analysis to generate report card
    const prompt = `You are a Senior Technical Interviewer. Analyze these session events from a candidate's ${session.scenario_id} assessment.
    
    1. Look in the events for an event where event_data.command is 'final_code_submission'. If found, evaluate the 'code' in the event_data for:
       - Correctness (logic, edge cases)
       - Complexity (Big O)
       - Style (readability, modern JS)
    2. If there are other 'command_executed' events, evaluate:
       - Debugging strategy (systematic vs random)
       - Tool knowledge (journalctl, curl, netstat, etc.)
    3. Generate a structured JSON report.
    
    CRITICAL INSTRUCTION: You MUST populate 'strengths', 'areas', and 'topics' with at least 1-3 string items each. NEVER leave them empty. If the code was perfect, find areas for slight optimization. If the code was terrible, find strengths in their attempt.
    
    Format:
    {
      "correctness": number, 
      "timeComplexity": number, 
      "communication": number, 
      "edgeCaseHandling": number,
      "strengths": ["string"], 
      "areas": ["string"], 
      "topics": ["string"]
    }
    
    Events: ${JSON.stringify(events)}
    
    Return ONLY pure JSON.`;

    let reportData;
    try {
      const aiRes = await model.generateContent(prompt);
      const response = await aiRes.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      reportData = JSON.parse(text);
    } catch (e) {
      console.warn("AI Report Generation failed for session:", sessionId, "Error:", e.message);
      reportData = {
        correctness: 0, timeComplexity: 0, communication: 0, edgeCaseHandling: 0,
        strengths: ["Analysis currently unavailable. Please check backend logs."],
        areas: ["Ensure Gemini API key is valid and model 'gemini-3-flash-preview' is supported in your region."],
        topics: ["General Assessment"]
      };
    }

    // 4. Persistence
    await db.query('UPDATE sessions SET summary_json = $1, status = \'completed\', ended_at = NOW() WHERE id = $2', [reportData, sessionId]);

    res.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
