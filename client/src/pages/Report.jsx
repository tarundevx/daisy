import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Share2, ArrowLeft, CheckCircle2, 
  XCircle, Clock, Code, Terminal, Activity, Zap
} from 'lucide-react';

const getScoreColor = (score) => {
  if (score >= 80) return "text-emerald-400 stroke-emerald-400";
  if (score >= 50) return "text-amber-400 stroke-amber-400";
  return "text-rose-400 stroke-rose-400";
};

const getScoreBg = (score) => {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-rose-500/10 border-rose-500/20";
};

const CircularScore = ({ score }) => {
  const circumference = 2 * Math.PI * 45; 
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          className="text-white/5 stroke-current" 
          strokeWidth="8" 
          cx="50" cy="50" r="45" fill="transparent" 
        />
        <circle 
          className={`${colorClass.split(' ')[1]} transition-all duration-1000 ease-out`} 
          strokeWidth="8" 
          strokeLinecap="round"
          cx="50" cy="50" r="45" fill="transparent" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold ${colorClass.split(' ')[0]}`}>{score}</span>
      </div>
    </div>
  );
};

const StatCardContent = ({ icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex items-center gap-5 hover:bg-white/10 transition-colors h-full w-full">
    <div className="p-4 bg-indigo-500/10 rounded-2xl flex-shrink-0">
      {icon}
    </div>
    <div>
      <div className="text-gray-400 text-sm font-medium mb-1 tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    </div>
  </div>
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isCode = report.assessment.type === 'code_sandbox';

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 relative font-sans overflow-x-hidden min-w-full pb-20">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 w-full space-y-8">
        
        {/* Section 1: Header & Profile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-4">
           <button 
             onClick={() => navigate('/dashboard')} 
             className="flex items-center text-gray-400 hover:text-white transition-colors group px-5 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 font-bold text-sm"
           >
             <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
           </button>
           <button 
             onClick={copyLink} 
             className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 font-bold text-sm"
           >
             <Share2 className="w-4 h-4 mr-2" /> {copied ? 'Copied to Clipboard!' : 'Share Report'}
           </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 backdrop-blur-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
           <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20 flex items-center">
                  {isCode ? <Code className="w-4 h-4 mr-2" /> : <Terminal className="w-4 h-4 mr-2" />}
                  {isCode ? 'Code Assessment' : 'Infrastructure Troubleshooting'}
                </span>
                <span className="text-gray-500 text-sm font-mono border border-white/10 px-3 py-1 rounded-full">{report.date}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                 {report.candidateName}
              </h1>
              <p className="text-xl text-gray-400 font-medium">
                 {report.assessment.title}
              </p>
           </div>
        </div>

        {/* Section 2: Score & Statistics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
           {/* Overall Score Card */}
           <div className={`col-span-1 lg:col-span-1 h-full p-8 rounded-[40px] border flex flex-col items-center justify-center gap-4 backdrop-blur-md ${getScoreBg(report.metrics.overallScore)}`}>
              <div className="text-center">
                <div className="text-gray-200 font-extrabold text-xl mb-1">Overall Match</div>
                <div className="text-xs text-gray-400 leading-relaxed mx-auto max-w-[180px]">
                  Scored heavily on execution, speed, and approach relative to rubric.
                </div>
              </div>
              <CircularScore score={report.metrics.overallScore} />
           </div>

           <div className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
             <StatCardContent 
               icon={<Clock className="w-8 h-8 text-indigo-400" />} 
               label="Elapsed Time" 
               value={report.assessment.duration}
             />
             <StatCardContent 
               icon={<Zap className="w-8 h-8 text-purple-400" />} 
               label="Algorithm Efficiency" 
               value={report.metrics.efficiency} 
             />
             {isCode ? (
               <StatCardContent 
                 icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                 label="Tests Passed"
                 value={report.metrics.testsPassed}
               />
             ) : (
               <StatCardContent 
                 icon={<Terminal className="w-8 h-8 text-amber-400" />}
                 label="Commands Executed"
                 value={report.metrics.commandsUsed || '14'}
               />
             )}
           </div>
        </div>

        {/* Section 3: AI Insights */}
        <h2 className="text-2xl font-bold flex items-center gap-3 pt-6 mb-2">
           <Activity className="w-6 h-6 text-purple-400" /> Behavioral & Technical Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[40px] backdrop-blur-md">
            <h4 className="text-xl font-extrabold mb-8 flex items-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7 mr-3" /> Core Strengths
            </h4>
            <ul className="space-y-6">
              {report.insights.strengths.map((s, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 mr-4 flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span className="leading-relaxed font-medium">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[40px] backdrop-blur-md">
            <h4 className="text-xl font-extrabold mb-8 flex items-center text-rose-400">
              <XCircle className="w-7 h-7 mr-3" /> Growth Opportunities
            </h4>
            <ul className="space-y-6">
              {report.insights.growth.map((g, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 mr-4 flex-shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                  <span className="leading-relaxed font-medium">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
