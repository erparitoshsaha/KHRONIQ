import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ShoppingBag } from 'lucide-react';
import { subscribeToToasts, showToast } from '../utils/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((newToast) => {
      setToasts((prev) => [...prev.slice(-3), newToast]);
      setTimeout(() => {
        removeToast(newToast.id);
      }, newToast.duration || 3200);
    });

    // Globally intercept native window.alert so no ugly browser alert dialog ever pops up
    const originalAlert = window.alert;
    window.alert = (message) => {
      showToast(message);
    };

    return () => {
      unsubscribe();
      window.alert = originalAlert;
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isBag = toast.message.toLowerCase().includes('shopping bag') || toast.message.toLowerCase().includes('cart');
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              borderColor: isError ? '#ef4444' : isInfo ? '#c5a880' : '#10b981'
            }}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg border-l-4 shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                {isError ? (
                  <AlertCircle size={18} className="text-red-400" />
                ) : isBag ? (
                  <ShoppingBag size={18} className="text-emerald-400" />
                ) : isInfo ? (
                  <Info size={18} className="text-amber-300" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {isError ? 'KHRONIQ Notice' : isBag ? 'Atelier Bag' : 'KHRONIQ'}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug break-words mt-0.5">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
