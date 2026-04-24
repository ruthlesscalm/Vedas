import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-slate-50 selection:bg-accent/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-t-0 border-x-0 border-b-slate-700/50 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group">
              <div className="bg-accent/20 border border-accent/30 p-2 rounded-lg group-hover:shadow-neon transition-all">
                <Shield className="text-accent w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none text-white">VEDAS</span>
                <span className="text-[10px] text-accent font-bold tracking-wider uppercase">Secure Logistics</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <User size={14} className="text-accent" />
                </div>
                <span className="text-xs font-bold text-white">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-danger transition-colors"
                title="Logout"
                id="btn-logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
