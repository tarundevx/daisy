import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Dashboard({ onStart, isEvolving, evolutionSummary }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-tally-bg flex flex-col items-center justify-center p-12 font-sans overflow-hidden">
      <div className="max-w-4xl w-full">
        
        <div className="text-center mb-20 relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-tally-blue/5 rounded-full blur-3xl"></div>
          <h1 className="text-9xl font-black text-tally-text-primary mb-6 tracking-tighter italic leading-none">
            Daisy
          </h1>
          <p className="text-3xl text-tally-text-secondary font-medium tracking-tight mb-4">
            HydraDB Contextual Interview Simulator
          </p>
          <div className="h-1.5 w-24 bg-tally-blue mx-auto mb-10"></div>
          <p className="text-sm text-tally-text-secondary font-black uppercase tracking-[0.3em] max-w-2xl mx-auto opacity-60 leading-relaxed">
            Neural evaluation for the next generation of architects.
          </p>
        </div>

        {isEvolving && (
          <div className="bg-tally-surface border border-tally-border rounded-tally-xl p-10 mb-12 text-center shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-tally-blue"></div>
             <div className="text-[10px] font-black text-tally-blue uppercase tracking-[0.4em] mb-4 italic">Neural Evolution Trace</div>
             <h3 className="text-3xl font-black text-tally-text-primary mb-4 tracking-tighter italic">Dynamic Profile Active</h3>
             <p className="text-xl text-tally-text-secondary font-bold italic tracking-tight opacity-90 underline decoration-tally-blue/20 underline-offset-8">
               "{evolutionSummary || 'You have started establishing a baseline debugging pattern.'}"
             </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10 justify-center mt-16 px-4">
            <button 
              onClick={() => onStart()}
              className="flex-1 max-w-md px-12 py-10 bg-white border-2 border-black hover:bg-black hover:text-white text-black transition-all shadow-2xl hover:shadow-tally-blue/10 flex flex-col items-start gap-6 group relative overflow-hidden"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity italic">Phase 01</div>
              <div className="text-4xl font-black italic tracking-tighter uppercase">Scenario Hub</div>
              <div className="h-1 w-12 bg-tally-pink"></div>
            </button>

            <button 
              onClick={() => navigate('/code')}
              className="flex-1 max-w-md px-12 py-10 bg-white border-2 border-black hover:bg-black hover:text-white text-black transition-all shadow-2xl hover:shadow-tally-pink/10 flex flex-col items-start gap-6 group relative overflow-hidden"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity italic">Phase 02</div>
              <div className="text-4xl font-black italic tracking-tighter uppercase">Code Sandbox</div>
              <div className="h-1 w-12 bg-tally-blue"></div>
            </button>
        </div>

        <div className="mt-24 text-center">
          <p className="text-[9px] text-tally-text-secondary font-black uppercase tracking-[0.4em] opacity-40">GEMINI NEURAL ENGINE & HYDRADB INFRASTRUCTURE</p>
        </div>

      </div>
    </div>
  );
}
