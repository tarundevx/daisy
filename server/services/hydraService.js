const client = require('../hydradb');

const RUBRICS = [
  {
    id: "prod_api_outage",
    text: "Scenario: Production API Outage. Available Resources: Service, Database, Logs, Config. Ideal solution path: (1) Gain access to environment, (2) Investigation commands: cat /var/log/app.log, curl http://localhost:8080/api/orders, env, ps aux, netstat -tulnp, cat .env. (3) Identify DB_HOST=localhost as root cause (PostgreSQL is external). (4) Identify database not listening on 5432 locally. Success on identifying the .env misconfiguration. Red flags: debugging application code instead of investigating database host configuration."
  },
  {
    id: "slow_api_endpoint",
    text: "Scenario: Performance Bottleneck (Slow API Endpoint). Available Resources: Java Spring Boot API, logs/performance.log, logs/db.log. Ideal path: (1) measure latency with curl -w '%{time_total}', (2) inspect performance.log to confirm latency, (3) examine db.log to identify N+1 query issue (repeated SELECTs for products/reviews), (4) use top to confirm low CPU/Normal memory usage. Success on identification of database query bottleneck. Red flags: assuming high CPU load without checking top, missing the N+1 pattern in database logs."
  },
  {
    id: "auth_vulnerability",
    text: "Scenario: Security Incident (IDOR). Available Resources: REST API with JWT auth, logs/access.log, logs/auth.log. Ideal path: (1) inspect access logs to see unauthorized access patterns to /api/user/, (2) check auth logs to confirm single user authentication, (3) test API manually using curl and the same valid token against multiple user IDs (101, 102). (4) Confirm IDOR by seeing Bob's data (102) with Alice's token. Success on identifying IDOR missing ownership validation. Red flags: assuming token forgery or network security failure instead of broken object level authorization."
  },
  {
    id: "rate_limiter",
    text: "Scenario: Code Challenge (API Rate Limiter & Cache). Available Resources: Monaco Editor, middleware.js. Ideal solution: (1) Sliding window implementation (using an array of timestamps or a bucket strategy), (2) Atomic cache updates to prevent stampede, (3) Correct 429 status code for rate limiting, (4) Sub-15ms response time for cached hits. Success: Passing all 3 test cases in Jest. Red flags: Global mutable state with race conditions, missing the 429 requirement, or cache layer not actually reducing latency."
  }
];

async function initializeTenant() {
  try {
    await client.tenant.create({ tenant_id: "interviewai" });
    console.log("Tenant initialized.");
  } catch (err) {
    if (err.message && err.message.includes('exists') || err.status === 409 || err.statusCode === 409 || err.status === 403 || err.statusCode === 403) {
      console.log("Tenant already exists or plan limit reached, skipping.");
    } else {
      console.error("HydraDB init error:", err);
    }
  }
}

async function seedKnowledgeBase() {
  for (const rubric of RUBRICS) {
    try {
      await client.upload.addMemory({
        memories: [{
          text: rubric.text,
          title: rubric.id + "_rubric",
          infer: false,
          metadata: { type: "rubric", scenario: rubric.id }
        }],
        tenant_id: "interviewai",
        sub_tenant_id: "scenarios_knowledge"
      });
      console.log(`Seeded rubric: ${rubric.id}`);
    } catch (err) {
      console.error(`Failed to seed ${rubric.id}:`, err);
    }
  }
}

async function logSessionMemory(userId, candidateName, sessionData) {
  const narrative = `Candidate ${candidateName} ${sessionData.solved ? 'completed' : 'attempted'} ${sessionData.scenarioId} (session ${sessionData.sessionNumber || 1}).
Time taken: ${sessionData.duration} seconds. Solved: ${sessionData.solved}.
Commands used in order: ${sessionData.commandsUsed?.join(', ')}.
First command: ${sessionData.firstCommand || 'N/A'}. Total commands typed: ${sessionData.totalCommands || 0}.
Used journalctl: ${sessionData.usedJournalctl ? 'yes' : 'no'}. Used nginx -t before restart: ${sessionData.usedNginxTest ? 'yes' : 'no'}.
Used df -h: ${sessionData.usedDfH ? 'yes' : 'no'}. Errors encountered: ${sessionData.errors?.length ? sessionData.errors.join(', ') : 'none'}.
Key behavioral note: Candidate used ${sessionData.uniqueCommandCount} unique commands to explore the environment.`;

  const details = await client.upload.addMemory({
    memories: [{
      text: narrative,
      infer: true,
      user_name: candidateName,
      custom_instructions: "Extract this candidate's debugging approach, systematic vs reactive behavior, log-reading habits, verification practices, and any patterns in how they approach unknown problems."
    }],
    tenant_id: "interviewai",
    sub_tenant_id: "candidate_" + userId
  });
  return details;
}

async function logAIAssessment(userId, sessionNumber, assessmentText, score, hiringSignal) {
  const details = await client.upload.addMemory({
    memories: [{
      text: assessmentText,
      infer: false,
      title: "AI Assessment - Session " + sessionNumber,
      metadata: { score, hiringSignal }
    }],
    tenant_id: "interviewai",
    sub_tenant_id: "candidate_" + userId
  });
  return details;
}

async function recallCandidateMemories(userId, query) {
  try {
    const result = await client.recall.recallPreferences({
      query: query,
      tenant_id: "interviewai",
      sub_tenant_id: "candidate_" + userId,
      mode: "fast",
      max_results: 10,
      recency_bias: 0.6,
      alpha: 0.8
    });
    
    if (!result.chunks || result.chunks.length === 0) {
      return "No previous session history found.";
    }
    
    return result.chunks.map(chunk => chunk.chunk_content || chunk.content).join('\n\n---\n\n');
  } catch (err) {
    if (err.status === 404) return "No previous session history found.";
    throw err;
  }
}

async function recallScenarioRubric(scenarioId) {
  try {
    const result = await client.recall.fullRecall({
      query: scenarioId + " scenario rubric ideal solution path red flags",
      tenant_id: "interviewai",
      sub_tenant_id: "scenarios_knowledge",
      mode: "fast",
      max_results: 3
    });
    
    if (!result.chunks || result.chunks.length === 0) {
      throw new Error("No chunks");
    }
    
    return result.chunks.map(chunk => chunk.chunk_content || chunk.content).join('\n\n---\n\n');
  } catch (err) {
    console.warn(`HydraDB fullRecall failed for scenario ${scenarioId}, falling back to local RUBRICS.`, err.message);
    const staticRubric = RUBRICS.find(r => r.id === scenarioId);
    if (staticRubric) return staticRubric.text;
    return "";
  }
}

module.exports = {
  initializeTenant,
  seedKnowledgeBase,
  logSessionMemory,
  logAIAssessment,
  recallCandidateMemories,
  recallScenarioRubric
};
