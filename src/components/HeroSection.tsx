import React from 'react';
import {
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  Globe2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { ProduceItem } from '../types/produce.ts';

interface HeroSectionProps {
  onStartScanning: () => void;
  onExploreGallery: () => void;
  featuredProduce: ProduceItem[];
  isLoading?: boolean;
  onSelectProduce: (item: ProduceItem) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartScanning,
  onExploreGallery,
  featuredProduce,
  isLoading = false,
  onSelectProduce,
}) => {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-slate-900/70 backdrop-blur-2xl text-slate-50 rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-5 shadow-2xl border border-white/10">
        {/* Citrus, Berry & Botanical Ambient Glows */}
        <div className="absolute -top-24 right-1/5 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/5 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-64 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Next-Gen Botanical Vision Intelligence
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-50 leading-tight">
            AI-Based Fruit & Vegetable <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-lime-400 bg-clip-text text-transparent">
              Recognition & Health Portal
            </span>
          </h1>

          {/* Urdu Subtitle with Romanized Transliteration */}
          <div className="space-y-1.5">
            <p className="text-sm sm:text-lg font-bold text-amber-300 tracking-wide">
              Phal Aur Sabzi Ki Tasveer Se AI Pehchan, Ghizaiyat Aur Sehat Ke Fawaid
            </p>
            <p className="text-xs sm:text-base font-urdu text-slate-200/90 max-w-2xl mx-auto" dir="rtl">
              کسی بھی پھل یا سبزی کی تصویر لیں؛ اے آئی فوراً پہچان کر غذائی اجزاء، شوگر اور گردے کے پرہیز بتائے گا۔
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload or capture a produce photo to request AI identification and save the result to your scan history.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onStartScanning}
              className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" /> Launch AI Recognition
            </button>
            <button
              onClick={onExploreGallery}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-100 font-semibold text-sm rounded-2xl border border-white/15 hover:border-lime-400/40 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-lime-400" /> Browse Food Directory
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left border-t border-white/10 max-w-4xl mx-auto text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
              <span>MySQL-Persisted Records</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Activity className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Diabetic & Renal Precautions</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Globe2 className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Catalog Record Details</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gemini Multimodal Vision</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Botanical Specimens */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-50 tracking-tight">
              Food Catalog Records
            </h2>
            <p className="text-xs text-slate-400">
              Records loaded from the MySQL food catalog.
            </p>
          </div>
          <button
            onClick={onExploreGallery}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            View All ({featuredProduce.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog records...
          </div>
        ) : featuredProduce.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No records found in database yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProduce.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProduce(item)}
              className="group bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:-translate-y-0.5 hover:border-orange-400/40 hover:shadow-[0_14px_38px_-14px_rgba(249,115,22,0.28)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/25" />
                <span className="absolute bottom-2 right-2 bg-slate-950/80 border border-white/15 text-amber-300 text-xs px-2 py-0.5 rounded font-serif backdrop-blur-xs">
                  {item.urduName}
                </span>
                <span className="absolute top-2 left-2 bg-slate-950/80 border border-white/15 text-slate-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {item.category}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-base text-slate-50 group-hover:text-orange-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs italic text-slate-400 font-serif">
                    {item.scientificName}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/65 border border-white/10 p-2 rounded-xl font-mono tabular-nums">
                  <span>{item.nutritionPer100g.calories} kcal</span>
                  <span>Fiber: {item.nutritionPer100g.fiberG}g</span>
                  <span className="text-lime-400 font-bold">GI {item.precautions.diabetes.glycemicIndex}</span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.healthBenefits[0]?.description}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};
