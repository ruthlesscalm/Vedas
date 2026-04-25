import React, { useState, useEffect, useCallback } from 'react';
import { CloudOff, RefreshCw, CheckCircle2, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOfflineLogs, clearOfflineLogs, getPendingCount } from '../utils/db';
import api from '../utils/api';

const OfflineSyncBanner = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // 'success' | 'error' | null
  const [expanded, setExpanded] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      /* ignore DB errors */
    }
  }, []);

  // Poll pending count every 3s so it stays fresh
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 3000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (syncResult === 'success') {
      const t = setTimeout(() => setSyncResult(null), 4000);
      return () => clearTimeout(t);
    }
  }, [syncResult]);

  const handleSyncAll = async () => {
    if (syncing || pendingCount === 0) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      const logs = await getOfflineLogs();
      // Strip the local id + savedAt before sending
      const payload = logs.map(({ id, savedAt, ...rest }) => rest);
      await api.post('/batch/sync', { logs: payload });
      await clearOfflineLogs();
      setPendingCount(0);
      setSyncResult('success');
    } catch {
      setSyncResult('error');
    } finally {
      setSyncing(false);
    }
  };

  // Nothing to show if online & nothing pending & no result
  if (isOnline && pendingCount === 0 && !syncResult) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-6 z-50"
        id="offline-sync-banner"
      >
        {/* Success flash */}
        <AnimatePresence>
          {syncResult === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 size={14} /> All logs synced successfully!
            </motion.div>
          )}
          {syncResult === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 bg-red-500/20 border border-red-500/40 backdrop-blur-md text-red-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <AlertTriangle size={14} /> Sync failed. Try again later.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main pill */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer"
        >
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all
            ${!isOnline
              ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : pendingCount > 0
                ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'bg-slate-800/80 border-slate-700/50'
            }
          `}>
            {/* Status icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${!isOnline
                ? 'bg-amber-500/20 text-amber-400'
                : pendingCount > 0
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }
            `}>
              {!isOnline ? <WifiOff size={16} /> : pendingCount > 0 ? <CloudOff size={16} /> : <Wifi size={16} />}
            </div>

            {/* Text */}
            <div>
              <p className="text-xs font-bold text-white leading-none">
                {!isOnline ? 'Offline Mode' : pendingCount > 0 ? `${pendingCount} Pending` : 'Online'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {!isOnline
                  ? 'Scans saved locally'
                  : pendingCount > 0
                    ? 'Tap to sync'
                    : 'All synced'
                }
              </p>
            </div>

            {/* Badge */}
            {pendingCount > 0 && (
              <div className="bg-indigo-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-1 shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                {pendingCount > 9 ? '9+' : pendingCount}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Sync panel */}
        <AnimatePresence>
          {expanded && pendingCount > 0 && isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              <p className="text-xs text-slate-400 mb-3">
                <span className="font-bold text-white">{pendingCount}</span> scan{pendingCount !== 1 ? 's' : ''} saved offline.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleSyncAll(); }}
                disabled={syncing}
                className={`
                  w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all
                  ${syncing
                    ? 'bg-indigo-500/20 text-indigo-300 cursor-wait'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  }
                `}
                id="btn-sync-all"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync All Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineSyncBanner;
