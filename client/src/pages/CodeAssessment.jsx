import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal as TerminalIcon, CheckCircle2, XCircle, Loader2, Send, FileCode, Info } from 'lucide-react';
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
              background: '#ffffff',
              foreground: '#111827',
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

  return (
    <div className="h-screen w-screen flex flex-col bg-tally-bg text-tally-text-primary font-sans overflow-hidden">
      <header className="h-20 flex items-center justify-between px-8 border-b border-tally-border bg-tally-surface">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="p-2.5 bg-tally-blue text-white rounded-tally-lg">
            <TerminalIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-tally-text-primary leading-none mb-1">Architecture Sandbox</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-tally-text-secondary/60">Live Environment</span>
            </div>
          </div>
        </motion.div>
        
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunTests}
            disabled={isBooting || isRunning}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all
              ${isBooting || isRunning 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-tally-border' 
                : 'bg-tally-blue hover:bg-blue-600 text-white shadow-md shadow-tally-blue/10'
              }`}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
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
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-tally-pink hover:bg-pink-600 text-white transition-all shadow-md shadow-tally-pink/10"
            >
              {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Complete Assessment
            </motion.button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Briefing & Console */}
        <div className="w-[42%] flex flex-col border-r border-tally-border bg-tally-bg overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-10 bg-tally-surface border border-tally-border p-8 rounded-tally-xl shadow-sm"
             >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-pink-50 text-tally-pink rounded-lg">
                    <Info className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-tally-text-primary tracking-tight">System Specification</h2>
                </div>
                
                <p className="text-tally-text-secondary text-base leading-relaxed mb-8 font-medium">
                  Implement a high-performance middleware layer that handles <span className="text-tally-blue font-bold">In-Memory Caching</span> and <span className="text-tally-pink font-bold">Sliding Window Rate Limiting</span>.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-5">
                    <div className="w-10 h-10 bg-tally-bg rounded-tally-lg flex items-center justify-center shrink-0 border border-tally-border">
                      <Activity className="w-5 h-5 text-tally-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-tally-text-primary mb-1">Caching Layer</h4>
                      <p className="text-xs text-tally-text-secondary font-medium">Improve response times for hot endpoints to &lt; 15ms.</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-10 h-10 bg-tally-bg rounded-tally-lg flex items-center justify-center shrink-0 border border-tally-border">
                      <Shield className="w-5 h-5 text-tally-pink" />
                    </div>
                    <div>
                      <h4 className="font-bold text-tally-text-primary mb-1">Security Throttling</h4>
                      <p className="text-xs text-tally-text-secondary font-medium">Enforce 100 req/window. Return HTTP 429 when exceeded.</p>
                    </div>
                  </div>
                </div>
             </motion.div>

             {/* Output Console Container */}
             <div className="bg-tally-surface rounded-tally-xl border border-tally-border p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-tally-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4" /> Execution Console
                  </h3>
                  {testResults && (
                    <div className="text-[10px] font-bold text-tally-blue uppercase tracking-widest bg-tally-bg px-2 py-0.5 rounded-full border border-tally-border">
                      Tests Loaded
                    </div>
                  )}
                </div>
                
                <div className="bg-white border border-tally-border rounded-tally-lg overflow-hidden mb-8">
                  <div ref={terminalRef} className="h-48 w-full p-4"></div>
                </div>

                <AnimatePresence>
                  {testResults && testResults.testResults && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-6 border-t border-tally-bg"
                    >
                       {testResults.numFailedTestSuites === 0 && (
                          <motion.div 
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="mb-8 bg-emerald-50 border border-emerald-100 rounded-tally-lg p-6 flex flex-col items-center justify-center text-center shadow-sm"
                          >
                             <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-8 h-8" />
                             </div>
                             <h3 className="text-xl font-bold text-emerald-700 mb-1 tracking-tight">Verified Success!</h3>
                             <p className="text-sm text-emerald-600 font-medium">All performance benchmarks and unit tests passed perfectly.</p>
                          </motion.div>
                       )}
                       
                       <h4 className="text-[10px] font-bold text-tally-text-secondary uppercase tracking-widest mb-2">Test Assertions</h4>
                       {testResults.testResults[0].assertionResults.map((result, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-tally-lg bg-tally-bg border border-tally-border group">
                             <span className="text-sm text-tally-text-primary font-bold">{result.title}</span>
                             {result.status === 'passed' ? (
                               <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                 <CheckCircle2 className="w-3 h-3" /> Passed
                               </span>
                             ) : (
                               <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                 <XCircle className="w-3 h-3" /> Failed
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
          <div className="flex bg-tally-surface border-b border-tally-border h-14 overflow-hidden shrink-0 shadow-sm relative z-10">
            {['middleware.js', 'server.js', 'rate-limiter.test.js'].map(filename => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`px-8 text-[11px] font-bold uppercase tracking-[0.1em] border-r border-tally-border transition-all duration-300 flex items-center gap-2 group ${
                  activeFile === filename 
                    ? 'bg-white text-tally-blue shadow-[0_4px_0_-2px_#0072e3_inset]' 
                    : 'text-tally-text-secondary/60 hover:text-tally-blue hover:bg-gray-50'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${activeFile === filename ? 'text-tally-blue' : 'text-tally-text-secondary/40 group-hover:text-tally-blue'}`} />
                {filename === 'middleware.js' ? 'Candidate Code' : filename}
                {filename !== 'middleware.js' && <span className="opacity-40 font-medium">(RT-ONLY)</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 relative bg-white">
            <Editor
              height="100%"
              path={activeFile}
              language="javascript"
              theme="vs"
              defaultValue={files[activeFile].file.contents}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                readOnly: !isEditable,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 26,
                padding: { top: 32, left: 24 },
                scrollBeyondLastLine: false,
                renderWhitespace: "none",
                smoothScrolling: true,
                cursorBlinking: "expand",
                cursorSmoothCaretAnimation: "on",
                fontLigatures: true,
                bracketPairColorization: { enabled: true },
                guides: { indentation: false }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
