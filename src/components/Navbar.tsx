import React from 'react';
import { Camera, Apple, Layers, GitCompare, Calendar, User, ShieldCheck, Heart } from 'lucide-react';
import type { UserProfile } from '../types/produce.ts';

interface NavbarProps {
  activeTab: 'home' | 'scanner' | 'gallery' | 'compare' | 'seasonal' | 'dashboard' | 'admin';
  setActiveTab: (tab: 'home' | 'scanner' | 'gallery' | 'compare' | 'seasonal' | 'dashboard' | 'admin') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-lime-400 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Apple className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-50 tracking-tight">NutriFlora</span>
                <span className="bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  AI Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Fruit & Veggie Health Intelligence</p>
            </div>
          </button>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5 border border-transparent'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/25'
                  : 'text-orange-300 hover:text-orange-200 hover:bg-orange-500/10 border border-orange-500/25'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              AI Recognition
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              Food Directory
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5 border border-transparent'
              }`}
            >
              <GitCompare className="w-4 h-4 shrink-0" />
              Compare
            </button>
            <button
              onClick={() => setActiveTab('seasonal')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'seasonal'
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              Seasonal Guide
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              Saved{' '}
              {savedCount > 0 && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums font-bold">
                  {savedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-lime-500/15 text-lime-300 border border-lime-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Admin
            </button>
          </nav>

          {/* User Account Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 hover:border-orange-400/40 bg-slate-900/70 hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                {user ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden sm:inline max-w-[140px] truncate">{user ? user.name : 'Sign In'}</span>
            </button>

            {/* Mobile Scan CTA */}
            <button
              onClick={() => setActiveTab('scanner')}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/25"
              aria-label="Scan produce"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around border-t border-white/10 px-2 py-1.5 text-xs text-slate-400 bg-[#090D16]/90">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-2 py-1 rounded ${activeTab === 'home' ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-2 py-1 rounded ${activeTab === 'scanner' ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Scan
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-2 py-1 rounded ${activeTab === 'gallery' ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Directory
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-2 py-1 rounded ${activeTab === 'compare' ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('seasonal')}
          className={`px-2 py-1 rounded ${activeTab === 'seasonal' ? 'text-orange-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Season
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2 py-1 rounded ${activeTab === 'dashboard' ? 'text-rose-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Saved
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'text-lime-400 font-bold' : 'hover:text-slate-200'}`}
        >
          Admin
        </button>
      </div>
    </header>
  );
};
