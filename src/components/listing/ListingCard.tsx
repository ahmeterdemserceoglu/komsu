"use client";

import { Listing, useStore } from "@/lib/store";
import { MapPin, Handshake, Gift, Tag, HelpCircle, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface ListingCardProps {
  item: Listing;
  onClick: () => void;
}

const renderTypeIcon = (type: Listing["type"], size = 48) => {
  const className = "text-[#f58220] stroke-[1.25] group-hover:scale-110 transition-transform duration-300";
  if (type === "borrow") return <Handshake size={size} className={className} />;
  if (type === "gift") return <Gift size={size} className={className} />;
  if (type === "sell") return <Tag size={size} className={className} />;
  return <HelpCircle size={size} className={className} />;
};

export default function ListingCard({ item, onClick }: ListingCardProps) {
  const { currentUser, toggleFavorite, isFavorited } = useStore();
  const favorited = isFavorited(item.id);

  const hasImage = item.imageUrls?.length > 0 || (item.imageUrl && item.imageUrl.startsWith("http"));
  const displayImage = item.imageUrls?.[0] || (item.imageUrl?.startsWith("http") ? item.imageUrl : null);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    toggleFavorite(item.id);
  };

  return (
    <div
      onClick={onClick}
      className="classic-card rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group"
    >
      {/* Visual box */}
      <div className="h-44 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center relative border-b border-slate-100 dark:border-slate-700 overflow-hidden">
        {hasImage && displayImage ? (
          <img
            src={displayImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100/60 dark:border-slate-600 transform group-hover:scale-105 transition-transform duration-300">
            {renderTypeIcon(item.type)}
          </div>
        )}
        
        {/* Badge type */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-full text-white shadow-sm ${
          item.type === "borrow" ? "bg-sky-500" : item.type === "gift" ? "bg-emerald-500" : item.type === "sell" ? "bg-orange-500" : "bg-violet-500"
        }`}>
          {item.type === "borrow" ? "Ödünç" : item.type === "gift" ? "Hediye" : item.type === "sell" ? "Satılık" : "Aranan"}
        </span>

        {/* Favorite Button */}
        {currentUser && (
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all cursor-pointer ${
              favorited
                ? "bg-[#f58220] text-white shadow-lg shadow-[#f58220]/30"
                : "bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-[#f58220] shadow-sm"
            }`}
          >
            <Bookmark size={14} fill={favorited ? "currentColor" : "none"} strokeWidth={2} />
          </motion.button>
        )}
        
        {/* Badge condition */}
        <span className="absolute bottom-3 right-3 px-2.5 py-0.5 text-[9px] font-semibold rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
          {item.condition}
        </span>

        {/* Multiple images indicator */}
        {item.imageUrls?.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            {item.imageUrls.slice(0, 4).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#f58220] transition-colors line-clamp-1">
            {item.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>

          {/* Price */}
          {item.type === "sell" && item.price && (
            <p className="text-sm font-bold text-[#f58220] mt-1.5">
              {item.price.toLocaleString("tr-TR")} ₺
            </p>
          )}
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-6 w-6 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-[9px] border border-white dark:border-slate-800 shrink-0 select-none shadow-sm">
              {item.owner.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
              {item.owner.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">
            <MapPin size={10} className="text-[#f58220]" />
            <span>{item.location.split(" ")[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
