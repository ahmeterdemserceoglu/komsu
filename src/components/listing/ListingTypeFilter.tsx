"use client";

import { Listing } from "@/lib/store";
import { Handshake, Gift, Tag } from "lucide-react";

interface ListingTypeFilterProps {
  activeFilter: "all" | "borrow" | "gift" | "sell" | "post";
  onFilterChange: (filter: "all" | "borrow" | "gift" | "sell" | "post") => void;
  listings: Listing[];
}

export default function ListingTypeFilter({ activeFilter, onFilterChange, listings }: ListingTypeFilterProps) {
  const availableListings = listings.filter(l => l.status === "available");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">İLAN TÜRÜ</h4>
      <div className="space-y-1">
        {[
          { id: "all", label: "Tüm Paylaşımlar", count: availableListings.length, icon: null },
          { id: "borrow", label: "Ödünç Verilenler", count: availableListings.filter(l => l.type === "borrow").length, icon: Handshake },
          { id: "gift", label: "Ücretsiz Hediye", count: availableListings.filter(l => l.type === "gift").length, icon: Gift },
          { id: "sell", label: "Uygun Satılık", count: availableListings.filter(l => l.type === "sell").length, icon: Tag },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id as any)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === f.id
                ? "bg-orange-50 dark:bg-orange-950/20 text-[#f58220] border-l-4 border-[#f58220]"
                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            <span className="flex items-center gap-2">
              {f.icon && <f.icon size={14} className="text-[#f58220]" />}
              {f.label}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-slate-500 dark:text-slate-450 font-semibold">{f.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
