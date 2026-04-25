import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, ScanLine, CheckCircle2,
  AlertCircle, QrCode, Camera, ImagePlus, X, CloudOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { sha256, UUID_REGEX } from '../utils/crypto';
import { getLocation } from '../utils/geolocation';
import { saveOfflineLog } from '../utils/db';

const SyncBatch = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);

  const processScan = useCallback(async (batchId) => {
    if (!batchId) {
      setError('Invalid QR code: no batch ID found');
      return;
    }

    if (!UUID_REGEX.test(batchId)) {
      setScanResult({
        status: 'error',
        batchId,
        message: 'Invalid QR Code — this is not a VEDAS registered batch.',
      });
      return;
    }

    setSubmitting(true);
    let location, scannedBy, timeStamp, logHash;
    try {
      location = await getLocation();
      scannedBy = user.username;
      timeStamp = new Date().toISOString();

      const dataToHash = `${batchId}:${scannedBy}:${location.lat},${location.lng}:${timeStamp}`;
      logHash = await sha256(dataToHash);

      const res = await api.post('/batch/sync', {
        logs: [{ batchId, scannedBy, location, timeStamp, logHash }],
      });

      if (res.data.success && res.data.message?.includes('Synced 0')) {
        setScanResult({
          status: 'error',
          batchId,
          message: 'Batch not found in the ledger. This QR code does not match any sealed batch.',
        });
      } else if (res.data.success) {
        setScanResult({ status: 'success', batchId, message: res.data.message });
      } else {
        throw new Error(res.data.message || 'Sync failed');
      }
    } catch (err) {
      if (!window.navigator.onLine && scannedBy) {
        await saveOfflineLog({ batchId, scannedBy, location, timeStamp, logHash });
        setScanResult({
          status: 'offline',
          batchId,
          message: 'Saved locally. Will sync automatically when back online.',
        });
      } else {
        setScanResult({
          status: 'error',
          batchId,
          message: err.response?.data?.message || err.message || 'Sync failed',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  const stopCamera = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.getState() === 2) {
          await html5QrRef.current.stop();
        }
      } catch { /* ignore */ }
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setScanResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      await new Promise((r) => setTimeout(r, 150));

      const el = document.getElementById('qr-reader');
      if (!el) { setScanning(false); return; }
      el.innerHTML = '';

      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopCamera();
          await processScan(decodedText.trim());
        },
        () => {}
      );
    } catch {
      setError('Camera access denied or not available. Try uploading an image instead.');
      setScanning(false);
    }
  }, [stopCamera, processScan]);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await stopCamera();
    setError('');
    setScanResult(null);
    setSubmitting(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      let fileReaderEl = document.getElementById('qr-file-reader');
      if (!fileReaderEl) {
        fileReaderEl = document.createElement('div');
        fileReaderEl.id = 'qr-file-reader';
        fileReaderEl.style.display = 'none';
        document.body.appendChild(fileReaderEl);
      }

      const html5Qr = new Html5Qrcode('qr-file-reader');
      const result = await html5Qr.scanFile(file, false);
      html5Qr.clear();
      await processScan(result.trim());
    } catch {
      setError('Could not read QR code from image. Make sure the image contains a valid QR code.');
      setSubmitting(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stopCamera, processScan]);

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          if (html5QrRef.current.getState() === 2) {
            html5QrRef.current.stop().catch(() => {});
          }
        } catch { /* ignore */ }
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
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">Scan & Sync</h2>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          Scan a batch QR code to log your checkpoint. Your identity, location, and timestamp are
          captured automatically and cryptographically hashed.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="qr-image-input"
          />

          {!scanning && !submitting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"></div>
                <QrCode size={64} className="relative z-10 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm mb-6 text-center">Use camera or upload a QR code image</p>
              <div className="flex gap-3">
                <button
                  onClick={startCamera}
                  className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-neon flex items-center gap-2 text-sm tracking-widest uppercase"
                  id="btn-start-scanner"
                >
                  <Camera size={18} /> CAMERA
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-700/80 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-sm tracking-widest uppercase border border-slate-600"
                  id="btn-upload-image"
                >
                  <ImagePlus size={18} /> IMAGE
                </button>
              </div>
            </div>
          ) : submitting ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm font-medium">Processing scan…</p>
            </div>
          ) : (
            <div>
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-slate-700/50" style={{ minHeight: '280px' }}></div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                  id="btn-stop-scanner"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={() => { stopCamera(); fileInputRef.current?.click(); }}
                  className="flex-1 py-2.5 text-sm text-accent hover:text-white border border-accent/30 hover:bg-accent/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                  id="btn-upload-while-scanning"
                >
                  <ImagePlus size={16} /> Upload Image
                </button>
              </div>
            </div>
          )}
        </div>

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
                <p className="text-xs mt-2 max-w-[200px] text-center">Scan a batch QR code to sync your checkpoint.</p>
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
            ) : scanResult.status === 'offline' ? (
              <motion.div
                key="offline"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 text-amber-400 mb-6 relative z-10">
                  <div className="bg-amber-500/20 p-2 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <CloudOff size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Saved Locally</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Batch ID</p>
                    <p className="text-white font-mono text-sm break-all">{scanResult.batchId}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-amber-500/20">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</p>
                    <p className="text-amber-400 text-sm font-medium">{scanResult.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Scanned By</p>
                      <p className="text-xs text-white font-bold">{user.username}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mode</p>
                      <p className="text-xs font-bold text-amber-400">⏳ Offline Queue</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setScanResult(null); setError(''); }}
                  className="mt-6 w-full py-3 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl font-bold transition-colors relative z-10"
                  id="btn-scan-next-offline"
                >
                  Scan Next Item
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
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Batch ID</p>
                    <p className="text-white font-mono text-sm break-all">{scanResult.batchId}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Message</p>
                    <p className="text-success text-sm font-medium">{scanResult.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Scanned By</p>
                      <p className="text-xs text-white font-bold">{user.username}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</p>
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

export default SyncBatch;
