import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal as TerminalIcon, CheckCircle2, XCircle, Loader2, Send } from 'lucide-react';
import { bootWebContainer, mountProject, runTests } from '../services/webcontainerService';
import { rateLimiterScenarioFiles } from '../scenarios/rateLimiterScenario';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        // Start backend session for tracking
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
            theme: { background: '#121820' },
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

    // AI Logging: Log test run result
    if (sessionId) {
      await axios.post('/api/session/command', {
        sessionId,
        command: 'npm test',
        scenarioId: 'rate_limiter',
        sessionState: { passed: results.numFailedTestSuites === 0 }
      });
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    setIsFinishing(true);
    try {
      // 1. Log the final code submission as an event for AI analysis
      await axios.post('/api/session/command', {
        sessionId,
        command: 'final_code_submission',
        scenarioId: 'rate_limiter',
        sessionState: { 
          code: files['middleware.js'].file.contents,
          testsPassed: testResults?.numFailedTestSuites === 0
        }
      });

      // 2. Wrap up session
      await axios.post('/api/session/end', {
        sessionId,
        userId: user?.id,
        candidateName: user?.name,
        scenarioId: 'rate_limiter',
        sessionState: { solved: testResults?.numFailedTestSuites === 0 },
        commandLog: [] // The backend already has events
      });

      // Crucial: Wait for DB propagation
      setTimeout(() => navigate(`/report/${sessionId}`), 800);
    } catch (err) {
      console.error('Failed to finish assessment:', err);
      setIsFinishing(false);
    }
  };

  const isEditable = activeFile === 'middleware.js';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-white font-sans overflow-hidden">
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-6 h-6 text-indigo-400" />
          <h1 className="text-lg font-semibold tracking-wide text-gray-100">Backend System Design Task</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleRunTests}
            disabled={isBooting || isRunning}
            className={`flex items-center gap-2 px-5 py-2 rounded-md font-medium text-sm transition-all duration-200
              ${isBooting || isRunning 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
              }`}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isBooting ? 'Booting Sandbox...' : isRunning ? 'Running...' : 'Submit & Run Tests'}
          </button>

          {testResults && (
            <button
              onClick={handleFinish}
              disabled={isFinishing}
              className="flex items-center gap-2 px-5 py-2 rounded-md font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/20"
            >
              {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Finish & View Report
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Briefing & Results */}
        <div className="w-[45%] flex flex-col border-r border-gray-800 overflow-y-auto bg-black/40">
          <div className="p-8">
             <div className="mb-8">
               <h2 className="text-xl font-medium text-white mb-4">API Rate Limiter & Cache Layer</h2>
               <p className="text-gray-400 text-sm leading-relaxed mb-4">
                 Your task is to implement a middleware that handles both rate limiting and caching. Unoptimized endpoints 
                 can bring down a system under heavy load.
               </p>
               <ul className="space-y-3 mb-6">
                 <li className="flex gap-3 text-sm text-gray-300 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                   <span><strong>Caching:</strong> Repeated requests to the same endpoint should be cached to improve response times (&lt; 15ms).</span>
                 </li>
                 <li className="flex gap-3 text-sm text-gray-300 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                   <span><strong>Concurrency:</strong> Must handle up to 100 concurrent requests without race conditions or cache stampedes.</span>
                 </li>
                 <li className="flex gap-3 text-sm text-gray-300 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                   <span><strong>Rate Limiting:</strong> Enforce a limit of 100 requests per sliding window. Exceeding limits should return a HTTP 429 status.</span>
                 </li>
               </ul>
             </div>

             {/* Test Results Section */}
             <div className="bg-[#121820] rounded-lg border border-gray-800/80 p-4 min-h-[300px]">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4" /> Output Console
                </h3>
                
                {/* Terminal Output */}
                <div ref={terminalRef} className="h-48 w-full bg-[#0d1117] border border-gray-800 rounded p-2 mb-4"></div>

                {/* Parsed Jest Results */}
                {testResults && testResults.testResults && (
                  <div className="space-y-3 mt-4 border-t border-gray-800 pt-4">
                     {testResults.numFailedTestSuites === 0 && (
                        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5 flex flex-col items-center justify-center text-center">
                           <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                              <CheckCircle2 className="w-6 h-6" />
                           </div>
                           <h3 className="text-lg font-semibold text-emerald-400 mb-1">Architecture Verified!</h3>
                           <p className="text-sm text-emerald-400/80">Excellent work! Your system design meets all performance and reliability requirements.</p>
                        </div>
                     )}
                     
                     <h4 className="text-sm font-medium text-white">Execution Summary</h4>
                     {testResults.testResults[0].assertionResults.map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/5">
                           <span className="text-sm text-gray-300">{result.title}</span>
                           {result.status === 'passed' ? (
                             <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                             </span>
                           ) : (
                             <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full">
                               <XCircle className="w-3.5 h-3.5" /> Failed
                             </span>
                           )}
                        </div>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="w-[55%] flex flex-col bg-[#1e1e1e]">
          <div className="flex bg-[#161b22] border-b border-gray-800 h-11 overflow-hidden shrink-0">
            {['middleware.js', 'server.js', 'rate-limiter.test.js'].map(filename => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`px-5 text-[13px] font-medium border-r border-gray-800 transition-colors ${
                  activeFile === filename ? 'bg-[#1e1e1e] text-indigo-400 border-t-2 border-t-indigo-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-t-2 border-t-transparent'
                }`}
              >
                {filename} {filename !== 'middleware.js' && <span className="ml-2 opacity-40 text-[11px]">(read-only)</span>}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              path={activeFile}
              language="javascript"
              theme="vs-dark"
              defaultValue={files[activeFile].file.contents}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                readOnly: !isEditable,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                renderWhitespace: "selection"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
