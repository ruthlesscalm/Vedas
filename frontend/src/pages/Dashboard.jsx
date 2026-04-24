import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Package, MapPin, Send, ShieldCheck, ShieldAlert, ScanLine, CheckCircle2,
  AlertCircle, Loader2, Box, Scale, ArrowRight, Trash2, Copy, QrCode, Camera,
  Download, ImagePlus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
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
  const [copyingBatchId, setCopyingBatchId] = useState(false);
  const [copyingHash, setCopyingHash] = useState(false);
  const qrRef = useRef(null);

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
        setResult({ batchId, originHash, sealedAt: timeStamp });
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
    setCopyingBatchId(true);
    setTimeout(() => setCopyingBatchId(false), 2000);
  };

  const copyHash = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.originHash);
    setCopyingHash(true);
    setTimeout(() => setCopyingHash(false), 2000);
  };

  const downloadPDF = () => {
    if (!result || !qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const qrDataUrl = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Title
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VEDAS', pageWidth / 2, 22, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text('Verified Ecosystem for Decentralized Asset Security', pageWidth / 2, 32, { align: 'center' });
    pdf.text('BATCH SEAL CERTIFICATE', pageWidth / 2, 42, { align: 'center' });

    // QR Code
    const qrSize = 60;
    const qrX = (pageWidth - qrSize) / 2;
    pdf.addImage(qrDataUrl, 'PNG', qrX, 60, qrSize, qrSize);

    // Batch ID
    let y = 132;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BATCH ID', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('courier', 'normal');
    pdf.text(result.batchId, 20, y);

    // SHA-256 Hash
    y += 14;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SHA-256 ORIGIN HASH', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    // Break hash into two lines if needed
    const hash = result.originHash;
    if (hash.length > 50) {
      pdf.text(hash.substring(0, 50), 20, y);
      y += 5;
      pdf.text(hash.substring(50), 20, y);
    } else {
      pdf.text(hash, 20, y);
    }

    // Date of Sealing
    y += 14;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATE OF SEALING', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('courier', 'normal');
    const sealDate = new Date(result.sealedAt);
    pdf.text(sealDate.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }), 20, y);

    // Producer
    y += 14;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRODUCER', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('courier', 'normal');
    pdf.text(user.username, 20, y);

    // Footer
    y += 20;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(20, y, pageWidth - 20, y);
    y += 8;
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This document certifies the cryptographic seal of the above batch.', pageWidth / 2, y, { align: 'center' });
    y += 5;
    pdf.text('Verify integrity by comparing the SHA-256 hash with the original data.', pageWidth / 2, y, { align: 'center' });

    pdf.save(`VEDAS-Batch-${result.batchId.slice(0, 8)}.pdf`);
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
          <div ref={qrRef} className="bg-white p-6 rounded-2xl flex justify-center items-center shadow-inner mb-4 relative z-10 max-w-[280px] mx-auto">
            <QRCodeCanvas
              value={result.batchId}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Download PDF Button */}
          <button
            onClick={downloadPDF}
            className="w-full mb-6 py-3 bg-accent/20 text-accent hover:bg-accent hover:text-white rounded-xl font-bold transition-colors relative z-10 flex items-center justify-center gap-2 text-sm tracking-wider uppercase"
            id="btn-download-pdf"
          >
            <Download size={18} /> Download QR Code
          </button>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Batch ID</p>
                <button
                  onClick={copyBatchId}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    copyingBatchId
                      ? 'bg-accent/20 text-accent'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  id="btn-copy-batchid"
                >
                  {copyingBatchId ? 'COPIED!' : <><Copy size={12} /> COPY</>}
                </button>
              </div>
              <p className="text-xs font-mono text-accent break-all">{result.batchId}</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">SHA-256 Cryptographic Hash</p>
                <button
                  onClick={copyHash}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                    copyingHash
                      ? 'bg-accent/20 text-accent'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  id="btn-copy-hash"
                >
                  {copyingHash ? 'COPIED!' : <><Copy size={12} /> COPY</>}
                </button>
              </div>
              <p className="text-xs font-mono text-success break-all">{result.originHash}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                <p className="text-sm font-bold text-success">Sealed</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Producer</p>
                <p className="text-sm font-bold text-white truncate">{user.username}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sealed</p>
                <p className="text-xs font-bold text-white">{new Date(result.sealedAt).toLocaleDateString()}</p>
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
// Uses Html5Qrcode directly (not Html5QrcodeScanner) for full control over
// camera vs image-upload modes and clean start/stop.
// ═════════════════════════════════════════════════════════════════════════════
const SyncBatchTab = () => {
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

    // Validate UUID format — VEDAS batch IDs are generated via crypto.randomUUID()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(batchId)) {
      setScanResult({
        status: 'error',
        batchId,
        message: 'Invalid QR Code — this is not a VEDAS registered batch.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const location = await getLocation();
      const scannedBy = user.username;
      const timeStamp = new Date().toISOString();

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

      if (res.data.success && res.data.message && res.data.message.includes('Synced 0')) {
        // Backend returns success but synced 0 logs — batch not found in DB
        setScanResult({
          status: 'error',
          batchId,
          message: 'Batch not found in the ledger. This QR code does not match any sealed batch.',
        });
      } else if (res.data.success) {
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
  }, [user]);

  const stopCamera = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const state = html5QrRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await html5QrRef.current.stop();
        }
      } catch {
        // ignore
      }
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setScanResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Small delay to ensure DOM is ready
      await new Promise((r) => setTimeout(r, 150));

      const el = document.getElementById('qr-reader');
      if (!el) {
        setScanning(false);
        return;
      }

      // Clear any leftover content
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
        () => {} // ignore scan errors
      );
    } catch (err) {
      setError('Camera access denied or not available. Try uploading an image instead.');
      setScanning(false);
    }
  }, [stopCamera, processScan]);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop camera if running
    await stopCamera();
    setError('');
    setScanResult(null);
    setSubmitting(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Use a separate hidden element for file scanning since the main
      // qr-reader div gets unmounted when camera state is false
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
    } catch (err) {
      setError('Could not read QR code from image. Make sure the image contains a valid QR code.');
      setSubmitting(false);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stopCamera, processScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          const state = html5QrRef.current.getState();
          if (state === 2) {
            html5QrRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
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

          {/* Hidden file input for image upload */}
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
              <p className="text-slate-400 text-sm mb-6 text-center">
                Use camera or upload a QR code image
              </p>
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
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden border-2 border-slate-700/50"
                style={{ minHeight: '280px' }}
              ></div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                  id="btn-stop-scanner"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-2.5 text-sm text-accent hover:text-white border border-accent/30 hover:bg-accent/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                  id="btn-upload-while-scanning"
                >
                  <ImagePlus size={16} /> Upload Image
                </button>
              </div>
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
