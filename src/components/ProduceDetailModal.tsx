import React, { useState } from 'react';
import {
  X,
  GitCompare,
  ExternalLink,
  ShieldAlert,
  Activity,
  Globe2,
  Sparkles,
  Flame,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Info,
} from 'lucide-react';
import type { ProduceItem } from '../types/produce.ts';
import { calculateDailyValuePercent } from '../utils/nutrition.ts';

interface ProduceDetailModalProps {
  item: ProduceItem | null;
  onClose: () => void;
  onCompareWith: (item: ProduceItem) => void;
}

export const ProduceDetailModal: React.FC<ProduceDetailModalProps> = ({
  item,
  onClose,
  onCompareWith,
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'precautions' | 'benefits' | 'origin' | 'sources'>('nutrition');

  if (!item) return null;

  const n = item.nutritionPer100g;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#05080F]/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        {/* Top Header & Cover Photo */}
        <div className="relative bg-slate-950 text-white min-h-[190px] sm:min-h-[220px] flex flex-col justify-end p-6 overflow-hidden border-b border-white/10">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-slate-950/80 to-transparent" />

          {/* Close & Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => onCompareWith(item)}
              className="p-2 rounded-full bg-slate-950/60 border border-white/15 text-slate-200 hover:text-orange-300 hover:bg-slate-900 backdrop-blur-md transition-all"
              title="Compare with another food"
              aria-label="Compare with another produce"
            >
              <GitCompare className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 border border-white/15 text-slate-200 hover:text-white hover:bg-slate-900 backdrop-blur-md transition-all"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Urdu Heading */}
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950">
                {item.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-slate-100 backdrop-blur-sm">
                {item.subCategory}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 border border-white/15 text-slate-200 backdrop-blur-sm">
                Family: {item.family}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-50 flex items-center gap-3">
                  {item.name}
                  <span className="text-xl sm:text-2xl font-serif text-amber-300 font-normal">
                    {item.urduName}
                  </span>
                </h2>
                <p className="text-sm italic text-slate-300 font-serif">
                  {item.scientificName}
                </p>
              </div>

              {/* Calorie Pill */}
              <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono tabular-nums">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-slate-50 font-bold text-sm">{n.calories} kcal</span>
                <span className="text-slate-400 text-xs">/ 100g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/10 bg-slate-950/70 px-4 flex gap-1 sm:gap-2 overflow-x-auto text-xs sm:text-[13px] font-medium">
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`py-3 px-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'nutrition'
                ? 'border-orange-400 text-orange-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            Nutrition Facts (USDA)
          </button>
          <button
            onClick={() => setActiveTab('precautions')}
            className={`py-3 px-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'precautions'
                ? 'border-orange-400 text-orange-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Health Precautions
          </button>
          <button
            onClick={() => setActiveTab('benefits')}
            className={`py-3 px-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'benefits'
                ? 'border-orange-400 text-orange-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            Health Benefits ({item.healthBenefits.length})
          </button>
          <button
            onClick={() => setActiveTab('origin')}
            className={`py-3 px-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'origin'
                ? 'border-orange-400 text-orange-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            Origin & Culinary
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'border-orange-400 text-orange-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Sources & Verification
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: NUTRITION */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              {/* Macro overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400 font-medium">Carbohydrates</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-50 mt-0.5">{n.carbsG}g</p>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">Sugars: {n.sugarsG}g</span>
                </div>
                <div className="bg-lime-500/10 border border-lime-500/25 rounded-xl p-3 text-center">
                  <span className="text-xs text-lime-300 font-medium">Dietary Fiber</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-lime-200 mt-0.5">{n.fiberG}g</p>
                  <span className="text-[11px] font-mono tabular-nums text-lime-400 font-medium">
                    {calculateDailyValuePercent(n.fiberG, 'fiberG')}% DV
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400 font-medium">Protein</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-50 mt-0.5">{n.proteinG}g</p>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {calculateDailyValuePercent(n.proteinG, 'proteinG')}% DV
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-400 font-medium">Water Content</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-50 mt-0.5">{n.waterPercent}%</p>
                  <span className="text-[11px] text-sky-400 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3" /> Hydration
                  </span>
                </div>
              </div>

              {/* Glycemic Index banner */}
              <div className="bg-gradient-to-r from-orange-950/50 to-lime-950/40 border border-orange-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">Glycemic Index (GI):</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-lime-500/20 text-lime-300 border border-lime-500/35">
                      {item.precautions.diabetes.glycemicIndex} ({item.precautions.diabetes.category})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {item.precautions.diabetes.advice}
                  </p>
                </div>
                <div className="text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/15 font-medium text-amber-300 shrink-0">
                  Serving: {item.recommendedServing}
                </div>
              </div>

              {/* Micronutrients and Daily Value Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  Vitamins & Essential Minerals per 100g (% Daily Value)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Vitamin C */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Vitamin C (Ascorbic Acid)</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        {n.vitaminC_mg} mg ({calculateDailyValuePercent(n.vitaminC_mg, 'vitaminC_mg')}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.vitaminC_mg, 'vitaminC_mg'), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Potassium */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Potassium (K)</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        {n.potassium_mg} mg ({calculateDailyValuePercent(n.potassium_mg, 'potassium_mg')}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-lime-400 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.potassium_mg, 'potassium_mg'), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Vitamin A */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Vitamin A (Carotenoids RAE)</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        {n.vitaminA_mcg} mcg ({calculateDailyValuePercent(n.vitaminA_mcg, 'vitaminA_mcg')}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.vitaminA_mcg, 'vitaminA_mcg'), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Vitamin K */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Vitamin K (Phylloquinone)</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        {n.vitaminK_mcg} mcg ({calculateDailyValuePercent(n.vitaminK_mcg, 'vitaminK_mcg')}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-400 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.vitaminK_mcg, 'vitaminK_mcg'), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Calcium & Iron */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Calcium & Iron</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        Ca: {n.calcium_mg}mg · Fe: {n.iron_mg}mg
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-400 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.iron_mg, 'iron_mg'), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Folate & Magnesium */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Folate & Magnesium</span>
                      <span className="font-bold font-mono tabular-nums text-slate-50">
                        B9: {n.folate_mcg}mcg · Mg: {n.magnesium_mg}mg
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-400 h-2 rounded-full"
                        style={{ width: `${Math.min(calculateDailyValuePercent(n.folate_mcg, 'folate_mcg'), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL PRECAUTIONS & SUITABILITY */}
          {activeTab === 'precautions' && (
            <div className="space-y-4">
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">Individual Health & Medical Conditions</h4>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    While fruits and vegetables provide essential micronutrients, specific biochemical components (potassium, oxalates, natural sugars, vitamin K) interact with physiological conditions and pharmaceutical medications. Review the structured precautions below.
                  </p>
                </div>
              </div>

              {/* Diabetes suitability */}
              <div className="border border-white/10 rounded-xl p-4 bg-slate-950/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
                    <h5 className="font-bold text-slate-100 text-sm">Diabetes Mellitus (Blood Glucose Control)</h5>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      item.precautions.diabetes.suitability === 'Safe'
                        ? 'bg-lime-500/15 text-lime-300 border-lime-500/30'
                        : item.precautions.diabetes.suitability === 'Moderate'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    Suitability: {item.precautions.diabetes.suitability}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.precautions.diabetes.advice}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
                  GI: {item.precautions.diabetes.glycemicIndex} ({item.precautions.diabetes.category}) · Total Carbs: {n.carbsG}g · Net Carbs: {Math.max(0, n.carbsG - n.fiberG).toFixed(1)}g
                </div>
              </div>

              {/* Kidney Disease / Renal Diet */}
              <div className="border border-white/10 rounded-xl p-4 bg-slate-950/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <h5 className="font-bold text-slate-100 text-sm">Kidney Disease (Renal & Oxalate Considerations)</h5>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/10 text-slate-200 border border-white/10">
                      {item.precautions.kidneyDisease.potassiumTier}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Oxalates: {item.precautions.kidneyDisease.oxalateLevel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.precautions.kidneyDisease.advice}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
                  Potassium: {n.potassium_mg}mg / 100g
                </div>
              </div>

              {/* Hypertension / Blood Pressure */}
              <div className="border border-white/10 rounded-xl p-4 bg-slate-950/60">
                <h5 className="font-bold text-slate-100 text-sm mb-1">Cardiovascular & Hypertension</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.precautions.hypertension.advice}
                </p>
              </div>

              {/* Allergies and Drug Interactions */}
              <div className="border border-rose-500/30 bg-rose-950/35 rounded-xl p-4">
                <h5 className="font-bold text-rose-300 text-sm mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Known Allergies, Cross-Reactivities & Drug Interactions
                </h5>
                <ul className="space-y-1.5 text-xs text-rose-200/90">
                  {item.precautions.allergiesAndInteractions.map((alert, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                  {item.precautions.contraindications.map((contra, idx) => (
                    <li key={`c-${idx}`} className="flex items-start gap-2 text-rose-200 font-medium">
                      <span className="text-rose-400 font-bold">⚠</span>
                      <span>{contra}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Detailed physiological benefits backed by clinical biochemistry and nutritional studies.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {item.healthBenefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/10 bg-slate-950/60 hover:border-lime-500/35 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-lime-400" />
                        {benefit.title}
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-lime-500/15 text-lime-300 border border-lime-500/30">
                        {benefit.targetedSystem}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ORIGIN & AGRICULTURAL PROFILE */}
          {activeTab === 'origin' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                  <h5 className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-orange-400" />
                    Geographical Origin
                  </h5>
                  <p>{item.origin}</p>

                  <h5 className="font-bold text-slate-100 pt-2">Primary Cultivation Regions:</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {item.cultivationRegions.map((region, idx) => (
                      <span key={idx} className="bg-slate-900 border border-white/15 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                  <h5 className="font-bold text-slate-100">Growing Season & Climate</h5>
                  <p><span className="font-semibold text-slate-200">Season:</span> {item.growingSeason.join(', ')}</p>
                  <p><span className="font-semibold text-slate-200">Climate:</span> {item.climate}</p>

                  <h5 className="font-bold text-slate-100 pt-2">Prominent Varieties / Cultivars:</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {item.varieties.map((variety, idx) => (
                      <span key={idx} className="bg-orange-500/15 border border-orange-500/30 text-orange-300 px-2 py-0.5 rounded text-[11px] font-medium">
                        {variety}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Local Names & Multilingual */}
              {item.localNames && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10">
                  <span className="font-bold text-slate-100 text-xs block mb-1.5">Multilingual Vernacular Names:</span>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {item.localNames.hindi && <span><strong className="text-slate-400">Hindi:</strong> {item.localNames.hindi}</span>}
                    {item.localNames.spanish && <span><strong className="text-slate-400">Spanish:</strong> {item.localNames.spanish}</span>}
                    {item.localNames.arabic && <span><strong className="text-slate-400">Arabic:</strong> {item.localNames.arabic}</span>}
                    {item.localNames.french && <span><strong className="text-slate-400">French:</strong> {item.localNames.french}</span>}
                  </div>
                </div>
              )}

              {/* Culinary & Storage */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-xl">
                  <h5 className="font-bold text-slate-100 mb-1.5">Culinary Applications & Preparation:</h5>
                  <div className="flex flex-wrap gap-2">
                    {item.culinaryUses.map((use, idx) => (
                      <span key={idx} className="bg-white/10 text-slate-200 px-2.5 py-1 rounded-md text-xs">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-xl">
                  <h5 className="font-bold text-slate-100 mb-1">Proper Storage & Shelf-Life:</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.storageTips}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOURCES & SCIENTIFIC REFERENCES */}
          {activeTab === 'sources' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  Authoritative Scientific Databases
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Nutritional calculations and biochemical safety profiles are referenced against the following peer-reviewed agricultural and nutritional bodies:
                </p>
                <div className="space-y-2 pt-2">
                  {item.sources.map((src, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-white/10 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-100 block">{src.name}</span>
                        <span className="text-[11px] text-slate-400">Agency: {src.organization}</span>
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-6 py-3.5 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" /> Sourced from USDA FoodData Central & FAO
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onCompareWith(item)}
              className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5 text-orange-400" /> Compare Food
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-extrabold shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
