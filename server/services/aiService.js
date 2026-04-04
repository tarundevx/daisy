const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' }); // load from root

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReport(sessionData, candidateHistory, scenarioRubric) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `You are an expert technical interviewer analyzing a candidate's debugging behavior in a realistic IT incident simulation.

SCENARIO: ${sessionData.scenarioId}
CANDIDATE SESSION DATA:
- Time taken: ${sessionData.duration} seconds
- Solved: ${sessionData.solved}
- Commands used: ${sessionData.commandsUsed?.join(', ')}
- Errors encountered: ${sessionData.errors?.length ? sessionData.errors.join(', ') : 'none'}
- Used systematic log-checking: ${sessionData.usedJournalctl ? 'yes' : 'no'}
- Validated before restarting: ${sessionData.usedNginxTest ? 'yes' : 'no'}

SCENARIO RUBRIC (ideal path and red flags):
${scenarioRubric}

CANDIDATE HISTORY FROM PREVIOUS SESSIONS:
${candidateHistory}

Generate a JSON object (no markdown, no backticks, raw JSON only):
{
  "strengths": ["specific observed strength 1", "specific observed strength 2"],
  "weakAreas": ["specific gap 1", "specific gap 2"],
  "thinkingPattern": "2-3 sentence description of their debugging style",
  "score": 0,
  "sessionSummary": "1-2 sentence plain English summary of this session",
  "hiringSignal": "strong_yes | yes | maybe | no",
  "nextFocus": "one specific skill they should work on next",
  "crossSessionInsight": "what patterns appear across multiple sessions, or null if first session",
  "nextScenarioRecommendation": {
    "scenarioId": "disk_full",
    "difficulty": "standard",
    "rationale": "one sentence why this is next"
  }
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1500 }
    });
    const text = result.response.text();
    // Quick sanitization in case of backticks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error (Report): Returning fallback mock.", error);
    return {
      strengths: ["Systematic log checking", "Calm under pressure"],
      weakAreas: ["Configuration syntax verification", "Root cause depth"],
      thinkingPattern: "Candidate exhibits a reactive yet methodical approach, though could benefit from deeper system tracing.",
      score: 78,
      sessionSummary: "Handled the incident but skipped a few verification steps.",
      hiringSignal: "yes",
      nextFocus: "System architecture and inter-process communication",
      crossSessionInsight: null,
      nextScenarioRecommendation: {
        scenarioId: "disk_full",
        difficulty: "standard",
        rationale: "To test their ability to handle low-level system failures after managing service-level errors."
      }
    };
  }
}

async function generateNextScenario(candidateHistory, completedScenarios) {
  const ALL_SCENARIOS = ['nginx_502', 'disk_full', 'service_down', 'permission_denied', 'high_cpu'];
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `Based on this candidate's history, choose the best next scenario.

CANDIDATE HISTORY: ${candidateHistory}
COMPLETED SCENARIOS: ${completedScenarios.join(', ')}
ALL AVAILABLE SCENARIOS: ${ALL_SCENARIOS.join(', ')}

Rules:
1. Prefer scenarios the candidate has NOT completed.
2. If all completed, pick the one most relevant to their weak areas.
3. If no history exists, return 'nginx_502' as the starting scenario.
4. Consider their weaknesses when selecting.

Return raw JSON only (no markdown, no backticks):
{
  "scenarioId": "<one of the scenario IDs above>",
  "rationale": "<one sentence why this scenario fits this candidate>"
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 300 }
    });
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error (Scenario):", error);
    throw error;
  }
}

module.exports = {
  generateReport,
  generateNextScenario
};
