import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const MedicalDisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-950/55 backdrop-blur-md border-b border-amber-500/20 px-4 py-2 text-xs text-amber-100/90 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="leading-relaxed text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-300">Medical & Nutritional Disclaimer:</span> Health benefits and precautions are sourced from verified nutritional databases (USDA FoodData Central, FAO/INFOODS). Information is strictly educational and does not constitute medical prescription or guaranteed treatment for clinical conditions. Always consult a licensed healthcare professional.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-300/80 hover:text-amber-100 hover:bg-amber-500/15 p-1 rounded-md transition-colors shrink-0"
          aria-label="Dismiss disclaimer banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
