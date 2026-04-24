import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Truck, Zap, Globe, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const RoleSelection = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <div className="inline-flex bg-accent/20 border border-accent/30 shadow-neon p-4 rounded-2xl mb-6">
            <Shield className="text-accent w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
            {user ? `Welcome, ${user.name}` : 'Select Your Portal'}
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            {user 
              ? `You are authenticated as a ${user.role.toUpperCase()}. Choose your operational environment below.`
              : 'Welcome to VEDAS. Please select your role or sign in to access secure cryptographic tools.'
            }
          </p>
          {!user && (
            <Link to="/login" className="inline-flex items-center gap-2 mt-6 text-accent hover:text-white font-bold transition-colors">
              Already have an account? Sign in here <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Client Portal */}
          <Link 
            to="/client/crypto"
            className={`group glass-panel p-8 rounded-3xl transition-all text-left flex flex-col h-full relative overflow-hidden ${user?.role === 'client' ? 'border-accent shadow-neon bg-accent/5' : 'hover:border-accent/50 hover:shadow-neon'}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent/20 transition-colors"></div>
            <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 shadow-sm text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-accent/50 transition-all z-10 relative">
              <Package size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors relative z-10">Client Portal</h2>
            <p className="text-slate-400 mb-8 flex-1 relative z-10">
              For manufacturers and consumers. Generate cryptographic seals and trace product authenticity via the public ledger.
            </p>
            <div className="flex gap-2 relative z-10">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Zap size={14}/> Crypto</span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Globe size={14}/> Trust Dashboard</span>
            </div>
          </Link>

          {/* Server Portal */}
          <Link 
            to="/server/scan"
            className={`group glass-panel p-8 rounded-3xl transition-all text-left flex flex-col h-full relative overflow-hidden ${user?.role === 'server' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/5' : 'hover:border-accent/50 hover:shadow-neon'}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent/20 transition-colors"></div>
            <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 shadow-sm text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-accent/50 transition-all z-10 relative">
              <Truck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors relative z-10">Server Portal</h2>
            <p className="text-slate-400 mb-8 flex-1 relative z-10">
              For logistics providers and drivers. Scan shipments in the field, with robust offline support via the Ghost-Log protocol.
            </p>
            <div className="flex gap-2 relative z-10">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Truck size={14}/> Ghost-Log</span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Globe size={14}/> Trust Dashboard</span>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelection;
