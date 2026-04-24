import React, { useState } from 'react';
import {
  Search, Package, MapPin, ShieldCheck, ShieldAlert, AlertCircle,
  Loader2, ArrowRight, Clock, User, Hash, Route
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const AdminDashboard = () => {
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchData, setBatchData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!batchId.trim()) return;

    setLoading(true);
    setError('');
    setBatchData(null);

    try {
      const res = await api.get(`/batch/${batchId.trim()}`);
      if (res.data.success) {
        setBatchData(res.data.data);
      } else {
        throw new Error(res.data.message || 'Batch not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Batch not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Package className="text-amber-400" size={20} />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">Admin Dashboard</h2>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          Track any batch across the supply chain. Enter a Batch ID to view its origin details and full journey log.
        </p>
      </header>

      <form onSubmit={handleSearch} className="glass-panel p-5 rounded-2xl mb-8 flex gap-3" id="admin-search-form">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Enter Batch ID (UUID)"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all text-sm font-mono"
            id="input-batch-search"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !batchId.trim()}
          className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-neon disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm tracking-widest uppercase"
          id="btn-search-batch"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={16} /> TRACK</>}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-danger/10 border border-danger/30 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium mb-6"
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {!batchData && !loading && !error && (
        <div className="glass-panel border-dashed border-slate-600 py-20 flex flex-col items-center justify-center text-slate-500 rounded-3xl">
          <Search size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-slate-400">Enter a Batch ID to begin tracking</p>
        </div>
      )}

      {batchData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-accent/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30">
                <Package size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Batch Origin</h3>
                <p className="text-xs text-slate-400">Sealed batch details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1"><Hash size={10} /> Batch ID</p>
                <p className="text-xs font-mono text-accent break-all">{batchData.origin.batchId}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1"><User size={10} /> Producer</p>
                <p className="text-sm font-bold text-white">{batchData.origin.producerId}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1"><MapPin size={10} /> Origin Location</p>
                <p className="text-xs font-mono text-white">
                  {batchData.origin.originLocation?.lat?.toFixed(4)}, {batchData.origin.originLocation?.lng?.toFixed(4)}
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1"><Clock size={10} /> Sealed At</p>
                <p className="text-xs font-mono text-white">
                  {new Date(batchData.origin.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Items ({batchData.origin.items?.length})</p>
              <div className="flex flex-wrap gap-2">
                {batchData.origin.items?.map((item, i) => (
                  <span key={i} className="bg-slate-700/50 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600">
                    {item.name} — {item.weight}kg
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Origin Hash</p>
              <p className="text-[10px] font-mono text-success break-all">{batchData.origin.originHash}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Route size={16} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Journey Log</h3>
              <span className="text-xs bg-slate-800/80 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700 font-bold">
                {batchData.journey?.length || 0} checkpoint{batchData.journey?.length !== 1 ? 's' : ''}
              </span>
            </div>

            {(!batchData.journey || batchData.journey.length === 0) ? (
              <div className="glass-panel border-dashed border-slate-600 py-16 flex flex-col items-center justify-center text-slate-500 rounded-3xl">
                <Route size={36} className="mb-3 opacity-30" />
                <p className="text-slate-400 font-medium">No checkpoints recorded yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-slate-700/50"></div>

                <div className="space-y-4">
                  {batchData.journey.map((log, idx) => (
                    <motion.div
                      key={log._id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative pl-12"
                    >
                      <div className={`absolute left-2.5 top-5 w-4 h-4 rounded-full border-2 z-10 ${
                        log.status === 'Verified'
                          ? 'bg-success/20 border-success'
                          : 'bg-danger/20 border-danger'
                      }`}></div>

                      <div className="glass-panel rounded-2xl p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {log.status === 'Verified' ? (
                              <ShieldCheck size={16} className="text-success" />
                            ) : (
                              <ShieldAlert size={16} className="text-danger" />
                            )}
                            <span className={`text-sm font-bold ${log.status === 'Verified' ? 'text-success' : 'text-danger'}`}>
                              {log.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timeStamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Scanned By</p>
                            <p className="text-xs text-white font-bold">{log.scannedBy}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Location</p>
                            <p className="text-xs font-mono text-white flex items-center gap-1">
                              <MapPin size={10} className="text-accent" />
                              {log.location?.lat?.toFixed(4)}, {log.location?.lng?.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Log Hash</p>
                          <p className="text-[9px] font-mono text-slate-300 break-all">{log.logHash}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
