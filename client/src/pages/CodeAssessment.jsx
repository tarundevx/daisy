import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { bootWebContainer, mountProject, runTests } from '../services/webcontainerService';
import { rateLimiterScenarioFiles } from '../scenarios/rateLimiterScenario';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export function CodeAssessment() {
  const [activeFile, setActiveFile] = useState('middleware.js');
  const activeFileRef = useRef('middleware.js');

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  const [files, setFiles] = useState(rateLimiterScenarioFiles);
  const [isBooting, setIsBooting] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [wcInstance, setWcInstance] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const termInstance = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await axios.post('/api/session/start', {
          userId: user?.id,
          scenarioId: 'rate_limiter'
        });
        setSessionId(sessionRes.data.sessionId);

        const wc = await bootWebContainer();
        await mountProject(wc, files);
        setWcInstance(wc);
        setIsBooting(false);
        
        if (terminalRef.current && !termInstance.current) {
          const fitAddon = new FitAddon();
          const term = new Terminal({
            theme: { 
              background: '#0a192f',
              foreground: '#e5e7eb',
              cursor: '#0072e3',
              selectionBackground: '#0072e333'
            },
            fontFamily: 'monospace',
            fontSize: 12,
            convertEol: true,
            disableStdin: true
          });
          term.loadAddon(fitAddon);
          term.open(terminalRef.current);
          fitAddon.fit();
          termInstance.current = term;
          term.writeln('WebContainer booted. Ready for tests.');
        }
      } catch (err) {
        console.error('Failed to boot WebContainer:', err);
      }
    }
    init();
  }, [user?.id]);

  useEffect(() => {
    if (!sessionId) return;
    const socket = io(window.location.origin.replace('5173', '3000'));
    socket.emit('join_code_session', {
      sessionId: sessionId,
      candidateName: user?.name || 'Anonymous Candidate',
      scenario: 'rate_limiter'
    });
    return () => {
      socket.disconnect();
    };
  }, [sessionId, user]);

  const handleEditorChange = (value) => {
    if (activeFileRef.current !== 'middleware.js') return;
    setFiles(prev => ({
      ...prev,
      [activeFileRef.current]: {
        file: { contents: value }
      }
    }));
  };

  const handleRunTests = async () => {
    if (!wcInstance) return;
    setIsRunning(true);
    setTestResults(null);
    termInstance.current?.clear();
    termInstance.current?.writeln('Updating files...');
    await mountProject(wcInstance, files);
    const onOutput = (data) => {
      termInstance.current?.write(data);
    };
    const results = await runTests(wcInstance, onOutput);
    setTestResults(results);
    setIsRunning(false);

    if (sessionId) {
      await axios.post('/api/session/command', {
        sessionId,
        command: 'npm test',
        scenarioId: 'rate_limiter',
        sessionState: { 
          passed: results?.numFailedTestSuites === 0,
          numPassedTests: results?.numPassedTests || 0,
          numTotalTests: results?.numTotalTests || 0,
          code: files['middleware.js'].file.contents,
          output: results?.rawOutput
        }
      });
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    setIsFinishing(true);
    try {
      await axios.post('/api/session/command', {
        sessionId,
        command: 'final_code_submission',
        scenarioId: 'rate_limiter',
        sessionState: { 
          code: files['middleware.js'].file.contents,
          testsPassed: testResults?.numFailedTestSuites === 0,
          numPassedTests: testResults?.numPassedTests || 0,
          numTotalTests: testResults?.numTotalTests || 0,
          output: testResults?.rawOutput
        }
      });

      await axios.post('/api/session/end', {
        sessionId,
        userId: user?.id,
        candidateName: user?.name,
        scenarioId: 'rate_limiter',
        sessionState: { solved: testResults?.numFailedTestSuites === 0 },
        commandLog: []
      });

      setTimeout(() => navigate(`/report/${sessionId}`), 800);
    } catch (err) {
      console.error('Failed to finish assessment:', err);
      setIsFinishing(false);
    }
  };

  const isEditable = activeFile === 'middleware.js';

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('custom-dark-blue', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a192f',
      }
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-tally-bg text-tally-text-primary font-sans overflow-hidden">
      <header className="h-20 flex items-center justify-between px-8 border-b border-tally-border bg-tally-surface">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-tally-text-primary leading-none mb-1 italic">Architecture sandbox</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tally-text-secondary opacity-60">System Synchronized</span>
            </div>
          </div>
        </motion.div>
        
        <div className="flex gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunTests}
            disabled={isBooting || isRunning}
            className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all
              ${isBooting || isRunning 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-tally-blue hover:bg-black text-white shadow-xl shadow-tally-blue/10'
              }`}
          >
            {isBooting ? 'System Booting...' : isRunning ? 'Executing...' : 'Submit & Execute'}
          </motion.button>

          {testResults && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinish}
              disabled={isFinishing}
              className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] bg-tally-pink hover:bg-black text-white transition-all shadow-xl shadow-tally-pink/10"
            >
              {isFinishing ? 'Finalizing...' : 'Complete Phase'}
            </motion.button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Briefing & Console */}
        <div className="w-[42%] flex flex-col border-r border-tally-border bg-tally-bg overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-12 bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-tally-pink opacity-20"></div>
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.3em]">System Specification</h2>
                </div>
                
                <p className="text-tally-text-primary text-xl leading-snug mb-10 font-medium tracking-tight">
                  Implement a high-performance middleware layer that handles <span className="text-tally-blue font-black italic underline decoration-2 underline-offset-4">In-Memory Caching</span> and <span className="text-tally-pink font-black italic underline decoration-2 underline-offset-4">Sliding Window Rate Limiting</span>.
                </p>

                <div className="space-y-8">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[9px] font-black text-tally-blue uppercase tracking-[0.2em]">Objective 01</h4>
                    <p className="text-sm text-tally-text-primary font-bold opacity-80 uppercase tracking-widest leading-none">Caching Layer</p>
                    <p className="text-[11px] text-tally-text-secondary font-medium leading-relaxed">Improve response times for hot endpoints to &lt; 15ms.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[9px] font-black text-tally-pink uppercase tracking-[0.2em]">Objective 02</h4>
                    <p className="text-sm text-tally-text-primary font-bold opacity-80 uppercase tracking-widest leading-none">Security Throttling</p>
                    <p className="text-[11px] text-tally-text-secondary font-medium leading-relaxed">Enforce 100 req/window. Return HTTP 429 when exceeded.</p>
                  </div>
                </div>
             </motion.div>

             {/* Output Console Container */}
             <div className="bg-tally-surface rounded-tally-xl border border-tally-border p-10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.3em]">
                    Execution Console
                  </h3>
                  {testResults && (
                    <div className="text-[9px] font-black text-tally-blue uppercase tracking-[0.2em] italic">
                      Telemetry Active
                    </div>
                  )}
                </div>
                
                <div className="bg-[#0a192f] border border-black rounded-tally-lg overflow-hidden mb-10 shadow-2xl">
                  <div ref={terminalRef} className="h-56 w-full p-4"></div>
                </div>

                <AnimatePresence>
                  {testResults && testResults.testResults && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 pt-10 border-t border-tally-bg"
                    >
                       {testResults.numFailedTestSuites === 0 && (
                          <motion.div 
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="mb-10 bg-emerald-50 border border-emerald-100 rounded-tally-xl p-8 flex flex-col items-center justify-center text-center"
                          >
                             <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-4 italic">VERIFIED SUCCESS</div>
                             <h3 className="text-3xl font-black text-emerald-700 mb-2 tracking-tighter leading-none italic">Benchmarking Passed</h3>
                             <p className="text-xs text-emerald-600 font-bold opacity-80">All performance metrics and security assertions validated.</p>
                          </motion.div>
                       )}
                       
                       <h4 className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.2em] mb-4">Internal Assertions</h4>
                       {testResults.testResults[0].assertionResults.map((result, idx) => (
                          <div key={idx} className="flex items-center justify-between p-5 rounded-tally-lg bg-tally-bg border border-tally-border group transition-all">
                             <span className="text-[11px] text-tally-text-primary font-black uppercase tracking-widest leading-none group-hover:italic transition-all">{result.title}</span>
                             {result.status === 'passed' ? (
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded border border-emerald-100 shadow-sm">
                                 Validated
                               </span>
                             ) : (
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600 bg-rose-50 px-3 py-1 rounded border border-rose-100 shadow-sm">
                                 Failed
                               </span>
                             )}
                          </div>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="w-[58%] flex flex-col bg-white">
          <div className="flex bg-tally-surface border-b border-tally-border h-16 overflow-hidden shrink-0 relative z-10">
            {['middleware.js', 'server.js', 'rate-limiter.test.js'].map(filename => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`px-10 text-[10px] font-black uppercase tracking-[0.2em] border-r border-tally-border transition-all duration-300 relative ${
                  activeFile === filename 
                    ? 'bg-white text-tally-blue italic' 
                    : 'text-tally-text-secondary/60 hover:text-black'
                }`}
              >
                {activeFile === filename && <div className="absolute top-0 left-0 w-full h-1.5 bg-tally-blue"></div>}
                {filename === 'middleware.js' ? 'Subject Logic' : filename}
                {filename !== 'middleware.js' && <span className="opacity-30 ml-2 text-[8px] font-black">READ ONLY</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 relative bg-[#0a192f]">
            <Editor
              height="100%"
              path={activeFile}
              language="javascript"
              theme="custom-dark-blue"
              beforeMount={handleEditorWillMount}
              defaultValue={files[activeFile].file.contents}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                readOnly: !isEditable,
                fontSize: 15,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 28,
                padding: { top: 40, left: 32 },
                scrollBeyondLastLine: false,
                renderWhitespace: "none",
                smoothScrolling: true,
                cursorBlinking: "solid",
                cursorSmoothCaretAnimation: "on",
                fontLigatures: true,
                bracketPairColorization: { enabled: true },
                guides: { indentation: false },
                scrollbar: {
                    verticalScrollbarSize: 4,
                    horizontalScrollbarSize: 4,
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
