"use client";

import React from "react";

type BadgeVariant = "default" | "borrow" | "gift" | "sell" | "ask" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  count?: number;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  borrow: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
  gift: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  sell: "bg-orange-50 text-[#f58220] border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  ask: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  danger: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  info: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[9px]",
  md: "px-2.5 py-1 text-[10px]",
};

export default function Badge({
  variant = "default",
  size = "sm",
  children,
  icon,
  className = "",
  count,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulse ? "animate-pulse" : ""}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {count !== undefined && (
        <span className="ml-0.5 bg-white/20 dark:bg-black/20 px-1.5 rounded-full text-[9px]">
          {count}
        </span>
      )}
    </span>
  );
}

export function CountBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`
        absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#f58220] border-2 border-[#091a35]
        text-white text-[10px] font-black flex items-center justify-center animate-pulse
        ${className}
      `}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
