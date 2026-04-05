import React from 'react';

export function BehaviorReport({ report, onHome }) {
  if (!report) return null;

  const { strengths, weakAreas, thinkingPattern, score, nextScenarioRecommendation, hiringSignal } = report;

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'strong_yes': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'yes': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'maybe': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'no': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  const getSignalLabel = (signal) => {
    return signal.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto p-12 font-sans overflow-hidden">
      <div className="bg-white rounded-tally-xl shadow-2xl overflow-hidden border border-tally-border relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-tally-blue"></div>
        
        {/* Header Section */}
        <div className="px-12 py-16 flex justify-between items-center bg-tally-surface border-b border-tally-border">
          <div>
            <div className="text-[10px] font-black text-tally-blue uppercase tracking-[0.4em] mb-4 italic">Neural Output</div>
            <h1 className="text-6xl font-black text-tally-text-primary tracking-tighter leading-none italic">Analysis</h1>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full border-4 border-tally-blue flex flex-col items-center justify-center bg-white shadow-xl shadow-tally-blue/5">
                <span className="text-[10px] font-black text-tally-text-secondary uppercase tracking-widest mb-1">Index</span>
                <span className="text-6xl font-black text-tally-text-primary italic tracking-tighter">{score}</span>
            </div>
            <span className={`mt-8 px-6 py-2 rounded-full text-[10px] font-black border uppercase tracking-[0.2em] shadow-sm ${getSignalColor(hiringSignal)}`}>
              {getSignalLabel(hiringSignal)}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-12 space-y-12 bg-white">
          
          <div className="bg-tally-surface p-10 rounded-tally-xl border border-tally-border shadow-sm">
            <h3 className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.3em] mb-6 italic">
              Thinking Pattern
            </h3>
            <p className="text-tally-text-primary leading-snug font-bold text-xl tracking-tight opacity-90 underline decoration-tally-blue/20 underline-offset-8">
              "{thinkingPattern}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-tally-xl border border-tally-border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-8 italic">
                Subject Strengths
              </h3>
              <ul className="space-y-6">
                 {strengths.map((str, i) => (
                   <li key={i} className="flex items-start text-sm text-tally-text-primary font-bold tracking-tight opacity-80 italic group-hover:not-italic transition-all">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-4 flex-shrink-0" />
                     {str}
                   </li>
                 ))}
              </ul>
            </div>

            <div className="bg-white p-10 rounded-tally-xl border border-tally-border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tally-pink"></div>
              <h3 className="text-[10px] font-black text-tally-pink uppercase tracking-[0.3em] mb-8 italic">
                Growth Areas
              </h3>
              <ul className="space-y-6">
                 {weakAreas.map((weak, i) => (
                   <li key={i} className="flex items-start text-sm text-tally-text-primary font-bold tracking-tight opacity-80 italic group-hover:not-italic transition-all">
                     <span className="w-1.5 h-1.5 rounded-full bg-tally-pink mt-2 mr-4 flex-shrink-0" />
                     {weak}
                   </li>
                 ))}
              </ul>
            </div>
          </div>

          <div className="bg-tally-surface p-10 rounded-tally-xl border border-tally-border flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex-1">
              <h3 className="text-[9px] font-black text-tally-blue uppercase tracking-[0.4em] mb-6 italic">
                Evolutionary Path
              </h3>
              <p className="text-xl text-tally-text-primary font-bold leading-tight tracking-tight italic opacity-90">
                {nextScenarioRecommendation.rationale}
              </p>
              <div className="mt-8 text-[9px] font-black bg-white border border-tally-border text-tally-blue px-4 py-2 rounded-full uppercase tracking-[0.3em] inline-block shadow-sm">
                Focus: {nextScenarioRecommendation.scenarioId.replace('_', ' ')}
              </div>
            </div>
            
            <button 
              onClick={onHome}
              className="px-10 py-5 bg-tally-blue hover:bg-black text-white font-black rounded-full shadow-2xl transition-all flex items-center flex-shrink-0 uppercase tracking-[0.4em] text-[10px] shadow-tally-blue/20 italic"
            >
              Commit & Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
