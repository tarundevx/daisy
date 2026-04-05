import React, { useState, useEffect } from 'react';
import { TerminalComponent } from '../components/Terminal';
import { ScenarioBrief } from '../components/ScenarioBrief';
import { useTerminal } from '../hooks/useTerminal';
import { prodApiOutage } from '../scenarios/prodApiOutage';
import { slowApiEndpoint } from '../scenarios/slowApiEndpoint';
import { authVulnerability } from '../scenarios/authVulnerability';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const SCENARIO_MAP = {
  'prod_api_outage': prodApiOutage,
  'slow_api_endpoint': slowApiEndpoint,
  'auth_vulnerability': authVulnerability
};

const SCENARIO_SEQUENCE = ['prod_api_outage', 'slow_api_endpoint', 'auth_vulnerability'];

export default function InterviewSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [activeScenario, setActiveScenario] = useState(SCENARIO_MAP[SCENARIO_SEQUENCE[0]]);
  const [sessionId, setSessionId] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const terminalState = useTerminal(activeScenario);

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await axios.post('/api/session/start', { 
          userId: user?.id,
          scenarioId: SCENARIO_SEQUENCE[scenarioIndex]
        });
        setSessionId(res.data.sessionId);
        setActiveScenario(SCENARIO_MAP[SCENARIO_SEQUENCE[scenarioIndex]]);
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    };
    startSession();
  }, [scenarioIndex, user?.id]);

  useEffect(() => {
    if (terminalState.solved && !showFollowUp && !isFinishing) {
      handleFinalSubmission();
    }
  }, [terminalState.solved]);

  const handleFinalSubmission = async () => {
    setShowFollowUp(true);
    try {
      const res = await axios.post('/api/session/follow-up', {
        sessionId,
        code: terminalState.history.filter(h => h.command.includes('edit') || h.command.includes('cat')).map(h => h.command).join('\n'),
        explanation: "Candidate solved the current scenario."
      });
      setFollowUpQuestion(res.data.followUpQuestion);
    } catch (err) {
      console.error('Follow-up error:', err);
      setFollowUpQuestion("Can you explain the trade-offs of your chosen solution?");
    }
  };

  const submitFollowUp = async () => {
    setIsFinishing(true);
    try {
      await axios.post('/api/session/end', {
        userId: user?.id,
        candidateName: user?.name,
        sessionId,
        scenarioId: activeScenario.id,
        sessionState: { solved: true },
        commandLog: terminalState.history
      });

      if (scenarioIndex < SCENARIO_SEQUENCE.length - 1) {
        // Move to next scenario
        setScenarioIndex(prev => prev + 1);
        setShowFollowUp(false);
        setFollowUpAnswer('');
        setFollowUpQuestion('');
        setIsFinishing(false);
        // Terminal will reset because activeScenario changes
      } else {
        // Last scenario done, go to report
        if (sessionId) {
          navigate(`/report/${sessionId}`);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Submit follow-up error:', err);
      if (sessionId) navigate(`/report/${sessionId}`);
      else navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#050505] overflow-hidden font-sans">
      <div className="w-[60%] h-full p-6 bg-black relative">
         <div className="flex justify-between items-center mb-4">
           <div className="flex gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
             <div className="w-3 h-3 rounded-full bg-green-500"></div>
           </div>
           <div className="text-xs text-gray-500 font-mono tracking-widest uppercase">
             Live Session: {sessionId?.substring(0, 8)}...
           </div>
         </div>
         <div className="h-[calc(100%-2rem)]">
           <TerminalComponent key={activeScenario.id} onCommand={terminalState.handleCommand} />
         </div>

         {/* AI Follow-up Overlay */}
         {showFollowUp && (
           <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-12 z-50 animate-in fade-in zoom-in duration-500">
             <div className="max-w-2xl w-full bg-white/5 border border-white/10 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
               <h3 className="text-2xl font-bold mb-6 text-indigo-400">Contextual Follow-up</h3>
               <p className="text-lg text-gray-200 mb-8 leading-relaxed italic">"{followUpQuestion || 'Analyzing your solution...'}"</p>
               <textarea
                 className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[150px] mb-8"
                 placeholder="Enter your explanation..."
                 value={followUpAnswer}
                 onChange={(e) => setFollowUpAnswer(e.target.value)}
               ></textarea>
               <button 
                 onClick={submitFollowUp}
                 disabled={!followUpAnswer || isFinishing}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center disabled:opacity-50"
               >
                 {isFinishing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Complete Interview"}
               </button>
             </div>
           </div>
         )}
      </div>
      <div className="w-[40%] h-full bg-[#0a0a0a]">
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
