const express = require('express');
const router = express.Router();
const hydraService = require('../services/hydraService');
const aiService = require('../services/aiService');
const scenarioEngine = require('../services/scenarioEngine');

router.get('/next', async (req, res) => {
  try {
    const { userId, history } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    let candidateHistory = await hydraService.recallCandidateMemories(userId, "completed scenarios weak areas");
    
    // Parse completed scenarios
    let completedScenarios = [];
    if (history) {
      completedScenarios = history.split(',').filter(s => s.trim());
    }

    const recommendation = await aiService.generateNextScenario(candidateHistory, completedScenarios);
    const scenario = scenarioEngine.getScenario(recommendation.scenarioId);

    res.json({
      scenarioId: recommendation.scenarioId,
      scenario,
      rationale: recommendation.rationale
    });
  } catch (error) {
    console.error('[/api/scenario/next] Error:', error);
    res.status(500).json({ error: 'Failed to generate next scenario' });
  }
});

router.get('/list', (req, res) => {
  try {
    const all = scenarioEngine.getAllScenarios();
    const list = all.map(s => ({
      id: s.id,
      title: s.title,
      difficulty: s.difficulty,
      timeLimit: s.timeLimit,
      brief: s.brief
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const scenario = scenarioEngine.getScenario(req.params.id);
    // clone to strip values
    const safeScenario = { ...scenario };
    safeScenario.commandMapKeys = Object.keys(scenario.commandMap);
    delete safeScenario.commandMap;
    res.json(safeScenario);
  } catch (err) {
    res.status(404).json({ error: 'Scenario not found' });
  }
});

module.exports = router;
