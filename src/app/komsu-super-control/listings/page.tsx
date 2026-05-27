"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/lib/store";
import { Search, Package, SlidersHorizontal } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { CATEGORY_LABELS, TYPE_LABELS, TYPE_COLORS } from "@/lib/schemas";
import { motion, AnimatePresence } from "framer-motion";
import ListingDetailDrawer from "./ListingDetailDrawer"; // To be created next

// A lean Listing Row for the list view
const ListingRow = ({ listing, onClick }: { listing: Listing; onClick: () => void }) => {
  const typeLabel = TYPE_LABELS[listing.type] || listing.type;
  const typeColor = TYPE_COLORS[listing.type] || 'bg-slate-500';

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${typeColor}`}>
                {listing.title.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{listing.title}</p>
                <p className="text-[10px] text-slate-400">ID: {listing.id.slice(0, 8)}...</p>
            </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium hidden md:table-cell">{listing.owner.name}</td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${typeColor}`}>
          {typeLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
        {CATEGORY_LABELS[listing.category.toUpperCase()] || listing.category}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${listing.status === "available" ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {listing.status === "available" ? "Aktif" : (listing.status === "archived" ? "Arşivli" : "Kapalı")}
        </span>
      </td>
    </motion.tr>
  );
};

export default function AdminListingsPageV2() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "all", status: "all" });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
      setListings(data);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleListingUpdate = (updatedListing: Partial<Listing> & { id: string }) => {
      setListings(prev => prev.map(l => l.id === updatedListing.id ? { ...l, ...updatedListing } : l));
      if(selectedListing?.id === updatedListing.id) {
          setSelectedListing({ ...selectedListing, ...updatedListing });
      }
  };
  
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
        const matchesSearch =
            l.title.toLowerCase().includes(search.toLowerCase()) ||
            l.owner.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = filters.type === "all" || l.type === filters.type;
        const matchesStatus = filters.status === "all" || l.status === filters.status;
        return matchesSearch && matchesType && matchesStatus;
    });
  }, [listings, search, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">İlan Yönetim Merkezi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{listings.length} toplam ilanı yönetin.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İlan başlığı veya sahip adı ile ara..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-[#f58220]/50 text-slate-800 dark:text-slate-200 transition-all"
           />
        </div>
        <div className="flex gap-3">
            <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="w-full sm:w-auto px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-[#f58220]/50 cursor-pointer text-slate-800 dark:text-slate-200 transition-all">
                <option value="all">Tüm Türler</option><option value="borrow">Ödünç</option><option value="gift">Hediye</option><option value="sell">Satılık</option><option value="ask">Aranan</option>
            </select>
             <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full sm:w-auto px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-[#f58220]/50 cursor-pointer text-slate-800 dark:text-slate-200 transition-all">
                <option value="all">Tüm Durumlar</option><option value="available">Aktif</option><option value="reserved">Rezerve</option><option value="completed">Tamamlandı</option><option value="archived">Arşivli</option>
            </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 h-96 animate-pulse"></div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={<Package size={40} className="text-slate-400" />}
          title="İlan bulunamadı"
          description="Arama veya filtre kriterlerinize uygun ilan yok."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">İlan</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Sahibi</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Tür</th>
                  <th className="text-left px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Kategori</th>
                  <th className="text-right px-4 py-3 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <motion.tbody layout className="divide-y divide-slate-100 dark:divide-slate-800">
                <AnimatePresence>
                    {filteredListings.map((listing) => (
                        <ListingRow key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

        <AnimatePresence>
            {selectedListing && (
                <ListingDetailDrawer 
                    listing={selectedListing} 
                    onClose={() => setSelectedListing(null)}
                    onListingUpdate={handleListingUpdate}
                />
            )}
        </AnimatePresence>
    </div>
  );
}
