const axios = require('axios');
require('dotenv').config({ path: '../.env' }); // Load from root

const HYDRADB_URL = 'https://api.hydradb.com';
const HYDRADB_KEY = process.env.HYDRADB_API_KEY;

const axiosConfig = {
  headers: {
    'Authorization': `Bearer ${HYDRADB_KEY}`,
    'Content-Type': 'application/json'
  }
};

async function createTenant(userId) {
  const tenant_id = "candidate_" + userId;
  try {
    const res = await axios.post(`${HYDRADB_URL}/tenants/create`, {
      tenant_id
    }, axiosConfig);
    return res.data;
  } catch (error) {
    console.error('HydraDB createTenant error:', error.response?.data || error.message);
    throw error;
  }
}

function buildNarrativeSummary(sessionData) {
  const { scenarioId, sessionNumber, solved, duration, commandsUsed } = sessionData;
  const timeFormatted = `${Math.floor(duration / 60)}m ${duration % 60}s`;
  
  let narrative = `Candidate attempted the ${scenarioId} scenario (session ${sessionNumber}).\n`;
  if (commandsUsed.length > 0) {
     narrative += `First command: '${commandsUsed[0]}'.\n`;
  }
  
  const checkedNginx = commandsUsed.includes("nginx -t");
  const checkedJournal = commandsUsed.includes("journalctl");
  
  if (scenarioId === 'nginx_502') {
     if (!checkedNginx) narrative += `Did not run nginx -t before restarting service (skipped syntax check).\n`;
     if (checkedJournal) narrative += `Found root cause via journalctl.\n`;
  }

  narrative += `Status: ${solved ? 'Solved' : 'Failed'} in ${timeFormatted} using ${commandsUsed.length} commands.\n`;
  narrative += `Commands used: ${JSON.stringify(commandsUsed)}`;

  return narrative;
}

async function logSession(userId, sessionData) {
  const tenant_id = "candidate_" + userId;
  const content = buildNarrativeSummary(sessionData);

  const payload = {
    tenant_id,
    memories: [{
       text: content,
       infer: true,
       user_name: tenant_id, // Giving context on who did it
       title: `Session ${sessionData.sessionNumber} - ${sessionData.scenarioId}`,
       document_metadata: {
         scenario: sessionData.scenarioId,
         session_number: sessionData.sessionNumber,
         solved: sessionData.solved,
         time_taken_sec: sessionData.duration,
         total_commands: sessionData.commandsUsed.length
       }
    }]
  };

  try {
    const res = await axios.post(`${HYDRADB_URL}/memories/add_memory`, payload, axiosConfig);
    return res.data;
  } catch (error) {
    console.error('HydraDB logSession error:', error.response?.data || error.message);
    throw error;
  }
}

async function recallContext(userId, query) {
  const tenant_id = "candidate_" + userId;
  try {
    const res = await axios.post(`${HYDRADB_URL}/recall/full_recall`, {
      tenant_id,
      query,
      max_results: 8
    }, axiosConfig);
    
    // Process response chunks into a readable string
    if (res.data && res.data.chunks) {
       return res.data.chunks.map(chunk => chunk.content).join('\n---\n');
    }
    return '';
  } catch (error) {
    console.error('HydraDB recallContext error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createTenant,
  logSession,
  recallContext
};
