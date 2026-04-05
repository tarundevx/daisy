import React from 'react';
import { Terminal, Clock, CheckCircle2, ChevronRight, Activity, Command } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScenarioBrief({ scenario, duration, solved, commandsUsed }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-tally-surface">
      <div className="p-10 border-b border-tally-border bg-white shadow-sm">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="px-3 py-1 bg-tally-bg text-tally-pink text-[10px] font-bold uppercase tracking-widest rounded-full border border-tally-border">
            Technical Challenge
          </span>
          {solved && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Resolved
            </span>
          )}
        </motion.div>

        <h2 className="text-3xl font-bold text-tally-text-primary tracking-tight mb-4">
          {scenario.title}
        </h2>
        
        <p className="text-tally-text-secondary text-base leading-relaxed mb-10 font-medium">
          {scenario.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-tally-bg p-4 rounded-tally-lg border border-tally-border">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-tally-blue" />
            </div>
            <div>
              <div className="text-[10px] text-tally-text-secondary font-bold uppercase tracking-widest leading-none mb-1">Time</div>
              <div className="text-sm font-bold text-tally-text-primary">{formatTime(duration)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-tally-bg p-4 rounded-tally-lg border border-tally-border">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Command className="w-4 h-4 text-tally-pink" />
            </div>
            <div>
              <div className="text-[10px] text-tally-text-secondary font-bold uppercase tracking-widest leading-none mb-1">Ops</div>
              <div className="text-sm font-bold text-tally-text-primary">{commandsUsed.length} Actions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-10 custom-scrollbar">
        <h3 className="text-[10px] font-bold text-tally-text-secondary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
           <Activity className="w-4 h-4" /> Live Operation Log
        </h3>
        {commandsUsed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
             <div className="w-12 h-12 bg-tally-bg rounded-full flex items-center justify-center mb-4 border border-tally-border">
                <Terminal className="w-5 h-5 text-tally-text-secondary" />
             </div>
             <p className="text-sm font-medium">Awaiting terminal input...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commandsUsed.map((cmd, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 bg-white p-3.5 rounded-tally-lg border border-tally-border shadow-sm group hover:border-tally-blue/30 transition-all"
              >
                <span className="text-[10px] font-mono font-bold text-tally-text-secondary/40 w-4">{i+1}</span>
                <ChevronRight className="w-3 h-3 text-tally-blue opacity-40 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-mono font-bold text-tally-text-primary truncate">{cmd}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
