import React from 'react';
import { Play, TrendingUp, Clock, Activity } from 'lucide-react';

export function Dashboard({ onStart, isEvolving, evolutionSummary }) {

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

        <div className="flex justify-center mt-12">
            <button 
              onClick={() => onStart()}
              className="px-10 py-5 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              <Play className="w-8 h-8 mr-3 fill-current" />
              Start Practice Session
            </button>
        </div>

      </div>
    </div>
  );
}
