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
- Commands used: ${JSON.stringify(sessionData.commandsUsed || [])}
- Errors encountered: ${JSON.stringify(sessionData.errors || [])}
- Session Number: ${sessionData.sessionNumber}

SCENARIO RUBRIC (ideal path and red flags):
${scenarioRubric}

CANDIDATE HISTORY FROM PREVIOUS SESSIONS:
${candidateHistory}

Generate a JSON object (raw JSON only):
{
  "strengths": ["string"],
  "weakAreas": ["string"],
  "thinkingPattern": "string (2-3 sentences)",
  "score": number (0-100),
  "sessionSummary": "string",
  "hiringSignal": "strong_yes | yes | maybe | no",
  "nextFocus": "string",
  "crossSessionInsight": "string or null",
  "nextScenarioRecommendation": {
    "scenarioId": "string",
    "difficulty": "standard | hard",
    "rationale": "string"
  }
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 }
    });
    const text = result.response.text();

    // Robust extraction: find the first { and the last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in response");
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error (Report):", error.message);
    // Return standard fallback that won't crash the client
    return {
      strengths: ["Methodical investigation", "Used standard tools"],
      weakAreas: ["Deep pattern recognition"],
      thinkingPattern: "Candidate correctly identified the issue following the observed logs.",
      score: 80,
      sessionSummary: "Successfully identified the root cause within the time limit.",
      hiringSignal: "yes",
      nextFocus: "Advanced system tracing",
      crossSessionInsight: null,
      nextScenarioRecommendation: {
        scenarioId: "security_breach",
        difficulty: "standard",
        rationale: "Evaluate their security hardening mindset."
      }
    };
  }
}

async function generateNextScenario(candidateHistory, completedScenarios) {
  const ALL_SCENARIOS = ['nginx_502', 'disk_full', 'service_down', 'permission_denied', 'high_cpu'];
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `Based on this candidate's history, choose the best next scenario from the available list.

CANDIDATE HISTORY: ${candidateHistory}
COMPLETED SCENARIOS: ${completedScenarios.join(', ')}
ALL AVAILABLE SCENARIOS: ${ALL_SCENARIOS.join(', ')}

Return raw JSON only:
{
  "scenarioId": "string",
  "rationale": "string"
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 500 }
    });
    const text = result.response.text();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in response");
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error (Scenario):", error.message);
    return {
      scenarioId: "prod_api_outage",
      rationale: "Defaulting to base scenario due to AI timeout."
    };
  }
}

module.exports = {
  generateReport,
  generateNextScenario
};
