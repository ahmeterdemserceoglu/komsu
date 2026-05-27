"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, Listing } from "@/lib/store";
import { X, Calendar, MapPin, Tag, MessageSquare, Handshake, Gift, HelpCircle, Lock, Package, Bookmark, Flag, Star, ChevronLeft, ChevronRight, Send, MessageCircle, CornerDownRight, Clock } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ReportModal from "@/components/ui/ReportModal";
import StarRating from "@/components/ui/StarRating";
import { CATEGORY_LABELS } from "@/lib/schemas";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ListingDetailDrawerProps {
  listing: Listing | null;
  onClose: () => void;
  onOpenLogin: (message: string) => void;
}

export default function ListingDetailDrawer({ listing, onClose, onOpenLogin }: ListingDetailDrawerProps) {
  const { currentUser, startConversation, toggleFavorite, isFavorited, getUserReviews, addListingComment, answerListingComment } = useStore();
  const router = useRouter();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Reviews & Comments States
  const [ownerReviews, setOwnerReviews] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  const [commentError, setCommentError] = useState("");

  // Q&A Thread states
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const handlePostAnswer = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!listing) return;

    const text = replyText[commentId]?.trim();
    if (!text) return;

    if (text.length < 2) {
      setCommentError("Cevabınız en az 2 karakter olmalıdır.");
      return;
    }

    setSubmittingAnswerId(commentId);
    setCommentError("");
    try {
      await answerListingComment(listing.id, commentId, text);
      setReplyText({ ...replyText, [commentId]: "" });
      setReplyingToId(null);
    } catch (err: any) {
      setCommentError(err.message || "Cevap gönderilemedi.");
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const isOwner = currentUser?.id === listing?.owner?.id;
  const favorited = (currentUser && listing) ? isFavorited(listing.id) : false;
  const images = listing?.imageUrls?.length ? listing.imageUrls : (listing?.imageUrl?.startsWith("http") ? [listing.imageUrl] : []);

  // Fetch Listing Owner's reviews
  useEffect(() => {
    const fetchOwnerReviews = async () => {
      if (listing?.owner?.id) {
        try {
          const reviews = await getUserReviews(listing.owner.id);
          setOwnerReviews(reviews);
        } catch (e) {
          console.error("Failed to fetch owner reviews", e);
        }
      }
    };
    fetchOwnerReviews();
  }, [listing?.owner?.id, getUserReviews]);

  // Fetch listing Q&A comments in real-time
  useEffect(() => {
    if (!listing?.id) return;

    const q = query(
      collection(db, "listings", listing.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setComments(data);
    });

    return () => unsubscribe();
  }, [listing?.id]);

  // Reset state on drawer load
  useEffect(() => {
    if (listing) {
      setCurrentImageIndex(0);
      setNewComment("");
      setActiveTab("details");
      setCommentError("");
    }
  }, [listing]);

  // Listen to search params to highlight a comment and auto-switch to Q&A comments tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const highlightId = params.get("highlightComment");
      if (highlightId && comments.length > 0) {
        setHighlightedCommentId(highlightId);
        setActiveTab("comments");
        
        // Scroll to highlighted element
        setTimeout(() => {
          const el = document.getElementById(`comment-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 600);

        // Clear query parameter from URL using shallow routing to prevent repeat triggers
        const newUrl = window.location.pathname + window.location.search.replace(/([?&])highlightComment=[^&]+(&?)/, '$1').replace(/[?&]$/, '');
        window.history.replaceState({ ...window.history.state }, "", newUrl);
      }
    }
  }, [comments]);

  if (!listing) return null;

  const avgOwnerRating = ownerReviews.length > 0
    ? ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerReviews.length
    : 0;

  const handleMessageOwner = async () => {
    await startConversation(listing.id, listing.owner);
    onClose();
  };

  const handleViewOwnerProfile = () => {
    router.push(`/profile?userId=${listing.owner.id}`);
    onClose();
  };

  const handleFavorite = () => {
    if (!currentUser) {
      onOpenLogin("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }
    toggleFavorite(listing.id);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError("");

    if (!currentUser) {
      onOpenLogin("Soru sorabilmek için önce giriş yapmalısınız.");
      return;
    }

    if (!newComment.trim()) return;

    if (newComment.trim().length < 5) {
      setCommentError("Sorunuz en az 5 karakter olmalıdır.");
      return;
    }

    setSubmittingComment(true);
    try {
      await addListingComment(listing.id, newComment.trim());
      setNewComment("");
    } catch (e: any) {
      setCommentError(e.message || "Yorum gönderilemedi.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderTypeIcon = (type: Listing["type"]) => {
    const size = 64;
    const className = "text-[#f58220] stroke-[1.25]";
    if (type === "borrow") return <Handshake size={size} className={className} />;
    if (type === "gift") return <Gift size={size} className={className} />;
    if (type === "sell") return <Tag size={size} className={className} />;
    return <HelpCircle size={size} className={className} />;
  };

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#091a35]/65 backdrop-blur-sm" />

      {/* Drawer Body */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full z-10 animate-slide-in-right border-l border-slate-100 dark:border-slate-700">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-[#091a35] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-base">
            <Package size={18} className="text-[#f58220]" />
            <span>İlan Detayı</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Favorite */}
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-full transition-colors cursor-pointer border-0 ${
                favorited ? "bg-[#f58220] text-white" : "hover:bg-white/10 text-white/80"
              }`}
            >
              <Bookmark size={16} fill={favorited ? "currentColor" : "none"} />
            </button>
            {/* Report */}
            {currentUser && !isOwner && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer border-0"
                title="Rapor Et"
              >
                <Flag size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer border-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/60 font-bold text-xs shrink-0 select-none">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all uppercase tracking-wider ${
              activeTab === "details"
                ? "border-[#f58220] text-[#f58220]"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            İlan Bilgileri
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 py-3.5 text-center border-b-2 cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              activeTab === "comments"
                ? "border-[#f58220] text-[#f58220]"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <MessageCircle size={14} />
            <span>Soru & Cevap ({comments.length})</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin">
          
          {activeTab === "details" ? (
            <>
              {/* IMAGE GALLERY / VISUAL */}
              <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 relative min-h-[220px]">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-64 object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full cursor-pointer transition-colors border-0"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full cursor-pointer transition-colors border-0"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentImageIndex(i)}
                              className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                                i === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="absolute top-3 left-3 bg-[#091a35]/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="absolute top-3 left-3 bg-[#091a35] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      İlan # {listing.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="h-24 w-24 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600 transform hover:scale-105 transition-transform">
                      {renderTypeIcon(listing.type)}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full text-white ${
                    listing.type === "borrow" ? "bg-sky-500" : listing.type === "gift" ? "bg-emerald-500" : "bg-orange-500"
                  }`}>
                    {listing.type === "borrow" ? "Ödünç Veriliyor" : listing.type === "gift" ? "Ücretsiz Hediye" : "Satılık"}
                  </span>
                </div>
              </div>

              {/* DATA CORE */}
              <div className="space-y-3">
                <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-100 leading-snug">
                  {listing.title}
                </h3>
                {listing.type === "sell" && listing.price && (
                  <p className="text-xl font-bold text-[#f58220]">
                    {listing.price.toLocaleString("tr-TR")} ₺
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {listing.description}
                </p>
              </div>

              {/* SPECIFICATIONS GRID */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Tag size={16} className="text-[#f58220] mb-1.5" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">KATEGORİ</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    {CATEGORY_LABELS[listing.category.toUpperCase()] || listing.category}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <MapPin size={16} className="text-[#f58220] mb-1.5" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TESLİM NOKTASI</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">{listing.location}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Star size={16} className="text-[#f58220] mb-1.5" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DURUM</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">{listing.condition}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Calendar size={16} className="text-[#f58220] mb-1.5" />
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TARİH</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    {listing.createdAt?.toDate ? listing.createdAt.toDate().toLocaleDateString("tr-TR") : "Yeni İlan"}
                  </div>
                </div>
              </div>

              {/* OWNER CARD */}
              <div 
                onClick={handleViewOwnerProfile}
                className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={listing.owner.name} size="lg" />
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">İLAN SAHİBİ</div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{listing.owner.name}</h4>
                    <p className="text-[10px] font-semibold text-[#f58220] truncate">{listing.owner.title}</p>
                    
                    {/* Owner star rating */}
                    {avgOwnerRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating rating={avgOwnerRating} size={11} />
                        <span className="text-[9px] font-bold text-slate-400">({ownerReviews.length})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Q&A TAB CONTENT */
            <div className="space-y-4 flex flex-col h-full">
              
              {/* Q&A Info Header */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-3 shrink-0">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-[#f58220] rounded-xl shrink-0">
                  <HelpCircle size={16} className="stroke-[1.5]" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Soru & Cevap</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    İlan sahibiyle doğrudan buradan soru-cevap yapabilirsiniz. Sorularınız ve cevaplar tüm kullanıcılara açık olarak yayınlanır.
                  </p>
                </div>
              </div>

              {/* Question list */}
              <div className="space-y-4 max-h-[300px] sm:max-h-[calc(100vh-320px)] overflow-y-auto pr-1.5 scrollbar-thin flex-1">
                {comments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-semibold text-xs leading-relaxed space-y-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <MessageSquare size={24} className="mx-auto text-slate-300 dark:text-slate-650 mb-1" />
                    <p>Bu ilan hakkında henüz soru sorulmamış.</p>
                    {isOwner ? (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Komşularınız soru sorduğunda burada görünecektir.</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">İlk soruyu soran komşu siz olun!</p>
                    )}
                  </div>
                ) : (
                  comments.map((c) => {
                    const isCommentFromOwner = c.author.id === listing.owner.id;

                    // Backward compatibility for old comments written by owner as flat comments
                    if (isCommentFromOwner) {
                      return (
                        <div key={c.id} className="p-3 rounded-2xl bg-orange-50/30 dark:bg-orange-950/5 border border-orange-100/40 dark:border-orange-900/20 ml-4 sm:ml-6 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-[#f58220] text-white flex items-center justify-center font-bold text-[8px]">
                                {c.author.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{c.author.name}</span>
                                <span className="ml-1.5 px-1 py-0.2 bg-[#f58220] text-white text-[7px] font-bold rounded">İLAN SAHİBİ</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("tr-TR") : "Şimdi"}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed pl-6 sm:pl-7">
                            {c.content}
                          </p>
                        </div>
                      );
                    }

                    const isHighlighted = c.id === highlightedCommentId;

                    // Render standard Q&A Pair
                    return (
                      <div
                        key={c.id}
                        id={`comment-${c.id}`}
                        className={`relative group border rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all space-y-3 ${
                          isHighlighted
                            ? "border-[#f58220] bg-orange-50/20 dark:bg-orange-950/10 ring-2 ring-[#f58220]/20 shadow-md animate-pulse"
                            : "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-700/80"
                        }`}
                      >
                        {/* Question Box */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 flex items-center justify-center font-bold text-[9px] select-none">
                                {c.author.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                  {c.author.name}
                                </span>
                                <span className="ml-1.5 px-1.5 py-0.2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[8px] font-bold rounded tracking-wide">
                                  KOMŞU
                                </span>
                                {isHighlighted && (
                                  <span className="ml-1.5 px-1.5 py-0.2 bg-orange-500 text-white text-[8px] font-bold rounded animate-bounce">
                                    YENİ
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("tr-TR") : "Şimdi"}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-7 sm:pl-8 leading-relaxed">
                            {c.content}
                          </p>
                        </div>

                        {/* Answer Box */}
                        {c.answer ? (
                          <div className="mt-3 ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-[#f58220]/40 space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="h-5.5 w-5.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#f58220] flex items-center justify-center font-bold text-[9px]">
                                  {listing.owner.name.slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <span className="text-[11px] font-bold text-slate-850 dark:text-slate-150">{listing.owner.name}</span>
                                  <span className="ml-1.5 px-1 py-0.2 bg-orange-50 dark:bg-orange-950/40 text-[#f58220] text-[7.5px] font-bold rounded">
                                    İLAN SAHİBİ CEVABI
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {c.answeredAt?.toDate ? c.answeredAt.toDate().toLocaleDateString("tr-TR") : "Şimdi"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed bg-orange-50/20 dark:bg-orange-950/5 p-2 sm:p-2.5 rounded-xl border border-orange-100/20 dark:border-orange-900/10">
                              {c.answer}
                            </p>
                          </div>
                        ) : (
                          /* Unanswered State */
                          <div className="mt-2.5 ml-7 sm:ml-8 flex items-center justify-between pt-0.5">
                            {isOwner ? (
                              /* Inline reply form for Owner */
                              <div className="w-full">
                                {replyingToId === c.id ? (
                                  <form onSubmit={(e) => handlePostAnswer(e, c.id)} className="flex items-center gap-1.5 mt-1">
                                    <input
                                      type="text"
                                      value={replyText[c.id] || ""}
                                      onChange={(e) => setReplyText({ ...replyText, [c.id]: e.target.value })}
                                      placeholder="Cevabınızı buraya yazın..."
                                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none font-medium text-[11px] text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] transition-all"
                                      autoFocus
                                    />
                                    <button
                                      type="submit"
                                      disabled={!(replyText[c.id]?.trim()) || submittingAnswerId === c.id}
                                      className="px-2.5 py-1.5 bg-[#f58220] text-white font-bold text-[10px] sm:text-[11px] rounded-lg hover:bg-[#e07216] transition-all disabled:opacity-50 flex items-center gap-0.5 cursor-pointer border-0 shadow-sm shrink-0"
                                    >
                                      {submittingAnswerId === c.id ? "..." : "Cevapla"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingToId(null)}
                                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] sm:text-[11px] rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border-0 shrink-0"
                                    >
                                      İptal
                                    </button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => setReplyingToId(c.id)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#f58220] hover:text-[#e07216] transition-colors border-0 bg-transparent cursor-pointer p-0 select-none"
                                  >
                                    <CornerDownRight size={13} className="text-[#f58220]" />
                                    <span>Bu Soruyu Cevapla</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* Awaiting response badge for regular user */
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full select-none">
                                <Clock size={11} className="animate-pulse" />
                                <span>Cevap bekleniyor</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Submit form - Only visible to non-owners */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 shrink-0">
                {isOwner ? (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    Kendi ilanınıza soru soramazsınız. Gelen soruları yukarıdan &quot;Bu Soruyu Cevapla&quot; seçeneğiyle cevaplayabilirsiniz.
                  </div>
                ) : (
                  <form onSubmit={handlePostComment} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => {
                          setNewComment(e.target.value);
                          setCommentError("");
                        }}
                        placeholder="İlan sahibine soru sorun (Örn: teslim yeri, eşya boyutu...)"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-medium text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] transition-all"
                        disabled={submittingComment}
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="h-9 w-9 rounded-xl bg-[#f58220] hover:bg-[#e07216] disabled:bg-slate-200 dark:disabled:bg-slate-850 text-white disabled:text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm active:scale-95 border-0"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                    {commentError && (
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">
                        {commentError}
                      </p>
                    )}
                  </form>
                )}
              </div>

            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
            {currentUser ? (
              isOwner ? (
                <div className="p-4 bg-[#091a35] text-white rounded-xl text-center font-bold text-xs">
                  Bu ilan size ait olduğu için mesaj gönderemezsiniz.
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<MessageSquare size={16} />}
                    onClick={handleMessageOwner}
                  >
                    Sohbet Başlat & Mesaj Gönder
                  </Button>
                  <Button
                    variant={favorited ? "danger" : "outline"}
                    size="md"
                    fullWidth
                    icon={<Bookmark size={16} fill={favorited ? "currentColor" : "none"} />}
                    onClick={handleFavorite}
                  >
                    {favorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                  </Button>
                </div>
              )
            ) : (
              <div className="p-6 rounded-2xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/70 dark:border-orange-800/30 text-center space-y-4 shadow-sm">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mx-auto text-[#f58220]">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">İlan Sahibiyle Görüşün</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Bu ilan sahibiyle iletişime geçmek için lütfen önce giriş yapın veya kayıt olun!
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => onOpenLogin("İlan sahibiyle görüşmek için giriş yapmalısınız.")}
                >
                  Giriş Yap & Mesaj Gönder
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="listing"
        targetId={listing.id}
        targetName={listing.title}
      />
    </div>
  );
}
