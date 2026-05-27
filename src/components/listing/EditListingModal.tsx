"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import LocationSearch from "@/components/location/LocationSearch";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/ui/ImageUploader";

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
}

const CATEGORIES = [
  { id: "HARDWARE", label: "Alet & Hırdavat" },
  { id: "KITCHEN", label: "Mutfak & Yemek" },
  { id: "OUTDOOR", label: "Bahçe & Bitki" },
  { id: "BOOKS", label: "Kitap & Hobi" },
  { id: "SPORTS", label: "Spor & Aktivite" },
  { id: "ELECTRONICS", label: "Elektronik" },
  { id: "MISC", label: "Diğer" }
];

export default function EditListingModal({ isOpen, onClose, listing }: EditListingModalProps) {
  const { updateListing } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"sell" | "borrow" | "gift" | "ask">("sell");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || "");
      setDescription(listing.description || "");
      setCategory(listing.category || "");
      setType(listing.type || "sell");
      setCondition(listing.condition || "");
      setLocation(listing.location || "");
      setPrice(listing.price);
      setImageUrls(listing.imageUrls || (listing.imageUrl ? [listing.imageUrl] : []));
    }
  }, [listing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    try {
      await updateListing(
        listing.id,
        title,
        description,
        category,
        type as any,
        condition,
        location,
        type === "sell" ? price : undefined,
        imageUrls[0] || undefined,
        imageUrls
      );
      onClose();
    } catch (error: any) {
      console.error("Failed to update listing", error);
      alert(error.message || "İlan güncellenemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="İlanı Düzenle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">İlan Başlığı</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] transition-all font-medium"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none resize-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] transition-all font-medium"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] cursor-pointer transition-all font-medium"
            required
          >
            <option value="" className="dark:bg-slate-900">Kategori Seçin</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">İlan Türü</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] cursor-pointer transition-all font-medium"
            required
          >
            <option value="sell" className="dark:bg-slate-900">Satılık</option>
            <option value="borrow" className="dark:bg-slate-900">Ödünç Veriliyor</option>
            <option value="gift" className="dark:bg-slate-900">Ücretsiz Hediye</option>
            <option value="ask" className="dark:bg-slate-900">Aranıyor</option>
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">Durum</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] cursor-pointer transition-all font-medium"
            required
          >
            <option value="Yeni" className="dark:bg-slate-900">Yeni</option>
            <option value="Çok İyi" className="dark:bg-slate-900">Çok İyi</option>
            <option value="İyi" className="dark:bg-slate-900">İyi</option>
            <option value="Kullanılmış" className="dark:bg-slate-900">Kullanılmış</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">Teslimat Noktası</label>
          <LocationSearch 
            value={location} 
            onChange={setLocation}
            placeholder="Konum ara (örn: Kadıköy, İstanbul)"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">
            Fotoğraflar <span className="text-slate-450 dark:text-slate-400 lowercase italic font-normal">(en fazla 5 adet)</span>
          </label>
          <ImageUploader
            images={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={5}
            folder="listings"
          />
        </div>

        {/* Price (only for sell type) */}
        {type === "sell" && (
          <div>
            <label className="block text-xs font-bold text-slate-655 dark:text-slate-300 mb-1.5">Fiyat (TL)</label>
            <input
              type="number"
              value={price || ""}
              onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none text-slate-800 dark:text-slate-200 focus:border-[#f58220] transition-all font-medium"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-[#f58220] hover:bg-[#e07216] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm text-sm border-0"
        >
          İlanı Güncelle
        </button>
      </form>
    </Modal>
  );
}
