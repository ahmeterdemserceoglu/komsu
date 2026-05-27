"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "listing" | "user";
  targetId: string;
  targetName: string;
}

const REASONS = [
  { id: "spam", label: "Spam veya yanıltıcı içerik" },
  { id: "inappropriate", label: "Uygunsuz içerik" },
  { id: "fraud", label: "Dolandırıcılık veya sahte ilan" },
  { id: "harassment", label: "Taciz veya tehdit" },
  { id: "other", label: "Diğer" },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const { addReport } = useStore();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason) {
      setError("Lütfen bir sebep seçin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addReport(targetType, targetId, reason, description.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason("");
        setDescription("");
      }, 2000);
    } catch {
      setError("Rapor gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rapor Et" size="sm">
      {success ? (
        <div className="text-center py-8 space-y-3">
          <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Raporunuz Gönderildi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ekibimiz en kısa sürede inceleyecektir.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
              {targetType === "listing" ? "İlan" : "Kullanıcı"}:{" "}
              <span className="font-bold">{targetName}</span>
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Raporlama Sebebi *
            </label>
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  reason === r.id
                    ? "border-[#f58220] bg-orange-50 dark:bg-orange-900/20 text-[#f58220]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Ek Açıklama <span className="lowercase italic font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaylı açıklama..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#f58220] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="md" fullWidth onClick={onClose} type="button">
              İptal
            </Button>
            <Button variant="danger" size="md" fullWidth isLoading={isSubmitting} type="submit">
              Rapor Gönder
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
