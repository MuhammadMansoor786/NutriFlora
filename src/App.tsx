import React, { useState, useEffect, useCallback } from 'react';
import { MedicalDisclaimerBanner } from './components/MedicalDisclaimerBanner.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AiScanner } from './components/AiScanner.tsx';
import { ProduceGallery } from './components/ProduceGallery.tsx';
import { ProduceCompare } from './components/ProduceCompare.tsx';
import { SeasonalGuide } from './components/SeasonalGuide.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { ProduceDetailModal } from './components/ProduceDetailModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ToastContainer, type ToastMessage, type ToastType } from './components/ToastContainer.tsx';
import { api, getStoredToken } from './services/api.ts';
import type {
  ProduceItem,
  RecognitionResult,
  SavedBookmarkRecord,
  ScanHistoryEntry,
  UserProfile,
} from './types/produce.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'scanner' | 'gallery' | 'compare' | 'seasonal' | 'dashboard' | 'admin'
  >('home');
  const [produceList, setProduceList] = useState<ProduceItem[]>([]);
  const [selectedProduce, setSelectedProduce] = useState<ProduceItem | null>(null);
  const [compareItemA, setCompareItemA] = useState<ProduceItem | null>(null);
  const [compareItemB, setCompareItemB] = useState<ProduceItem | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nutriflora_user');
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        return parsed.dbId && getStoredToken() ? parsed : null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [savedBookmarks, setSavedBookmarks] = useState<SavedBookmarkRecord[]>([]);
  const [isFoodsLoading, setIsFoodsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [isBookmarksLoading, setIsBookmarksLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAuthenticated = Boolean(user?.dbId && getStoredToken());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshFoods = useCallback(async () => {
    setIsFoodsLoading(true);
    try {
      const foods = await api.getFoods();
      setProduceList(foods);
    } catch (err: any) {
      setProduceList([]);
      notify(err?.message || 'Failed to load food catalog.', 'error');
    } finally {
      setIsFoodsLoading(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const items = await api.getHistory({ limit: 50 });
      setHistory(items);
    } catch (err: any) {
      setHistory([]);
      notify(err?.message || 'Failed to load scan history.', 'error');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const refreshSavedBookmarks = useCallback(async () => {
    if (!getStoredToken() || !user?.dbId) {
      setSavedBookmarks([]);
      setIsBookmarksLoading(false);
      return;
    }
    setIsBookmarksLoading(true);
    try {
      const items = await api.getSavedItems();
      setSavedBookmarks(items);
    } catch (err: any) {
      setSavedBookmarks([]);
      notify(err?.message || 'Failed to load saved bookmarks.', 'error');
    } finally {
      setIsBookmarksLoading(false);
    }
  }, [user?.dbId, notify]);

  useEffect(() => {
    refreshFoods();
    refreshHistory();
  }, [refreshFoods, refreshHistory]);

  useEffect(() => {
    refreshSavedBookmarks();
  }, [refreshSavedBookmarks]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('nutriflora_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nutriflora_user');
      }
    } catch {
      // Local storage is only used to restore an authenticated profile.
    }
  }, [user]);

  const handleSaveHistory = (res: RecognitionResult) => {
    const newEntry: ScanHistoryEntry = {
      id: res.scanId ? `scan-${res.scanId}` : `scan-${Date.now()}`,
      dbId: res.scanId,
      timestamp: res.recognizedAt,
      produceName: res.item.name,
      scientificName: res.item.scientificName,
      urduName: res.item.urduName,
      category: res.item.category,
      confidence: res.confidence,
      imageUrl: res.item.imageUrl,
      itemData: res.item,
    };

    setHistory((prev) => [newEntry, ...prev.filter((h) => h.id !== newEntry.id).slice(0, 49)]);
  };

  const handleDeleteHistoryItem = async (dbId: number | undefined, localId: string) => {
    if (dbId) {
      try {
        await api.deleteHistory(dbId);
      } catch (err: any) {
        notify(err?.message || 'Failed to delete scan history record.', 'error');
        return;
      }
    } else {
      notify('This scan has no database record and cannot be deleted.', 'error');
      return;
    }
    setHistory((prev) => prev.filter((item) => item.id !== localId));
    notify('Scan history record deleted.', 'info');
  };

  const handleClearHistory = async () => {
    const dbIds = history.map((h) => h.dbId).filter((id): id is number => Boolean(id));
    try {
      await Promise.all(dbIds.map((id) => api.deleteHistory(id)));
      setHistory([]);
      notify('Scan history cleared.', 'info');
    } catch (err: any) {
      notify(err?.message || 'Failed to clear scan history.', 'error');
      await refreshHistory();
    }
  };

  const handleUpdateBookmarkNote = async (savedId: number, personalNote: string) => {
    const updated = await api.updateSavedNote(savedId, personalNote);
    setSavedBookmarks((prev) => prev.map((b) => (b.id === savedId ? updated : b)));
    notify('Personal dietary note updated.', 'success');
  };

  const handleDeleteBookmark = async (savedId: number) => {
    await api.deleteSavedItem(savedId);
    setSavedBookmarks((prev) => prev.filter((b) => b.id !== savedId));
    notify('Bookmark removed.', 'info');
  };

  const handleCompareWith = (item: ProduceItem) => {
    setCompareItemA(item);
    setActiveTab('compare');
    if (selectedProduce) setSelectedProduce(null);
  };

  const handleAddNewProduce = async (item: ProduceItem) => {
    const created = await api.createFood(item);
    setProduceList((prev) => [created, ...prev]);
    notify(`Added "${created.name}" to the food catalog.`, 'success');
  };

  const handleUpdateProduce = async (dbId: number, item: ProduceItem) => {
    const updated = await api.updateFood(dbId, item);
    setProduceList((prev) => prev.map((p) => (p.dbId === dbId ? updated : p)));
    notify(`Updated "${updated.name}" in the food catalog.`, 'success');
  };

  const handleDeleteProduce = async (dbId: number) => {
    await api.deleteFood(dbId);
    setProduceList((prev) => prev.filter((p) => p.dbId !== dbId));
    notify('Catalog item deleted.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#090D16] obsidian-ambient-bg text-slate-50 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <MedicalDisclaimerBanner />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        savedCount={savedBookmarks.length}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HeroSection
            onStartScanning={() => setActiveTab('scanner')}
            onExploreGallery={() => setActiveTab('gallery')}
            featuredProduce={produceList}
            isLoading={isFoodsLoading}
            onSelectProduce={(item) => setSelectedProduce(item)}
          />
        )}

        {activeTab === 'scanner' && (
          <AiScanner
            onSelectProduce={(item) => setSelectedProduce(item)}
            onSaveHistory={handleSaveHistory}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => setIsAuthOpen(true)}
            onBookmarkSaved={refreshSavedBookmarks}
            onNotify={notify}
          />
        )}

        {activeTab === 'gallery' && (
          <ProduceGallery
            items={produceList}
            isLoading={isFoodsLoading}
            onSelectProduce={(item) => setSelectedProduce(item)}
            onCompareWith={handleCompareWith}
          />
        )}

        {activeTab === 'compare' && (
          <ProduceCompare
            items={produceList}
            isLoading={isFoodsLoading}
            preselectedA={compareItemA}
            preselectedB={compareItemB}
            onSelectProduce={(item) => setSelectedProduce(item)}
          />
        )}

        {activeTab === 'seasonal' && (
          <SeasonalGuide
            onSelectProduce={(item) => setSelectedProduce(item)}
          />
        )}

        {activeTab === 'dashboard' && user && isAuthenticated && (
          <UserDashboard
            user={user}
            history={history}
            savedBookmarks={savedBookmarks}
            isAuthenticated={isAuthenticated}
            isLoadingBookmarks={isBookmarksLoading}
            isLoadingHistory={isHistoryLoading}
            onRequireAuth={() => setIsAuthOpen(true)}
            onSelectProduce={(item) => setSelectedProduce(item)}
            onUpdateBookmarkNote={handleUpdateBookmarkNote}
            onDeleteBookmark={handleDeleteBookmark}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onUpdatePreferences={(dietaryPreferences) => {
              setUser((prev) => (prev ? { ...prev, dietaryPreferences } : prev));
              notify('Dietary preferences saved.', 'success');
            }}
          />
        )}

        {activeTab === 'dashboard' && (!user || !isAuthenticated) && (
          <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-3">
            <h1 className="text-xl font-bold text-slate-100">Sign in to view saved records</h1>
            <p className="text-sm text-slate-400">Saved bookmarks and scan history are loaded from your MySQL account.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-sm font-bold rounded-xl"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            user={user}
            items={produceList}
            onAddNewProduce={handleAddNewProduce}
            onUpdateProduce={handleUpdateProduce}
            onDeleteProduce={handleDeleteProduce}
            onOpenAuth={() => setIsAuthOpen(true)}
            onNotify={notify}
          />
        )}
      </main>

      <ProduceDetailModal
        item={selectedProduce}
        onClose={() => setSelectedProduce(null)}
        onCompareWith={handleCompareWith}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={!isAuthenticated ? null : user}
        onLogin={(newUser) => {
          setUser(newUser);
          notify(`Welcome, ${newUser.name}!`, 'success');
        }}
        onLogout={() => {
          api.logout();
          setSavedBookmarks([]);
          setUser(null);
          notify('Signed out successfully.', 'info');
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="bg-[#060910]/90 backdrop-blur-xl text-slate-300 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 text-xs mt-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-50 font-bold text-base">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-lime-400 flex items-center justify-center text-slate-950 font-extrabold text-xs">
                  NF
                </div>
                NutriFlora AI
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                AI-based produce recognition with catalog and scan records stored in MySQL.
              </p>
              <p className="font-serif text-amber-300 text-xs">
                پھلوں اور سبزیوں کی نباتاتی شناخت اور غذائی معلومات کا باضابطہ نظام
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-3">
                Clinical Precautions
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>Glycemic Index & Diabetic Safety</li>
                <li>Chronic Kidney Disease (CKD) & Potassium</li>
                <li>Soluble Oxalates & Nephrolithiasis</li>
                <li>Warfarin (Coumadin) & Vitamin K Interactions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider mb-3">
                Multimodal AI Engine
              </h4>
              <p className="text-slate-400 leading-relaxed mb-3">
                Image recognition powered by Google Gemini Vision with MySQL-persisted scan history.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>
              © {new Date().getFullYear()} NutriFlora AI. Information is intended for nutritional planning and educational exploration. Not intended as medical diagnosis.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('scanner')} className="hover:text-orange-300 transition-colors">
                Scan Photo
              </button>
              <button onClick={() => setActiveTab('gallery')} className="hover:text-orange-300 transition-colors">
                Directory
              </button>
              <button onClick={() => setActiveTab('compare')} className="hover:text-orange-300 transition-colors">
                Compare
              </button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-lime-300 transition-colors">
                Curator Panel
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
