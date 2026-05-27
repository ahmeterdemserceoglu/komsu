"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  success: {
    icon: <CheckCircle size={18} />,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  error: {
    icon: <AlertCircle size={18} />,
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
  },
  info: {
    icon: <Info size={18} />,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  React.useEffect(() => {
    const preventCopySelect = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable ||
        target.closest("input") ||
        target.closest("textarea")
      ) {
        return;
      }
      e.preventDefault();
    };

    const preventKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable ||
        target.closest("input") ||
        target.closest("textarea")
      ) {
        return;
      }

      const isControl = e.ctrlKey || e.metaKey;
      if (
        isControl && 
        (e.key === "a" || e.key === "A" || e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", preventCopySelect);
    document.addEventListener("selectstart", preventCopySelect);
    document.addEventListener("keydown", preventKeys);

    return () => {
      document.removeEventListener("copy", preventCopySelect);
      document.removeEventListener("selectstart", preventCopySelect);
      document.removeEventListener("keydown", preventKeys);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const config = toastConfig[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg} ${config.border}`}
              >
                <span className={`shrink-0 mt-0.5 ${config.text}`}>
                  {config.icon}
                </span>
                <p className={`text-sm font-semibold flex-1 ${config.text}`}>
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer ${config.text}`}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
