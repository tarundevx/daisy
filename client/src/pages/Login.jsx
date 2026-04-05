import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userData;
      if (isLogin) {
        userData = await login(email, password);
      } else {
        userData = await signup(email, password, name);
      }
      
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tally-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Doodles (Simplified placeholder for the Tally feel) */}
      <div className="absolute top-20 left-[10%] w-32 h-32 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-tally-pink fill-current">
          <path d="M10,50 Q25,25 50,50 T90,50" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-[10%] w-40 h-40 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-tally-blue fill-current">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M30,30 L70,70 M70,30 L30,70" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold text-tally-text-primary mb-3 tracking-tight"
          >
            Daisy
          </motion.h1>
          <p className="text-tally-text-secondary text-lg font-medium">
            {isLogin ? 'Welcome back.' : 'Join the evolution.'}
          </p>
        </div>

        <div className="bg-tally-surface border border-tally-border p-10 rounded-tally-xl shadow-sm">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-tally-lg mb-6 text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-4 text-tally-text-secondary w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-4 pl-12 pr-4 text-tally-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-4 text-tally-text-secondary w-5 h-5" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-4 pl-12 pr-4 text-tally-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-tally-text-secondary w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-tally-bg border border-tally-border rounded-tally-lg py-4 pl-12 pr-4 text-tally-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tally-blue/20 transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-tally-blue hover:bg-blue-600 text-white font-bold py-4 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 shadow-md shadow-tally-blue/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="mr-2">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-tally-text-secondary hover:text-tally-blue text-sm font-semibold transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-tally-text-secondary text-sm font-medium">
          Powered by <span className="text-tally-pink">Daisy AI</span>
        </p>
      </motion.div>
    </div>
  );
}
