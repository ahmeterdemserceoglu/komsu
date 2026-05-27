"use client";

import React, { useState, useEffect } from "react";
import { useStore, Listing } from "@/lib/store";
import { Save, AlertCircle, MapPin, Tag } from "lucide-react";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/ui/ImageUploader";
import LocationSearch from "@/components/location/LocationSearch";

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CONDITIONS: Listing["condition"][] = ["Yeni", "Çok İyi", "İyi", "Kullanılmış"];

const listingSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(50, "Başlık en fazla 50 karakter olmalıdır"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır").max(500, "Açıklama en fazla 500 karakter olmalıdır"),
  category: z.string().min(1, "Kategori seçmelisiniz"),
  type: z.enum(["borrow", "gift", "sell", "ask"]),
  condition: z.enum(["Yeni", "Çok İyi", "İyi", "Kullanılmış"]),
  location: z.string().min(3, "Konum en az 3 karakter olmalıdır").max(80),
});

export default function NewListingModal({ isOpen, onClose }: NewListingModalProps) {
  const { currentUser, addListing, isLoading } = useStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [type, setType] = useState<Listing["type"]>("borrow");
  const [condition, setCondition] = useState<Listing["condition"]>("Çok İyi");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCategory(CATEGORIES[0].id);
      setType("borrow");
      setCondition("Çok İyi");
      setLocation("");
      setPrice(0);
      setImageUrls([]);
      setErrors({});
      setGlobalError("");
    }
  }, [isOpen]);

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const formData = { title, description, category, type, condition, location };
    const validationResult = listingSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      setGlobalError("Lütfen formdaki eksik veya hatalı alanları düzeltin.");
      return;
    }

    if (type === "sell" && price <= 0) {
      setErrors({ price: "Fiyat 0'dan büyük olmalıdır" });
      setGlobalError("Lütfen formdaki eksik veya hatalı alanları düzeltin.");
      return;
    }

    try {
      await addListing(
        title,
        description,
        category,
        type,
        condition,
        location,
        type === "sell" ? price : undefined,
        imageUrls[0] || undefined,
        imageUrls.length > 0 ? imageUrls : undefined
      );
      onClose();
    } catch (error: any) {
      console.error("Failed to add listing", error);
      setGlobalError("İlan oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Ücretsiz İlan Ver" size="lg">
      <form onSubmit={handleSubmitListing} className="space-y-5">
        {globalError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              İlan Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Bosch Darbeli Matkap (Uçları Tam)"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 ${
                errors.title ? "border-red-300 bg-red-50/25 dark:border-red-900/50 focus:border-red-400" : "border-slate-200 dark:border-slate-800 focus:border-[#f58220]"
              }`}
              required
            />
            {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              İlan Açıklaması *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İlanınızın durumunu, nasıl teslim edileceğini veya özel isteklerinizi yazın..."
              rows={4}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none resize-none transition-all font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 ${
                errors.description ? "border-red-300 bg-red-50/25 dark:border-red-900/50 focus:border-red-400" : "border-slate-200 dark:border-slate-800 focus:border-[#f58220]"
              }`}
              required
            />
            {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.description}</p>}
          </div>

          {/* Category & Exchange Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Kategori *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all font-medium cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Paylaşım Türü *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "borrow", label: "Ödünç" },
                  { id: "gift", label: "Hediye" },
                  { id: "sell", label: "Satılık" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === opt.id
                        ? "bg-[#091a35] dark:bg-slate-800 border-[#091a35] dark:border-slate-700 text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Eşya Durumu (Kondisyon) *
            </label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#f58220] border-[#f58220] text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Teslim Noktası / Konum *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <MapPin size={16} />
              </span>
              <LocationSearch 
                value={location} 
                onChange={setLocation}
                placeholder="Konum ara (örn: Kadıköy, İstanbul)"
              />
            </div>
            {errors.location && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.location}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
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
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Fiyat (₺) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <Tag size={16} />
                </span>
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Örn. 500"
                  min="0"
                  step="1"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 ${
                    errors.price ? "border-red-300 bg-red-50/25 dark:border-red-900/50 focus:border-red-400" : "border-slate-200 dark:border-slate-800 focus:border-[#f58220]"
                  }`}
                />
              </div>
              {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.price}</p>}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{isLoading ? "Yayınlanıyor..." : "İlanı Yayınla"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
