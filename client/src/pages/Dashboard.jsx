import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { SOCKET_URL } from '../api';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [interviewCode, setInterviewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    
    socket.emit('join_lobby', {
      candidateName: user.name,
      isVerified: isVerified
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isVerified, SOCKET_URL]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-code', { 
        email: user?.email, 
        code: interviewCode 
      });
      if (res.data.success) {
        setIsVerified(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid interview code. Please verify with HR.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-tally-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-tally-blue/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-tally-pink/5 rounded-full blur-[120px]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold tracking-tighter text-tally-text-primary mb-4 italic">
              Verification
            </h1>
            <p className="text-tally-text-secondary font-medium px-4">Enter your secure access code to unlock the evaluation environment.</p>
          </div>

          <div className="bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-tally-blue opacity-20"></div>
            <form onSubmit={handleVerify} className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-tally-text-secondary mb-4 block uppercase tracking-[0.2em]">
                  Secure Access Key
                </label>
                <input 
                  type="text"
                  placeholder="HR-XXXXXX"
                  value={interviewCode}
                  onChange={(e) => setInterviewCode(e.target.value.toUpperCase())}
                  className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-5 px-6 text-tally-text-primary font-mono placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all uppercase tracking-widest font-black text-xl"
                  maxLength={20}
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 border border-red-100 p-4 rounded-tally-lg"
                  >
                    <p className="text-xs text-red-600 font-bold leading-tight uppercase tracking-widest text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !interviewCode}
                className="w-full bg-tally-blue hover:bg-blue-600 text-white font-black py-5 rounded-full transition-colors flex items-center justify-center uppercase tracking-[0.3em] text-[10px] disabled:opacity-50 shadow-xl shadow-tally-blue/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Authorize Entry'
                )}
              </motion.button>
            </form>
          </div>

          <button 
            onClick={logout}
            className="mt-12 text-tally-text-secondary hover:text-black transition-colors text-[10px] font-black uppercase tracking-[0.2em] mx-auto block"
          >
            Exit Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-20">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="flex items-center mb-6 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full w-fit">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Identity Validated</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-tally-text-primary mb-4 italic">Assessment</h1>
            <p className="text-tally-text-secondary text-xl font-medium">System ready for evaluation phase — <span className="text-black font-black uppercase tracking-widest text-sm">{user?.name.split(' ')[0]}</span></p>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={logout}
            className="w-fit px-8 py-3 bg-white hover:bg-black hover:text-white border border-tally-border rounded-full transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm"
          >
            Sign Out
          </motion.button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            onClick={() => navigate('/session/prod_api_outage')}
            className="group relative bg-tally-surface border border-tally-border p-12 rounded-tally-xl text-left transition-all hover:border-tally-blue h-[450px] flex flex-col justify-between shadow-sm hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-tally-blue opacity-0 group-hover:opacity-100 transition-all"></div>
            
            <div>
              <div className="mb-12">
                <span className="text-[10px] font-black text-tally-blue bg-blue-50 px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-blue-100 group-hover:bg-tally-blue group-hover:text-white transition-all">
                  Troubleshooting
                </span>
              </div>
              <h2 className="text-5xl font-black mb-6 tracking-tighter text-tally-text-primary leading-none group-hover:italic transition-all">
                Feature Fix<br/>Sandbox
              </h2>
              <p className="text-tally-text-secondary leading-relaxed text-lg font-medium opacity-80 max-w-sm">
                Debug live infrastructure outages and resolve performance bottlenecks in a high-fidelity virtual terminal.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-tally-border pt-8 mt-12">
              <div className="flex gap-6">
                <div className="text-[9px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Live Term</div>
                <div className="text-[9px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">DevOps</div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tally-blue group-hover:translate-x-2 transition-transform">Begin Mode</span>
            </div>
          </motion.button>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8 }}
            onClick={() => navigate('/code')}
            className="group relative bg-tally-surface border border-tally-border p-12 rounded-tally-xl text-left transition-all hover:border-tally-pink h-[450px] flex flex-col justify-between shadow-sm hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-tally-pink opacity-0 group-hover:opacity-100 transition-all"></div>
            
            <div>
              <div className="mb-12">
                <span className="text-[10px] font-black text-tally-pink bg-pink-50 px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-pink-100 group-hover:bg-tally-pink group-hover:text-white transition-all">
                  Development
                </span>
              </div>
              <h2 className="text-5xl font-black mb-6 tracking-tighter text-tally-text-primary leading-none group-hover:italic transition-all">
                Algorithmic<br/>Sandbox
              </h2>
              <p className="text-tally-text-secondary leading-relaxed text-lg font-medium opacity-80 max-w-sm">
                Implement full-stack features and solve logical challenges using a dedicated Monaco workspace.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-tally-border pt-8 mt-12">
              <div className="flex gap-6">
                <div className="text-[9px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Code Audit</div>
                <div className="text-[9px] font-black text-tally-text-secondary uppercase tracking-[0.2em]">Architecture</div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tally-pink group-hover:translate-x-2 transition-transform">Begin Mode</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
