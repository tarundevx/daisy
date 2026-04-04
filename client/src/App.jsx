import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TerminalComponent } from './components/Terminal';
import { ScenarioBrief } from './components/ScenarioBrief';
import { BehaviorReport } from './components/BehaviorReport';
import { useTerminal } from './hooks/useTerminal';
import { nginx502 } from './scenarios/nginx502';
import { diskFull } from './scenarios/diskFull';
import { serviceDown } from './scenarios/serviceDown';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const SCENARIO_MAP = {
  'nginx_502': nginx502,
  'disk_full': diskFull,
  'service_down': serviceDown
};

function App() {
  const [userId, setUserId] = useState('');
  const [view, setView] = useState('dashboard'); // dashboard | session | report
  const [activeScenario, setActiveScenario] = useState(nginx502);
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
      // 1. Create/ensure tenant
      await axios.post(`${API_BASE}/session/start`, { userId });
      
      // 2. Load accurate scenario (either recommended or check for next)
      if (recommendation && SCENARIO_MAP[recommendation.scenarioId]) {
         setActiveScenario(SCENARIO_MAP[recommendation.scenarioId]);
         setEvolutionSummary(`Focusing on your weak spot: ${recommendation.rationale}`);
      } else {
         // Default if first time
         setActiveScenario(nginx502);
      }
      
      setView('session');
    } catch (e) {
      console.error('Error starting session:', e);
      setView('session'); // fallback to let them play offline
    }
  };

  // Watch for solve event to trigger report
  useEffect(() => {
    if (terminalState.solved && view === 'session') {
      submitSession();
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

    setView('report'); // switch to report view loading state

    try {
      const res = await axios.post(`${API_BASE}/report/generate`, {
        userId,
        sessionData
      });
      setReport(res.data);
      
      const nextNum = sessionNumber + 1;
      setSessionNumber(nextNum);
      localStorage.setItem('daisy_session_num', nextNum.toString());
      setIsEvolving(true);
    } catch (e) {
       console.error("Error generating report", e);
       // mock report for offline fallback
       setReport({
         strengths: ["Fast typing", "Checked logs immediately"],
         weakAreas: ["Didn't check config syntax before restarting services"],
         thinkingPattern: "Candidate relies on trial and error restarts rather than targeted verification tests.",
         score: 72,
         hiringSignal: "maybe",
         nextScenarioRecommendation: { scenarioId: 'disk_full', difficulty: 'standard', rationale: 'Test their awareness of system health commands like df/du' }
       });
    }
  };

  if (view === 'dashboard') {
    return <Dashboard onStart={handleStartPractice} isEvolving={isEvolving} evolutionSummary={evolutionSummary} />;
  }

  if (view === 'report') {
    if (!report) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div><span className="ml-4 text-indigo-900 font-bold">HydraDB is extracting your patterns...</span></div>;
    return <BehaviorReport report={report} onNext={(rec) => { setReport(null); handleStartPractice(rec); }} />;
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
           <TerminalComponent onCommand={terminalState.handleCommand} />
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
