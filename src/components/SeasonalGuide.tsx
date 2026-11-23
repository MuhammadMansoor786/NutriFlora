import React, { useState, useEffect } from 'react';
import { Calendar, Sun, CloudRain, Wind, Snowflake, Loader2 } from 'lucide-react';
import type { ProduceItem } from '../types/produce.ts';
import { api } from '../services/api.ts';

interface SeasonalGuideProps {
  onSelectProduce: (item: ProduceItem) => void;
}

export const SeasonalGuide: React.FC<SeasonalGuideProps> = ({
  onSelectProduce,
}) => {
  const [activeSeason, setActiveSeason] = useState<'Spring' | 'Summer' | 'Autumn' | 'Winter'>('Summer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seasonalProduce, setSeasonalProduce] = useState<ProduceItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    api
      .getFoods({ season: activeSeason })
      .then((fetched) => {
        if (active) {
          setSeasonalProduce(fetched);
          setLoadError(null);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setSeasonalProduce([]);
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeSeason]);

  const seasonInfo = {
    Spring: {
      icon: CloudRain,
      color: 'text-lime-200 bg-lime-950/40 border-lime-500/30',
      iconColor: 'text-lime-400',
      description: 'Explore catalog records marked as in season during spring.',
    },
    Summer: {
      icon: Sun,
      color: 'text-amber-100 bg-amber-950/40 border-amber-500/30',
      iconColor: 'text-amber-400',
      description: 'Explore catalog records marked as in season during summer.',
    },
    Autumn: {
      icon: Wind,
      color: 'text-orange-100 bg-orange-950/40 border-orange-500/30',
      iconColor: 'text-orange-400',
      description: 'Explore catalog records marked as in season during autumn.',
    },
    Winter: {
      icon: Snowflake,
      color: 'text-sky-100 bg-sky-950/40 border-sky-500/30',
      iconColor: 'text-sky-400',
      description: 'Explore catalog records marked as in season during winter.',
    },
  };

  const currentConfig = seasonInfo[activeSeason];
  const IconComponent = currentConfig.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" /> Agricultural Almanac
        </div>
        <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight">
          Seasonal Produce & Harvest Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Eating fruits and vegetables in their natural harvest season provides up to 3x higher micronutrient density, optimal flavor, and lower environmental pesticide residues.
        </p>
      </div>

      {/* Season Selector Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-900/80 border border-white/10 p-1.5 rounded-2xl gap-1 text-xs font-bold">
          {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map((season) => (
            <button
              key={season}
              onClick={() => setActiveSeason(season)}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeSeason === season
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20 font-extrabold'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-white/5'
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Season Description Banner */}
      <div className={`p-4 rounded-2xl border backdrop-blur-xl ${currentConfig.color} flex items-start gap-3 text-xs leading-relaxed`}>
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${currentConfig.iconColor}`} />
        <div>
          <span className="font-bold text-sm block mb-0.5 text-slate-50">{activeSeason} Agricultural Profile:</span>
          <p className="text-slate-200/90">{currentConfig.description}</p>
        </div>
      </div>

      {/* Grid of In-Season Items */}
      {isLoading && seasonalProduce.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 rounded-2xl border border-white/10 p-3 space-y-3 animate-pulse"
            >
              <div className="h-32 rounded-xl bg-slate-800" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-800/70 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : seasonalProduce.length === 0 ? (
        <div className="text-center py-14 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 space-y-2">
          <Calendar className="w-7 h-7 text-slate-500 mx-auto" />
          <p className="text-base font-bold text-slate-100">
            {loadError || `No ${activeSeason} records found in database yet`}
          </p>
          <p className="text-xs text-slate-400">
            {loadError || `Add catalog records for ${activeSeason} in the Admin panel.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-orange-300 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Refreshing {activeSeason} harvest catalog...
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {seasonalProduce.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduce(item)}
                className="group bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:-translate-y-0.5 hover:border-orange-400/40 transition-all cursor-pointer p-3 flex flex-col justify-between"
              >
                <div className="relative h-32 rounded-xl overflow-hidden bg-slate-950 mb-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 bg-slate-950/80 border border-white/10 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-serif backdrop-blur-xs">
                    {item.urduName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 block">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-orange-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 italic font-serif truncate">
                    {item.scientificName}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono tabular-nums">{item.nutritionPer100g.calories} kcal</span>
                  <span className="text-orange-400 font-semibold">View Facts →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
