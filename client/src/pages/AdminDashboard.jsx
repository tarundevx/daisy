import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Activity, ClipboardList, ShieldCheck, 
  ExternalLink, Search, RefreshCw, AlertCircle, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const socket = io(window.location.origin.replace('5173', '3000'));

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
    <div className="flex items-center gap-4 mb-2">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className="text-gray-400 font-medium text-sm">{label}</span>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
  </div>
);

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessRes, candRes] = await Promise.all([
        axios.get('/api/admin/sessions'),
        axios.get('/api/admin/candidates')
      ]);
      setSessions(sessRes.data);
      setCandidates(candRes.data);
    } catch (err) {
      console.error('Admin Dashboard Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Connect to Precision Tracker
    const socket = io(window.location.origin.replace('5173', '3000'));

    socket.emit('join_admin_room');

    socket.on('update_live_sessions', (updatedSessions) => {
      console.log('Precision Sync:', updatedSessions);
      setLiveSessions(updatedSessions);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              <ShieldCheck className="w-10 h-10 text-indigo-400" />
              HR Admin Console
            </h1>
            <p className="text-gray-400 font-medium">Monitoring platform health and candidate performance.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl transition-all flex items-center gap-2 font-bold"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Users />} label="Total Candidates" value={candidates.length} color="bg-blue-500 text-blue-400" />
          <StatCard icon={<Activity />} label="Sessions" value={liveSessions.length} color="bg-emerald-500 text-emerald-400" />
          <StatCard icon={<ClipboardList />} label="Total Assessments" value={sessions.length} color="bg-purple-500 text-purple-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates List */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                   <Users className="w-6 h-6 text-indigo-400" /> Candidate Pipeline
                </h2>
                <div className="relative">
                   <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                   <input 
                      type="text" 
                      placeholder="Search candidates..." 
                      className="bg-[#111] border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                         <th className="pb-4 px-4">Candidate</th>
                         <th className="pb-4 px-4">Status</th>
                         <th className="pb-4 px-4">Score</th>
                         <th className="pb-4 px-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {filteredCandidates.map(can => (
                         <tr key={can.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4">
                               <div className="font-bold text-gray-200 group-hover:text-white">{can.name}</div>
                               <div className="text-xs text-gray-500">{can.email}</div>
                            </td>
                            <td className="py-4 px-4">
                               <span className="text-xs font-mono px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                                  {can.total_sessions} Sessions
                               </span>
                            </td>
                            <td className="py-4 px-4">
                               <span className="font-mono text-gray-300">
                                  {can.avg_score ? `${Math.round(can.avg_score)}%` : 'N/A'}
                               </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                               <button 
                                  onClick={() => can.latest_session_id && navigate(`/report/${can.latest_session_id}`)}
                                  className={`text-indigo-400 hover:text-indigo-300 transition-colors ${!can.latest_session_id ? 'opacity-20 cursor-not-allowed' : ''}`}
                                  disabled={!can.latest_session_id}
                                  title={can.latest_session_id ? "View Latest Report" : "No reports available"}
                               >
                                  <ExternalLink className="w-4 h-4" />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Right Column Layout */}
          <div className="flex flex-col gap-8">
             {/* Live Monitoring Panel */}
             <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl">
             <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-emerald-400" /> Live Activity
             </h2>
             <div className="space-y-4">
                {liveSessions.length === 0 && (
                   <div className="text-center py-12 text-gray-500 italic text-sm">
                      No active sessions currently.
                   </div>
                )}
                {liveSessions.map(ls => (
                   <div key={ls.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <div className="font-bold text-gray-200">{ls.candidate_name}</div>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                      <div className="text-xs font-mono text-indigo-400 mb-3 capitalize">
                         Scenario: {ls.scenario_id.replace(/_/g, ' ')}
                      </div>
                      <div className="p-3 bg-black/40 rounded-2xl flex flex-col gap-1 border border-white/5">
                         <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Latest Action</div>
                         <div className="text-xs text-gray-300 font-mono italic">
                            &gt; {ls.last_event || 'Just started...'}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Session History Panel */}
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl">
             <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-purple-400" /> Session History
             </h2>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
                {sessions.length === 0 && (
                   <div className="text-center py-12 text-gray-500 italic text-sm">
                      No historical sessions.
                   </div>
                )}
                {sessions.map(s => (
                   <div key={s.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2 transition-all hover:bg-white/10">
                      <div className="flex justify-between items-center">
                         <span className="font-bold text-gray-200">{s.candidate_name || 'Candidate'}</span>
                         <span className="text-xs text-gray-500 font-mono">
                            {new Date(s.started_at).toLocaleDateString()}
                         </span>
                      </div>
                      <div className="text-xs font-mono text-purple-400 capitalize">
                         {s.scenario_id ? s.scenario_id.replace(/_/g, ' ') : 'Unknown Scenario'}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                         <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {s.status}
                         </span>
                         <button 
                            onClick={() => navigate(`/report/${s.id}`)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold"
                         >
                            View Report <ExternalLink className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
