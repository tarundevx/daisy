const client = require('../hydradb');

const RUBRICS = [
  {
    id: "nginx_502",
    text: "Scenario: nginx 502 Bad Gateway. Ideal solution path: (1) curl localhost to confirm 502 symptoms, (2) cat nginx config to read upstream block, (3) nginx -t to validate config syntax, (4) systemctl status app to check backend service, (5) journalctl -u app to find root cause error, (6) fix the root cause (missing env var MONGODB_URI), (7) systemctl restart app, (8) nginx -t again to confirm, (9) curl localhost to verify fix. Maximum time: 15 minutes. Red flags: restarting services without checking journalctl, running nginx -t after restart not before, brute-force trial and error without reading logs, not verifying fix with curl."
  },
  {
    id: "disk_full",
    text: "Scenario: Disk full at 100%. Ideal path: (1) df -h to confirm disk usage, (2) du -sh /* to find largest directory, (3) du -sh /var/* to narrow down, (4) ls -lh /var/log/app/ to identify large log files, (5) tail the log to check if it is safe to truncate, (6) truncate -s 0 /var/log/app/app.log to free space, (7) df -h to confirm space freed. Bonus: set up logrotate config. Red flags: deleting files without checking contents, using rm on system files, not verifying with df after fix."
  },
  {
    id: "service_down",
    text: "Scenario: systemd service fails to start. Ideal path: (1) systemctl start api to observe failure, (2) journalctl -u api -n 50 immediately to read error, (3) identify EnvironmentFile missing, (4) ls /etc/api/ to find env.example, (5) cat /etc/api/env.example to read required vars, (6) cp env.example to env, (7) systemctl start api to verify fix, (8) curl the service endpoint. Red flags: multiple restart attempts without reading journalctl, not checking what variables are required before copying the file."
  },
  {
    id: "permission_denied",
    text: "Scenario: Application cannot write to /var/data/uploads/. Ideal path: (1) check application error log for 'permission denied', (2) ls -la /var/data/ to see ownership, (3) id to check current user, (4) ps aux | grep app to see what user the process runs as, (5) chown app_user:app_user /var/data/uploads/ to fix ownership, (6) chmod 755 /var/data/uploads/ if permissions are wrong, (7) systemctl restart app, (8) verify with a test write. Red flags: chmod 777, not checking what user the process runs as before chown."
  },
  {
    id: "high_cpu",
    text: "Scenario: Server at 99% CPU, app responding slowly. Ideal path: (1) top or htop to identify offending process, (2) ps aux --sort=-%cpu to confirm, (3) strace or lsof to inspect what the process is doing, (4) check app logs for infinite loop patterns or runaway cron job, (5) identify the specific cause (runaway cron job running every second), (6) crontab -l to view cron entries, (7) crontab -e to fix the schedule, (8) kill the rogue process, (9) verify CPU normalizes with top. Red flags: kill -9 without diagnosing, restarting app without identifying root cause."
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
      return "";
    }
    
    return result.chunks.map(chunk => chunk.chunk_content || chunk.content).join('\n\n---\n\n');
  } catch (err) {
    if (err.status === 404) return "";
    throw err;
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
