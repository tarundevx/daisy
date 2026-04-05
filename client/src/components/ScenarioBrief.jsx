import React from 'react';
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
          className="flex items-center gap-4 mb-6"
        >
          <span className="px-4 py-1.5 bg-tally-bg text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-tally-border">
            Technical Challenge
          </span>
          {solved && (
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Resolved
            </span>
          )}
        </motion.div>

        <h2 className="text-4xl font-black text-tally-text-primary tracking-tighter mb-6 italic leading-none">
          {scenario.title}
        </h2>
        
        <p className="text-tally-text-secondary text-lg leading-snug mb-12 font-medium tracking-tight">
          {scenario.description}
        </p>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2 bg-tally-bg p-6 rounded-tally-lg border border-tally-border">
            <div className="text-[9px] text-tally-text-secondary font-black uppercase tracking-[0.3em] opacity-60">Session Time</div>
            <div className="text-2xl font-black text-tally-text-primary italic">{formatTime(duration)}</div>
          </div>
          <div className="flex flex-col gap-2 bg-tally-bg p-6 rounded-tally-lg border border-tally-border">
            <div className="text-[9px] text-tally-text-secondary font-black uppercase tracking-[0.3em] opacity-60">Ops cycles</div>
            <div className="text-2xl font-black text-tally-text-primary italic">{commandsUsed.length} Actions</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-10 custom-scrollbar">
        <h3 className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
           Live Operation Log
        </h3>
        {commandsUsed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
             <div className="h-1 bg-tally-border w-12 mb-6"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting terminal Trace...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {commandsUsed.map((cmd, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6 bg-white p-5 rounded-tally-lg border border-tally-border group transition-all"
              >
                <span className="text-[9px] font-black text-tally-text-secondary opacity-30 w-6 italic">#{String(i+1).padStart(2, '0')}</span>
                <div className="w-1.5 h-1.5 bg-tally-blue rounded-full opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-xs font-black text-tally-text-primary truncate uppercase tracking-widest">{cmd}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
