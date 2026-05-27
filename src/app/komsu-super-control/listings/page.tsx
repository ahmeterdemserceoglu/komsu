"use client";

import React, { useState } from "react";
import { useStore, Listing } from "@/lib/store";
import { Search, Trash2, Eye, Package } from "lucide-react";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { CATEGORY_LABELS } from "@/lib/schemas";

export default function AdminListingsPage() {
  const { listings, deleteListing } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinizden emin misiniz?")) return;
    setIsDeleting(id);
    try {
      await deleteListing(id);
    } catch {
      // Error handled in store
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">İlan Yönetimi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{listings.length} ilan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İlan, kategori veya kullanıcı ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:border-[#f58220] text-slate-800 dark:text-slate-200"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:border-[#f58220] cursor-pointer text-slate-800 dark:text-slate-200"
        >
          <option value="all">Tüm Türler</option>
          <option value="borrow">Ödünç</option>
          <option value="gift">Hediye</option>
          <option value="sell">Satılık</option>
          <option value="ask">Aranan</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={40} className="text-slate-300" />}
          title="İlan bulunamadı"
          description="Arama kriterlerinize uygun ilan yok."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">İlan</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sahibi</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tür</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                  <th className="text-right px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{listing.title}</p>
                      <p className="text-[10px] text-slate-400">#{listing.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{listing.owner.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        listing.type === "borrow" ? "bg-sky-500" : listing.type === "gift" ? "bg-emerald-500" : listing.type === "sell" ? "bg-orange-500" : "bg-violet-500"
                      }`}>
                        {listing.type === "borrow" ? "Ödünç" : listing.type === "gift" ? "Hediye" : listing.type === "sell" ? "Satılık" : "Aranan"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {CATEGORY_LABELS[listing.category.toUpperCase()] || listing.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        listing.status === "available"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : listing.status === "reserved"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {listing.status === "available" ? "Aktif" : listing.status === "reserved" ? "Rezerve" : "Tamamlandı"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={isDeleting === listing.id}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
