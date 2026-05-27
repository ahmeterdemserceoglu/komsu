"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Calendar, Compass, Bookmark, LogOut, Tag, MessageSquare, User as UserIcon, Zap, MapPin, Handshake, Gift, HelpCircle, Package, Edit, Trash2, Menu, X as CloseIcon, Shield
} from "lucide-react";
import Link from "next/link";
import EditProfileModal from "@/components/profile/EditProfileModal";
import EditListingModal from "@/components/listing/EditListingModal";
import StarRating from "@/components/ui/StarRating";
import ReviewModal from "@/components/ui/ReviewModal";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db, rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

const renderTypeIcon = (type: string, size = 20) => {
  const className = "text-[#f58220] stroke-[1.5]";
  if (type === "borrow") return <Handshake size={size} className={className} />;
  if (type === "gift") return <Gift size={size} className={className} />;
  if (type === "sell") return <Tag size={size} className={className} />;
  return <HelpCircle size={size} className={className} />;
};

function ProfileContent() {
  const {
    currentUser, isAuthLoading, listings, feedPosts, logoutUser, deleteListing, getUserReviews,
  } = useStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditListingModalOpen, setIsEditListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [viewedListings, setViewedListings] = useState<any[]>([]);
  const [activeMobileSection, setActiveMobileSection] = useState<"listings" | "bio">("listings");
  
  // Reviews state
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewsFetchedTrigger, setReviewsFetchedTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"listings" | "posts" | "reviews">("listings");

  const isViewingOtherUser = userIdParam && userIdParam !== currentUser?.id;
  const displayUser = isViewingOtherUser ? viewedUser : currentUser;
  const displayListings = isViewingOtherUser ? viewedListings : listings;

  const [displayUserStatus, setDisplayUserStatus] = useState<{ state: string; last_changed?: any } | null>(null);

  // Listen to presence status of displayUser
  useEffect(() => {
    if (!displayUser?.id) {
      setDisplayUserStatus(null);
      return;
    }

    const statusRef = ref(rtdb, `user_status/${displayUser.id}`);
    const unsub = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDisplayUserStatus(data);
      } else {
        setDisplayUserStatus(null);
      }
    });

    return () => unsub();
  }, [displayUser?.id]);

  // Fetch other user's data when userId is provided
  useEffect(() => {
    const fetchOtherUserData = async () => {
      if (userIdParam && userIdParam !== currentUser?.id) {
        try {
          const userDoc = await getDoc(doc(db, "users", userIdParam));
          if (userDoc.exists()) {
            setViewedUser({ id: userDoc.id, ...userDoc.data() });
            
            // Fetch user's listings
            const listingsQuery = query(collection(db, "listings"), where("owner.id", "==", userIdParam));
            const listingsSnapshot = await getDocs(listingsQuery);
            const userListings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setViewedListings(userListings);
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
        }
      }
    };

    fetchOtherUserData();
  }, [userIdParam, currentUser]);

  // Fetch user reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const targetUid = userIdParam || currentUser?.id;
      if (targetUid) {
        try {
          const reviewsData = await getUserReviews(targetUid);
          setUserReviews(reviewsData);
        } catch (error) {
          console.error("Failed to fetch user reviews", error);
        }
      }
    };
    fetchReviews();
  }, [userIdParam, currentUser, getUserReviews, reviewsFetchedTrigger]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEditListing = (listing: any) => {
    setEditingListing(listing);
    setIsEditListingModalOpen(true);
  };

  useEffect(() => {
    if (isClient && !isAuthLoading && !currentUser && !isViewingOtherUser) {
      router.push("/");
    }
  }, [isClient, isAuthLoading, currentUser, router, isViewingOtherUser]);

  if (!isClient || isAuthLoading || (!currentUser && !isViewingOtherUser) || (isViewingOtherUser && !viewedUser)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce" />
          <span className="h-3 w-3 bg-[#091a35] rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

  // Filter listings & posts owned by current user
  const myListings = displayListings.filter((l) => l.owner.id === displayUser.id);
  const myPosts = isViewingOtherUser ? [] : (currentUser ? feedPosts.filter((p) => p.author.id === currentUser.id) : []);

  // Calculate average rating
  const avgRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
    : 0;

  const refreshReviews = () => setReviewsFetchedTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-[#f58220] selection:text-white">
      
      {/* HEADER */}
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
              <Handshake size={18} className="stroke-[2.5]" />
            </span>
            <span className="font-bold text-lg tracking-tight uppercase text-white">
              paylaş
            </span>
          </div>

          {/* Burger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#091a35]">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/"
                className="block py-2 px-3 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ana Sayfa
              </Link>
              <div className="border-t border-white/10 pt-3 space-y-2">
                <button
                  onClick={() => {
                    setActiveMobileSection("listings");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    activeMobileSection === "listings" ? "bg-[#f58220] text-white" : "hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  İlanlar
                </button>
                <button
                  onClick={() => {
                    setActiveMobileSection("bio");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    activeMobileSection === "bio" ? "bg-[#f58220] text-white" : "hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  Hakkında
                </button>
              </div>
              {!isViewingOtherUser && (
                <>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
                  >
                    Profili Düzenle
                  </button>
                  <button
                    onClick={() => {
                      logoutUser();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="w-full px-4 md:px-8 lg:px-12 py-8 space-y-8 animate-fade-in">
        
        {/* PROFILE HEADER CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                {/* Avatar */}
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-4xl shrink-0 shadow-md select-none border-white relative">
              {displayUser.name.slice(0, 2).toUpperCase()}
              {displayUserStatus?.state === "online" && (
                <span className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-sm animate-pulse" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="inline-block px-3 py-1 bg-orange-50 dark:bg-orange-950/20 text-[#f58220] text-[10px] font-bold uppercase tracking-wider rounded-full border border-orange-100 dark:border-orange-900/50">
                    Aktif Üye
                  </span>
                  {displayUserStatus?.state === "online" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      çevrimiçi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-slate-200 dark:border-slate-700">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full" />
                      çevrimdışı
                    </span>
                  )}
                </div>
                <h1 className="font-bold text-3xl text-slate-800 dark:text-slate-100 leading-tight mt-1.5">
                  {displayUser.name}
                </h1>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-200 uppercase tracking-wide">{displayUser.title}</p>
                
                {/* Rating stars */}
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
                  <StarRating rating={avgRating} size={16} />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {avgRating > 0 ? `${avgRating.toFixed(1)} (${userReviews.length} Yorum)` : "Henüz değerlendirilmemiş"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg">
                  <Calendar size={14} className="text-[#f58220]" />
                  <span>Katılım: {displayUser.joinedDate || "Bilinmiyor"}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 flex gap-2">
              {!isViewingOtherUser ? (
                <>
                  {currentUser?.role === "admin" && (
                    <Link
                      href="/komsu-super-control"
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-amber-600/10"
                    >
                      <Shield size={16} /> Admin Paneli
                    </Link>
                  )}
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-[#091a35] hover:bg-[#152a4e] text-white font-bold text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit size={16} /> Düzenle
                  </button>
                  <button
                    onClick={logoutUser}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl border border-red-100 dark:border-red-900/50 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} /> Çıkış
                  </button>
                </>
              ) : (
                currentUser && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-5 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-sm rounded-xl border border-slate-200 transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-95"
                  >
                    Değerlendirme Yaz
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: BIO & IMPACT (4 cols / 3 cols on xl) */}
          <div className={`${activeMobileSection === "bio" ? "block" : "hidden"} md:block md:col-span-4 xl:col-span-3 space-y-6`}>
            
            {/* Bio Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                ✍️ {isViewingOtherUser ? "Hakkında" : "Hakkımda"}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {displayUser.bio || (isViewingOtherUser ? "Bu kullanıcı hakkında bilgi yok." : "Kendiniz hakkında bir şeyler yazın.")}
              </p>
            </div>

            {/* IMPACT STATS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-center">
                Paylaşım Katkı Skoru
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                  <span className="font-bold text-3xl text-[#091a35] dark:text-slate-100">{myListings.length}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-200 font-bold uppercase tracking-wider mt-1.5">Aktif İlan</span>
                </div>
                {!isViewingOtherUser ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <span className="font-bold text-3xl text-[#f58220]">{myPosts.length}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-200 font-bold uppercase tracking-wider mt-1.5">Duvar Mesajı</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <span className="font-bold text-3xl text-emerald-500">{userReviews.length}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-200 font-bold uppercase tracking-wider mt-1.5">Değerlendirme</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LISTINGS & POSTS & REVIEWS TABS (8 cols / 9 cols on xl) */}
          <div className={`${activeMobileSection === "listings" ? "block" : "hidden"} md:block md:col-span-8 xl:col-span-9 space-y-6`}>
            
            {/* Unified right card with tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 gap-6 text-sm font-bold">
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    activeTab === "listings" ? "text-[#f58220]" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-350"
                  }`}
                >
                  İlanlar ({myListings.length})
                  {activeTab === "listings" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f58220] rounded-full" />
                  )}
                </button>

                {!isViewingOtherUser && (
                  <button
                    onClick={() => setActiveTab("posts")}
                    className={`pb-3 transition-colors cursor-pointer relative ${
                      activeTab === "posts" ? "text-[#f58220]" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-350"
                    }`}
                  >
                    Duvar Paylaşımlarım ({myPosts.length})
                    {activeTab === "posts" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f58220] rounded-full" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-3 transition-colors cursor-pointer relative ${
                    activeTab === "reviews" ? "text-[#f58220]" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-350"
                  }`}
                >
                  Değerlendirmeler ({userReviews.length})
                  {activeTab === "reviews" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f58220] rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="pt-2">
                {activeTab === "listings" && (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                    {myListings.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 text-center py-8">
                        {isViewingOtherUser ? "Bu kullanıcı henüz aktif bir ilan açmamış." : "Henüz aktif bir ilan açmadınız."}
                      </p>
                    ) : (
                      myListings.map((item, index) => (
                        <div key={item.id ? `${item.id}-${index}` : `listing-${index}`} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex gap-3 items-center min-w-0">
                            <span className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 select-none shadow-sm">
                              {renderTypeIcon(item.type)}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{item.title}</h4>
                              <div className="flex gap-2 mt-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                                  item.type === "borrow" ? "bg-sky-500" : item.type === "gift" ? "bg-emerald-500" : "bg-orange-500"
                                }`}>
                                  {item.type === "borrow" ? "Ödünç" : item.type === "gift" ? "Hediye" : "Satılık"}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-200 uppercase">
                                  {item.condition}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-200 rounded-full text-[9px] font-bold uppercase">
                              {item.status === "available" ? "Yayında" : item.status === "reserved" ? "Rezerve" : "Tamamlandı"}
                            </span>
                            {!isViewingOtherUser && (
                              <>
                                <button
                                  onClick={() => handleEditListing(item)}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer border-0"
                                  title="İlanı Düzenle"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => deleteListing(item.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer border-0"
                                  title="İlanı Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "posts" && !isViewingOtherUser && (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                    {myPosts.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 text-center py-8">Panoda henüz hiç paylaşımınız yok.</p>
                    ) : (
                      myPosts.map((post, index) => (
                        <div key={post.id ? `${post.id}-${index}` : `post-${index}`} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400 dark:text-slate-200">
                              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString("tr-TR") : "Yeni"}
                            </span>
                            <span className={`px-2 py-0.5 rounded border ${
                              post.type === "announcement" ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-450 border-red-200 dark:border-red-900/50" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                            }`}>
                              {post.type === "announcement" ? "Duyuru" : "Sohbet"}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-100 leading-relaxed border-l-3 border-[#f58220] pl-3 py-0.5">
                            {post.content}
                          </p>
                          <div className="flex gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-200 border-t border-slate-200/50 dark:border-slate-800 pt-2.5">
                            <span className="flex items-center gap-1"><Zap size={12} strokeWidth={3} className="text-[#f58220]" /> {post.likes} Beğeni</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                    {userReviews.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 text-center py-8">Henüz hiç değerlendirme yapılmamış.</p>
                    ) : (
                      userReviews.map((review, index) => (
                        <div key={review.id ? `${review.id}-${index}` : `review-${index}`} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/85 rounded-2xl space-y-3 shadow-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <span className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-[10.5px] select-none border border-white dark:border-slate-800 shadow-sm">
                                {review.reviewerName.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{review.reviewerName}</h4>
                                <div className="mt-0.5">
                                  <StarRating rating={review.rating} size={11} />
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString("tr-TR") : "Az Önce"}
                            </span>
                          </div>
                          
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed italic bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            &quot;{review.comment}&quot;
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </main>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <EditListingModal 
        isOpen={isEditListingModalOpen} 
        onClose={() => setIsEditListingModalOpen(false)} 
        listing={editingListing} 
      />

      {/* Reviews Modal */}
      {isReviewModalOpen && viewedUser && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            refreshReviews();
          }}
          reviewedUserId={viewedUser.id}
          reviewedUserName={viewedUser.name}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-around z-40">
        <button
          onClick={() => setActiveMobileSection("listings")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeMobileSection === "listings" ? "text-[#f58220]" : "text-slate-400"
          }`}
        >
          <Package size={20} />
          <span className="text-[10px] font-semibold">İlanlar</span>
        </button>
        <button
          onClick={() => setActiveMobileSection("bio")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeMobileSection === "bio" ? "text-[#f58220]" : "text-slate-400"
          }`}
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-semibold">Hakkında</span>
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce" />
          <span className="h-3 w-3 bg-[#091a35] rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Yükleniyor...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
