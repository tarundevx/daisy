import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Share2, ArrowLeft, CheckCircle2, 
  XCircle, Clock, Code, Terminal, Activity, Zap, Star, TrendingUp, AlertTriangle
} from 'lucide-react';
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

const StatCardContent = ({ icon, label, value, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-tally-surface border border-tally-border p-8 rounded-tally-xl shadow-sm hover:shadow-md transition-all flex items-center gap-6 h-full w-full group overflow-hidden relative"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-tally-bg rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-500"></div>
    <div className="p-4 bg-tally-bg rounded-tally-lg flex-shrink-0 border border-tally-border relative z-10">
      {React.cloneElement(icon, { className: 'w-7 h-7' })}
    </div>
    <div className="relative z-10">
      <div className="text-tally-text-secondary text-xs font-bold uppercase tracking-widest mb-1.5">{label}</div>
      <div className="text-3xl font-bold text-tally-text-primary tracking-tight">{value}</div>
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
      <div className="min-h-screen bg-tally-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isCode = report.assessment.type === 'code_sandbox';

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-12 font-sans overflow-x-hidden min-w-full pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
           >
              <button 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center text-tally-text-secondary hover:text-tally-blue transition-all group mb-8 font-bold text-xs uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-tally-blue text-white rounded-tally-lg">
                  <Star className="w-6 h-6" />
                </div>
                <h1 className="text-5xl font-bold text-tally-text-primary tracking-tight">Executive Report</h1>
              </div>
              <p className="text-xl text-tally-text-secondary font-medium italic">
                Performance audit for <span className="text-tally-text-primary font-bold not-italic">{report.candidateName}</span>
              </p>
           </motion.div>

           <motion.button 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={copyLink} 
             className="flex items-center bg-white border border-tally-border hover:bg-gray-50 text-tally-text-primary px-8 py-4 rounded-full transition-all shadow-sm font-bold text-sm gap-3"
           >
             <Share2 className="w-5 h-5 text-tally-blue" />
             {copied ? 'Link Copied!' : 'Export Analysis'}
           </motion.button>
        </header>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-tally-surface border border-tally-border rounded-tally-xl p-10 md:p-12 shadow-sm relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-32 h-32 bg-tally-bg opacity-40 rounded-full translate-x-16 -translate-y-16"></div>
           <div className="flex flex-col md:flex-row justify-between gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1 bg-tally-bg text-tally-blue text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-tally-border flex items-center">
                    {isCode ? <Code className="w-3.5 h-3.5 mr-2" /> : <Terminal className="w-3.5 h-3.5 mr-2" />}
                    {isCode ? 'Code Sandbox' : 'Infra Audit'}
                  </span>
                  <span className="text-tally-text-secondary text-xs uppercase tracking-widest font-bold">{report.date}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-tally-text-primary tracking-tight leading-tight">
                   {report.assessment.title}
                </h2>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-fit border border-emerald-100 italic">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">Rubric Matched Assessment</span>
                </div>
              </div>

              <div className={`p-10 rounded-tally-xl border flex flex-col items-center justify-center gap-6 shadow-sm min-w-[280px] ${getScoreBg(report.metrics.overallScore)}`}>
                  <CircularScore score={report.metrics.overallScore} />
                  <div className="text-center">
                    <div className="text-tally-text-primary font-bold text-sm uppercase tracking-widest mb-1">Architectural Rating</div>
                    <div className="text-[10px] text-tally-text-secondary font-medium leading-relaxed max-w-[200px]">
                      Weighted across execution, speed, and approach relative to performance baseline.
                    </div>
                  </div>
              </div>
           </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCardContent 
            icon={<Clock className="text-tally-blue" />} 
            label="Total Time" 
            value={report.assessment.duration}
            delay={0.3}
          />
          <StatCardContent 
            icon={<Zap className="text-tally-pink" />} 
            label="Execution Grade" 
            value={report.metrics.efficiency} 
            delay={0.4}
          />
          {isCode ? (
            <StatCardContent 
              icon={<CheckCircle2 className="text-emerald-500" />}
              label="Test Coverage"
              value={report.metrics.testsPassed}
              delay={0.5}
            />
          ) : (
            <StatCardContent 
              icon={<Activity className="text-amber-500" />}
              label="Ops Score"
              value="82%"
              delay={0.5}
            />
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="space-y-8 pt-8">
           <h2 className="text-3xl font-bold flex items-center gap-4 text-tally-text-primary tracking-tight">
              <Activity className="w-8 h-8 text-tally-blue" /> Automated Insights
           </h2>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-white border border-emerald-100 p-10 rounded-tally-xl shadow-sm relative overflow-hidden group"
             >
               <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
               <h4 className="text-xl font-bold mb-10 flex items-center text-emerald-700">
                 <CheckCircle2 className="w-7 h-7 mr-3" /> Technical Strengths
               </h4>
               <ul className="space-y-8">
                 {report.insights.strengths.map((s, i) => (
                   <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (i * 0.1) }}
                    className="flex items-start text-tally-text-primary"
                   >
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2 mr-6 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
                     <span className="leading-relaxed font-semibold text-lg">{s}</span>
                   </motion.li>
                 ))}
               </ul>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-white border border-pink-100 p-10 rounded-tally-xl shadow-sm relative overflow-hidden group"
             >
               <div className="absolute top-0 left-0 w-1.5 h-full bg-tally-pink"></div>
               <h4 className="text-xl font-bold mb-10 flex items-center text-tally-pink">
                 <AlertTriangle className="w-7 h-7 mr-3" /> Growth Vectors
               </h4>
               <ul className="space-y-8">
                 {report.insights.growth.map((g, i) => (
                   <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (i * 0.1) }}
                    className="flex items-start text-tally-text-primary"
                   >
                     <div className="w-2.5 h-2.5 rounded-full bg-tally-pink mt-2 mr-6 shrink-0 shadow-[0_0_12px_rgba(236,0,140,0.3)]"></div>
                     <span className="leading-relaxed font-semibold text-lg">{g}</span>
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
