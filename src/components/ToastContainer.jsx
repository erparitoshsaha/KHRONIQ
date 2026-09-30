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
      }, newToast.duration || 3000);
    });

    // Globally intercept native window.alert so no browser alert dialog ever pops up
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
      className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-xs sm:max-w-sm w-auto min-w-[260px] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isBag =
          toast.message.toLowerCase().includes('shopping bag') ||
          toast.message.toLowerCase().includes('cart');
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        const accentColor = isError ? '#ef4444' : isInfo ? '#c5a880' : '#10b981';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              borderLeft: `4px solid ${accentColor}`,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.28)'
            }}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-neutral-800 transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 flex items-center justify-center">
                {isError ? (
                  <AlertCircle size={18} style={{ color: '#f87171' }} />
                ) : isBag ? (
                  <ShoppingBag size={18} style={{ color: '#34d399' }} />
                ) : isInfo ? (
                  <Info size={18} style={{ color: '#fbbf24' }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: '#34d399' }} />
                )}
              </div>
              <span
                style={{ color: '#ffffff' }}
                className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words"
              >
                {toast.message}
              </span>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{ color: '#a3a3a3' }}
              className="shrink-0 p-1 rounded hover:bg-white/10 transition cursor-pointer"
              aria-label="Close notification"
            >
              <X size={14} style={{ color: '#d4d4d4' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
