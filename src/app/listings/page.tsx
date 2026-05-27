"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ArrowLeft, Package, Search } from "lucide-react";
import Link from "next/link";
import ListingDetailDrawer from "@/components/listing/ListingDetailDrawer";
import LoginModal from "@/components/auth/LoginModal";
import ListingCard from "@/components/listing/ListingCard";

export default function ListingsPage() {
  const { listings } = useStore();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedType, setSelectedType] = useState<"all" | "sell" | "borrow" | "gift">("all");
  const [selectedCondition, setSelectedCondition] = useState("ALL");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginActionMessage, setLoginActionMessage] = useState("");

  const handleOpenLogin = (message: string) => {
    setLoginActionMessage(message);
    setIsLoginModalOpen(true);
  };

  const categories = [
    { id: "ALL", label: "Tüm Kategoriler" },
    { id: "HARDWARE", label: "Alet & Hırdavat" },
    { id: "KITCHEN", label: "Mutfak & Yemek" },
    { id: "OUTDOOR", label: "Bahçe & Bitki" },
    { id: "BOOKS", label: "Kitap & Hobi" },
    { id: "SPORTS", label: "Spor & Aktivite" },
    { id: "ELECTRONICS", label: "Elektronik" },
    { id: "MISC", label: "Diğer" }
  ];

  const conditions = ["ALL", "Yeni", "Az Kullanılmış", "İyi Durumda", "Kullanılmış"];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || listing.category === selectedCategory;
    const matchesType = selectedType === "all" || listing.type === selectedType;
    const matchesCondition = selectedCondition === "ALL" || listing.condition === selectedCondition;
    
    return matchesSearch && matchesCategory && matchesType && matchesCondition;
  });

  const handleInspectListing = (listing: any) => {
    setSelectedListing(listing);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#091a35] text-white px-4 md:px-8 lg:px-12 py-3.5 shadow-md">
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Ana Sayfa
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 bg-[#f58220] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 select-none text-white">
              <Package size={18} className="stroke-[2.5]" />
            </span>
            <span className="font-bold text-lg tracking-tight uppercase text-white">
              paylaş
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-4 md:px-8 lg:px-12 py-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Tüm İlanlar</h1>
        
        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
            <input
              type="text"
              placeholder="İlan, açıklama veya konum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">İlan Türü</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "all" | "sell" | "borrow" | "gift")}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]"
              >
                <option value="all" className="dark:bg-slate-900">Tüm Türler</option>
                <option value="sell" className="dark:bg-slate-900">Satılık</option>
                <option value="borrow" className="dark:bg-slate-900">Ödünç</option>
                <option value="gift" className="dark:bg-slate-900">Hediye</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Durum</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220]"
              >
                {conditions.map((cond) => (
                  <option key={cond} value={cond} className="dark:bg-slate-900">
                    {cond === "ALL" ? "Tüm Durumlar" : cond}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-bold">{filteredListings.length}</span> ilan bulundu
          </p>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <Package size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 dark:text-slate-200 font-semibold">Aradığınız kriterde ilan bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onClick={() => handleInspectListing(item)}
              />
            ))}
          </div>
        )}
      </main>

      <ListingDetailDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onOpenLogin={handleOpenLogin}
      />
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        actionMessage={loginActionMessage}
      />
    </div>
  );
}
