import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Play, Activity, History, Trophy, TrendingUp, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/dashboard/history')
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.history);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const radarData = stats?.topics?.map(t => ({
    subject: t.scenario_id === 'rate_limiter' ? 'Code: Rate Limiter' : t.scenario_id.replace(/_/g, ' '),
    A: parseInt(t.avg_score),
    fullMark: 100
  })) || [];

  const lineData = stats?.progress?.map(p => ({
    name: new Date(p.day).toLocaleDateString(),
    score: parseInt(p.avg_score)
  })) || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-400 mt-1">Your evolution continues.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/code')}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-all border border-white/10"
          >
            Code Sandbox
          </button>
          <button 
            onClick={() => navigate('/session/prod_api_outage')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-all shadow-lg shadow-indigo-600/20"
          >
            <Play className="w-5 h-5 mr-2" /> Feature Sandbox
          </button>
          <button 
            onClick={logout}
            className="bg-white/5 hover:bg-white/10 text-gray-400 p-2.5 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={<Trophy className="text-yellow-400" />} 
              label="Average Score" 
              value={`${Math.round(history.reduce((acc, curr) => acc + (curr.score || 0), 0) / (history.filter(s => s.score !== null).length || 1))}%`} 
            />
            <StatCard icon={<TrendingUp className="text-green-400" />} label="Total Sessions" value={history.length} />
            <StatCard icon={<Activity className="text-blue-400" />} label="Hints Used" value={stats?.hints || 0} />
          </div>

          {/* Line Chart */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" /> Progress Over Time
            </h3>
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Radar Chart */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-400" /> Mastery Radar
            </h3>
            <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="User" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History List */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-[400px] flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-400" /> Recent Sessions
            </h3>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {history.map((session) => (
                <div 
                  key={session.id} 
                  onClick={() => navigate(`/report/${session.id}`)}
                  className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors capitalize">
                      {session.scenario_id === 'rate_limiter' ? 'Code: Rate Limiter' : session.scenario_id.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${session.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {session.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {new Date(session.started_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
      <div className="bg-white/5 p-3 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
