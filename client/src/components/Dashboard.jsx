import React from 'react';
import { Play, TrendingUp, Clock, Activity } from 'lucide-react';

export function Dashboard({ onStart, isEvolving, evolutionSummary }) {
  // Temporary hardcoded past sessions to demo UI
  const sessions = [
    { scenario: 'NGINX 502', date: '2026-10-09', score: 85, solved: true, time: '3m 12s' },
    { scenario: 'Service Down', date: '2026-10-08', score: 62, solved: false, time: '10m 00s' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
      <div className="max-w-5xl w-full">
        
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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Session History</h2>
              <p className="text-gray-500 text-sm mt-1">Review your past performance</p>
            </div>
            <button 
              onClick={() => onStart()}
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg shadow-md transition-colors flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Practice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="px-6 py-4">Scenario</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((sess, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{sess.scenario}</td>
                    <td className="px-6 py-4">{sess.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">{sess.score}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sess.solved ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">Solved</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">Timeout</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-500">{sess.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
