"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ArrowLeft, MessageSquare, Zap, Megaphone, Search, Send, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import Pagination from "@/components/layout/Pagination";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FeedPage() {
  const { currentUser, feedPosts, listings, toggleLikePost, addFeedPost, addComment } = useStore();
  const { showToast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<"discussion" | "announcement">("discussion");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedPage, setFeedPage] = useState(1);
  const postsPerPage = 8;
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalComments, setModalComments] = useState<any[]>([]);

  const activePost = feedPosts.find((p) => p.id === activeCommentPostId);

  const filteredPosts = feedPosts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const uniqueActiveMembers = new Set([
    ...feedPosts.filter(p => p && p.author && p.author.id).map((p) => p.author.id),
    ...listings.filter(l => l && l.owner && l.owner.id).map((l) => l.owner.id)
  ]).size;

  useEffect(() => {
    setFeedPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (feedPage - 1) * postsPerPage,
    feedPage * postsPerPage
  );

  const announcements = feedPosts.filter((p) => p.type === "announcement");

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPostContent.trim()) return;

    try {
      await addFeedPost(newPostContent, newPostType);
      showToast("success", "Paylaşımınız başarıyla yayınlandı.");
      setNewPostContent("");
      setNewPostType("discussion");
    } catch (error: any) {
      console.error("Failed to publish post", error);
      showToast("error", error?.message || "Paylaşım yayınlanırken bir hata oluştu.");
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentInputs[postId]?.trim()) return;

    try {
      await addComment(postId, commentInputs[postId]);
      showToast("success", "Yorumunuz eklendi.");
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (error: any) {
      console.error("Failed to add comment", error);
      showToast("error", error?.message || "Yorum eklenirken bir hata oluştu.");
    }
  };

  const handleModalAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeCommentPostId || !modalCommentInput.trim()) return;

    try {
      await addComment(activeCommentPostId, modalCommentInput);
      showToast("success", "Yorumunuz eklendi.");
      setModalCommentInput("");
    } catch (error: any) {
      console.error("Failed to add comment", error);
      showToast("error", error?.message || "Yorum eklenirken bir hata oluştu.");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments({ ...expandedComments, [postId]: !expandedComments[postId] });
  };

  useEffect(() => {
    if (!activeCommentPostId) {
      setModalComments([]);
      return;
    }

    const commentsQuery = query(
      collection(db, "feed_posts", activeCommentPostId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(commentsQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setModalComments(data);
    });

    return () => unsub();
  }, [activeCommentPostId]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Giriş Yapmalısınız</h1>
          <Link href="/" className="text-[#f58220] font-semibold">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#091a35] text-white px-4 md:px-8 lg:px-12 py-3.5 shadow-md">
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Ana Sayfa
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 bg-[#f58220] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 select-none text-white">
              <MessageSquare size={18} className="stroke-[2.5]" />
            </span>
            <span className="font-bold text-lg tracking-tight uppercase text-white">
              paylaş
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-4 md:px-8 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Feed stream (8 cols / 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Post Creator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/70 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
            <form onSubmit={handlePublishPost} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Komşularınızla ne paylaşmak istersiniz?"
                    rows={2}
                    maxLength={300}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100/70 dark:border-slate-800/40 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220]/60 focus:ring-1 focus:ring-[#f58220]/60 resize-none placeholder-slate-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setNewPostType("discussion")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                      newPostType === "discussion"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/10"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <MessageSquare size={13} className="stroke-[2]" />
                    <span>Sohbet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostType("announcement")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                      newPostType === "announcement"
                        ? "bg-rose-500 text-white shadow-sm shadow-rose-500/10"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Megaphone size={13} className="stroke-[2]" />
                    <span>Duyuru</span>
                  </button>
                  <span className="hidden md:inline text-[10.5px] font-bold text-slate-400 dark:text-slate-550 ml-2 select-none">
                    {newPostContent.length}/300
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-sm rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-orange-500/20"
                >
                  Paylaş
                </button>
              </div>
            </form>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100/70 dark:border-slate-800/40 shadow-sm mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
              <input
                type="text"
                placeholder="Paylaşımlarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-100/70 dark:border-slate-800/40 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f58220]/60 focus:ring-1 focus:ring-[#f58220]/60 placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Feed */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-100/70 dark:border-slate-800/40 shadow-sm text-center">
              <MessageSquare size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 dark:text-slate-200 font-semibold">
                {searchQuery ? "Aradığınız kriterde paylaşım bulunamadı." : "Henüz hiç paylaşım yok."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/70 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300 p-6 space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {post.author.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                            {post.author.name}
                          </h3>
                          {post.type === "announcement" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30">
                              <Megaphone size={10} className="stroke-[2.5]" />
                              Duyuru
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                              <MessageSquare size={10} className="stroke-[2.5]" />
                              Sohbet
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString("tr-TR", { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : "Yeni"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-2">
                    {post.title && (
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {post.title}
                      </h2>
                    )}
                    <p className="text-[14px] text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-normal">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-2">
                    <button
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                        post.likedBy?.includes(currentUser.id)
                          ? "text-[#f58220]"
                          : "text-slate-450 hover:text-[#f58220] dark:text-slate-400 dark:hover:text-orange-400"
                      }`}
                    >
                      <Zap size={16} className={post.likedBy?.includes(currentUser.id) ? "fill-current" : ""} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveCommentPostId(post.id);
                        setModalCommentInput("");
                      }}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-455 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>{post.commentsCount} Yorum</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {totalPages > 1 && (
                <div className="pt-4">
                  <Pagination
                    currentPage={feedPage}
                    totalPages={totalPages}
                    onPageChange={setFeedPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (4 cols / 3 cols on xl) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* STATS PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100/70 dark:border-slate-800/40 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#f58220]" />
              <span>Topluluk İstatistikleri</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100/40 dark:border-slate-800/30 flex flex-col items-center text-center">
                <span className="font-bold text-2xl text-[#091a35] dark:text-slate-100">{feedPosts.length}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Toplam Mesaj</span>
              </div>
              <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100/40 dark:border-slate-800/30 flex flex-col items-center text-center">
                <span className="font-bold text-2xl text-[#f58220]">{listings.length}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Aktif İlan</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-650 dark:text-slate-350">
              <span className="text-slate-400 dark:text-slate-550">Aktif Üye Sayısı:</span>
              <span className="bg-orange-50 dark:bg-orange-950/20 text-[#f58220] px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/50">{uniqueActiveMembers} Üye</span>
            </div>
          </div>

          {/* RECENT ANNOUNCEMENTS PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100/70 dark:border-slate-800/40 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Megaphone size={18} className="text-[#f58220]" />
              <span>Topluluk Duyuruları</span>
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-550 text-center py-4">Henüz duyuru bulunmuyor.</p>
              ) : (
                announcements.slice(0, 5).map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/20 rounded-xl space-y-1.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-500">
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{ann.author?.name || "Üye"}</span>
                      <span>
                        {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString("tr-TR") : "Yeni"}
                      </span>
                    </div>
                    {ann.title && <h4 className="text-xs font-bold text-rose-950 dark:text-rose-300 truncate">{ann.title}</h4>}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-350 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Pinned Discussion Modal for Comments */}
      {activeCommentPostId && activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-[620px] max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border border-slate-100/80 dark:border-slate-800/50 overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#f58220]">
                  <MessageSquare size={18} className="stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Yorumlar</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold">{modalComments.length} Yorum Paylaşıldı</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveCommentPostId(null);
                  setModalCommentInput("");
                }}
                className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments Thread (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/25 dark:bg-slate-950/15">
              
              {/* Orijinal Paylaşım (Topic) Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800/60 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {activePost.author.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                        {activePost.author.name}
                      </h4>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                        {activePost.createdAt?.toDate ? activePost.createdAt.toDate().toLocaleString("tr-TR", { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "Yeni"}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 dark:bg-orange-950/20 text-[#f58220] border border-orange-100/30 dark:border-orange-900/30">
                    Konu Sahibi
                  </span>
                </div>
                <div className="space-y-1.5 pl-0.5">
                  {activePost.title && (
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {activePost.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-normal">
                    {activePost.content}
                  </p>
                </div>
              </div>

              {/* Comments Separator */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tüm Yorumlar</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/80 ml-3" />
              </div>

              {modalComments && modalComments.length > 0 ? (
                <div className="space-y-4 relative pl-1">
                  {/* Decorative vertical thread connecting line */}
                  <div className="absolute left-[16px] top-2 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800/80 -z-10" />

                  {modalComments.map((comment) => {
                    const isAuthor = comment.author.id === activePost.author.id;
                    return (
                      <div key={comment.id} className="flex items-start gap-3 group">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-400 to-slate-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm border-2 border-white dark:border-slate-900 z-10">
                          {comment.author.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-900/60 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100/70 dark:border-slate-800/60 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                                {comment.author.name}
                              </span>
                              {isAuthor && (
                                <span className="px-1.5 py-0.2 bg-orange-50 dark:bg-orange-950/20 text-[#f58220] text-[8px] font-bold rounded-md border border-orange-100/30 dark:border-orange-900/30">
                                  Yazar
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                              {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString("tr-TR", { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : "Yeni"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-normal">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <MessageSquare size={32} className="text-slate-300 dark:text-slate-600 mb-2.5" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Henüz hiç yorum yapılmamış.
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-medium">
                    Düşüncelerinizi paylaşarak sohbeti ilk siz başlatın!
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleModalAddComment} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-full border border-slate-100 dark:border-slate-800/45 focus-within:border-[#f58220]/50 dark:focus-within:border-[#f58220]/50 transition-all">
                <input
                  type="text"
                  placeholder="Yorumunuzu buraya yazın..."
                  value={modalCommentInput}
                  onChange={(e) => setModalCommentInput(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-0 focus:outline-none pl-3"
                  autoFocus
                />
                <button
                  type="submit"
                  className="h-9 w-9 rounded-full bg-[#f58220] hover:bg-[#e07216] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-orange-500/20"
                >
                  <Send size={13} className="ml-0.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
