const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hydraService = require('../services/hydraService');
const scenarioEngine = require('../services/scenarioEngine');

router.post('/start', async (req, res) => {
  try {
    const { userId, candidateName, scenarioId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    await hydraService.initializeTenant();
    
    // Simplification for the hackathon endpoint — if no scenarioId is provided,
    // we would actually call the AI service. But for direct testing as required:
    const targetScenarioId = scenarioId || 'nginx_502';
    const scenario = scenarioEngine.getScenario(targetScenarioId);
    
    // We don't send the raw commandMap back to the frontend in a real app,
    // but the getScenario helper returns the full object.
    const sessionId = crypto.randomUUID();

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

router.post('/command', (req, res) => {
  try {
    const { sessionId, userId, scenarioId, command, sessionState } = req.body;
    if (!scenarioId || !command) return res.status(400).json({ error: 'scenarioId and command required' });

    const result = scenarioEngine.evaluateCommand(scenarioId, command, sessionState || {});
    
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
