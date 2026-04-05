import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Activity, ClipboardList, ShieldCheck, 
  ExternalLink, Search, RefreshCw, AlertCircle, LogOut, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const socketURL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-tally-surface border border-tally-border p-8 rounded-tally-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
  >
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-tally-bg rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
    <div className="flex items-center gap-5 mb-4 relative z-10">
      <div className={`p-4 rounded-tally-lg ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <div>
        <span className="text-tally-text-secondary font-bold text-xs uppercase tracking-widest leading-none block mb-1">{label}</span>
        <div className="text-4xl font-bold text-tally-text-primary tracking-tight">{value}</div>
      </div>
    </div>
    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full relative z-10 border border-emerald-100">
      <TrendingUp className="w-3 h-3" /> Live
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [commonCode, setCommonCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessRes, candRes, settingsRes] = await Promise.all([
        axios.get('/api/admin/sessions'),
        axios.get('/api/admin/candidates'),
        axios.get('/api/admin/settings')
      ]);
      setSessions(sessRes.data);
      setCandidates(candRes.data);
      setCommonCode(settingsRes.data.common_access_code);
    } catch (err) {
      console.error('Admin Dashboard Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io(socketURL);
    socket.emit('join_admin_room');
    socket.on('update_live_sessions', (updatedSessions) => {
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
      <div className="min-h-screen bg-tally-bg flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-tally-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-tally-blue text-white rounded-tally-lg">
                  <ShieldCheck className="w-8 h-8" />
               </div>
               <h1 className="text-5xl font-bold tracking-tight text-tally-text-primary">Admin Console</h1>
            </div>
            <p className="text-tally-text-secondary text-lg font-medium">Monitoring platform health and candidate performance.</p>
            
            <div className="mt-8 flex items-center gap-4 bg-tally-surface border border-tally-border p-4 pr-6 rounded-tally-xl w-fit shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] text-tally-text-secondary uppercase tracking-widest font-bold mb-1">Global Access Code</span>
                <span className="font-mono text-tally-blue font-bold text-xl tracking-tight leading-none">{commonCode || 'Loading...'}</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 180 }}
                onClick={async () => {
                  if (!window.confirm('Regenerate common access code? Old code will stop working immediately.')) return;
                  setIsRegenerating(true);
                  try {
                    const res = await axios.post('/api/admin/settings/regenerate');
                    setCommonCode(res.data.common_access_code);
                  } catch (e) { console.error(e); }
                  setIsRegenerating(false);
                }}
                disabled={isRegenerating}
                className="p-3 hover:bg-tally-bg rounded-full transition-all text-tally-text-secondary hover:text-tally-blue"
              >
                <RefreshCw className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData} 
              className="p-4 bg-tally-surface hover:bg-gray-50 border border-tally-border rounded-tally-lg transition-all shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 text-tally-text-secondary ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="px-6 py-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-tally-lg transition-all flex items-center gap-2 font-bold shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-blue-600">
          <StatCard icon={<Users />} label="Total Candidates" value={candidates.length} color="bg-blue-100 text-tally-blue" delay={0.1} />
          <StatCard 
            icon={<Activity />} 
            label="Live Active Sessions" 
            value={liveSessions.filter(ls => ls.scenario_id !== 'Lobby' && ls.scenario_id !== 'Authenticating').length} 
            color="bg-emerald-100 text-emerald-600" 
            delay={0.2} 
          />
          <StatCard icon={<ClipboardList />} label="Total Assessments" value={sessions.length} color="bg-pink-100 text-tally-pink" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Candidates List */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-tally-surface border border-tally-border rounded-tally-xl p-10 shadow-sm"
          >
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <h2 className="text-3xl font-bold flex items-center gap-4 text-tally-text-primary">
                   <Users className="w-8 h-8 text-tally-blue" /> Candidate Pipeline
                </h2>
                <div className="relative w-full md:w-80">
                   <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-tally-text-secondary" />
                   <input 
                      type="text" 
                      placeholder="Search candidates..." 
                      className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-tally-text-secondary text-xs font-bold uppercase tracking-widest border-b border-tally-border">
                         <th className="pb-5 px-4 font-bold">Candidate</th>
                         <th className="pb-5 px-4 font-bold">Status</th>
                         <th className="pb-5 px-4 font-bold">Score</th>
                         <th className="pb-5 px-4 font-bold text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-tally-border">
                      {filteredCandidates.map((can, idx) => (
                         <motion.tr 
                            key={can.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + (idx * 0.05) }}
                            className="group hover:bg-tally-bg transition-colors"
                         >
                            <td className="py-6 px-4">
                               <div className="font-bold text-tally-text-primary group-hover:text-tally-blue text-lg mb-0.5">{can.name}</div>
                               <div className="text-xs text-tally-text-secondary font-medium uppercase tracking-tight">{can.email}</div>
                            </td>
                            <td className="py-6 px-4">
                               <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-tally-blue/10 text-tally-blue rounded-full border border-tally-blue/10">
                                  {can.total_sessions} Sessions
                               </span>
                            </td>
                            <td className="py-6 px-4">
                               <span className="font-bold text-tally-text-primary text-lg">
                                  {can.avg_score ? `${Math.round(can.avg_score)}%` : '—'}
                               </span>
                            </td>
                            <td className="py-6 px-4 text-right">
                               <button 
                                  onClick={() => can.latest_session_id && navigate(`/report/${can.latest_session_id}`)}
                                  className={`p-3 rounded-full hover:bg-tally-surface border border-transparent hover:border-tally-border text-tally-blue hover:text-blue-700 transition-all ${!can.latest_session_id ? 'opacity-10 cursor-not-allowed' : ''}`}
                                  disabled={!can.latest_session_id}
                               >
                                  <ExternalLink className="w-5 h-5" />
                               </button>
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </motion.div>

          <div className="flex flex-col gap-10">
             {/* Live Monitoring Panel */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-tally-surface border border-tally-border rounded-tally-xl p-8 shadow-sm flex-1"
             >
               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-tally-text-primary">
                  <Activity className="w-6 h-6 text-emerald-500" /> Live Activity
               </h2>
               <div className="space-y-4">
                  {liveSessions.length === 0 && (
                     <div className="text-center py-16 text-tally-text-secondary/50 italic font-medium">
                        No active sessions.
                     </div>
                  )}
                  {liveSessions.map(ls => {
                     const isLobby = ls.scenario_id === 'Lobby' || ls.scenario_id === 'Authenticating';
                     return (
                      <div key={ls.id} className={`p-5 rounded-tally-lg bg-tally-bg border border-tally-border group hover:border-emerald-500/30 transition-all ${isLobby ? 'opacity-60 saturate-50' : ''}`}>
                         <div className="flex justify-between items-start mb-3">
                            <div className="font-bold text-tally-text-primary text-lg">{ls.candidate_name}</div>
                            <div className={`w-3 h-3 rounded-full animate-pulse mt-1.5 ${isLobby ? 'bg-gray-400' : 'bg-emerald-500'}`}></div>
                         </div>
                         <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isLobby ? 'text-gray-500' : 'text-tally-pink'}`}>
                            {isLobby ? (ls.scenario_id === 'Authenticating' ? 'Verification' : 'Lobby') : `${ls.scenario_id.replace(/_/g, ' ')}`}
                         </div>
                         {!isLobby && (
                           <div className="p-4 bg-white rounded-tally-lg flex flex-col gap-2 border border-tally-border shadow-sm">
                              <div className="text-[9px] text-tally-text-secondary uppercase tracking-[0.2em] font-bold">Latest Action</div>
                              <div className="text-xs text-tally-text-primary font-medium italic truncate">
                                 {ls.last_event || 'Initializing session...'}
                              </div>
                           </div>
                         )}
                      </div>
                     );
                  })}
               </div>
             </motion.div>

             {/* Session History Panel */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.7 }}
               className="bg-tally-surface border border-tally-border rounded-tally-xl p-8 shadow-sm"
             >
               <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-tally-text-primary">
                  <ClipboardList className="w-6 h-6 text-tally-pink" /> History
               </h2>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {sessions.length === 0 && (
                     <div className="text-center py-16 text-tally-text-secondary/50 italic font-medium">
                        No previous sessions.
                     </div>
                  )}
                  {sessions.map(s => (
                     <div key={s.id} className="p-5 rounded-tally-lg border border-tally-border flex flex-col gap-3 transition-all hover:bg-tally-bg">
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-tally-text-primary text-base">{s.candidate_name || 'Anonymous'}</span>
                           <span className="text-[10px] text-tally-text-secondary font-bold uppercase tracking-wider">
                              {new Date(s.started_at).toLocaleDateString()}
                           </span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-tally-pink truncate">
                           {s.scenario_id ? s.scenario_id.replace(/_/g, ' ') : 'General Workspace'}
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-3 border-t border-tally-bg">
                           <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {s.status}
                           </span>
                           <button 
                              onClick={() => navigate(`/report/${s.id}`)}
                              className="text-xs text-tally-blue hover:text-blue-700 transition-colors flex items-center gap-1.5 font-bold uppercase tracking-widest"
                           >
                              Report <ExternalLink className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
             </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
