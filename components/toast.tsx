"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICON_MAP = {
  success: (
    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white p-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>
  ),
  error: (
    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white p-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
    </div>
  ),
  info: (
    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white p-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" strokeWidth="3" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    </div>
  ),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — pinned at top center */}
      <div className="fixed top-6 left-0 right-0 z-[200] flex flex-col items-center pointer-events-none max-w-[480px] mx-auto px-6">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="pointer-events-auto mt-2"
            >
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-background border border-border shadow-[0_12px_24px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]">
                {ICON_MAP[toast.type]}
                <span className="text-[13px] font-bold text-foreground">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

