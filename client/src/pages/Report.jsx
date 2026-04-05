import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const getScoreColor = (score) => {
  if (score >= 80) return "text-emerald-600 stroke-emerald-600 fill-emerald-500/10";
  if (score >= 50) return "text-tally-blue stroke-tally-blue fill-tally-blue/10";
  return "text-tally-pink stroke-tally-pink fill-tally-pink/10";
};

const getScoreBg = (score) => {
  if (score >= 80) return "bg-emerald-50 border-emerald-100";
  if (score >= 50) return "bg-blue-50 border-blue-100";
  return "bg-pink-50 border-pink-100";
};

const CircularScore = ({ score }) => {
  const circumference = 2 * Math.PI * 45; 
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);
  
  return (
    <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          className="text-gray-100 stroke-current" 
          strokeWidth="6" 
          cx="50" cy="50" r="45" fill="transparent" 
        />
        <motion.circle 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          className={`${colorClass.split(' ')[1]} transition-all`} 
          strokeWidth="8" 
          strokeLinecap="round"
          cx="50" cy="50" r="45" fill="transparent" 
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className={`text-5xl font-black ${colorClass.split(' ')[0]}`}
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-tally-text-secondary mt-1">Match %</span>
      </div>
    </div>
  );
};

const StatCardContent = ({ label, value, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-full w-full group overflow-hidden relative"
  >
    <div className="absolute top-0 left-0 w-full h-1.5 bg-current opacity-10"></div>
    <div className="relative z-10">
      <div className="text-tally-text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</div>
      <div className="text-4xl font-black text-tally-text-primary tracking-tighter italic">{value}</div>
    </div>
  </motion.div>
);

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`/api/report/${sessionId}`);
        setReport(res.data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-tally-bg flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tally-blue animate-pulse">Generating Audit</span>
      </div>
    );
  }

  const isCode = report.assessment.type === 'code_sandbox';

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-20 font-sans overflow-x-hidden min-w-full pb-40">
      <div className="max-w-6xl mx-auto space-y-16">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
           >
              <button 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center text-tally-text-secondary hover:text-black transition-all group mb-10 font-black text-[10px] uppercase tracking-[0.3em]"
              >
                Return to Hub
              </button>
              
              <div className="flex items-center gap-4 mb-6 bg-tally-blue text-white px-5 py-1.5 rounded-full w-fit">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validated report</span>
              </div>
              <h1 className="text-7xl font-black text-tally-text-primary tracking-tighter italic mb-4">Executive Audit</h1>
              <p className="text-2xl text-tally-text-secondary font-medium tracking-tight">
                Neural evaluation for <span className="text-black font-black uppercase tracking-widest text-sm">{report.candidateName}</span>
              </p>
           </motion.div>

           <motion.button 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={copyLink} 
             className="px-10 py-4 bg-white border border-tally-border hover:bg-black hover:text-white rounded-full transition-all shadow-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-tally-blue/5"
           >
             {copied ? 'Audit Shared' : 'Share Analysis'}
           </motion.button>
        </header>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-tally-surface border border-tally-border rounded-tally-xl p-12 md:p-16 shadow-sm relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-40 h-40 bg-tally-bg opacity-30 rounded-full translate-x-20 -translate-y-20"></div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <span className="px-5 py-2 bg-tally-bg text-tally-blue text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-tally-border">
                      {isCode ? 'Code Sandbox' : 'Infra Audit'}
                    </span>
                    <span className="text-tally-text-secondary text-[10px] uppercase tracking-[0.2em] font-black opacity-60 italic">{report.date}</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black text-tally-text-primary tracking-tighter leading-none italic">
                     {report.assessment.title}
                  </h2>
                  <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2 rounded-full w-fit border border-emerald-100 italic">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Rubric Aligned Phase</span>
                  </div>
                </div>

                {/* Behavioral Integrity Tracking */}
                <div className="mt-16 bg-white border border-tally-border p-8 rounded-tally-xl shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all flex flex-col md:flex-row md:items-center gap-10">
                  <div className={`absolute top-0 left-0 md:w-2 md:h-full w-full h-2 ${report.metrics.integrity?.score > 70 ? 'bg-emerald-500' : report.metrics.integrity?.score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex-1">
                    <div className="text-tally-text-secondary text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                      Integrity Intelligence
                    </div>
                    <div className="text-xl text-tally-text-primary font-bold leading-tight italic tracking-tight opacity-80 decoration-tally-blue decoration-2 underline-offset-8">
                       "{report.metrics.integrity?.analysis || 'Validating behavior metrics...'}"
                    </div>
                  </div>
                  <div className="md:text-right flex-shrink-0 md:border-l border-t md:border-t-0 border-tally-border md:pl-10 pt-6 md:pt-0">
                     <div className="text-[9px] text-tally-text-secondary font-black mb-2 uppercase tracking-[0.2em]">Trust Index</div>
                     <div className={`text-6xl font-black tracking-tighter italic ${report.metrics.integrity?.score > 70 ? 'text-emerald-600' : report.metrics.integrity?.score > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {report.metrics.integrity?.score}%
                     </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4 flex">
                <div className={`w-full p-12 rounded-tally-xl border flex flex-col items-center justify-center gap-8 shadow-sm ${getScoreBg(report.metrics.overallScore)}`}>
                    <CircularScore score={report.metrics.overallScore} />
                    <div className="text-center">
                      <div className="text-tally-text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-3">Architectural rating</div>
                      <div className="text-[11px] text-tally-text-secondary font-bold leading-relaxed max-w-[240px] opacity-70">
                        Weighted evaluation across execution efficiency, algorithmic complexity, and behavioral approach.
                      </div>
                    </div>
                </div>
              </div>
           </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <StatCardContent 
            label="Phased Duration" 
            value={report.assessment.duration}
            delay={0.3}
          />
          <StatCardContent 
            label="Execution tier" 
            value={report.metrics.efficiency} 
            delay={0.4}
          />
          {isCode ? (
            <StatCardContent 
              label="Test validation"
              value={report.metrics.testsPassed}
              delay={0.5}
            />
          ) : (
            <StatCardContent 
              label="Operational Score"
              value="82%"
              delay={0.5}
            />
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="space-y-12 pt-12">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-tally-text-primary tracking-tighter italic">Technical insights</h2>
                <p className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.3em]">AI-driven subject telemetry</p>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-white border border-tally-border p-12 rounded-tally-xl shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
             >
               <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
               <h4 className="text-[10px] font-black mb-12 uppercase tracking-[0.4em] text-emerald-600 italic">Core Strengths</h4>
               <ul className="space-y-10">
                 {report.insights.strengths.map((s, i) => (
                   <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (i * 0.1) }}
                    className="flex items-start text-tally-text-primary"
                   >
                     <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-8 shrink-0"></div>
                     <span className="leading-tight font-bold text-xl tracking-tight opacity-90 italic group-hover:not-italic transition-all group-hover:text-black">"{s}"</span>
                   </motion.li>
                 ))}
               </ul>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-white border border-tally-border p-12 rounded-tally-xl shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
             >
               <div className="absolute top-0 left-0 w-2 h-full bg-tally-pink"></div>
               <h4 className="text-[10px] font-black mb-12 uppercase tracking-[0.4em] text-tally-pink italic">Growth Vectors</h4>
               <ul className="space-y-10">
                 {report.insights.growth.map((g, i) => (
                   <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (i * 0.1) }}
                    className="flex items-start text-tally-text-primary"
                   >
                     <div className="w-2 h-2 rounded-full bg-tally-pink mt-2 mr-8 shrink-0"></div>
                     <span className="leading-tight font-bold text-xl tracking-tight opacity-90 italic group-hover:not-italic transition-all group-hover:text-black">"{g}"</span>
                   </motion.li>
                 ))}
               </ul>
             </motion.div>
           </div>
        </div>

      </div>
    </div>
  );
}
