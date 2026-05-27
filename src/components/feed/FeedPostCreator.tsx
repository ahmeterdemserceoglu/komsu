"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Megaphone, Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";

interface FeedPostCreatorProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export default function FeedPostCreator({ onSuccess, compact = false }: FeedPostCreatorProps) {
  const { currentUser, addFeedPost } = useStore();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"discussion" | "announcement">("discussion");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addFeedPost(content.trim(), postType);
      setContent("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      showToast("success", "Paylaşımınız başarıyla panoya asıldı.");
      onSuccess?.();
    } catch (err: any) {
      console.error("Failed to publish post", err);
      showToast("error", err.message || "Paylaşım yayınlanırken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Yeni Paylaşım Yap</span>
          
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPostType("discussion")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                postType === "discussion"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Sohbet
            </button>
            <button
              type="button"
              onClick={() => setPostType("announcement")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                postType === "announcement"
                  ? "bg-white dark:bg-slate-700 text-[#f58220] shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Megaphone size={12} />
              Duyuru
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Avatar name={currentUser.name} size="sm" />
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setShowSuccess(false);
            }}
            placeholder="Neler paylaşmak istersiniz?"
            rows={compact ? 2 : 3}
            maxLength={300}
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-[#091a35] dark:focus:border-slate-500 text-sm font-medium text-slate-800 dark:text-slate-200 resize-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {showSuccess && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 text-center animate-fade-in">
            ✓ Paylaşımınız başarıyla yayınlandı.
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
            {content.length}/300
          </span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-5 py-2 bg-[#091a35] hover:bg-[#152a4e] text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            <Send size={14} />
            {isSubmitting ? "Yayınlanıyor..." : "Yayınla"}
          </button>
        </div>
      </form>
    </div>
  );
}
