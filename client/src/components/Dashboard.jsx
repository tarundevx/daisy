import React from 'react';
import { Play, Code2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard({ onStart, isEvolving, evolutionSummary }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-3xl w-full">
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-tight">Daisy</h1>
          <p className="text-xl text-gray-600 font-medium">HydraDB Contextual Interview Simulator</p>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
            Leetcode tests what you memorized. Daisy tests how you think — and gets smarter every time you practice.
          </p>
        </div>

        {isEvolving && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8 text-center shadow-sm">
             <div className="flex justify-center mb-3">
               <Activity className="w-8 h-8 text-indigo-500" />
             </div>
             <h3 className="text-lg font-bold text-indigo-900 mb-2">Your profile is evolving</h3>
             <p className="text-indigo-800 text-sm italic">"{evolutionSummary || 'You have started establishing a baseline debugging pattern.'}"</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 px-4">
            <button 
              onClick={() => onStart()}
              className="flex-1 max-w-xs px-8 py-6 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
            >
              <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              Scenario Sandbox
            </button>

            <button 
              onClick={() => navigate('/code')}
              className="flex-1 max-w-xs px-8 py-6 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
            >
              <Code2 className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform text-indigo-600" />
              Code Sandbox
            </button>
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Powered by Gemini 1.5 Flash & HydraDB</p>
        </div>

      </div>
    </div>
  );
}
