"use client";

import React from "react";
import { Compass } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm ${className}`}
    >
      <div className="flex justify-center mb-4">
        {icon || <Compass className="text-slate-300 dark:text-slate-600" size={44} />}
      </div>
      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">
        {title}
      </h4>
      {description && (
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
