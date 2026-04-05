const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!sessionId || sessionId === "null" || !uuidRegex.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }

  try {
    const sessionRes = await db.query(`
      SELECT s.*, u.name as candidate_name 
      FROM sessions s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = $1
    `, [sessionId]);

    if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessionRes.rows[0];

    const eventsRes = await db.query(
      'SELECT event_type, event_data, created_at FROM session_events WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    const events = eventsRes.rows;

    let reportData = session.summary_json;

    if (!reportData || req.query.refresh === 'true') {
      const prompt = `You are a Senior Technical Engineering Manager. Analyze this candidate's interactive coding session. You will receive a history of their 'npm test' and 'final_code_submission' events containing their code iterations and terminal outputs.
      
      Look at their sequence of actions. Did they struggle and iterate with many failing 'npm test' runs, or did they instantly write confident code and submit it? 
      Analyze their ACTUAL behavioral workflow based on the raw terminal 'output' recorded. Are they systematically debugging errors step-by-step by reading the errors, or brute-forcing/spamming 'Submit'?
      Generate highly niche, tailored insights based strictly on how they behaved during the session relative to the test outputs.
      
      CRITICAL INSTRUCTION: You MUST populate 'strengths', 'areas', and 'topics' with at least 1-3 highly personalized behavioral or technical string items each. NEVER leave them empty.
      
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

      await db.query('UPDATE sessions SET summary_json = $1, status = \'completed\', ended_at = COALESCE(ended_at, NOW()) WHERE id = $2', [reportData, sessionId]);
      
      if (!session.ended_at) session.ended_at = new Date();
    }

    const durationMs = new Date(session.ended_at || new Date()).getTime() - new Date(session.started_at).getTime();
    const minutes = Math.max(0, Math.floor(durationMs / 60000));
    const seconds = Math.max(0, Math.floor((durationMs % 60000) / 1000));
    const durationString = `${minutes}m ${seconds}s`;

    const detailedLog = events.map((e, index) => {
      const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data || '{}') : (e.event_data || {});
      const command = data.command || e.event_type;
      
      let status = 'Logged';
      const isPassed = data.testsPassed === true || data.passed === true || data.solved === true || 
                      (data.sessionState && (data.sessionState.passed === true || data.sessionState.testsPassed === true || data.sessionState.solved === true));
                      
      const isFailed = data.testsPassed === false || data.passed === false || data.solved === false || 
                      (data.sessionState && (data.sessionState.passed === false || data.sessionState.testsPassed === false || data.sessionState.solved === false));

      if (isPassed) {
        status = 'Passed';
      } else if (isFailed) {
        status = 'Failed';
      } else if (e.event_type === 'command') {
        status = 'Executed';
      }

      const msSinceStart = new Date(e.created_at).getTime() - new Date(session.started_at).getTime();
      const sSinceStart = Math.max(0, Math.floor(msSinceStart / 1000));
      const mSinceStart = Math.max(0, Math.floor(sSinceStart / 60));
      const timeStr = mSinceStart > 0 ? `+${mSinceStart}m ${sSinceStart % 60}s` : `+${sSinceStart}s`;

      return {
        label: command,
        status: status,
        time: timeStr
      };
    });

    const isCode = session.scenario_id === 'rate_limiter';

    const fullReport = {
      candidateName: session.candidate_name || 'Anonymous',
      date: new Date(session.started_at).toISOString().split('T')[0],
      assessment: {
        title: session.scenario_id ? session.scenario_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Assessment',
        type: isCode ? 'code_sandbox' : 'feature_sandbox',
        duration: durationString,
      },
      metrics: {
        overallScore: Math.round(((reportData.correctness || 0) + (reportData.timeComplexity || 0) + (reportData.edgeCaseHandling || 0)) / 3) || reportData.correctness || 0,
        testsPassed: isCode ? `${detailedLog.filter(l => l.status === 'Passed' || l.status === 'success').length}/${Math.max(1, detailedLog.filter(l => l.status === 'Passed' || l.status === 'Failed' || l.status === 'success').length)}` : null,
        commandsUsed: events.length,
        efficiency: reportData.timeComplexity ? `${reportData.timeComplexity}%` : "N/A",
      },
      insights: {
        strengths: reportData.strengths || [],
        growth: reportData.areas || []
      },
      detailedLog: detailedLog
    };

    res.json(fullReport);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
