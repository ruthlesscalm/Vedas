import React, { useState, useEffect } from 'react';
import { ScrollText, MapPin, ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/batch/logs/${user.username}`);
      if (res.data.success) {
        setLogs(res.data.data);
      } else {
        throw new Error(res.data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="text-accent animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Loading logs…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <ScrollText className="text-violet-400" size={20} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">My Logs</h2>
              <p className="text-slate-400 text-sm mt-1">Your scan history across all batches</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-accent transition-all"
            id="btn-refresh-logs"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-danger/10 border border-danger/30 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium mb-6"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel border-dashed border-slate-600 py-20 flex flex-col items-center justify-center text-slate-500 rounded-3xl"
        >
          <ScrollText size={48} className="mb-4 opacity-50" />
          <p className="font-medium text-slate-400 text-lg">No logs yet</p>
          <p className="text-xs mt-2 text-slate-500">Sync a batch checkpoint to see your logs here.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-slate-400">
              <span className="text-white font-bold">{logs.length}</span> checkpoint{logs.length !== 1 ? 's' : ''} recorded
            </p>
          </div>

          {logs.map((log, idx) => (
            <motion.div
              key={log._id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="glass-panel rounded-2xl p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {log.status === 'Verified' ? (
                    <div className="w-9 h-9 bg-success/20 rounded-lg flex items-center justify-center border border-success/30">
                      <ShieldCheck size={18} className="text-success" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-danger/20 rounded-lg flex items-center justify-center border border-danger/30">
                      <ShieldAlert size={18} className="text-danger" />
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold ${log.status === 'Verified' ? 'text-success' : 'text-danger'}`}>
                      {log.status}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(log.timeStamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Batch ID</p>
                  <p className="text-xs font-mono text-accent break-all">{log.batchId}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                  <p className="text-xs font-mono text-white flex items-center gap-1.5">
                    <MapPin size={12} className="text-accent" />
                    {log.location?.lat?.toFixed(4)}, {log.location?.lng?.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="mt-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Log Hash</p>
                <p className="text-[10px] font-mono text-slate-300 break-all">{log.logHash}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLogs;
