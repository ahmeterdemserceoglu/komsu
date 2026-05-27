"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "right" | "left";
  width?: string;
  headerActions?: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  width = "w-full md:w-[480px]",
  headerActions,
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const slideFrom = side === "right" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#091a35]/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative ${width} h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col ${
              side === "right" ? "ml-auto border-l" : "mr-auto border-r"
            } border-slate-200 dark:border-slate-700`}
          >
            {/* Header */}
            {title && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#091a35] to-[#152a4e] text-white flex items-center justify-between shrink-0">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  {title}
                </h2>
                <div className="flex items-center gap-2">
                  {headerActions}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
