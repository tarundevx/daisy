import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Trophy, AlertCircle, BookOpen, Share2, ArrowLeft, CheckCircle2, XCircle
} from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">No report found.</h2>
        <button onClick={() => navigate('/dashboard')} className="text-indigo-400 hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'Correctness', value: report.correctness },
    { name: 'Complexity', value: report.timeComplexity },
    { name: 'Communication', value: report.communication },
    { name: 'Edge Cases', value: report.edgeCaseHandling }
  ];

  const getColor = (value) => {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <button 
            onClick={copyLink}
            className="flex items-center bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all border border-white/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-indigo-600/20 rounded-3xl mb-6">
            <Trophy className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 tracking-tight">
            Interview Performance
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            A comprehensive breakdown of your algorithmic and communication skills extracted from your recent session.
          </p>
        </div>

        {/* Chart Section */}
        <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] mb-12 backdrop-blur-xl shadow-2xl">
          <h3 className="text-2xl font-bold mb-10 text-center flex items-center justify-center">
             <Trophy className="w-6 h-6 mr-3 text-yellow-400" /> Skill Breakdown
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 13 }} dy={10} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 13 }} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '15px', padding: '12px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Strengths */}
          <div className="bg-green-500/5 border border-green-500/10 p-8 rounded-[40px]">
            <h4 className="text-xl font-bold mb-6 flex items-center text-green-400">
              <CheckCircle2 className="w-6 h-6 mr-3" /> Core Strengths
            </h4>
            <ul className="space-y-4">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2.5 mr-3 flex-shrink-0"></div>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Areas */}
          <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[40px]">
            <h4 className="text-xl font-bold mb-6 flex items-center text-red-400">
              <XCircle className="w-6 h-6 mr-3" /> Growth Opportunities
            </h4>
            <ul className="space-y-4">
              {report.areas.map((a, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-3 flex-shrink-0"></div>
                  {a}
                </li>
              ))}
            </ul>
            {report.correctness === 0 && (
              <button 
                onClick={() => {
                  setLoading(true);
                  axios.get(`/api/report/${sessionId}?refresh=true`).then(res => {
                    setReport(res.data);
                    setLoading(false);
                  });
                }}
                className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-sm"
              >
                Regenerate Analysis
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-gray-500 text-xs font-mono uppercase tracking-widest mb-12">
           Verified by HydraDB AI Engine • Daisy Assessment
        </div>
      </div>
    </div>
  );
}
