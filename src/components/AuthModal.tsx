import React, { useState } from 'react';
import { X, User, Lock, Mail, Apple, AlertCircle, Loader2 } from 'lucide-react';
import type { UserProfile } from '../types/produce.ts';
import { api } from '../services/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toUserProfile = (authUser: {
    id: number;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
  }): UserProfile => ({
    id: `usr-${authUser.id}`,
    dbId: authUser.id,
    name: authUser.full_name,
    email: authUser.email,
    role: authUser.role,
    dietaryPreferences: currentUser?.dietaryPreferences || {
      diabeticFriendlyOnly: false,
      lowPotassiumMode: false,
      highFiberFocus: false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (isRegister && !name.trim()) {
      setError('Full name is required to register.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = isRegister
        ? await api.register(name.trim(), email.trim(), password)
        : await api.login(email.trim(), password);

      onLogin(toUserProfile(response.user));
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05080F]/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/15 p-6 space-y-5 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-lime-400 text-slate-950 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Apple className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-50">
            {currentUser ? 'Your Profile Account' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400">
            {currentUser
              ? 'Manage your scan records and health bookmarks'
              : 'Sign in to save recognition history and bookmarks'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/35 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/10 space-y-1.5">
              <span className="text-slate-400 font-medium block">Signed in as:</span>
              <p className="text-sm font-bold text-slate-50">{currentUser.name}</p>
              <p className="text-slate-400">{currentUser.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-lime-500/15 text-lime-300 border border-lime-500/30">
                {currentUser.role}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  api.logout();
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold rounded-xl transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegister && (
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Sara Khan"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/15 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold block mb-1 text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/15 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/15 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-orange-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegister ? 'Register & Continue' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsRegister(!isRegister);
                }}
                className="text-slate-400 hover:text-orange-300 transition-colors"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up free"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
