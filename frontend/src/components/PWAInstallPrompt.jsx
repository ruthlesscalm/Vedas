import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed this session
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;

    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so it doesn't pop immediately on page load
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  if (dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
        id="pwa-install-prompt"
      >
        <div className="bg-slate-800/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(99,102,241,0.15)]">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            aria-label="Dismiss"
            id="btn-dismiss-pwa"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <Smartphone size={20} className="text-indigo-400" />
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-0.5">Install VEDAS App</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Add to your home screen for instant access, offline scanning, and a native app experience.
              </p>

              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold tracking-widest uppercase px-4 py-2.5 rounded-xl transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                id="btn-install-pwa"
              >
                <Download size={14} />
                Install
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
