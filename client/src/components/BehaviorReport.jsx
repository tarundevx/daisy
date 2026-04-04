import React from 'react';
import { Home, BrainCircuit, AlertTriangle, Lightbulb } from 'lucide-react';

export function BehaviorReport({ report, onHome }) {
  if (!report) return null;

  const { strengths, weakAreas, thinkingPattern, score, nextScenarioRecommendation, hiringSignal } = report;

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'strong_yes': return 'bg-green-100 text-green-800 border-green-200';
      case 'yes': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSignalLabel = (signal) => {
    return signal.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <BrainCircuit className="w-48 h-48" />
          </div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Behavioral Output</h1>
              <p className="text-indigo-200 text-lg">AI-Powered Debugging Analysis</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-indigo-400 flex items-center justify-center bg-black/20 backdrop-blur-sm relative">
                  <span className="text-5xl font-black text-white">{score}</span>
              </div>
              <span className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold shadow-md border backdrop-blur-md uppercase tracking-wide ${getSignalColor(hiringSignal)}`}>
                {getSignalLabel(hiringSignal)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-8 bg-gray-50">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-3">
              <BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" />
              Thinking Pattern
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">{thinkingPattern}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-green-500">
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
                Strengths
              </h3>
              <ul className="space-y-3">
                 {strengths.map((str, i) => (
                   <li key={i} className="flex items-start text-sm text-gray-600">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-2 flex-shrink-0" />
                     {str}
                   </li>
                 ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-red-500">
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Growth Areas
              </h3>
              <ul className="space-y-3">
                 {weakAreas.map((weak, i) => (
                   <li key={i} className="flex items-start text-sm text-gray-600">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0" />
                     {weak}
                   </li>
                 ))}
              </ul>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Next Step
              </h3>
              <p className="text-indigo-800 mt-1">{nextScenarioRecommendation.rationale}</p>
              <div className="mt-2 text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded inline-block">
                Skill focus: {nextScenarioRecommendation.scenarioId.replace('_', ' ')}
              </div>
            </div>
            
            <button 
              onClick={onHome}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center flex-shrink-0"
            >
              Finish & Go Home
              <Home className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({className}) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
