"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useStore, Listing, FeedPost } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Compass, ArrowRight, Zap, Search, Package, MessageSquare, Megaphone } from "lucide-react";
import ListingDetailDrawer from "@/components/listing/ListingDetailDrawer";
import LoginModal from "@/components/auth/LoginModal";
import Header from "@/components/layout/Header";
import CategoryFilter from "@/components/layout/CategoryFilter";
import ListingCard from "@/components/listing/ListingCard";
import Pagination from "@/components/layout/Pagination";
import UserCard from "@/components/layout/UserCard";
import ListingTypeFilter from "@/components/listing/ListingTypeFilter";

function SearchParamsHandler({
  listings,
  setSelectedListing,
  setChatOpen,
  currentUser,
  onOpenLoginForChat,
}: {
  listings: Listing[];
  setSelectedListing: (listing: Listing | null) => void;
  setChatOpen: (open: boolean) => void;
  currentUser: any;
  onOpenLoginForChat: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const openListingId = searchParams.get("openListing");
    if (openListingId && listings.length > 0) {
      const listing = listings.find((l) => l.id === openListingId);
      if (listing) {
        setSelectedListing(listing);
      }
    }
  }, [searchParams, listings, setSelectedListing]);

  // Handle openChat query parameter
  useEffect(() => {
    const shouldOpenChat = searchParams.get("openChat");
    if (shouldOpenChat === "true") {
      // Clean up the URL first
      const url = new URL(window.location.href);
      url.searchParams.delete("openChat");
      router.replace(url.pathname + url.search, { scroll: false });
      
      // Then open chat or show login modal
      if (currentUser) {
        setChatOpen(true);
      } else {
        onOpenLoginForChat();
      }
    }
  }, [searchParams, setChatOpen, currentUser, router, onOpenLoginForChat]);

  return null;
}

