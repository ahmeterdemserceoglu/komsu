"use client";

import React from "react";
import { ShieldCheck } from 'lucide-react';

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  verified?: boolean; // <-- Eklendi
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig: Record<AvatarSize, { container: string; text: string; indicator: string; verified: string }> = {
  xs: { container: "h-6 w-6", text: "text-[8px]", indicator: "h-2 w-2 border", verified: "h-3 w-3" },
  sm: { container: "h-8 w-8", text: "text-[10px]", indicator: "h-2.5 w-2.5 border-[1.5px]", verified: "h-3.5 w-3.5" },
  md: { container: "h-10 w-10", text: "text-xs", indicator: "h-3 w-3 border-2", verified: "h-4 w-4" },
  lg: { container: "h-14 w-14", text: "text-base", indicator: "h-3.5 w-3.5 border-2", verified: "h-5 w-5" },
  xl: { container: "h-28 w-28 md:h-32 md:w-32", text: "text-4xl", indicator: "h-5 w-5 border-[3px]", verified: "h-8 w-8" },
};

export default function Avatar({
  name,
  imageUrl,
  size = "md",
  verified = false, // <-- Eklendi
  showOnline = false,
  isOnline = false,
  className = "",
  onClick,
}: AvatarProps) {
  const config = sizeConfig[size];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative inline-flex shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${config.container} rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm`}
        />
      ) : (
        <span
          className={`${config.container} rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold ${config.text} border-2 border-white dark:border-slate-800 shadow-sm select-none`}
        >
          {initials}
        </span>
      )}
      
      {verified && (
        <div className={`absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5`}>
          <ShieldCheck className={`${config.verified} text-green-500`} fill="#34D399" stroke="white" strokeWidth={1}/>
        </div>
      )}

      {showOnline && !verified && (
        <span
          className={`absolute bottom-0 right-0 ${config.indicator} rounded-full border-white dark:border-slate-800 ${
            isOnline ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
          }`}
        />
      )}
    </div>
  );
}
