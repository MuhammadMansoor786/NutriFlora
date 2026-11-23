import React, { useState } from 'react';
import {
  History,
  Sliders,
  Trash2,
  ChevronRight,
  Bookmark,
  Pencil,
  Check,
  X,
  LogIn,
  Loader2,
} from 'lucide-react';
import type { ProduceItem, SavedBookmarkRecord, ScanHistoryEntry, UserProfile } from '../types/produce.ts';

interface UserDashboardProps {
  user: UserProfile;
  history: ScanHistoryEntry[];
  savedBookmarks: SavedBookmarkRecord[];
  isAuthenticated: boolean;
  isLoadingBookmarks?: boolean;
  isLoadingHistory?: boolean;
  onRequireAuth: () => void;
  onSelectProduce: (item: ProduceItem) => void;
  onUpdateBookmarkNote: (savedId: number, personalNote: string) => Promise<void>;
  onDeleteBookmark: (savedId: number) => Promise<void>;
  onDeleteHistoryItem: (dbId: number | undefined, localId: string) => Promise<void>;
  onClearHistory: () => void;
  onUpdatePreferences: (prefs: UserProfile['dietaryPreferences']) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  history,
  savedBookmarks,
  isAuthenticated,
  isLoadingBookmarks = false,
  isLoadingHistory = false,
  onRequireAuth,
  onSelectProduce,
  onUpdateBookmarkNote,
  onDeleteBookmark,
  onDeleteHistoryItem,
  onClearHistory,
  onUpdatePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'preferences'>('saved');
  const [editingBookmarkId, setEditingBookmarkId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const startEditingNote = (bookmark: SavedBookmarkRecord) => {
    setActionError(null);
    setEditingBookmarkId(bookmark.id);
    setNoteDraft(bookmark.personalNote || '');
  };

  const handleSaveNote = async (savedId: number) => {
    setActionError(null);
    setSavingNoteId(savedId);
    try {
      await onUpdateBookmarkNote(savedId, noteDraft.trim());
      setEditingBookmarkId(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update bookmark note.');
    } finally {
      setSavingNoteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-lime-400 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-orange-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-50">{user.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 border border-white/15 text-slate-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-center">
          <div className="bg-slate-950/65 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-medium uppercase block">Saved Items</span>
            <span className="text-lg font-bold font-mono tabular-nums text-rose-400">{savedBookmarks.length}</span>
          </div>
          <div className="bg-slate-950/65 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-medium uppercase block">Scans Run</span>
            <span className="text-lg font-bold font-mono tabular-nums text-lime-400">{history.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('saved')}
          className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'saved'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-slate-50'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Bookmarks ({savedBookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          Recognition Scan History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'preferences'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Health Preferences
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} aria-label="Dismiss message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: DATABASE SAVED BOOKMARKS */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {/* Cloud / DB Scan Bookmarks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-orange-400" />
                Saved AI Scan Bookmarks ({savedBookmarks.length})
              </h2>
              {!isAuthenticated && (
                <button
                  onClick={onRequireAuth}
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In to Sync Bookmarks
                </button>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="p-5 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-100 text-sm">Sign in to manage persistent scan bookmarks & notes</p>
                  <p className="text-slate-400 mt-0.5">
                    Bookmark AI recognition scans with personal dietary notes stored in the database.
                  </p>
                </div>
                <button
                  onClick={onRequireAuth}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 font-semibold rounded-xl shrink-0"
                >
                  Sign In / Register
                </button>
              </div>
            ) : isLoadingBookmarks ? (
              <div className="text-center py-10 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Loading your saved bookmarks...</p>
              </div>
            ) : savedBookmarks.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
                <Bookmark className="w-7 h-7 text-slate-500 mx-auto" />
                <p className="font-bold text-slate-100 text-sm">No records found in database yet</p>
                <p className="text-xs text-slate-400">
                  Scan any produce photo in AI Recognition and click "Bookmark Result" to save it with personal notes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg space-y-3 hover:border-orange-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => onSelectProduce(bookmark.itemData)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                          <img
                            src={bookmark.itemData.imageUrl}
                            alt={bookmark.itemName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-100 hover:text-orange-300 truncate">
                            {bookmark.itemName}
                          </h4>
                          <p className="text-xs italic font-serif text-slate-400 truncate">
                            {bookmark.scientificName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono tabular-nums">
                            <span className="px-1.5 py-0.5 rounded bg-lime-500/15 text-lime-300 border border-lime-500/30 font-bold">
                              {bookmark.confidenceScore}% match
                            </span>
                            <span>{bookmark.itemData.nutritionPer100g.calories} kcal / 100g</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditingNote(bookmark)}
                          className="p-1.5 text-slate-400 hover:text-orange-300 rounded-lg transition-colors"
                          title="Edit personal note"
                          aria-label={`Edit note for ${bookmark.itemName}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteBookmark(bookmark.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete bookmark"
                          aria-label={`Delete bookmark ${bookmark.itemName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {editingBookmarkId === bookmark.id ? (
                      <div className="flex gap-2 items-center pt-1">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Write personal dietary note..."
                          className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                        />
                        <button
                          type="button"
                          disabled={savingNoteId === bookmark.id}
                          onClick={() => handleSaveNote(bookmark.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBookmarkId(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                          aria-label="Cancel note edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/10 text-xs text-slate-300">
                        <span className="font-semibold text-slate-400">Note: </span>
                        {bookmark.personalNote ? (
                          <span>{bookmark.personalNote}</span>
                        ) : (
                          <span className="italic text-slate-500">No personal note added yet.</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: RECOGNITION SCAN HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Recent camera and photo uploads persisted in scan_history
            </span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          {isLoadingHistory && history.length === 0 ? (
            <div className="text-center py-14 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Loading recognition scan history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
              <History className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-bold text-slate-100 text-sm">No records found in database yet</p>
              <p className="text-xs text-slate-400">
                Go to the AI Recognition tab to scan your first fruit or vegetable photo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onSelectProduce(record.itemData)}
                  className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-orange-400/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                      <img
                        src={record.imageUrl}
                        alt={record.produceName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-orange-300">
                          {record.produceName}
                        </h4>
                        <span className="text-xs font-serif text-amber-300">{record.urduName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-lime-500/15 text-lime-300 border border-lime-500/30">
                          {record.confidence}% match
                        </span>
                      </div>
                      <p className="text-xs italic text-slate-400 font-serif">
                        {record.scientificName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
                    <span className="font-mono tabular-nums">
                      {new Date(record.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-orange-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                      Review <ChevronRight className="w-4 h-4" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistoryItem(record.dbId, record.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete scan record"
                      aria-label={`Delete scan ${record.produceName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DIETARY PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Personal Health Flags & Filtering Profile</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize warning highlights to prioritize produce safe for your specific nutritional needs.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-950/55 hover:border-orange-400/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={user.dietaryPreferences.diabeticFriendlyOnly}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...user.dietaryPreferences,
                    diabeticFriendlyOnly: e.target.checked,
                  })
                }
                className="mt-0.5 rounded accent-orange-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-100 block">Diabetic-Safe Priority Filter</span>
                <span className="text-slate-400">
                  Automatically flags high-sugar tropical fruits and emphasizes Low Glycemic Index (GI ≤ 55) produce.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-950/55 hover:border-orange-400/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={user.dietaryPreferences.lowPotassiumMode}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...user.dietaryPreferences,
                    lowPotassiumMode: e.target.checked,
                  })
                }
                className="mt-0.5 rounded accent-orange-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-100 block">Low Potassium (Renal Care Mode)</span>
                <span className="text-slate-400">
                  Highlights catalog records with less than 200mg potassium per 100g.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-950/55 hover:border-orange-400/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={user.dietaryPreferences.highFiberFocus}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...user.dietaryPreferences,
                    highFiberFocus: e.target.checked,
                  })
                }
                className="mt-0.5 rounded accent-orange-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-100 block">High Dietary Fiber Goal</span>
                <span className="text-slate-400">
                  Prioritizes produce with over 3g of soluble and insoluble fiber for optimal gut microbiome health.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