export default function HomePage() {
  const {
    currentUser, listings, feedPosts, conversations,
    toggleLikePost, addFeedPost, setChatOpen, logoutUser,
    listingsPage, listingsPerPage: storeListingsPerPage, setListingsPage,
  } = useStore();

  const { showToast } = useToast();

  const listingsPerPage = 15;

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState<"all" | "borrow" | "gift" | "sell" | "post">("all");

  const [feedPage, setFeedPage] = useState(1);
  const feedPostsPerPage = 8;

  // Modals / Drawer State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginActionMessage, setLoginActionMessage] = useState("");

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<"discussion" | "announcement">("discussion");
  const [postSuccess, setPostSuccess] = useState(false);

  // Stable callback for opening login modal for chat
  const handleOpenLoginForChat = useCallback(() => {
    setLoginActionMessage("Mesajlarınızı görmek için giriş yapmalısınız.");
    setIsLoginModalOpen(true);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setListingsPage(1);
    setFeedPage(1);
  }, [selectedCategory, searchQuery, activeFilter, setListingsPage]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-4 w-4 bg-[#f58220] rounded-full animate-bounce" />
          <span className="h-4 w-4 bg-[#091a35] rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="h-4 w-4 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Komşu Yükleniyor...</div>
      </div>
    );
  }

  // Intercept actions with Login Modal if unauthenticated
  const ensureAuth = (message: string, action: () => void) => {
    if (!currentUser) {
      setLoginActionMessage(message);
      setIsLoginModalOpen(true);
    } else {
      action();
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    ensureAuth("Duvarımızda paylaşım yapmak için giriş yapmalısınız.", async () => {
      try {
        await addFeedPost(newPostContent.trim(), newPostType);
        setNewPostContent("");
        setPostSuccess(true);
        setTimeout(() => setPostSuccess(false), 3000);
        showToast("success", "Paylaşımınız başarıyla panoya asıldı.");
      } catch (err: any) {
        console.error("Failed to publish post", err);
        showToast("error", err.message || "Paylaşım yayınlanırken bir hata oluştu.");
      }
    });
  };

  const handleCreateListingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    ensureAuth("İlan verebilmek için giriş yapmalısınız.", () => {
      router.push("/listing/new");
    });
  };

  const handleChatOpenClick = () => {
    ensureAuth("Mesajlarınızı görmek için giriş yapmalısınız.", () => {
      setChatOpen(true);
    });
  };

  const handleLikePostClick = (postId: string) => {
    ensureAuth("Gönderileri beğenmek için giriş yapmalısınız.", () => {
      toggleLikePost(postId);
    });
  };

  const handleInspectListing = (listing: Listing) => {
    setSelectedListing(listing);
  };

  // Filter listings based on category selection, search query and listing type
  const activeListingItems = listings.filter((item) => {
    if (item.status !== "available") return false;

    const matchesCategory = selectedCategory === "ALL" || item.category.toUpperCase() === selectedCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      activeFilter === "all" ||
      (activeFilter === "borrow" && item.type === "borrow") ||
      (activeFilter === "gift" && item.type === "gift") ||
      (activeFilter === "sell" && item.type === "sell");

    return matchesCategory && matchesSearch && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(activeListingItems.length / listingsPerPage);
  const paginatedListings = activeListingItems.slice(
    (listingsPage - 1) * listingsPerPage,
    listingsPage * listingsPerPage
  );

  // Filter feed posts based on search query
  const filteredFeedPosts = feedPosts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Feed pagination logic
  const totalFeedPages = Math.ceil(filteredFeedPosts.length / feedPostsPerPage);
  const paginatedFeedPosts = filteredFeedPosts.slice(
    (feedPage - 1) * feedPostsPerPage,
    feedPage * feedPostsPerPage
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-[#f58220] selection:text-white">

      {/* TOP HEADER */}
      <Header
        onCreateListingClick={handleCreateListingClick}
        onLoginClick={() => {
          setLoginActionMessage("Giriş yaparak hemen tüm ilanları yönetin.");
          setIsLoginModalOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        mobileMenuExtra={
          <div className="md:hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">İlan Türü</h3>
            <ListingTypeFilter
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              listings={listings}
            />
          </div>
        }
      />

      {/* MOBILE SEARCH BAR */}
      <div className="p-4 bg-[#091a35] border-t border-white/5 md:hidden">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ne aramıştınız?"
            className="w-full pl-11 pr-4 py-2.5 bg-white/10 focus:bg-white text-slate-800 placeholder-slate-300 focus:placeholder-slate-400 border border-white/10 rounded-full outline-none text-sm transition-all font-medium"
          />
          <Search className="absolute left-4 top-3.5 text-slate-300 pointer-events-none" size={16} />
        </div>
      </div>

      {/* CATEGORIES BAR */}
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT PROFILE & PANEL (3 cols / 2 cols on xl) */}
        <aside className="lg:col-span-3 xl:col-span-2 space-y-6">
          <div className="hidden lg:block">
            <UserCard
              currentUser={currentUser}
              onLoginClick={() => {
                setLoginActionMessage("Giriş yaparak tüm ilanlara ulaşın.");
                setIsLoginModalOpen(true);
              }}
              onLogout={logoutUser}
            />
          </div>

          <ListingTypeFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            listings={listings}
          />
        </aside>

        {/* MIDDLE SECTION: LISTINGS GRID & WALL (9 cols / 10 cols on xl) */}
        <section className="lg:col-span-9 xl:col-span-10 space-y-8">

          {/* CLASSIFIED LISTINGS CONTAINER */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Package size={20} className="text-[#f58220]" />
                Aktif İlanlar

              </h3>
              <Link
                href="/listings"
                className="text-xs text-[#f58220] hover:text-[#e07216] font-semibold transition-colors"
              >
                Tümünü Gör
              </Link>
            </div>

            {activeListingItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                <Compass className="mx-auto mb-3 text-slate-350 dark:text-slate-400" size={44} />
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">Aradığınız kriterde ilan bulunamadı</h4>
                <p className="text-slate-400 dark:text-slate-200 text-xs mt-1">Arama kelimenizi değiştirebilir veya farklı bir kategori seçebilirsiniz.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {paginatedListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      onClick={() => handleInspectListing(item)}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={listingsPage}
                  totalPages={totalPages}
                  onPageChange={setListingsPage}
                />
              </>
            )}
          </div>

          {/* COMMUNITY FEED BOARD */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-[#f58220]" />
                Paylaşım Duvarı

              </div>
              <Link
                href="/feed"
                className="text-xs text-[#f58220] hover:text-[#e07216] font-semibold transition-colors"
              >
                Tümünü Gör
              </Link>
            </h3>

            {/* Post Creator */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <form onSubmit={handlePublishPost} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-450 uppercase dark:text-slate-200">Yeni Paylaşım Yap</span>

                  {/* Choice between discussion and announcement */}
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setNewPostType("discussion")}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${newPostType === "discussion" ? "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-500"
                        }`}
                    >
                      Sohbet
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPostType("announcement")}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${newPostType === "announcement" ? "bg-white dark:bg-slate-950 text-[#f58220] shadow-sm" : "text-slate-500"
                        }`}
                    >
                      <Megaphone size={12} />
                      Duyuru
                    </button>
                  </div>
                </div>

                <textarea
                  value={newPostContent}
                  onChange={(e) => {
                    setNewPostContent(e.target.value);
                    setPostSuccess(false);
                  }}
                  maxLength={300}
                  placeholder="Neler paylaşmak istersiniz? (Örn. bahçedeki kediler için mama kabı arıyorum, yarın takas şenliği var vs.)"
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-[#091a35] text-sm font-medium text-slate-800 dark:text-slate-200 resize-none transition-all placeholder-slate-400"
                />

                {postSuccess && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/55 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-400 text-center animate-fade-in">
                    ✓ Paylaşımınız başarıyla panoya asıldı.
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-450 dark:text-slate-500">
                    {newPostContent.length}/300
                  </span>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim()}
                    className="px-6 py-2 bg-[#091a35] hover:bg-[#152a4e] dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Yayınla
                  </button>
                </div>
              </form>
            </div>

            {/* Posts Stream */}
            <div className="space-y-4">
              {filteredFeedPosts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
                  <p className="text-slate-400 dark:text-slate-200 text-xs">Pano henüz boş. İlk paylaşımı siz yapın!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedFeedPosts.map((post) => (
                      <article
                        key={post.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative group"
                      >
                        <div className="flex items-start justify-between mb-3.5">
                          <div className="flex items-center gap-3">
                            <span className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-xs border border-white shrink-0 select-none shadow-sm">
                              {post.author.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{post.author.name}</div>
                              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-200 mt-0.5">
                                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString("tr-TR") : "Yeni Paylaşım"}
                              </div>
                            </div>
                          </div>

                          {post.type === "announcement" ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                              <Megaphone size={10} />
                              DUYURU
                            </span>
                          ) : post.type === "listing_share" ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-[#f58220] text-[9px] font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-900/50 flex items-center gap-1">
                              <Package size={10} />
                              İLAN
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-200 text-[9px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <MessageSquare size={10} />
                              SOHBET
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          {post.title && (
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{post.title}</h4>
                          )}
                          <p className="text-sm font-medium text-slate-650 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                            {post.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                          <button
                            onClick={() => handleLikePostClick(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer px-2.5 py-1.5 rounded-lg ${currentUser && post.likedBy?.includes(currentUser.id)
                                ? "text-[#f58220] bg-orange-50/50 dark:bg-orange-950/20"
                                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                              }`}
                          >
                            <Zap size={14} strokeWidth={3} fill={currentUser && post.likedBy?.includes(currentUser.id) ? "currentColor" : "none"} />
                            <span>{post.likes || 0} Beğeni</span>
                          </button>

                          {post.type === "listing_share" && (
                            <button
                              onClick={() => {
                                // Find relevant listing
                                const relatedListing = listings.find((l) => post.content.toUpperCase().includes(l.title.toUpperCase()));
                                if (relatedListing) handleInspectListing(relatedListing);
                              }}
                              className="text-xs font-bold text-[#091a35] dark:text-slate-200 hover:text-[#f58220] dark:hover:text-[#f58220] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              İlanı İncele <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>

                  <Pagination
                    currentPage={feedPage}
                    totalPages={totalFeedPages}
                    onPageChange={setFeedPage}
                  />
                </>
              )}
            </div>
          </div>

        </section>



      </main>

      {/* DRAWERS & MODALS */}
      <Suspense fallback={null}>
        <SearchParamsHandler 
          listings={listings} 
          setSelectedListing={setSelectedListing} 
          setChatOpen={setChatOpen}
          currentUser={currentUser}
          onOpenLoginForChat={handleOpenLoginForChat}
        />
      </Suspense>

      <ListingDetailDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onOpenLogin={(msg) => ensureAuth(msg, () => { })}
      />

      {/* ACTION-BASED LOGIN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        actionMessage={loginActionMessage}
      />

    </div>
  );
}
