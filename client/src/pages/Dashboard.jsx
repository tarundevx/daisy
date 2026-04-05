import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Shield, Code, Lock, ArrowRight, LogOut, CheckCircle2, AlertCircle, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [interviewCode, setInterviewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const socket = io(window.location.origin.replace('5173', '3000'));
    
    socket.emit('join_lobby', {
      candidateName: user.name,
      isVerified: isVerified
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isVerified]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/verify-code', { 
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
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-tally-blue/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-tally-pink/5 rounded-full blur-[120px]"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-tally-text-primary mb-3">
              Verification Required
            </h1>
            <p className="text-tally-text-secondary font-medium">Please enter your HR-provided interview code to continue.</p>
          </div>

          <div className="bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm relative overflow-hidden">
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-tally-text-secondary mb-3 block">
                  Interview Access Code
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-tally-blue transition-colors" />
                  <input 
                    type="text"
                    placeholder="HR-XXXXXX"
                    value={interviewCode}
                    onChange={(e) => setInterviewCode(e.target.value.toUpperCase())}
                    className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-4 pl-12 pr-4 text-tally-text-primary font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all uppercase tracking-widest font-semibold"
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-tally-lg flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium leading-tight">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading || !interviewCode}
                className="w-full bg-tally-blue hover:bg-blue-600 text-white font-bold py-4 rounded-full transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 shadow-md shadow-tally-blue/10"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Unlock Assessment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <button 
            onClick={logout}
            className="mt-8 text-tally-text-secondary hover:text-tally-blue transition-colors text-sm font-bold flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tally-bg p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4 bg-green-50 text-green-600 px-3 py-1 rounded-full w-fit border border-green-100">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Access Verified</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-tally-text-primary mb-3">Assessment Sandbox</h1>
            <p className="text-tally-text-secondary text-lg font-medium">Ready to showcase your skills, {user?.name.split(' ')[0]}?</p>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={logout}
            className="w-fit p-4 bg-tally-surface hover:bg-gray-50 border border-tally-border rounded-tally-lg transition-all group shadow-sm"
          >
            <LogOut className="w-5 h-5 text-tally-text-secondary group-hover:text-tally-blue" />
          </motion.button>
        </header>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Feature Fix Sandbox */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => navigate('/session/prod_api_outage')}
            className="group relative bg-tally-surface border border-tally-border p-12 rounded-tally-xl text-left transition-all hover:bg-white hover:border-tally-blue h-full flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-tally-blue/5 overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-tally-blue/5 rounded-full blur-[80px] group-hover:bg-tally-blue/10 transition-all"></div>
            
            <div>
              <div className="w-16 h-16 bg-blue-50 text-tally-blue rounded-tally-lg flex items-center justify-center mb-10 group-hover:bg-tally-blue group-hover:text-white transition-all">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight text-tally-text-primary">Feature Fix Sandbox</h2>
              <p className="text-tally-text-secondary leading-relaxed text-lg font-medium">
                Solve infrastructure outages, debug system logs, and resolve performance bottlenecks in a live Linux terminal environment.
              </p>
            </div>

            <div className="mt-20 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-tally-text-secondary/60 uppercase tracking-widest">
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-tally-text-secondary/60 uppercase tracking-widest">
                  <Activity className="w-3.5 h-3.5" />
                  DevOps
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-tally-border flex items-center justify-center group-hover:bg-tally-blue group-hover:text-white group-hover:border-tally-blue transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </motion.button>

          {/* Code Sandbox */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => navigate('/code')}
            className="group relative bg-tally-surface border border-tally-border p-12 rounded-tally-xl text-left transition-all hover:bg-white hover:border-tally-pink h-full flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-tally-pink/5 overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-tally-pink/5 rounded-full blur-[80px] group-hover:bg-tally-pink/10 transition-all"></div>
            
            <div>
              <div className="w-16 h-16 bg-pink-50 text-tally-pink rounded-tally-lg flex items-center justify-center mb-10 group-hover:bg-tally-pink group-hover:text-white transition-all">
                <Code className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight text-tally-text-primary">Code Sandbox</h2>
              <p className="text-tally-text-secondary leading-relaxed text-lg font-medium">
                Implement high-performance algorithms, fix logical bugs, and build robust features using a full Monaco editor workspace.
              </p>
            </div>

            <div className="mt-20 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-tally-text-secondary/60 uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5" />
                  Development
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-tally-text-secondary/60 uppercase tracking-widest">
                  <Activity className="w-3.5 h-3.5" />
                  Architecture
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-tally-border flex items-center justify-center group-hover:bg-tally-pink group-hover:text-white group-hover:border-tally-pink transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
