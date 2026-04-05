const prodApiOutage = require('../scenarios/prodApiOutage');
const slowApiEndpoint = require('../scenarios/slowApiEndpoint');
const authVulnerability = require('../scenarios/authVulnerability');
const rateLimiter = require('../scenarios/rateLimiter');
const dbConnectionPool = require('../scenarios/dbConnectionPool');
const memoryLeak = require('../scenarios/memoryLeak');
const cdnCache = require('../scenarios/cdnCache');

const SCENARIOS = {
  [prodApiOutage.id]: prodApiOutage,
  [slowApiEndpoint.id]: slowApiEndpoint,
  [authVulnerability.id]: authVulnerability,
  [rateLimiter.id]: rateLimiter,
  [dbConnectionPool.id]: dbConnectionPool,
  [memoryLeak.id]: memoryLeak,
  [cdnCache.id]: cdnCache
};

function getScenario(scenarioId) {
  if (!SCENARIOS[scenarioId]) throw new Error('Scenario not found: ' + scenarioId);
  return SCENARIOS[scenarioId];
}

function evaluateCommand(scenarioId, commandRaw, sessionState) {
  const scenario = getScenario(scenarioId);
  const command = commandRaw.toLowerCase().trim().replace(/\s+/g, ' ');
  let output = '';
  let solved = false;
  
  // Track command in history for state evaluation (if sessionState.history doesn't exist, create it)
  sessionState.history = sessionState.history || [];
  sessionState.history.push(command);

  if (scenario.commandMap[command] !== undefined) {
    output = scenario.commandMap[command];
  } else if (typeof scenario.fallback === 'function') {
    output = scenario.fallback(command, sessionState.history);
  } else {
    // Prefix matching fallback
    const prefixes = Object.keys(scenario.commandMap).filter(k => command.startsWith(k));
    if (prefixes.length > 0) {
      prefixes.sort((a, b) => b.length - a.length); // longest matching prefix
      output = scenario.commandMap[prefixes[0]];
    } else {
      output = `bash: ${command.split(' ')[0]}: command not found`;
    }
  }

  if (typeof scenario.isSolved === 'function' && scenario.isSolved(sessionState.history, command)) {
    solved = true;
    sessionState.solved = true;
  }

  return { output, fixProgress: sessionState, solved };
}

function getSessionStats(commandLog, scenarioId) {
  const commandsUsed = commandLog.map(c => c.command);
  const totalCommands = commandsUsed.length;
  const uniqueCommandCount = new Set(commandsUsed).size;
  const firstCommand = commandsUsed.length > 0 ? commandsUsed[0] : null;

  const usedJournalctl = commandsUsed.some(c => c.includes('journalctl'));
  const usedNginxTest = commandsUsed.some(c => c.includes('nginx -t'));
  const usedDfH = commandsUsed.some(c => c.includes('df -h'));
  const usedTopOrHtop = commandsUsed.some(c => c.includes('top') || c.includes('htop'));
  
  // Checking log before restart
  let checkedLogsBeforeRestart = false;
  const restartIndex = commandsUsed.findIndex(c => c.includes('restart'));
  if (restartIndex !== -1) {
    for (let i = 0; i < restartIndex; i++) {
       if (commandsUsed[i].includes('journalctl') || commandsUsed[i].includes('tail') || commandsUsed[i].includes('cat /var/log')) {
         checkedLogsBeforeRestart = true;
         break;
       }
    }
  } else {
    // If they never restarted, they didn't do it right or wrong regarding restarts
    checkedLogsBeforeRestart = usedJournalctl; 
  }

  const duration = commandLog.length > 1 
    ? Math.floor((commandLog[commandLog.length - 1].timestamp - commandLog[0].timestamp) / 1000) 
    : 0;

  return {
    commandsUsed,
    errors: [], // Extract from output ideally, but simulated to empty since we don't store individual outputs in commandLog currently
    duration,
    usedJournalctl,
    usedNginxTest,
    usedDfH,
    usedTopOrHtop,
    checkedLogsBeforeRestart,
    firstCommand,
    totalCommands,
    uniqueCommandCount,
    solved: false // Will be updated by caller
  };
}

module.exports = {
  getScenario,
  evaluateCommand,
  getSessionStats,
  getAllScenarios: () => Object.values(SCENARIOS)
};
