import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Shield, Code, Lock, ArrowRight, LogOut, CheckCircle2, AlertCircle, ChevronRight, Activity, Terminal
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [interviewCode, setInterviewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-verify if already verified in session (optional enhancement)
  // For now, we'll follow the flow strictly

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
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_-20%,#312e81,black)]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Daisy Assessment
            </h1>
            <p className="text-gray-400 font-medium">Please enter your HR-provided interview code to continue.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                  Interview Access Code
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password"
                    placeholder="HR-XXXXXX"
                    value={interviewCode}
                    onChange={(e) => setInterviewCode(e.target.value.toUpperCase())}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase tracking-widest"
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 leading-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !interviewCode}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-xl shadow-white/5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    Unlock Assessment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <button 
            onClick={logout}
            className="mt-8 text-gray-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 overflow-hidden bg-[radial-gradient(circle_at_50%_-20%,#312e81,black)]">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Code Verified</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Assessment Sandbox</h1>
            <p className="text-gray-400 mt-2 font-medium">Welcome back, {user?.name}. Select your environment to begin.</p>
          </div>
          <button 
            onClick={logout}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-white" />
          </button>
        </header>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 items-center">
          {/* Feature Fix Sandbox */}
          <button 
            onClick={() => navigate('/session/prod_api_outage')}
            className="group relative bg-white/5 border border-white/10 p-10 rounded-[60px] text-left transition-all hover:bg-white/10 hover:border-indigo-500/50 hover:-translate-y-2 h-full flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] group-hover:bg-indigo-600/20 transition-all"></div>
            
            <div>
              <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-indigo-600/30 transition-all">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Feature Fix Sandbox</h2>
              <p className="text-gray-400 leading-relaxed text-lg font-medium">
                Solve infrastructure outages, debug system logs, and resolve performance bottlenecks in a live Linux terminal environment.
              </p>
            </div>

            <div className="mt-20 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Activity className="w-3.5 h-3.5" />
                  DevOps
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </button>

          {/* Code Sandbox */}
          <button 
            onClick={() => navigate('/code')}
            className="group relative bg-white/5 border border-white/10 p-10 rounded-[60px] text-left transition-all hover:bg-white/10 hover:border-purple-500/50 hover:-translate-y-2 h-full flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] group-hover:bg-purple-600/20 transition-all"></div>
            
            <div>
              <div className="w-16 h-16 bg-purple-600/20 text-purple-400 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-purple-600/30 transition-all">
                <Code className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Code Sandbox</h2>
              <p className="text-gray-400 leading-relaxed text-lg font-medium">
                Implement high-performance algorithms, fix logical bugs, and build robust features using a full Monaco editor workspace.
              </p>
            </div>

            <div className="mt-20 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Shield className="w-3.5 h-3.5" />
                  Development
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Activity className="w-3.5 h-3.5" />
                  Architecture
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
