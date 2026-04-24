import React, { useState } from 'react';
import { Package, ScanLine, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SealBatch from '../components/SealBatch';
import SyncBatch from '../components/SyncBatch';
import MyLogs from '../components/MyLogs';

const tabs = [
  { id: 'seal', label: 'Seal Batch', icon: Package, activeClass: 'bg-accent text-white shadow-neon' },
  { id: 'sync', label: 'Sync Batch', icon: ScanLine, activeClass: 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' },
  { id: 'logs', label: 'My Logs', icon: ScrollText, activeClass: 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('seal');

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="glass-panel inline-flex rounded-2xl p-1.5 gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-all ${
                activeTab === tab.id ? tab.activeClass : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id={`tab-${tab.id}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'seal' && <SealBatch />}
          {activeTab === 'sync' && <SyncBatch />}
          {activeTab === 'logs' && <MyLogs />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
