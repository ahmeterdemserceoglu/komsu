"use client";

import React, { useState, useEffect } from "react";
import { useStore, FeedPost, Comment } from "@/lib/store";
import { Zap, MessageSquare, Megaphone, Package, ArrowRight, Send, Clock } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

interface FeedPostCardProps {
  post: FeedPost;
  onInspectListing?: (title: string) => void;
  showComments?: boolean;
}

export default function FeedPostCard({ post, onInspectListing, showComments = true }: FeedPostCardProps) {
  const { currentUser, toggleLikePost, addComment } = useStore();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load comments from subcollection when expanded
  useEffect(() => {
    if (!isCommentsOpen) return;

    const commentsQuery = query(
      collection(db, "feed_posts", post.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(commentsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
      setComments(data);
    });

    return () => unsub();
  }, [isCommentsOpen, post.id]);

  const handleLike = () => {
    if (!currentUser) return;
    toggleLikePost(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(post.id, commentInput.trim());
      setCommentInput("");
    } catch {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp: unknown) => {
    if (!timestamp) return "Yeni";
    const ts = timestamp as { toDate?: () => Date };
    const date = ts.toDate ? ts.toDate() : new Date(timestamp as string);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes}dk`;
    if (hours < 24) return `${hours}sa`;
    if (days < 7) return `${days}g`;
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative group transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <Link href={`/profile?userId=${post.author.id}`}>
            <Avatar name={post.author.name} size="md" />
          </Link>
          <div>
            <Link
              href={`/profile?userId=${post.author.id}`}
              className="font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-[#f58220] transition-colors"
            >
              {post.author.name}
            </Link>
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock size={10} />
              {formatTime(post.createdAt)}
            </div>
          </div>
        </div>

        {post.type === "announcement" ? (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800 flex items-center gap-1">
            <Megaphone size={10} />
            DUYURU
          </span>
        ) : post.type === "listing_share" ? (
          <span className="px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-[#f58220] text-[9px] font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-800 flex items-center gap-1">
            <Package size={10} />
            İLAN
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <MessageSquare size={10} />
            SOHBET
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        {post.title && (
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{post.title}</h4>
        )}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer px-2.5 py-1.5 rounded-lg ${
              isLiked
                ? "text-[#f58220] bg-orange-50/50 dark:bg-orange-900/20"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Zap size={14} strokeWidth={3} fill={isLiked ? "currentColor" : "none"} />
            <span>{post.likes || 0}</span>
          </button>

          {showComments && (
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>{post.commentsCount || 0}</span>
            </button>
          )}
        </div>

        {post.type === "listing_share" && onInspectListing && (
          <button
            onClick={() => onInspectListing(post.content)}
            className="text-xs font-bold text-[#091a35] dark:text-slate-200 hover:text-[#f58220] flex items-center gap-1 cursor-pointer transition-colors"
          >
            İlanı İncele <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Comments Section */}
      {isCommentsOpen && showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Comment input */}
          {currentUser && (
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <Avatar name={currentUser.name} size="xs" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Yorum yaz..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:border-[#f58220] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || isSubmitting}
                  className="p-1.5 rounded-full bg-[#f58220] hover:bg-[#e07216] text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Comments list */}
          {comments.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar name={comment.author.name} size="xs" />
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {comment.author.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center py-2">
              Henüz yorum yok. İlk yorumu siz yapın!
            </p>
          )}
        </div>
      )}
    </article>
  );
}
