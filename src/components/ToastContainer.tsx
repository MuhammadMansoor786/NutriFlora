import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const STYLES: Record<
  ToastType,
  { container: string; iconColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    container: 'bg-slate-900/95 backdrop-blur-xl text-slate-50 border-lime-500/35 shadow-lime-950/40',
    iconColor: 'text-lime-400',
    icon: CheckCircle2,
  },
  error: {
    container: 'bg-slate-900/95 backdrop-blur-xl text-slate-50 border-rose-500/40 shadow-rose-950/40',
    iconColor: 'text-rose-400',
    icon: AlertCircle,
  },
  warning: {
    container: 'bg-slate-900/95 backdrop-blur-xl text-slate-50 border-amber-500/40 shadow-amber-950/40',
    iconColor: 'text-amber-400',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-slate-900/95 backdrop-blur-xl text-slate-50 border-orange-500/35 shadow-orange-950/40',
    iconColor: 'text-orange-400',
    icon: Info,
  },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-medium transition-all ${style.container}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
