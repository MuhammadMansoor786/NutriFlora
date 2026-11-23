import React, { useState, useEffect } from 'react';
import { GitCompare, Activity, Loader2 } from 'lucide-react';
import type { ProduceItem } from '../types/produce.ts';
import { compareNutrition, calculateDailyValuePercent } from '../utils/nutrition.ts';

interface ProduceCompareProps {
  items: ProduceItem[];
  isLoading?: boolean;
  preselectedA?: ProduceItem | null;
  preselectedB?: ProduceItem | null;
  onSelectProduce: (item: ProduceItem) => void;
}

export const ProduceCompare: React.FC<ProduceCompareProps> = ({
  items,
  isLoading = false,
  preselectedA,
  preselectedB,
  onSelectProduce,
}) => {
  const [itemAId, setItemAId] = useState<string>(preselectedA?.id || items[0]?.id || '');
  const [itemBId, setItemBId] = useState<string>(preselectedB?.id || items[1]?.id || '');

  useEffect(() => {
    if (preselectedA?.id) {
      setItemAId(preselectedA.id);
    } else if (items.length > 0 && !items.some((i) => i.id === itemAId)) {
      setItemAId(items[0].id);
    }
  }, [preselectedA, items]);

  useEffect(() => {
    if (preselectedB?.id) {
      setItemBId(preselectedB.id);
    } else if (items.length > 1 && !items.some((i) => i.id === itemBId)) {
      setItemBId(items[1].id);
    }
  }, [preselectedB, items]);

  if (isLoading && items.length < 2) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-3">
        <Loader2 className="w-7 h-7 text-orange-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-300">
          Loading food catalog for side-by-side comparison...
        </p>
      </div>
    );
  }

  const itemA = items.find((i) => i.id === itemAId) || items[0];
  const itemB = items.find((i) => i.id === itemBId) || items[1] || items[0];

  if (!itemA || !itemB || items.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 p-10 text-center space-y-2">
          <GitCompare className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-base font-bold text-slate-100">
            Not enough catalog items to compare yet
          </p>
          <p className="text-xs text-slate-400">
            At least two fruits or vegetables are required in the food catalog to run a side-by-side nutritional comparison.
          </p>
        </div>
      </div>
    );
  }

  compareNutrition(itemA, itemB);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider">
          <GitCompare className="w-3.5 h-3.5" /> Direct Nutritional Analysis
        </div>
        <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight">
          Compare Fruits & Vegetables Side-by-Side
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Evaluate nutritional density, glycemic impact, dietary fiber, and clinical suitability for diabetes and renal conditions between any two specimens.
        </p>
      </div>

      {/* Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item A Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-orange-500/25 shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-orange-300 uppercase tracking-wider bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 rounded-lg">
              Food A
            </span>
            <select
              value={itemAId}
              onChange={(e) => setItemAId(e.target.value)}
              className="bg-slate-950/90 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400/60"
            >
              {items.map((i) => (
                <option key={`a-${i.id}`} value={i.id} className="bg-slate-900 text-slate-100">
                  {i.name} ({i.urduName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
              <img
                src={itemA.imageUrl}
                alt={itemA.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                {itemA.name}
                <span className="text-lg font-serif text-amber-300">{itemA.urduName}</span>
              </h3>
              <p className="text-xs italic text-slate-400 font-serif">{itemA.scientificName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-slate-200">
                  {itemA.category}
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-orange-300">
                  {itemA.nutritionPer100g.calories} kcal / 100g
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Item B Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-lime-500/25 shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-lime-300 uppercase tracking-wider bg-lime-500/15 border border-lime-500/30 px-2.5 py-1 rounded-lg">
              Food B
            </span>
            <select
              value={itemBId}
              onChange={(e) => setItemBId(e.target.value)}
              className="bg-slate-950/90 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-500/25 focus:border-lime-400/60"
            >
              {items.map((i) => (
                <option key={`b-${i.id}`} value={i.id} className="bg-slate-900 text-slate-100">
                  {i.name} ({i.urduName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
              <img
                src={itemB.imageUrl}
                alt={itemB.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                {itemB.name}
                <span className="text-lg font-serif text-lime-300">{itemB.urduName}</span>
              </h3>
              <p className="text-xs italic text-slate-400 font-serif">{itemB.scientificName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-slate-200">
                  {itemB.category}
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-lime-300">
                  {itemB.nutritionPer100g.calories} kcal / 100g
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/60 border-b border-white/10">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Nutritional Values per 100g (Standard Reference)
          </h3>
        </div>

        <div className="divide-y divide-white/10 text-xs">
          {/* Calories */}
          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-400 font-medium">Calories</div>
            <div className={`font-bold font-mono tabular-nums ${itemA.nutritionPer100g.calories < itemB.nutritionPer100g.calories ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemA.nutritionPer100g.calories} kcal
            </div>
            <div className={`font-bold font-mono tabular-nums ${itemB.nutritionPer100g.calories < itemA.nutritionPer100g.calories ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemB.nutritionPer100g.calories} kcal
            </div>
          </div>

          {/* Dietary Fiber */}
          <div className="grid grid-cols-3 p-3 items-center bg-slate-950/35">
            <div className="text-slate-400 font-medium">Dietary Fiber</div>
            <div className={`font-bold font-mono tabular-nums ${itemA.nutritionPer100g.fiberG > itemB.nutritionPer100g.fiberG ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemA.nutritionPer100g.fiberG} g ({calculateDailyValuePercent(itemA.nutritionPer100g.fiberG, 'fiberG')}% DV)
            </div>
            <div className={`font-bold font-mono tabular-nums ${itemB.nutritionPer100g.fiberG > itemA.nutritionPer100g.fiberG ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemB.nutritionPer100g.fiberG} g ({calculateDailyValuePercent(itemB.nutritionPer100g.fiberG, 'fiberG')}% DV)
            </div>
          </div>

          {/* Sugars */}
          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-400 font-medium">Total Natural Sugars</div>
            <div className={`font-bold font-mono tabular-nums ${itemA.nutritionPer100g.sugarsG < itemB.nutritionPer100g.sugarsG ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemA.nutritionPer100g.sugarsG} g
            </div>
            <div className={`font-bold font-mono tabular-nums ${itemB.nutritionPer100g.sugarsG < itemA.nutritionPer100g.sugarsG ? 'text-lime-400' : 'text-slate-100'}`}>
              {itemB.nutritionPer100g.sugarsG} g
            </div>
          </div>

          {/* Vitamin C */}
          <div className="grid grid-cols-3 p-3 items-center bg-slate-950/35">
            <div className="text-slate-400 font-medium">Vitamin C (Immune)</div>
            <div className={`font-bold font-mono tabular-nums ${itemA.nutritionPer100g.vitaminC_mg > itemB.nutritionPer100g.vitaminC_mg ? 'text-orange-400' : 'text-slate-100'}`}>
              {itemA.nutritionPer100g.vitaminC_mg} mg ({calculateDailyValuePercent(itemA.nutritionPer100g.vitaminC_mg, 'vitaminC_mg')}% DV)
            </div>
            <div className={`font-bold font-mono tabular-nums ${itemB.nutritionPer100g.vitaminC_mg > itemA.nutritionPer100g.vitaminC_mg ? 'text-orange-400' : 'text-slate-100'}`}>
              {itemB.nutritionPer100g.vitaminC_mg} mg ({calculateDailyValuePercent(itemB.nutritionPer100g.vitaminC_mg, 'vitaminC_mg')}% DV)
            </div>
          </div>

          {/* Potassium */}
          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-400 font-medium">Potassium (Electrolyte)</div>
            <div className="font-bold font-mono tabular-nums text-slate-100">
              {itemA.nutritionPer100g.potassium_mg} mg
            </div>
            <div className="font-bold font-mono tabular-nums text-slate-100">
              {itemB.nutritionPer100g.potassium_mg} mg
            </div>
          </div>

          {/* Glycemic Index */}
          <div className="grid grid-cols-3 p-3 items-center bg-slate-950/35">
            <div className="text-slate-400 font-medium">Glycemic Index (GI)</div>
            <div>
              <span className="font-bold font-mono tabular-nums text-slate-100">{itemA.precautions.diabetes.glycemicIndex}</span>{' '}
              <span className="text-[10px] text-slate-400">({itemA.precautions.diabetes.category})</span>
            </div>
            <div>
              <span className="font-bold font-mono tabular-nums text-slate-100">{itemB.precautions.diabetes.glycemicIndex}</span>{' '}
              <span className="text-[10px] text-slate-400">({itemB.precautions.diabetes.category})</span>
            </div>
          </div>

          {/* Diabetes Suitability */}
          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-400 font-medium">Diabetic Plan Suitability</div>
            <div>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                itemA.precautions.diabetes.suitability === 'Safe'
                  ? 'bg-lime-500/15 text-lime-300 border-lime-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {itemA.precautions.diabetes.suitability}
              </span>
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                itemB.precautions.diabetes.suitability === 'Safe'
                  ? 'bg-lime-500/15 text-lime-300 border-lime-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {itemB.precautions.diabetes.suitability}
              </span>
            </div>
          </div>

          {/* Kidney Potassium & Oxalate */}
          <div className="grid grid-cols-3 p-3 items-center bg-slate-950/35">
            <div className="text-slate-400 font-medium">Kidney / Renal Profile</div>
            <div className="space-y-0.5">
              <span className="block font-medium text-slate-200">{itemA.precautions.kidneyDisease.potassiumTier}</span>
              <span className="text-[10px] text-slate-400">Oxalates: {itemA.precautions.kidneyDisease.oxalateLevel}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block font-medium text-slate-200">{itemB.precautions.kidneyDisease.potassiumTier}</span>
              <span className="text-[10px] text-slate-400">Oxalates: {itemB.precautions.kidneyDisease.oxalateLevel}</span>
            </div>
          </div>
        </div>

        {/* View Profile Action Buttons */}
        <div className="grid grid-cols-2 p-4 bg-slate-950/60 border-t border-white/10 gap-4">
          <button
            onClick={() => onSelectProduce(itemA)}
            className="w-full py-2.5 bg-white/5 hover:bg-orange-500/15 border border-white/15 hover:border-orange-400/50 rounded-xl text-xs font-semibold text-slate-100 transition-colors"
          >
            Full Profile: {itemA.name}
          </button>
          <button
            onClick={() => onSelectProduce(itemB)}
            className="w-full py-2.5 bg-white/5 hover:bg-lime-500/15 border border-white/15 hover:border-lime-400/50 rounded-xl text-xs font-semibold text-slate-100 transition-colors"
          >
            Full Profile: {itemB.name}
          </button>
        </div>
      </div>
    </div>
  );
};
