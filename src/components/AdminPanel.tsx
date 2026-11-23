import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Layers,
  X,
  Activity,
  Lock,
  AlertCircle,
  Database,
  Loader2,
} from 'lucide-react';
import type { ProduceItem, AdminDashboardStats, UserProfile } from '../types/produce.ts';
import { api } from '../services/api.ts';

interface AdminPanelProps {
  user: UserProfile | null;
  items: ProduceItem[];
  onAddNewProduce: (item: ProduceItem) => Promise<void>;
  onUpdateProduce: (dbId: number, item: ProduceItem) => Promise<void>;
  onDeleteProduce: (dbId: number) => Promise<void>;
  onOpenAuth: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const createEmptyForm = (): Partial<ProduceItem> => ({
  name: '',
  scientificName: '',
  urduName: '',
  category: undefined,
  subCategory: '',
  family: '',
  imageUrl: '',
  origin: '',
  climate: '',
  growingSeason: [],
  cultivationRegions: [],
  varieties: [],
  description: '',
  nutritionPer100g: {
    calories: 0,
    waterPercent: 0,
    carbsG: 0,
    sugarsG: 0,
    fiberG: 0,
    proteinG: 0,
    fatG: 0,
    vitaminC_mg: 0,
    vitaminA_mcg: 0,
    vitaminK_mcg: 0,
    potassium_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    magnesium_mg: 0,
    folate_mcg: 0,
  },
  precautions: {
    diabetes: {
      glycemicIndex: 0,
      category: '',
      suitability: '',
      advice: '',
    },
    kidneyDisease: {
      potassiumTier: '',
      oxalateLevel: '',
      advice: '',
    },
    hypertension: {
      advice: '',
    },
    allergiesAndInteractions: [],
    contraindications: [],
  },
  healthBenefits: [],
  recommendedServing: '',
  culinaryUses: [],
  storageTips: '',
  sources: [],
});

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  items,
  onAddNewProduce,
  onUpdateProduce,
  onDeleteProduce,
  onOpenAuth,
  onNotify,
}) => {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalScans: 0,
    totalCatalogItems: 0,
    recentScans: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dbMode, setDbMode] = useState<'mysql' | 'offline' | 'checking'>('checking');
  const [dbName, setDbName] = useState<string>('fruit_veg_health_db');
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProduceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Partial<ProduceItem>>(createEmptyForm());

  const isAdmin = user?.role === 'admin' && Boolean(user.dbId);

  const fetchHealth = async () => {
    try {
      const h = await api.getHealth();
      setDbMode(h.dbMode);
      if (h.database) setDbName(h.database);
    } catch {
      setDbMode('offline');
    }
  };

  const fetchStats = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([api.getAdminStats(), fetchHealth()]);
      setStats({
        totalUsers: data.totalUsers,
        totalScans: data.totalScans,
        totalCatalogItems: data.totalCatalogItems,
        recentScans: data.recentScans,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void fetchStats();
    }
  }, [isAdmin, items.length]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormState(createEmptyForm());
    setShowFormModal(true);
  };

  const openEditModal = (item: ProduceItem) => {
    setEditingItem(item);
    setFormState({
      ...item,
      nutritionPer100g: { ...item.nutritionPer100g },
      precautions: { ...item.precautions },
    });
    setShowFormModal(true);
  };

  const handleSaveProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.scientificName || !formState.category) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const id =
        editingItem?.id ||
        formState.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const completeItem: ProduceItem = {
        ...(createEmptyForm() as ProduceItem),
        ...(formState as ProduceItem),
        id,
        dbId: editingItem?.dbId,
      };

      if (editingItem?.dbId) {
        await onUpdateProduce(editingItem.dbId, completeItem);
      } else {
        await onAddNewProduce(completeItem);
      }
      setShowFormModal(false);
      await fetchStats();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save produce record.';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRow = async (item: ProduceItem) => {
    setError(null);
    try {
      if (item.dbId === undefined) throw new Error('Catalog record has no database id.');
      await onDeleteProduce(item.dbId);
      await fetchStats();
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete produce record.';
      setError(msg);
      onNotify?.(msg, 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">
              Curator & Admin Management
            </h1>
            <span className="bg-slate-900 text-slate-200 border border-white/15 text-xs px-2.5 py-0.5 rounded-full font-mono">
              v1.2.0
            </span>
            {dbMode === 'mysql' ? (
              <span
                data-testid="db-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-lime-500/15 text-lime-300 border border-lime-500/35"
              >
                <span className="w-2 h-2 rounded-full bg-lime-400" />
                <Database className="w-3.5 h-3.5" />
                MySQL Connected ({dbName})
              </span>
            ) : dbMode === 'offline' ? (
              <span
                data-testid="db-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <Database className="w-3.5 h-3.5" />
                MySQL Offline
              </span>
            ) : (
              <span
                data-testid="db-status-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-white/15"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking Database...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit AI recognition scan logs, review system metrics, and manage             Review MySQL scan records and manage the food catalog.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void fetchStats();
                onNotify?.('Refreshed admin metrics and database status.', 'info');
              }}
              className="p-2 border border-white/15 bg-slate-900/80 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
              title="Refresh statistics"
              aria-label="Refresh statistics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Produce Record
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/35 rounded-xl text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Authentication Gate */}
      {!isAdmin ? (
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-50">Administrator Authentication Required</h2>
            <p className="text-xs text-slate-400">
              Sign in with an administrator account to access system metrics, inspect scan_history logs, and add, edit, or delete catalog records.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-orange-500/20"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium">Registered Users</span>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-50">{stats.totalUsers}</p>
              <span className="text-[11px] text-slate-400">Active accounts</span>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Scan History Logs</span>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-orange-400">{stats.totalScans}</p>
              <span className="text-[11px] text-slate-400">Stored in MySQL</span>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium">Food Catalog Items</span>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-50">{stats.totalCatalogItems}</p>
              <span className="text-[11px] text-slate-400">Database records</span>
            </div>
          </div>

          {/* Produce Database Table */}
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                Verified Botanical & Nutrition Records ({items.length})
              </h3>
            </div>

            {isLoading && (
              <div className="p-3 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synchronizing catalog & scan metrics...
              </div>
            )}

            {items.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Layers className="w-7 h-7 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-100">No records found in database yet</p>
                <p className="text-xs text-slate-400">
                  Use "Add Produce Record" above to insert a verified fruit or vegetable entry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase font-bold text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Produce</th>
                      <th className="py-3 px-4">Urdu Name</th>
                      <th className="py-3 px-4">Scientific Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Season</th>
                      <th className="py-3 px-4">Calories</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {items.map((item) => (
                      <tr key={`${item.dbId ?? item.id}-${item.name}`} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/10"
                          />
                          {item.name}
                        </td>
                        <td className="py-3 px-4 font-serif text-amber-300 text-sm">{item.urduName}</td>
                        <td className="py-3 px-4 italic font-serif text-slate-400">{item.scientificName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-slate-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{item.growingSeason.join(', ')}</td>
                        <td className="py-3 px-4 font-mono tabular-nums font-medium text-lime-300">
                          {item.nutritionPer100g.calories} kcal
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-orange-300 rounded transition-colors mr-1"
                            title="Edit record"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete record"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Scan History Logs */}
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              Recent AI Scan History Logs ({stats.recentScans.length})
            </h3>

            {stats.recentScans.length === 0 ? (
              <p className="text-xs text-slate-400">No scans have been logged in scan_history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase font-bold text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Scan #</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Scientific Name</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {stats.recentScans.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">#{log.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-100">{log.item_name}</td>
                        <td className="py-2.5 px-3">{log.category}</td>
                        <td className="py-2.5 px-3 italic font-serif text-slate-400">{log.scientific_name || '—'}</td>
                        <td className="py-2.5 px-3 font-semibold font-mono tabular-nums text-lime-400">{log.confidence_score}%</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono tabular-nums">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

      {/* Add / Edit Produce Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05080F]/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 p-6 space-y-4 my-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-slate-50">
                {editingItem ? `Edit ${editingItem.name}` : 'Add New Produce Record'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduce} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Common English Name</label>
                <input
                  type="text"
                  required
                  value={formState.name || ''}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="Enter common name"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Scientific Botanical Name</label>
                  <input
                    type="text"
                    required
                    value={formState.scientificName || ''}
                    onChange={(e) => setFormState({ ...formState, scientificName: e.target.value })}
                    placeholder="Enter scientific name"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Urdu Name</label>
                  <input
                    type="text"
                    required
                    value={formState.urduName || ''}
                    onChange={(e) => setFormState({ ...formState, urduName: e.target.value })}
                    placeholder="Enter Urdu name"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs font-serif text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={formState.category || ''}
                    onChange={(e: any) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/90 border border-white/15 rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:border-orange-400/60"
                  >
                    <option value="" className="bg-slate-900 text-slate-100">Select category</option>
                    <option value="fruit" className="bg-slate-900 text-slate-100">Fruit</option>
                    <option value="vegetable" className="bg-slate-900 text-slate-100">Vegetable</option>
                    <option value="herb" className="bg-slate-900 text-slate-100">Herb</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Season</label>
                  <select
                    value={formState.growingSeason?.[0] || ''}
                    onChange={(e) =>
                      setFormState({ ...formState, growingSeason: [e.target.value as any] })
                    }
                    className="w-full px-3 py-2 bg-slate-950/90 border border-white/15 rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:border-orange-400/60"
                  >
                    <option value="" className="bg-slate-900 text-slate-100">Select season</option>
                    <option value="Year-round" className="bg-slate-900 text-slate-100">Year-round</option>
                    <option value="Spring" className="bg-slate-900 text-slate-100">Spring</option>
                    <option value="Summer" className="bg-slate-900 text-slate-100">Summer</option>
                    <option value="Autumn" className="bg-slate-900 text-slate-100">Autumn</option>
                    <option value="Winter" className="bg-slate-900 text-slate-100">Winter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Geographical Origin</label>
                  <input
                    type="text"
                    value={formState.origin || ''}
                    onChange={(e) => setFormState({ ...formState, origin: e.target.value })}
                    placeholder="Enter geographical origin"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Botanical Family</label>
                  <input
                    type="text"
                    value={formState.family || ''}
                    onChange={(e) => setFormState({ ...formState, family: e.target.value })}
                    placeholder="Enter botanical family"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Calories (100g)</label>
                  <input
                    type="number"
                    value={formState.nutritionPer100g?.calories ?? 0}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        nutritionPer100g: {
                          ...formState.nutritionPer100g!,
                          calories: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.nutritionPer100g?.fiberG ?? 0}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        nutritionPer100g: {
                          ...formState.nutritionPer100g!,
                          fiberG: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Vitamin C (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.nutritionPer100g?.vitaminC_mg ?? 0}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        nutritionPer100g: {
                          ...formState.nutritionPer100g!,
                          vitaminC_mg: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-orange-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={formState.imageUrl || ''}
                  onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                  placeholder="Enter image URL"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-white/15 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60 text-slate-950 rounded-xl font-extrabold text-xs"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
