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
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, Sparkles, Send, ArrowRight, ShieldCheck } from 'lucide-react';

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
    let ignore = false;

    const startSession = async () => {
      try {
        const res = await axios.post('/api/session/start', { 
          userId: user?.id,
          scenarioId: SCENARIO_SEQUENCE[scenarioIndex]
        });
        if (!ignore) {
          setSessionId(res.data.sessionId);
          setActiveScenario(SCENARIO_MAP[SCENARIO_SEQUENCE[scenarioIndex]]);
        }
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    };
    if (user?.id) {
       startSession();
    }
    
    return () => { ignore = true; };
  }, [scenarioIndex, user?.id]);

  useEffect(() => {
    if (!sessionId || !user || !activeScenario) return;
    const socket = io(window.location.origin.replace('5173', '3000'));
    socket.emit('join_code_session', { 
      sessionId, 
      candidateName: user.name,
      scenario: activeScenario.id
    });
    return () => {
      socket.disconnect();
    };
  }, [sessionId, user, activeScenario?.id]);

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
        setScenarioIndex(prev => prev + 1);
        setActiveScenario(null); // Force-clear current scenario to show loading state
        setSessionId(null);
        setShowFollowUp(false);
        setFollowUpAnswer('');
        setFollowUpQuestion('');
        setIsFinishing(false);
      } else {
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
    <div className="h-screen w-screen flex bg-tally-bg overflow-hidden font-sans">
      <div className="w-[62%] h-full p-10 flex flex-col relative">
         <header className="flex justify-between items-center mb-8">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex items-center gap-3"
           >
             <div className="p-2 bg-tally-blue text-white rounded-tally-lg">
               <TerminalIcon className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-tally-text-primary tracking-tight leading-none mb-1">Live Terminal</h2>
               <div className="text-[10px] text-tally-text-secondary/60 font-bold uppercase tracking-widest">
                 Session UUID: {sessionId?.substring(0, 8)}...
               </div>
             </div>
           </motion.div>
           
           <div className="flex gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
           </div>
         </header>

          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex-1 bg-white border border-tally-border rounded-tally-xl shadow-sm overflow-hidden p-6 relative"
          >
            {activeScenario ? (
               <TerminalComponent key={activeScenario.id} onCommand={terminalState.handleCommand} />
            ) : (
               <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a192f] rounded-lg">
                 <div className="w-12 h-12 border-4 border-tally-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                 <div className="text-tally-blue font-bold tracking-widest text-[10px] uppercase animate-pulse">Initializing Neural Sandbox...</div>
               </div>
            )}
          </motion.div>

         <AnimatePresence>
           {showFollowUp && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center p-12 z-50"
             >
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="max-w-2xl w-full bg-white border border-tally-border p-12 rounded-tally-xl shadow-2xl relative overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-tally-blue to-tally-pink"></div>
                 
                 <div className="flex items-center gap-3 mb-8">
                   <div className="p-2.5 bg-tally-blue/10 text-tally-blue rounded-full">
                     <Sparkles className="w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-bold text-tally-text-primary tracking-tight">Contextual Verification</h3>
                 </div>

                 <p className="text-xl text-tally-text-primary mb-10 leading-relaxed font-medium italic">
                    "{followUpQuestion || 'Analyzing your performance and technical decisions...'}"
                 </p>

                 <div className="relative mb-10">
                   <textarea
                     className="w-full bg-tally-bg border border-tally-border rounded-tally-lg p-6 text-tally-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all min-h-[160px] font-medium"
                     placeholder="State your technical justification..."
                     value={followUpAnswer}
                     onChange={(e) => setFollowUpAnswer(e.target.value)}
                   ></textarea>
                 </div>

                 <motion.button 
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.99 }}
                   onClick={submitFollowUp}
                   disabled={!followUpAnswer || isFinishing}
                   className="w-full bg-tally-blue hover:bg-blue-600 text-white font-bold py-5 rounded-full transition-all shadow-lg shadow-tally-blue/10 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isFinishing ? (
                     <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     <>
                        <span className="text-lg">Submit & Continue</span>
                        <ArrowRight className="w-5 h-5" />
                     </>
                   )}
                 </motion.button>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      <div className="w-[38%] h-full bg-tally-surface border-l border-tally-border shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-10">
          {activeScenario ? (
            <ScenarioBrief 
                scenario={activeScenario} 
                duration={terminalState.duration} 
                solved={terminalState.solved}
                commandsUsed={terminalState.commandsUsed}
            />
          ) : (
            <div className="p-10 flex flex-col items-center justify-center h-full text-center">
               <div className="p-4 bg-tally-bg rounded-tally-xl border border-tally-border mb-6">
                 <Sparkles className="w-8 h-8 text-tally-blue animate-pulse" />
               </div>
               <h3 className="text-xl font-bold text-tally-text-primary mb-2">Preparing Scenario</h3>
               <p className="text-sm text-tally-text-secondary leading-relaxed">Configuring the virtual environment for the next evaluation phase.</p>
            </div>
          )}
      </div>
    </div>
  );
}
