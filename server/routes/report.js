const express = require('express');
const router = express.Router();
const hydraService = require('../services/hydraService');
const aiService = require('../services/aiService');

router.post('/generate', async (req, res) => {
  try {
    const { userId, candidateName, sessionData, sessionNumber } = req.body;
    if (!userId || !sessionData) return res.status(400).json({ error: 'userId and sessionData required' });

    console.log(`[Report] Recalling history...`);
    const candidateHistory = await hydraService.recallCandidateMemories(userId, "debugging patterns weak areas behaviors");
    
    console.log(`[Report] Recalling rubric...`);
    const rubric = await hydraService.recallScenarioRubric(sessionData.scenarioId);

    console.log(`[Report] Generating AI Report...`);
    const report = await aiService.generateReport(sessionData, candidateHistory, rubric);

    console.log(`[Report] Logging AI Assessment...`);
    await hydraService.logAIAssessment(userId, sessionNumber || 1, JSON.stringify(report), report.score || 0, report.hiringSignal || 'unknown');

    res.json(report);
  } catch (error) {
    console.error('[/api/report/generate] Error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.toString(), stack: error.stack });
  }
});

module.exports = router;
