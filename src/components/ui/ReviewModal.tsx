"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewedUserId: string;
  reviewedUserName: string;
  listingId?: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  reviewedUserId,
  reviewedUserName,
  listingId,
}: ReviewModalProps) {
  const { addReview } = useStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Lütfen bir puan verin.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("Yorum en az 5 karakter olmalıdır.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addReview(reviewedUserId, rating, comment.trim(), listingId);
      setRating(0);
      setComment("");
      onClose();
    } catch {
      setError("Değerlendirme gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Değerlendirme Yaz" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">{reviewedUserName}</span>{" "}
            için değerlendirmeniz
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center">
          <StarRating
            rating={rating}
            interactive
            onChange={setRating}
            size={32}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Yorumunuz
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deneyiminizi paylaşın..."
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#f58220] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 float-right">
            {comment.length}/300
          </span>
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
          <Button variant="primary" size="md" fullWidth isLoading={isSubmitting} type="submit">
            Gönder
          </Button>
        </div>
      </form>
    </Modal>
  );
}
