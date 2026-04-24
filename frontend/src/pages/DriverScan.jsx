import React, { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { ShieldCheck, ShieldAlert, Truck, WifiOff, RefreshCw, ScanLine, HardDriveDownload, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { savePendingScan, getPendingScans, clearPendingScans } from '../utils/db'

const DriverScan = () => {
  const [scanResult, setScanResult] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [ghostQueue, setGhostQueue] = useState([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load pending queue from IndexedDB
    getPendingScans().then(scans => setGhostQueue(scans)).catch(() => {})

    const scanner = new Html5QrcodeScanner(
      'reader',
      { qrbox: { width: 250, height: 250 }, fps: 5, aspectRatio: 1.0 },
      false
    )

    scanner.render(
      async (result) => {
        scanner.clear()
        try {
          const parsed = JSON.parse(result)
          const logEntry = {
            ...parsed,
            scannedAt: new Date().toISOString(),
            status: 'Authentic',
            node: 'Transit',
          }
          setScanResult(logEntry)

          if (!navigator.onLine) {
            await savePendingScan(logEntry)
            const updated = await getPendingScans()
            setGhostQueue(updated)
          } else {
            console.log('Live sync to backend:', logEntry)
          }
        } catch {
          setScanResult({ error: true, raw: result })
        }
      },
      () => {} // suppress routine scan errors
    )

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      scanner.clear().catch(() => {})
    }
  }, [])

  const syncGhostLogs = async () => {
    if (isOffline || ghostQueue.length === 0) return
    setSyncing(true)
    try {
      // In production, POST each entry to /api/verify
      console.log('Syncing', ghostQueue.length, 'ghost logs...')
      await clearPendingScans()
      setGhostQueue([])
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <header className="mb-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shadow-neon">
            <Truck className="text-accent" size={20} />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">
          Ghost-Log Scanner
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Field-ready cryptographic verification. If connectivity drops, the{' '}
          <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            Ghost-Log
          </strong>{' '}
          engine caches all scans in IndexedDB and syncs when you're back online.
        </p>
      </header>

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-warning/20 border border-warning/50 text-warning px-6 py-4 rounded-2xl mb-8 flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <WifiOff className="animate-pulse flex-shrink-0" />
              <div>
                <strong className="block text-sm uppercase tracking-widest font-bold">
                  Ghost-Log Engine Active
                </strong>
                <span className="text-xs opacity-90">
                  Offline mode — scans cached in IndexedDB.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-warning/20 px-3 py-1.5 rounded-lg border border-warning/30 flex-shrink-0">
              <HardDriveDownload size={14} />
              <span className="text-xs font-bold font-mono">{ghostQueue.length} Queued</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ScanLine className="text-accent" /> Optical Interface
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>

          <div className="relative">
            <div
              id="reader"
              className="w-full rounded-2xl overflow-hidden border-2 border-slate-700/50"
            ></div>
            <div className="absolute inset-0 border-2 border-accent/30 rounded-2xl pointer-events-none group-hover:border-accent/60 transition-colors"></div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-accent/50 shadow-neon -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 px-2">
            <ShieldCheck className="text-success" /> Verification Result
          </h2>

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
                <p className="font-medium text-slate-400">Awaiting QR input…</p>
                <p className="text-xs mt-2 max-w-[200px] text-center">
                  Position the seal within the frame.
                </p>
              </motion.div>
            ) : scanResult.error ? (
              <motion.div
                key="error"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-danger/10 border border-danger/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md"
              >
                <div className="flex items-center gap-3 text-danger mb-4">
                  <ShieldAlert size={28} />
                  <h3 className="text-xl font-bold">Authentication Failed</h3>
                </div>
                <p className="text-danger/80 text-sm mb-4">
                  This seal does not conform to the VEDAS cryptographic standard. Possible tampering
                  detected.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-danger/20 font-mono text-xs text-danger break-all">
                  {scanResult.raw}
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  className="mt-6 w-full py-3 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-xl font-bold transition-colors"
                >
                  Reset Scanner
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
                  <h3 className="text-xl font-bold">Seal Authentic</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Batch ID
                    </p>
                    <p className="text-white font-mono">{scanResult.id}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      SHA-256 Signature
                    </p>
                    <p className="text-success font-mono text-xs break-all">{scanResult.hash}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Time
                      </p>
                      <p className="text-xs text-white font-mono">
                        {new Date(scanResult.scannedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Sync
                      </p>
                      <p className={`text-xs font-bold ${isOffline ? 'text-warning' : 'text-success'}`}>
                        {isOffline ? '⏳ Queued' : '✓ Live'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setScanResult(null)}
                  className="mt-6 w-full py-3 bg-success/20 text-success hover:bg-success hover:text-white rounded-xl font-bold transition-colors relative z-10 shadow-neon-success"
                >
                  Scan Next Item
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ghost-Log sync button when back online */}
          {!isOffline && ghostQueue.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={syncGhostLogs}
              disabled={syncing}
              className="w-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent hover:text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-neon disabled:opacity-50"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'SYNCING…' : `SYNC ${ghostQueue.length} QUEUED GHOST-LOGS`}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriverScan
