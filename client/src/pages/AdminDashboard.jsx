import api, { SOCKET_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const socketURL = SOCKET_URL;

const StatCard = ({ label, value, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
  >
    <div className="absolute top-0 left-0 w-1.5 h-full bg-current opacity-10"></div>
    <div className="relative z-10">
      <span className="text-[10px] text-tally-text-secondary font-black uppercase tracking-[0.2em] leading-none block mb-6">{label}</span>
      <div className="flex items-end gap-3">
        <div className="text-6xl font-black text-tally-text-primary tracking-tighter italic">{value}</div>
        <div className="mb-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Live
        </div>
      </div>
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
        api.get('/admin/sessions'),
        api.get('/admin/candidates'),
        api.get('/admin/settings')
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
      <div className="min-h-screen bg-tally-bg flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-tally-blue border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tally-blue animate-pulse">Initializing Interface</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-16">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-6 bg-tally-blue text-white px-4 py-1 rounded-full w-fit">
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Admin</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-tally-text-primary mb-4 italic">Management</h1>
            <p className="text-tally-text-secondary text-xl font-medium">Global oversight and real-time candidate metrics.</p>
            
            <div className="mt-12 flex items-center gap-10 bg-tally-surface border border-tally-border p-8 rounded-tally-xl w-fit shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tally-bg opacity-50 rounded-full translate-x-16 -translate-y-16"></div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] text-tally-text-secondary uppercase tracking-[0.2em] font-black mb-2">Global Access Key</span>
                <span className="font-mono text-tally-blue font-black text-3xl tracking-tight leading-none group-hover:italic transition-all">{commonCode || 'Validating...'}</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (!window.confirm('Regenerate access key? Legacy keys will expire immediately.')) return;
                  setIsRegenerating(true);
                  try {
                    const res = await api.post('/admin/settings/regenerate');
                    setCommonCode(res.data.common_access_code);
                  } catch (e) { console.error(e); }
                  setIsRegenerating(false);
                }}
                disabled={isRegenerating}
                className="px-6 py-3 bg-white border border-tally-border rounded-full transition-all text-tally-text-secondary hover:text-black font-black uppercase tracking-[0.2em] text-[10px] relative z-10"
              >
                {isRegenerating ? 'Syncing...' : 'Reset Key'}
              </motion.button>
            </div>
          </motion.div>

          <div className="flex items-center gap-6">
            <button 
              onClick={fetchData} 
              className="px-8 py-3 bg-white border border-tally-border rounded-full transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50"
            >
              Refresh Data
            </button>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="px-8 py-3 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 text-red-600 rounded-full transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-sm"
            >
              Exit Console
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <StatCard label="Total Candidates" value={candidates.length} color="text-tally-blue" delay={0.1} />
          <StatCard 
            label="Live Active Sessions" 
            value={liveSessions.filter(ls => ls.scenario_id !== 'Lobby' && ls.scenario_id !== 'Authenticating').length} 
            color="text-emerald-600" 
            delay={0.2} 
          />
          <StatCard label="Final Assessments" value={sessions.length} color="text-tally-pink" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Candidates List */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-8 bg-tally-surface border border-tally-border rounded-tally-xl p-12 shadow-sm"
          >
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-10">
                <div>
                  <h2 className="text-4xl font-black text-tally-text-primary tracking-tighter italic mb-2">
                     Candidates
                  </h2>
                  <p className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Pipeline oversight</p>
                </div>
                <div className="relative w-full md:w-96 group">
                   <input 
                      type="text" 
                      placeholder="Search records..." 
                      className="w-full bg-tally-bg border border-tally-border rounded-full py-4 px-8 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all uppercase tracking-widest"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-tally-text-secondary text-[10px] font-black uppercase tracking-[0.2em] border-b border-tally-border">
                         <th className="pb-6 px-4">Subject</th>
                         <th className="pb-6 px-4">Status</th>
                         <th className="pb-6 px-4">Evaluation</th>
                         <th className="pb-6 px-4 text-right">Records</th>
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
                            <td className="py-8 px-4">
                               <div className="font-black text-tally-text-primary group-hover:text-tally-blue text-xl tracking-tight mb-1 group-hover:italic transition-all">{can.name}</div>
                               <div className="text-[10px] text-tally-text-secondary font-black uppercase tracking-widest opacity-60">{can.email}</div>
                            </td>
                            <td className="py-8 px-4">
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 bg-white text-tally-text-primary rounded-full border border-tally-border group-hover:bg-tally-blue group-hover:text-white transition-all shadow-sm">
                                  {can.total_sessions} PHASES
                               </span>
                            </td>
                            <td className="py-8 px-4">
                               <span className="font-black text-tally-text-primary text-2xl tracking-tighter italic">
                                  {can.avg_score ? `${Math.round(can.avg_score)}%` : 'PENDING'}
                                </span>
                            </td>
                            <td className="py-8 px-4 text-right">
                               <button 
                                  onClick={() => can.latest_session_id && navigate(`/report/${can.latest_session_id}`)}
                                  className={`px-6 py-2 rounded-full border border-tally-border text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all shadow-sm ${!can.latest_session_id ? 'opacity-10 cursor-not-allowed' : ''}`}
                                  disabled={!can.latest_session_id}
                               >
                                  View Audit
                               </button>
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </motion.div>

          <div className="lg:col-span-4 flex flex-col gap-12">
             {/* Live Monitoring Panel */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
               className="bg-tally-surface border border-tally-border rounded-tally-xl p-10 shadow-sm flex-1"
             >
               <div className="mb-10">
                 <h2 className="text-3xl font-black text-tally-text-primary tracking-tighter italic mb-2">
                    Active
                 </h2>
                 <p className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Real-time telemetry</p>
               </div>
               
               <div className="space-y-6">
                  {liveSessions.length === 0 && (
                     <div className="text-center py-24 text-tally-text-secondary/40 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        No subjects active
                     </div>
                  )}
                  {liveSessions.map(ls => {
                     const isLobby = ls.scenario_id === 'Lobby' || ls.scenario_id === 'Authenticating';
                     return (
                      <div key={ls.id} className={`p-6 rounded-tally-xl bg-tally-bg border border-tally-border group transition-all relative overflow-hidden ${isLobby ? 'opacity-40 grayscale' : ''}`}>
                         <div className={`absolute top-0 left-0 w-1.5 h-full ${isLobby ? 'bg-gray-400' : 'bg-emerald-500'}`}></div>
                         <div className="flex justify-between items-start mb-4">
                            <div className="font-black text-tally-text-primary text-xl tracking-tight group-hover:italic transition-all">{ls.candidate_name}</div>
                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse mt-2 ${isLobby ? 'bg-gray-400' : 'bg-emerald-500'}`}></div>
                         </div>
                         <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-6 ${isLobby ? 'text-gray-500' : 'text-tally-pink'}`}>
                            {isLobby ? (ls.scenario_id === 'Authenticating' ? 'VALIDATING IDENTITY' : 'INITIAL LOBBY') : `${ls.scenario_id.replace(/_/g, ' ')}`}
                         </div>
                         {!isLobby && (
                           <div className="p-5 bg-white rounded-tally-lg flex flex-col gap-3 border border-tally-border shadow-sm">
                              <div className="text-[8px] text-tally-text-secondary uppercase tracking-[0.3em] font-black mb-1">Telemetry Action</div>
                              <div className="text-[11px] text-tally-text-primary font-bold italic truncate opacity-80 uppercase tracking-widest leading-none">
                                 {ls.last_event || 'Syncing sandbox environment...'}
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
               className="bg-tally-surface border border-tally-border rounded-tally-xl p-10 shadow-sm"
             >
                <div className="mb-10">
                 <h2 className="text-3xl font-black text-tally-text-primary tracking-tighter italic mb-2">
                    History
                 </h2>
                 <p className="text-[10px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Phase logs</p>
               </div>

               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {sessions.length === 0 && (
                     <div className="text-center py-20 text-tally-text-secondary/40 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        Archive empty
                     </div>
                  )}
                  {sessions.map(s => (
                     <div key={s.id} className="p-6 rounded-tally-xl border border-tally-border flex flex-col gap-4 transition-all hover:bg-tally-bg group">
                        <div className="flex justify-between items-start">
                           <span className="font-black text-tally-text-primary text-lg tracking-tight group-hover:italic transition-all">{s.candidate_name || 'Anonymous'}</span>
                           <span className="text-[8px] text-tally-text-secondary font-black uppercase tracking-[0.2em]">
                              {new Date(s.started_at).toLocaleDateString()}
                           </span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-tally-pink truncate opacity-80">
                           {s.scenario_id ? s.scenario_id.replace(/_/g, ' ') : 'WORKSPACE'}
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-4 border-t border-tally-border">
                           <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {s.status}
                           </span>
                           <button 
                              onClick={() => navigate(`/report/${s.id}`)}
                              className="text-[9px] text-tally-blue hover:text-black transition-all font-black uppercase tracking-[0.3em] italic"
                           >
                              Review Audit
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

