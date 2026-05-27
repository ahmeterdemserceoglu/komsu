"use client";

import React from "react";
import { useStore, Listing } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import { Bookmark, Trash2, ArrowRight, Handshake, Gift, Tag, HelpCircle, MapPin } from "lucide-react";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectListing: (listing: Listing) => void;
}

const renderTypeIcon = (type: string, size = 18) => {
  const className = "text-[#f58220] stroke-[1.5]";
  if (type === "borrow") return <Handshake size={size} className={className} />;
  if (type === "gift") return <Gift size={size} className={className} />;
  if (type === "sell") return <Tag size={size} className={className} />;
  return <HelpCircle size={size} className={className} />;
};

export default function FavoritesModal({ isOpen, onClose, onInspectListing }: FavoritesModalProps) {
  const { currentUser, listings, toggleFavorite } = useStore();

  if (!currentUser) return null;

  const favoriteListings = listings.filter((l) => currentUser.favorites?.includes(l.id));

  const handleInspect = (listing: Listing) => {
    onClose();
    setTimeout(() => {
      onInspectListing(listing);
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Favori İlanlarım" size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {favoriteListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-orange-50 dark:bg-orange-950/20 rounded-full flex items-center justify-center text-[#f58220] mb-4 animate-pulse">
              <Bookmark size={32} fill="currentColor" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Favori ilanınız bulunmuyor</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
              Keşfet sayfasındaki ilanları bookmark ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {favoriteListings.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-orange-200 dark:hover:border-orange-950/40 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm"
              >
                <div className="flex gap-3.5 items-center min-w-0 flex-1">
                  <span className="h-11 w-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm select-none">
                    {renderTypeIcon(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-[#f58220] transition-colors">
                        {item.title}
                      </h4>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wider uppercase shrink-0 ${
                        item.type === "borrow" ? "bg-sky-500" : item.type === "gift" ? "bg-emerald-500" : "bg-orange-500"
                      }`}>
                        {item.type === "borrow" ? "Ödünç" : item.type === "gift" ? "Hediye" : "Satılık"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500 dark:text-slate-350 font-semibold">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {item.location}</span>
                      <span className="text-slate-300 dark:text-slate-800">•</span>
                      <span>{item.condition}</span>
                      {item.type === "sell" && item.price && (
                        <>
                          <span className="text-slate-300 dark:text-slate-800">•</span>
                          <span className="text-[#f58220] font-bold">{item.price} TL</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleInspect(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 bg-[#091a35] hover:bg-[#152a4e] dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer group-hover:shadow-sm"
                    title="İlan Detayı"
                  >
                    Detay <ArrowRight size={10} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 text-orange-650 dark:text-orange-450 border border-orange-100/50 dark:border-orange-900/30 hover:scale-105 transition-all cursor-pointer"
                    title="Favorilerden Kaldır"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
