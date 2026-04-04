const nginx502 = require('../scenarios/nginx502');
const diskFull = require('../scenarios/diskFull');
const serviceDown = require('../scenarios/serviceDown');
const permissionDenied = require('../scenarios/permissionDenied');
const highCpu = require('../scenarios/highCpu');

const SCENARIOS = {
  [nginx502.id]: nginx502,
  [diskFull.id]: diskFull,
  [serviceDown.id]: serviceDown,
  [permissionDenied.id]: permissionDenied,
  [highCpu.id]: highCpu
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
  
  // State mutations based on commands
  if (scenarioId === 'nginx_502') {
    if (command === 'cp /opt/app/.env.example /opt/app/.env' || command === 'nano /opt/app/.env' || command === 'vi /opt/app/.env' || command === 'vim /opt/app/.env') {
      sessionState.envCreated = true;
    }
    if (command === 'systemctl restart app') {
      if (sessionState.envCreated) {
        sessionState.fixApplied = true;
        output = '● app.service restarted successfully';
      } else {
        output = "Job for app.service failed because the control process exited with error code.\nSee 'systemctl status app' and 'journalctl -xe' for details.";
      }
    } else if (command === 'curl localhost') {
      output = sessionState.fixApplied 
        ? '{"status":"ok","message":"Application running","timestamp":"2024-01-15T11:42:07Z","version":"2.1.4"}'
        : scenario.commandMap['curl localhost'];
      if (sessionState.fixApplied) solved = true;
    } else if (command === 'curl localhost:3001') {
      output = sessionState.fixApplied 
        ? '{"status":"ok","uptime":42,"database":"connected"}'
        : scenario.commandMap['curl localhost:3001'];
    } else if (command === 'systemctl start app' && sessionState.fixApplied) {
      output = '● app.service - Node.js Application Server — active (running)';
    }
  } 
  else if (scenarioId === 'disk_full') {
    if (command === 'truncate -s 0 /var/log/app/app.log') {
      sessionState.fixApplied = true;
    }
    if (command === 'df -h') {
      output = sessionState.fixApplied 
        ? "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   7.2G   43G  15% /\ntmpfs           3.9G  128M  3.8G   4% /dev/shm\n/dev/sdb1       200G   45G  155G  23% /data"
        : "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   50G     0  100% /\ntmpfs           3.9G  128M  3.8G   4% /dev/shm\n/dev/sdb1       200G   45G  155G  23% /data";
      if (sessionState.fixApplied) solved = true;
    }
  }
  else if (scenarioId === 'service_down') {
    if (command === 'cp /etc/api/production.env.example /etc/api/production.env') {
      sessionState.partialFix = true;
      output = "";
    } else if (command === 'cp /etc/api/production.env.bak /etc/api/production.env') {
      sessionState.fixApplied = true;
      output = "";
    }
    
    if (command === 'systemctl start api') {
      if (sessionState.fixApplied) {
        output = '● api.service - REST API Service — started successfully';
        solved = true;
      } else if (sessionState.partialFix) {
        output = "Job for api.service failed: Database connection refused.\npostgresql://api_user:password@localhost:5432/apidb — connection refused (wrong credentials or host)";
      } else {
        output = "Job for api.service failed because the control process exited with error code.\nSee 'journalctl -xe' for details.";
      }
    } else if (command === 'systemctl status api' && sessionState.fixApplied) {
      output = "● api.service - REST API Service\n   Active: active (running) since Mon 2024-01-15 11:29:44 UTC; 12s ago\n Main PID: 8102 (python3)\nJan 15 11:29:44 prod-03 python3[8102]: INFO:     Started server process\nJan 15 11:29:44 prod-03 python3[8102]: INFO:     Application startup complete.";
    } else if (command === 'curl localhost:8000/health') {
      output = sessionState.fixApplied 
        ? '{"status":"healthy","database":"connected","redis":"connected","version":"2.4.1"}'
        : "curl: (7) Failed to connect to localhost port 8000: Connection refused";
    }
  }
  else if (scenarioId === 'permission_denied') {
    sessionState.owner = sessionState.owner || false;
    sessionState.perms = sessionState.perms || false;
    
    if (command === 'chown uploads_svc:uploads_svc /var/data/uploads/') {
      sessionState.owner = true;
      output = "";
    } else if (command === 'chmod 755 /var/data/uploads/') {
      sessionState.perms = true;
      output = "";
    } else if (command === 'chmod 777 /var/data/uploads/') {
      sessionState.perms = true;
      output = "Warning: chmod 777 applied. This is a security risk — world-writable directories allow any user to write to or delete files in this directory. Consider using chmod 755 with proper ownership instead.";
    }

    if (command === 'systemctl restart uploads' || command === 'systemctl restart uploads.service') {
      if (sessionState.owner && sessionState.perms) {
        output = "● uploads.service - active (running)";
        solved = true;
      } else {
        output = "● uploads.service - still failing (permission denied)";
      }
    }
  }
  else if (scenarioId === 'high_cpu') {
    if (command === 'kill 9891' || command === 'kill -9 9891') {
      sessionState.killed = true;
      output = "";
    }
    if (command === 'nano /opt/app/scripts/health_monitor.sh' || command === 'vim /opt/app/scripts/health_monitor.sh' || command === 'crontab -e -u app') {
      sessionState.scriptFixed = true;
    }
    
    if (command === 'top' || command === 'htop') {
      if (sessionState.killed) {
        output = "top - 11:43:15 up 14 days, 2:42,  1 user,  load average: 1.02, 4.21, 6.44\n%Cpu(s):  4.2 us,  0.8 sy,  0.0 ni, 94.2 id\n  PID USER     %CPU COMMAND\n 9234 app       3.1 node\n 1234 nginx     0.3 nginx";
      } else {
        output = scenario.commandMap[command] || scenario.commandMap['top'];
      }
    }
    
    if (sessionState.killed && sessionState.scriptFixed) {
      solved = true;
    }
  }

  if (output === '') {
    // Standard lookup
    if (scenario.commandMap[command] !== undefined) {
      output = scenario.commandMap[command];
    } else {
      // Prefix matching
      const prefixes = Object.keys(scenario.commandMap).filter(k => command.startsWith(k));
      if (prefixes.length > 0) {
        prefixes.sort((a, b) => b.length - a.length); // longest matching prefix
        output = scenario.commandMap[prefixes[0]];
      } else {
        // Fallback keywords
        if (command.includes('journalctl')) output = scenario.commandMap['journalctl -u app'] || "No journal entries.";
        else if (command.includes('systemctl status')) output = scenario.commandMap['systemctl status app'] || "Unit not found.";
        else output = `bash: ${command.split(' ')[0]}: command not found`;
      }
    }
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
