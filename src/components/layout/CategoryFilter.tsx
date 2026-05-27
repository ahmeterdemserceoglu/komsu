"use client";

import { Globe, Wrench, Utensils, Leaf, BookOpen, Trophy, Laptop, Package } from "lucide-react";

const CATEGORIES = [
  { id: "ALL", label: "Tüm İlanlar" },
  { id: "HARDWARE", label: "Alet & Hırdavat" },
  { id: "KITCHEN", label: "Mutfak & Yemek" },
  { id: "OUTDOOR", label: "Bahçe & Bitki" },
  { id: "BOOKS", label: "Kitap & Hobi" },
  { id: "SPORTS", label: "Spor & Aktivite" },
  { id: "ELECTRONICS", label: "Elektronik" },
  { id: "MISC", label: "Diğer" }
];

const renderCategoryIcon = (id: string, size = 16) => {
  if (id === "ALL") return <Globe size={size} />;
  if (id === "HARDWARE") return <Wrench size={size} />;
  if (id === "KITCHEN") return <Utensils size={size} />;
  if (id === "OUTDOOR") return <Leaf size={size} />;
  if (id === "BOOKS") return <BookOpen size={size} />;
  if (id === "SPORTS") return <Trophy size={size} />;
  if (id === "ELECTRONICS") return <Laptop size={size} />;
  return <Package size={size} />;
};

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 shadow-sm overflow-x-auto scrollbar-none">
      <div className="w-full px-4 md:px-8 lg:px-12 flex items-center justify-start md:justify-center gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 text-sm font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? "bg-[#091a35] border-[#091a35] dark:bg-[#f58220] dark:border-[#f58220] text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <span className="flex items-center justify-center shrink-0">{renderCategoryIcon(cat.id)}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
