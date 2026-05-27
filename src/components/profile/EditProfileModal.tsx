"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Briefcase, FileText, X, Save, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, updateUserProfile, isLoading, error, clearError } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    let cleaned = numbers;
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(0, 11);
    } else {
      cleaned = cleaned.substring(0, 10);
    }

    if (cleaned.length === 0) return "";
    
    if (cleaned.startsWith("0")) {
      if (cleaned.length <= 1) return "0";
      if (cleaned.length <= 4) return `0 (${cleaned.slice(1, 4)})`;
      if (cleaned.length <= 7) return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}`;
      if (cleaned.length <= 9) return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)}`;
      return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    } else {
      if (cleaned.length <= 3) return `(${cleaned})`;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}`;
      if (cleaned.length <= 8) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
  };

  const validatePhone = (phoneStr: string): boolean => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      return digits.length === 11 && digits.startsWith("05");
    }
    return digits.length === 10 && digits.startsWith("5");
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email || "");
      setPhone(formatPhoneNumber(currentUser.phone || ""));
      setTitle(currentUser.title);
      setBio(currentUser.bio || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) {
      clearError();
      setLocalError("");
      setSuccess(false);
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (!validatePhone(phone)) {
      setLocalError("Lütfen geçerli bir telefon numarası girin (Örn. 0555 123 45 67).");
      return;
    }

    try {
      await updateUserProfile(name, email, phone, title, bio);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#091a35]/65 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#091a35] px-6 py-5 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#f58220] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-white">Profili Düzenle</h2>
                    <p className="text-xs text-slate-300 font-medium">Bilgilerinizi güncelleyin</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {(error || localError) && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">{error || localError}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/55 rounded-xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Profil başarıyla güncellendi!</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 select-none">
                    <User size={14} className="text-[#f58220]" />
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                    placeholder="Adınız ve soyadınız"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 select-none">
                    <Mail size={14} className="text-[#f58220]" />
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 select-none">
                    <Phone size={14} className="text-[#f58220]" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                    placeholder="0555 123 45 67"
                    required
                  />
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 select-none">
                    <Briefcase size={14} className="text-[#f58220]" />
                    Ünvan / Meslek
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                    placeholder="Örn: Tasarımcı, Öğretmen"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 select-none">
                    <FileText size={14} className="text-[#f58220]" />
                    Hakkımda
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all resize-none"
                    placeholder="Kendiniz hakkında kısaca bilgi verin..."
                    maxLength={200}
                  />
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-550">{bio.length}/200</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full py-3 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : success ? (
                    <>
                      <Save size={18} />
                      Kaydedildi!
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
