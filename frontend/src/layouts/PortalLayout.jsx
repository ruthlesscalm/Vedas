import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, Cpu, Globe, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link to={to} onClick={onClick} className="relative group">
    <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-accent' : 'text-slate-400 group-hover:text-white'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
    </div>
    {active && (
      <motion.div 
        layoutId="nav-glow" 
        className="absolute -inset-x-4 -inset-y-2 bg-accent/10 rounded-xl -z-10 shadow-neon"
      />
    )}
  </Link>
);

const PortalLayout = ({ portalName, links }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen text-slate-50 selection:bg-accent/30 ${lowDataMode ? 'low-data' : ''}`}>
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-t-0 border-x-0 border-b-slate-700/50 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-accent/20 border border-accent/30 p-2 rounded-lg group-hover:shadow-neon transition-all">
                <Shield className="text-accent w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none text-white">VEDAS</span>
                <span className="text-[10px] text-accent font-bold tracking-wider uppercase">{portalName} Portal</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => (
                <NavItem 
                  key={link.to}
                  to={link.to} 
                  icon={link.icon} 
                  label={link.label} 
                  active={location.pathname === link.to} 
                />
              ))}
              
              <div className="h-6 w-px bg-slate-700"></div>
              
              <button 
                onClick={() => setLowDataMode(!lowDataMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                  lowDataMode 
                    ? 'bg-warning/20 text-warning border-warning/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${lowDataMode ? 'bg-warning animate-pulse' : 'bg-slate-500'}`}></div>
                {lowDataMode ? '2G MODE' : 'STD SYNC'}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-xl">
                    <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                      <User size={14} className="text-accent" />
                    </div>
                    <span className="text-xs font-bold text-white">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-danger transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-neon"
                >
                  <LogIn size={16} /> LOGIN
                </Link>
              )}
            </div>

            <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-6 pt-16"
          >
            {links.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                onClick={() => setIsMenuOpen(false)} 
                className={`text-2xl font-bold transition-colors ${location.pathname === link.to ? 'text-accent shadow-neon' : 'text-slate-300 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
            <button 
              onClick={() => { setLowDataMode(!lowDataMode); setIsMenuOpen(false); }}
              className={`px-6 py-3 rounded-xl border font-bold text-sm transition-all ${
                lowDataMode ? 'bg-warning/20 border-warning/50 text-warning shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              {lowDataMode ? 'DISABLE 2G MODE' : 'ENABLE 2G MODE'}
            </button>
            {user ? (
              <div className="flex flex-col items-center gap-6 mt-4">
                <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-6 py-3 rounded-2xl">
                  <User className="text-accent" size={20} />
                  <span className="font-bold text-white">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-danger font-bold text-lg"
                >
                  <LogOut size={20} /> LOGOUT
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="bg-accent text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-neon flex items-center gap-2"
              >
                <LogIn size={20} /> SIGN IN
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Sync Status Bar */}
      <div className="fixed bottom-0 left-0 w-full h-10 glass-panel border-t-slate-700/50 border-x-0 border-b-0 rounded-none flex items-center px-4 justify-between z-50 text-xs font-medium font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full shadow-neon animate-pulse-slow"></div>
          <span className="hidden sm:inline text-slate-300">System Online</span>
        </div>
        <div className="flex gap-6">
          <span className="flex items-center gap-1"><Cpu size={14} className="text-accent"/> IndexedDB Ready</span>
          <span className="hidden sm:flex items-center gap-1"><Globe size={14} className="text-accent"/> Node: Harohalli</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
             <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PortalLayout;

