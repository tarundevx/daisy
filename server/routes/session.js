const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const hydraService = require('../services/hydraService');
const scenarioEngine = require('../services/scenarioEngine');
const { logEvent } = require('../services/eventLogger');
const { getIO } = require('../services/socketService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

router.post('/start', async (req, res) => {
  const sessionId = crypto.randomUUID();
  try {
    const { userId, candidateName, scenarioId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const targetScenarioId = scenarioId || 'prod_api_outage';
    const scenario = scenarioEngine.getScenario(targetScenarioId);

    try {
      // 1. Auto-cleanup: Mark any existing in_progress sessions for this user as abandoned
      await db.query(`
        UPDATE sessions SET status = 'abandoned', ended_at = NOW()
        WHERE user_id = $1 AND status = 'in_progress'
      `, [userId]);

      // 2. Create the session in rowstore FIRST (to satisfy FK constraints)
      await db.query(`
        INSERT INTO sessions (id, user_id, scenario_id, status, started_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [sessionId, userId, targetScenarioId, 'in_progress']);

      // 2. Log session start in columnar-ready event stream
      await logEvent(sessionId, 'session_start', { userId, scenarioId: targetScenarioId });
    } catch (dbErr) {
      console.warn("Database error during session start:", dbErr.message);
    }

    res.json({
      sessionId,
      scenario,
      startTime: Date.now()
    });
  } catch (error) {
    console.error('[/api/session/start] Error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/command', async (req, res) => {
  try {
    const { sessionId, userId, scenarioId, command, sessionState } = req.body;
    if (!scenarioId || !command) return res.status(400).json({ error: 'scenarioId and command required' });

    const result = scenarioEngine.evaluateCommand(scenarioId, command, sessionState || {});

    try {
      // Log command execution
      const eventPayload = { command, output: result.output ? result.output.substring(0, 100) : '' };
      
      // Override output with actual client terminal output if provided
      if (sessionState?.output) {
        eventPayload.output = sessionState.output.substring(0, 500); // Allow more context for AI
      }
      
      if (command === 'final_code_submission') {
        eventPayload.code = sessionState?.code;
        eventPayload.testsPassed = sessionState?.testsPassed;
      } else if (command === 'npm test') {
        eventPayload.testsPassed = sessionState?.passed;
        eventPayload.code = sessionState?.code;
      }
      await logEvent(sessionId, 'command_executed', eventPayload);
      
      // Real-time Push to Admins
      try {
        const io = getIO();
        io.to('admins').emit('SESSION_ACTIVITY', {
          sessionId,
          command,
          output: eventPayload.output,
          type: 'command'
        });
      } catch (e) {
        console.warn("Could not push real-time update:", e.message);
      }
    } catch (dbErr) {
      console.warn("Could not log command to database:", dbErr.message);
    }

    res.json({
      output: result.output,
      fixProgress: result.fixProgress,
      solved: result.solved,
      updatedSessionState: result.fixProgress
    });
  } catch (error) {
    console.error('[/api/session/command] Error:', error);
    res.status(500).json({ error: 'Failed to evaluate command' });
  }
});

// New: Live Follow-up Questioning
router.post('/follow-up', async (req, res) => {
  const { sessionId, code, explanation } = req.body;
  try {
    const prompt = `Analyze the following code and explanation from a candidate. Ask a single contextual follow-up question regarding complexity, trade-offs, edge cases, or alternative approaches. Be professional but challenging. 
    Code: ${code}
    Explanation: ${explanation}`;

    const result = await model.generateContent(prompt).catch(err => {
      console.warn("Gemini API Error (Follow-up):", err.message);
      return null;
    });

    let followUpQuestion = "Can you explain the most challenging part of this scenario and how you addressed it?";
    if (result && result.response) {
      const response = await result.response;
      followUpQuestion = response.text();
    }

    await logEvent(sessionId, 'follow_up_served', { question: followUpQuestion });

    res.json({ followUpQuestion });
  } catch (error) {
    console.error('Follow-up error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up', details: error.message });
  }
});

router.post('/end', async (req, res) => {
  try {
    const { userId, candidateName, sessionId, scenarioId, commandLog, sessionState, sessionNumber } = req.body;

    const stats = scenarioEngine.getSessionStats(commandLog || [], scenarioId);
    stats.solved = sessionState?.solved || false;

    // sessionData structure we need for logging
    const sessionData = {
      scenarioId,
      sessionNumber: sessionNumber || 1,
      solved: stats.solved,
      duration: stats.duration,
      commandsUsed: stats.commandsUsed,
      firstCommand: stats.firstCommand,
      totalCommands: stats.totalCommands,
      uniqueCommandCount: stats.uniqueCommandCount,
      usedJournalctl: stats.usedJournalctl,
      usedNginxTest: stats.usedNginxTest,
      usedDfH: stats.usedDfH
    };

    await hydraService.logSessionMemory(userId, candidateName, sessionData);

    try {
      // Update session status and score in rowstore
      await db.query(`
        UPDATE sessions 
        SET status = 'completed', score = $1, ended_at = NOW() 
        WHERE id = $2
      `, [stats.solved ? 100 : 0, sessionId]);

      // Log session end in columnar stream
      await logEvent(sessionId, 'session_ended', { userId, score: stats.solved ? 100 : 0 });

      // Real-time Push to Admins: Instantly remove from live count
      try {
        const io = getIO();
        io.to('admins').emit('CANDIDATE_DISCONNECTED', {
          sessionId,
          userId
        });
      } catch (e) {
        console.warn("Could not push real-time disconnect:", e.message);
      }
    } catch (dbErr) {
      console.warn("Could not update session record in database:", dbErr.message);
    }

    res.json({
      stats,
      memoryLogged: true
    });
  } catch (error) {
    console.error('[/api/session/end] Error:', error);
    res.status(500).json({ error: 'Failed to end session', details: error.toString(), stack: error.stack });
  }
});

module.exports = router;
