import React from 'react';
import { Terminal, Clock, CheckCircle } from 'lucide-react';

export function ScenarioBrief({ scenario, duration, solved, commandsUsed }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold font-sans text-gray-900 flex items-center mb-2">
          {scenario.title}
          {solved && <CheckCircle className="ml-2 w-6 h-6 text-green-500" />}
        </h2>
        <p className="text-gray-600">{scenario.description}</p>
        
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">
            <Clock className="w-4 h-4 mr-2 text-indigo-600" />
            {formatTime(duration)}
          </div>
          <div className="flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">
            <Terminal className="w-4 h-4 mr-2 text-indigo-600" />
            {commandsUsed.length} commands
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Live Command Log</h3>
        {commandsUsed.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Waiting for input...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {commandsUsed.map((cmd, i) => (
              <div key={i} className="flex font-mono text-sm">
                <span className="text-gray-400 mr-3 block w-4 text-right">{i+1}</span>
                <span className="text-indigo-700">{cmd}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
