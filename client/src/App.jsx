import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TerminalComponent } from './components/Terminal';
import { ScenarioBrief } from './components/ScenarioBrief';
import { BehaviorReport } from './components/BehaviorReport';
import { useTerminal } from './hooks/useTerminal';
import { prodApiOutage } from './scenarios/prodApiOutage';
import { slowApiEndpoint } from './scenarios/slowApiEndpoint';
import { authVulnerability } from './scenarios/authVulnerability';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const SCENARIO_MAP = {
  'prod_api_outage': prodApiOutage,
  'slow_api_endpoint': slowApiEndpoint,
  'auth_vulnerability': authVulnerability
};

function App() {
  const [userId, setUserId] = useState('');
  const [view, setView] = useState('dashboard'); // dashboard | session | report
  const [activeScenario, setActiveScenario] = useState(prodApiOutage);
  const [report, setReport] = useState(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionSummary, setEvolutionSummary] = useState('');
  const [sessionNumber, setSessionNumber] = useState(1);

  const terminalState = useTerminal(activeScenario);

  useEffect(() => {
    let uid = localStorage.getItem('daisy_user_id');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('daisy_user_id', uid);
    }
    setUserId(uid);
    
    // Check if profile is evolving and grab a summary
    // Typically we'd fetch actual history, here we just set active if session > 1
    const storedSessionNum = parseInt(localStorage.getItem('daisy_session_num') || '1');
    setSessionNumber(storedSessionNum);
    if (storedSessionNum > 1) {
      setIsEvolving(true);
    }
  }, []);

  const handleStartPractice = async (recommendation = null) => {
    try {
      // 1. Determine accurate scenario (either recommended or check for next)
      let selectedScenarioKey = '';
      if (recommendation && SCENARIO_MAP[recommendation.scenarioId]) {
         selectedScenarioKey = recommendation.scenarioId;
         setActiveScenario(SCENARIO_MAP[recommendation.scenarioId]);
         setEvolutionSummary(`Focusing on your weak spot: ${recommendation.rationale}`);
      } else {
         // Cycle through scenarios based on session number or random
         const scenariosKeys = Object.keys(SCENARIO_MAP);
         selectedScenarioKey = scenariosKeys[(sessionNumber - 1) % scenariosKeys.length];
         setActiveScenario(SCENARIO_MAP[selectedScenarioKey]);
         setEvolutionSummary('');
      }

      // 2. Create/ensure tenant on backend
      await axios.post(`${API_BASE}/session/start`, { 
         userId,
         scenarioId: selectedScenarioKey 
      });

      setView('session');
    } catch (e) {
      console.error('Error starting session:', e);
      // Fallback
      if (recommendation && SCENARIO_MAP[recommendation.scenarioId]) {
         setActiveScenario(SCENARIO_MAP[recommendation.scenarioId]);
      } else {
         const scenariosKeys = Object.keys(SCENARIO_MAP);
         const nextKey = scenariosKeys[(sessionNumber - 1) % scenariosKeys.length];
         setActiveScenario(SCENARIO_MAP[nextKey]);
      }
      setView('session'); // fallback to let them play offline
    }
  };

  // Watch for solve event to trigger report
  useEffect(() => {
    if (terminalState.solved && view === 'session') {
      setTimeout(() => {
         submitSession();
      }, 2500); // Wait 2.5 seconds to see [SCENARIO SOLVED] in terminal
    }
  }, [terminalState.solved, view]);

  const submitSession = async () => {
    const sessionData = {
      scenarioId: activeScenario.id,
      sessionNumber,
      solved: terminalState.solved,
      duration: terminalState.duration,
      commandsUsed: terminalState.commandsUsed
    };

    // Attempt to log session memory to backend
    try {
      await axios.post(`${API_BASE}/session/end`, { 
         userId, 
         candidateName: "Candidate",
         sessionId: "local",
         scenarioId: activeScenario.id,
         sessionState: { solved: terminalState.solved },
         commandLog: terminalState.history,
         sessionNumber 
      });
    } catch (e) {
      console.warn("Could not log session end to backend:", e);
    }

    const nextNum = sessionNumber + 1;
    setSessionNumber(nextNum);
    localStorage.setItem('daisy_session_num', nextNum.toString());

    if (sessionNumber < 3) {
       // Start the next test immediately without showing report
       const scenariosKeys = Object.keys(SCENARIO_MAP);
       const selectedScenarioKey = scenariosKeys[(nextNum - 1) % scenariosKeys.length];
       setActiveScenario(SCENARIO_MAP[selectedScenarioKey]);
       
       try {
         await axios.post(`${API_BASE}/session/start`, { userId, scenarioId: selectedScenarioKey });
       } catch (e) {}
       
       setView('session');
       return;
    }

    // All tests done, generate final report
    setView('report');
    setSessionNumber(1);
    localStorage.setItem('daisy_session_num', '1');

    try {
      const res = await axios.post(`${API_BASE}/report/generate`, {
        userId,
        sessionData,
        sessionNumber
      });
      setReport(res.data);
      setIsEvolving(true);
    } catch (e) {
       console.error("Error generating report", e);
       const totalCmds = terminalState.commandsUsed.length;
       const fastTime = terminalState.duration < 120;
       
       setReport({
         strengths: fastTime ? ["Fast detection of root cause", "Confident operations"] : ["Systematic approach", "Thorough log checking"],
         weakAreas: totalCmds > 10 ? ["Relied on trial and error", "Lots of unnecessary commands entered"] : ["Could verify configuration syntax sooner"],
         thinkingPattern: `Passed all 3 intensive scenarios. Final scenario time: ${terminalState.duration}s.`,
         score: terminalState.solved ? (fastTime ? 92 : 85) : 60,
         hiringSignal: terminalState.solved ? "strong_yes" : "yes",
         nextScenarioRecommendation: { scenarioId: 'system_architecture', difficulty: 'hard', rationale: `Graduated core troubleshooting.` }
       });
       setIsEvolving(true);
    }
  };

  if (view === 'dashboard') {
    return <Dashboard onStart={handleStartPractice} isEvolving={isEvolving} evolutionSummary={evolutionSummary} />;
  }

  if (view === 'report') {
    if (!report) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div><span className="ml-4 text-indigo-900 font-bold">HydraDB is extracting your patterns...</span></div>;
    return <BehaviorReport report={report} onHome={() => { setReport(null); setView('dashboard'); }} />;
  }

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans">
      <div className="w-[60%] h-full p-6 bg-black">
         <div className="flex justify-between items-center mb-4">
           <div className="flex gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
             <div className="w-3 h-3 rounded-full bg-green-500"></div>
           </div>
           <button onClick={submitSession} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded hover:bg-gray-700 transition">Give Up (End Session)</button>
         </div>
         <div className="h-[calc(100%-2rem)]">
           <TerminalComponent key={activeScenario.id} onCommand={terminalState.handleCommand} />
         </div>
      </div>
      <div className="w-[40%] h-full">
         <ScenarioBrief 
            scenario={activeScenario} 
            duration={terminalState.duration} 
            solved={terminalState.solved}
            commandsUsed={terminalState.commandsUsed}
         />
      </div>
    </div>
  );
}

export default App;
