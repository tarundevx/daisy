const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' }); // Load from root

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReport(context, sessionData) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: "You are an expert technical interviewer analyzing a software engineer candidate's debugging behavior in a realistic IT scenario simulator. Based on the candidate's session history, generate a structured JSON report."
  });

  const prompt = `Candidate history:\n${context}\n\nLatest session:\n${JSON.stringify(sessionData)}\n\nGenerate a JSON report with:
{
  "strengths": ["string array - specific observed behaviors"],
  "weakAreas": ["string array - specific gaps"],
  "thinkingPattern": "string (2-3 sentences describing their debugging style)",
  "score": 0,
  "nextScenarioRecommendation": {
    "scenarioId": "nginx_502 / disk_full / service_down",
    "difficulty": "standard / hard",
    "rationale": "string"
  },
  "hiringSignal": "strong_yes | yes | maybe | no"
}
Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error (Report):", error);
    throw error;
  }
}

async function selectNextScenario(context) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  const prompt = `Based on this candidate's history, select the best next scenario for them from this list: nginx_502, disk_full, service_down.\nIf they've done all three, suggest which to repeat with increased difficulty.\n\nCandidate history:\n${context}\n\nReturn ONLY JSON:\n{ "scenarioId": "string", "difficulty": "standard" | "hard", "rationale": "string" }`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error (Scenario):", error);
    throw error;
  }
}

module.exports = {
  generateReport,
  selectNextScenario
};
