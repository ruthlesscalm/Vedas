import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex bg-accent/10 border border-accent/30 shadow-neon p-4 rounded-2xl mb-6 hover:scale-105 transition-transform">
            <Shield className="text-accent w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Authorization</h1>
          <p className="text-slate-400 text-lg">Secure access to VEDAS cryptographic portal</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-10 rounded-[2.5rem] space-y-6 relative border-slate-700/30" id="login-form">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-3xl rounded-full -mr-20 -mt-20"></div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-danger/10 border border-danger/30 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium"
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                {typeof error === 'string' ? error : (error?.message || 'An error occurred')}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="email"
                  required
                  id="input-email"
                  className="w-full bg-slate-900/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:bg-slate-900/60 transition-all font-medium"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Passphrase</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="password"
                  required
                  id="input-password"
                  className="w-full bg-slate-900/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:bg-slate-900/60 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-login"
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-neon flex justify-center items-center gap-2 relative z-10 text-sm tracking-widest uppercase mt-4 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>ESTABLISH CONNECTION <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>

          <div className="text-center pt-4 relative z-10 border-t border-slate-800/50">
            <p className="text-slate-400 text-sm">
              No account?{' '}
              <Link to="/register" className="text-accent hover:text-white font-bold transition-colors">Register Here</Link>
            </p>
          </div>
        </form>

        <p className="text-center mt-8 text-[10px] text-slate-600 font-bold tracking-widest uppercase">
          VEDAS · Verified Ecosystem for Decentralized Asset Security
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
