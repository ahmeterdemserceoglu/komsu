"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function FeedPostSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="h-28 w-28 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-10 rounded-2xl ${
              i % 2 === 0 ? "w-3/5" : "w-2/5"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
