"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Package, Users, MessageSquare, TrendingUp, Eye } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/schemas";

export default function AdminDashboard() {
  const { listings, feedPosts, conversations } = useStore();

  const stats = [
    { label: "Toplam İlan", value: listings.length, icon: Package, color: "bg-orange-50 dark:bg-orange-900/30 text-[#f58220]" },
    { label: "Toplam Paylaşım", value: feedPosts.length, icon: MessageSquare, color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { label: "Toplam Sohbet", value: conversations.length, icon: Users, color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  ];

  // Category distribution
  const categoryMap: Record<string, number> = {};
  listings.forEach((l) => {
    categoryMap[l.category] = (categoryMap[l.category] || 0) + 1;
  });
  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(...Object.values(categoryMap), 1);

  // Type distribution
  const typeMap: Record<string, number> = { borrow: 0, gift: 0, sell: 0, ask: 0 };
  listings.forEach((l) => { typeMap[l.type] = (typeMap[l.type] || 0) + 1; });

  // Recent listings
  const recentListings = listings.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform istatistikleri ve genel bakış</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#f58220]" /> Kategori Dağılımı
          </h3>
          <div className="space-y-3">
            {categoryEntries.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {CATEGORY_LABELS[cat.toUpperCase()] || cat}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f58220] to-amber-400 rounded-full transition-all"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {categoryEntries.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Eye size={16} className="text-[#f58220]" /> İlan Türü Dağılımı
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "borrow", label: "Ödünç", color: "bg-sky-500" },
              { key: "gift", label: "Hediye", color: "bg-emerald-500" },
              { key: "sell", label: "Satılık", color: "bg-orange-500" },
              { key: "ask", label: "Aranan", color: "bg-violet-500" },
            ].map((t) => (
              <div
                key={t.key}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700"
              >
                <div className={`h-3 w-3 ${t.color} rounded-full mx-auto mb-2`} />
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {typeMap[t.key]}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4">Son İlanlar</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentListings.map((listing) => (
            <div key={listing.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${
                  listing.type === "borrow" ? "bg-sky-500" : listing.type === "gift" ? "bg-emerald-500" : listing.type === "sell" ? "bg-orange-500" : "bg-violet-500"
                }`}>
                  {listing.type[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{listing.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {listing.owner.name} — {CATEGORY_LABELS[listing.category.toUpperCase()] || listing.category}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                {listing.status}
              </span>
            </div>
          ))}
          {recentListings.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Henüz ilan yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
