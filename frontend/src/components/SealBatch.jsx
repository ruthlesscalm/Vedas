import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Package, MapPin, ShieldCheck, AlertCircle, Box, Scale,
  ArrowRight, Trash2, Copy, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { sha256 } from '../utils/crypto';
import { getLocation } from '../utils/geolocation';

const SealBatch = () => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(1);
  const [items, setItems] = useState([{ name: '', weight: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copyingBatchId, setCopyingBatchId] = useState(false);
  const [copyingHash, setCopyingHash] = useState(false);
  const qrRef = useRef(null);

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
      setError(err.response?.data?.message || err.message || 'Failed to seal batch');
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

    const qrSize = 60;
    pdf.addImage(qrDataUrl, 'PNG', (pageWidth - qrSize) / 2, 60, qrSize, qrSize);

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

    y += 14;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SHA-256 ORIGIN HASH', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    const hash = result.originHash;
    if (hash.length > 50) {
      pdf.text(hash.substring(0, 50), 20, y);
      y += 5;
      pdf.text(hash.substring(50), 20, y);
    } else {
      pdf.text(hash, 20, y);
    }

    y += 14;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATE OF SEALING', 20, y);
    y += 7;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('courier', 'normal');
    pdf.text(new Date(result.sealedAt).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }), 20, y);

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

          <div ref={qrRef} className="bg-white p-6 rounded-2xl flex justify-center items-center shadow-inner mb-4 relative z-10 max-w-[280px] mx-auto">
            <QRCodeCanvas value={result.batchId} size={200} level="H" includeMargin={true} />
          </div>

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
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${copyingBatchId ? 'bg-accent/20 text-accent' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
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
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${copyingHash ? 'bg-accent/20 text-accent' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
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
          <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">SHA-256</strong>{' '}
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
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Number of Items</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:shadow-neon transition-all appearance-none cursor-pointer"
                id="select-item-count"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} item{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Details</label>
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

export default SealBatch;
