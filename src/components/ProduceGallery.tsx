import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  GitCompare,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { ProduceItem, ProduceCategory, GlycemicCategory, PotassiumTier } from '../types/produce.ts';
import { filterProduceItems } from '../utils/nutrition.ts';
import { api } from '../services/api.ts';

interface ProduceGalleryProps {
  items: ProduceItem[];
  isLoading?: boolean;
  onSelectProduce: (item: ProduceItem) => void;
  onCompareWith: (item: ProduceItem) => void;
}

export const ProduceGallery: React.FC<ProduceGalleryProps> = ({
  items,
  isLoading = false,
  onSelectProduce,
  onCompareWith,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProduceCategory | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<string | 'all'>('all');
  const [glycemicFilter, setGlycemicFilter] = useState<GlycemicCategory | 'all'>('all');
  const [potassiumFilter, setPotassiumFilter] = useState<PotassiumTier | 'all'>('all');
  const [highFiberOnly, setHighFiberOnly] = useState(false);
  const [highVitaminCOnly, setHighVitaminCOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'calories_asc' | 'vitaminc_desc' | 'fiber_desc'>('name');
  const [liveItems, setLiveItems] = useState<ProduceItem[]>(items);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLiveItems(items);
  }, [items]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setIsFiltering(true);
      api
        .getFoods({
          q: searchQuery.trim() || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          season: selectedSeason !== 'all' ? selectedSeason : undefined,
        })
        .then((fetched) => {
          if (active) {
            setLiveItems(fetched);
            setLoadError(null);
          }
        })
        .catch((err: Error) => {
          if (active) {
            setLiveItems([]);
            setLoadError(err.message);
          }
        })
        .finally(() => {
          if (active) setIsFiltering(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, selectedSeason, items]);

  const filteredItems = useMemo(() => {
    let list = filterProduceItems(liveItems, {
      query: searchQuery,
      category: selectedCategory,
      season: selectedSeason,
      glycemicTier: glycemicFilter,
      potassiumTier: potassiumFilter,
      highFiberOnly,
      highVitaminCOnly,
    });

    return list.sort((a, b) => {
      if (sortBy === 'calories_asc') {
        return a.nutritionPer100g.calories - b.nutritionPer100g.calories;
      }
      if (sortBy === 'vitaminc_desc') {
        return b.nutritionPer100g.vitaminC_mg - a.nutritionPer100g.vitaminC_mg;
      }
      if (sortBy === 'fiber_desc') {
        return b.nutritionPer100g.fiberG - a.nutritionPer100g.fiberG;
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    liveItems,
    searchQuery,
    selectedCategory,
    selectedSeason,
    glycemicFilter,
    potassiumFilter,
    highFiberOnly,
    highVitaminCOnly,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Directory Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight">
            Fruit & Vegetable Food Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse verified botanical specimens with USDA FoodData Central nutrition facts, clinical health precautions, and growing regions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold font-mono tabular-nums text-lime-300 bg-lime-500/15 px-3 py-1.5 rounded-xl border border-lime-500/30 shrink-0 self-start md:self-auto">
          {isLoading || isFiltering ? (
            <Loader2 className="w-4 h-4 text-lime-400 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-lime-400" />
          )}
          <span>{isLoading ? 'Syncing catalog...' : `${filteredItems.length} Verified Entries`}</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
        {/* Search Bar + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by English name, Urdu (آم، کریلہ), scientific name (e.g., Momordica)..."
              className="w-full pl-10 pr-14 py-2 bg-slate-950/75 border border-white/15 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400/60 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950/85 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400/60"
            >
              <option value="name" className="bg-slate-900 text-slate-100">Name (A-Z)</option>
              <option value="calories_asc" className="bg-slate-900 text-slate-100">Lowest Calories</option>
              <option value="vitaminc_desc" className="bg-slate-900 text-slate-100">Highest Vitamin C</option>
              <option value="fiber_desc" className="bg-slate-900 text-slate-100">Highest Fiber</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
          {/* Category tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedCategory('fruit')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'fruit'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              Fruits
            </button>
            <button
              onClick={() => setSelectedCategory('vegetable')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'vegetable'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              Vegetables
            </button>
            <button
              onClick={() => setSelectedCategory('herb')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'herb'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              Herbs
            </button>
          </div>

          {/* Quick Health Goals Toggles */}
          <button
            onClick={() => setGlycemicFilter(glycemicFilter === 'Low' ? 'all' : 'Low')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              glycemicFilter === 'Low'
                ? 'bg-lime-500/20 text-lime-300 border-lime-500/50'
                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-lime-400/40'
            }`}
          >
            Diabetic Friendly (Low GI)
          </button>

          <button
            onClick={() => setHighFiberOnly(!highFiberOnly)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              highFiberOnly
                ? 'bg-lime-500/20 text-lime-300 border-lime-500/50'
                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-lime-400/40'
            }`}
          >
            High Fiber (&gt;3g)
          </button>

          <button
            onClick={() => setHighVitaminCOnly(!highVitaminCOnly)}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              highVitaminCOnly
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-orange-400/40'
            }`}
          >
            High Vitamin C (&gt;30mg)
          </button>

          <button
            onClick={() => setPotassiumFilter(potassiumFilter === 'Low Potassium' ? 'all' : 'Low Potassium')}
            className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
              potassiumFilter === 'Low Potassium'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-rose-400/40'
            }`}
          >
            Low Potassium (&lt;200mg)
          </button>
        </div>
      </div>

      {/* Produce Grid */}
      {(isLoading || isFiltering) && filteredItems.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 rounded-2xl border border-white/10 overflow-hidden p-4 space-y-3 animate-pulse"
            >
              <div className="h-44 rounded-xl bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-800/70 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-3">
          <p className="text-base font-bold text-slate-100">
            {loadError || (!liveItems.length && !searchQuery ? 'No records found in database yet' : 'No produce items found matching criteria')}
          </p>
          <p className="text-xs text-slate-400">
            {loadError || (!liveItems.length ? 'Add food records in the Admin panel to populate this directory.' : 'Try adjusting your search query or reset the health filters.')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedSeason('all');
              setGlycemicFilter('all');
              setPotassiumFilter('all');
              setHighFiberOnly(false);
              setHighVitaminCOnly(false);
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-xl text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => onSelectProduce(item)}
                className="group bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:-translate-y-0.5 hover:border-orange-400/40 hover:shadow-[0_14px_38px_-14px_rgba(249,115,22,0.28)] transition-all flex flex-col cursor-pointer"
              >
                {/* Photo Thumbnail */}
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-black/25" />

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 border border-white/15 text-slate-100 backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  {/* Compare button */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onCompareWith(item)}
                      className="p-1.5 rounded-full bg-slate-950/65 border border-white/15 text-slate-200 hover:bg-slate-900 hover:text-orange-300 backdrop-blur-md transition-all"
                      title="Compare"
                      aria-label="Compare"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom title inside image */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-slate-50 drop-shadow-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <h3 className="font-bold text-base leading-tight text-slate-50 group-hover:text-orange-300 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-sm font-serif text-amber-300 font-medium shrink-0">
                        {item.urduName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic font-serif truncate mt-0.5">
                      {item.scientificName}
                    </p>
                  </div>
                </div>

                {/* Card Content & Nutrition quick tags */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Macro chips */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono tabular-nums">
                    <div className="bg-slate-950/60 rounded-lg p-1.5 border border-white/10">
                      <span className="text-[10px] font-sans text-slate-400 block">Energy</span>
                      <span className="font-bold text-slate-100">{item.nutritionPer100g.calories} kcal</span>
                    </div>
                    <div className="bg-lime-500/10 rounded-lg p-1.5 border border-lime-500/25">
                      <span className="text-[10px] font-sans text-lime-300 block">Fiber</span>
                      <span className="font-bold text-lime-200">{item.nutritionPer100g.fiberG}g</span>
                    </div>
                    <div className="bg-slate-950/60 rounded-lg p-1.5 border border-white/10">
                      <span className="text-[10px] font-sans text-slate-400 block">GI Tier</span>
                      <span className="font-bold text-slate-100">{item.precautions.diabetes.category}</span>
                    </div>
                  </div>

                  {/* Clinical suitability tag */}
                  <div className="text-[11px] flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/10">
                    <span>
                      Diabetic:{' '}
                      <strong className={item.precautions.diabetes.suitability === 'Safe' ? 'text-lime-400' : 'text-amber-300'}>
                        {item.precautions.diabetes.suitability}
                      </strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>
                      Potassium: <strong className="text-slate-200">{item.precautions.kidneyDisease.potassiumTier.split(' ')[0]}</strong>
                    </span>
                  </div>

                  {/* View Details link */}
                  <div className="flex items-center justify-between pt-1 text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                    <span>Clinical Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
