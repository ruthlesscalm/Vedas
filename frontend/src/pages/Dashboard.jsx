import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Package, MapPin, Send, ShieldCheck, ShieldAlert, ScanLine, CheckCircle2,
  AlertCircle, Loader2, Box, Scale, ArrowRight, Trash2, Copy, QrCode, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ─── SHA-256 Hashing Utility ────────────────────────────────────────────────
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Geolocation Helper ────────────────────────────────────────────────────
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// SEAL BATCH Tab
// ═════════════════════════════════════════════════════════════════════════════
const SealBatchTab = () => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(1);
  const [items, setItems] = useState([{ name: '', weight: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copying, setCopying] = useState(false);

  // Keep items array in sync with itemCount
  useEffect(() => {
    setItems((prev) => {
      const newItems = [...prev];
      while (newItems.length < itemCount) newItems.push({ name: '', weight: '' });
      return newItems.slice(0, itemCount);
    });
  }, [itemCount]);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSeal = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate all items
      for (let i = 0; i < items.length; i++) {
        if (!items[i].name.trim()) throw new Error(`Item ${i + 1} name is required`);
        if (!items[i].weight || isNaN(items[i].weight) || Number(items[i].weight) <= 0) {
          throw new Error(`Item ${i + 1} weight must be a positive number`);
        }
      }

      const location = await getLocation();
      const batchId = crypto.randomUUID();
      const producerId = user.username;
      const timeStamp = new Date().toISOString();
      const formattedItems = items.map((it) => ({
        name: it.name.trim(),
        weight: Number(it.weight),
      }));

      // Compute the hash the same way the backend does
      const itemsString = JSON.stringify(formattedItems);
      const dataToHash = `${batchId}:${producerId}:${itemsString}:${location.lat},${location.lng}:${timeStamp}`;
      const originHash = await sha256(dataToHash);

      const res = await axios.post('/api/batch/seal', {
        batchId,
        producerId,
        items: formattedItems,
        locationObj: location,
        timeStamp,
        originHash,
      });

      if (res.data.success) {
        setResult({ batchId, originHash });
      } else {
        throw new Error(res.data.message || 'Seal failed');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to seal batch';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyBatchId = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.batchId);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const reset = () => {
    setResult(null);
    setItems([{ name: '', weight: '' }]);
    setItemCount(1);
    setError('');
  };

  if (result) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg mx-auto"
      >
        <div className="glass-panel border border-success/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-success/10 blur-3xl rounded-full"></div>
          <div className="absolute top-4 right-4 z-20">
            <button onClick={reset} className="p-2 text-slate-400 hover:text-danger transition-colors" id="btn-reset-seal">
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center text-success border border-success/30 shadow-neon-success">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Batch Sealed Successfully</h3>
              <p className="text-sm text-slate-400 font-mono mt-1">Cryptographic seal active</p>
            </div>
          </div>

          {/* QR Code – contains only the batchId */}
          <div className="bg-white p-6 rounded-2xl flex justify-center items-center shadow-inner mb-8 relative z-10 max-w-[280px] mx-auto">
            <QRCodeCanvas
              value={result.batchId}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Batch ID</p>
                <button
                  onClick={copyBatchId}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    copying
                      ? 'bg-accent/20 text-accent'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  id="btn-copy-batchid"
                >
                  {copying ? 'COPIED!' : <><Copy size={12} /> COPY</>}
                </button>
              </div>
              <p className="text-xs font-mono text-accent break-all">{result.batchId}</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">SHA-256 Origin Hash</p>
              <p className="text-xs font-mono text-success break-all">{result.originHash}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                <p className="text-sm font-bold text-success">Sealed</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Producer</p>
                <p className="text-sm font-bold text-white">{user.username}</p>
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full mt-6 py-3 bg-success/20 text-success hover:bg-success hover:text-white rounded-xl font-bold transition-colors relative z-10 shadow-neon-success"
            id="btn-seal-another"
          >
            Seal Another Batch
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shadow-neon">
            <Box size={16} className="text-accent" />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Seal Protocol</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">Seal a Batch</h2>
        <p className="text-slate-400 text-base max-w-xl leading-relaxed">
          Register items with cryptographic hashing. Each parameter is sealed using{' '}
          <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            SHA-256
          </strong>{' '}
          to create an immutable digital seal.
        </p>
      </header>

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

      <form onSubmit={handleSeal} className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden group" id="seal-form">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-accent/10 transition-colors duration-1000"></div>

        <div className="space-y-6 relative z-10">
          {/* Number of Items selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Number of Items
            </label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:shadow-neon transition-all appearance-none cursor-pointer"
                id="select-item-count"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} item{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Item Inputs */}
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Item Details
            </label>
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all text-sm"
                    placeholder={`Item ${idx + 1} name`}
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all text-sm"
                    placeholder="Weight (kg)"
                    value={item.weight}
                    onChange={(e) => updateItem(idx, 'weight', e.target.value)}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-xs bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
            <MapPin size={14} className="text-accent flex-shrink-0" />
            <span>Location & timestamp will be captured automatically on submit</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-seal-batch"
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-xl transition-all shadow-neon mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm tracking-widest uppercase"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>SEAL BATCH <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SYNC BATCH Tab (Middleman QR Scanner)
// ═════════════════════════════════════════════════════════════════════════════
const SyncBatchTab = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);  // { status, batchId, message }
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const readerRef = useRef(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError('');
    setScanResult(null);
    setScanning(true);

    // Dynamically import to avoid SSR issues
    const { Html5QrcodeScanner } = await import('html5-qrcode');

    // Small delay to ensure DOM element is rendered
    await new Promise((r) => setTimeout(r, 100));

    if (!readerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { qrbox: { width: 250, height: 250 }, fps: 5, aspectRatio: 1.0 },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Stop scanner immediately
        stopScanner();

        // The QR code contains only the batchId (UUID)
        const batchId = decodedText.trim();

        if (!batchId) {
          setError('Invalid QR code: no batch ID found');
          return;
        }

        setSubmitting(true);
        try {
          const location = await getLocation();
          const scannedBy = user.username;
          const timeStamp = new Date().toISOString();

          // Compute logHash matching backend's expected format
          const dataToHash = `${batchId}:${scannedBy}:${location.lat},${location.lng}:${timeStamp}`;
          const logHash = await sha256(dataToHash);

          const res = await axios.post('/api/batch/sync', {
            logs: [
              {
                batchId,
                scannedBy,
                location,
                timeStamp,
                logHash,
              },
            ],
          });

          if (res.data.success) {
            setScanResult({
              status: 'success',
              batchId,
              message: res.data.message,
            });
          } else {
            throw new Error(res.data.message || 'Sync failed');
          }
        } catch (err) {
          const msg =
            err.response?.data?.message || err.message || 'Sync failed';
          setScanResult({ status: 'error', batchId, message: msg });
        } finally {
          setSubmitting(false);
        }
      },
      () => {} // suppress routine scan errors
    );
  }, [user, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Camera className="text-emerald-400" size={20} />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">
          Scan & Sync
        </h2>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          Scan a batch QR code to log your checkpoint. Your identity, location, and timestamp are
          captured automatically and cryptographically hashed.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ScanLine className="text-accent" /> QR Scanner
            </h3>
            {scanning && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
              </div>
            )}
          </div>

          {!scanning && !submitting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"></div>
                <QrCode size={64} className="relative z-10 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm mb-6 text-center">
                Start the scanner to read a batch QR code
              </p>
              <button
                onClick={startScanner}
                className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-neon flex items-center gap-2 text-sm tracking-widest uppercase"
                id="btn-start-scanner"
              >
                <Camera size={18} /> START SCANNER
              </button>
            </div>
          ) : submitting ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm font-medium">Processing scan…</p>
            </div>
          ) : (
            <div ref={readerRef}>
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden border-2 border-slate-700/50"
              ></div>
              <button
                onClick={stopScanner}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
                id="btn-stop-scanner"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
            <ShieldCheck className="text-success" /> Sync Result
          </h3>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-danger/10 border border-danger/30 p-4 rounded-xl flex items-center gap-3 text-danger text-sm font-medium"
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel border-dashed border-slate-600 h-[300px] flex flex-col items-center justify-center text-slate-500 rounded-3xl"
              >
                <ScanLine size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-slate-400">Awaiting QR scan…</p>
                <p className="text-xs mt-2 max-w-[200px] text-center">
                  Scan a batch QR code to sync your checkpoint.
                </p>
              </motion.div>
            ) : scanResult.status === 'error' ? (
              <motion.div
                key="error"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-danger/10 border border-danger/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md"
              >
                <div className="flex items-center gap-3 text-danger mb-4">
                  <ShieldAlert size={28} />
                  <h3 className="text-xl font-bold">Sync Failed</h3>
                </div>
                <p className="text-danger/80 text-sm mb-4">{scanResult.message}</p>
                {scanResult.batchId && (
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-danger/20 font-mono text-xs text-danger break-all">
                    Batch: {scanResult.batchId}
                  </div>
                )}
                <button
                  onClick={() => { setScanResult(null); setError(''); }}
                  className="mt-6 w-full py-3 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-xl font-bold transition-colors"
                  id="btn-retry-scan"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-success/10 border border-success/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 text-success mb-6 relative z-10">
                  <div className="bg-success/20 p-2 rounded-full border border-success/30 shadow-neon-success">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Checkpoint Synced</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Batch ID
                    </p>
                    <p className="text-white font-mono text-sm break-all">{scanResult.batchId}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Message
                    </p>
                    <p className="text-success text-sm font-medium">{scanResult.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Scanned By
                      </p>
                      <p className="text-xs text-white font-bold">{user.username}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Status
                      </p>
                      <p className="text-xs font-bold text-success">✓ Synced</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setScanResult(null); setError(''); }}
                  className="mt-6 w-full py-3 bg-success/20 text-success hover:bg-success hover:text-white rounded-xl font-bold transition-colors relative z-10 shadow-neon-success"
                  id="btn-scan-next"
                >
                  Scan Next Item
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD (Tab Switcher)
// ═════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('seal');

  return (
    <div>
      {/* Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="glass-panel inline-flex rounded-2xl p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('seal')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-all ${
              activeTab === 'seal'
                ? 'bg-accent text-white shadow-neon'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            id="tab-seal"
          >
            <Package size={18} />
            Seal Batch
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-all ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            id="tab-sync"
          >
            <ScanLine size={18} />
            Sync Batch
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'seal' ? <SealBatchTab /> : <SyncBatchTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
