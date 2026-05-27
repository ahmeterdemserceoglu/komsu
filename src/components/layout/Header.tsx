"use client";

import React, { useState } from "react";
import { MessageSquare, Plus, Search, LogOut, Bookmark, Sun, Moon, Menu, X } from "lucide-react";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { useStore, Listing } from "@/lib/store";
import NotificationBell from "@/components/ui/NotificationBell";
import FavoritesModal from "@/components/listing/FavoritesModal";
import ListingDetailDrawer from "@/components/listing/ListingDetailDrawer";
import NewListingModal from "@/components/listing/NewListingModal";
import Drawer from "@/components/ui/Drawer";

interface HeaderProps {
  onCreateListingClick: (e: React.MouseEvent) => void;
  onLoginClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  mobileMenuExtra?: React.ReactNode;
}

export default function Header({ onCreateListingClick, onLoginClick, searchQuery, onSearchChange, mobileMenuExtra }: HeaderProps) {
  const { currentUser, conversations, logoutUser, setChatOpen, theme, setTheme } = useStore();
  
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isNewListingOpen, setIsNewListingOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate unread conversations count
  const unreadConversationsCount = conversations.filter(conv => {
    if (!currentUser) return false;
    const hasUnreadMessages = conv.messages?.some(msg => 
      msg.receiverId === currentUser.id && msg.status !== 'read'
    );
    return hasUnreadMessages;
  }).length;

  const favoriteCount = currentUser?.favorites?.length || 0;

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-30 bg-[#091a35] text-white px-4 md:px-8 lg:px-12 py-3.5 shadow-md">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="h-10 w-10 bg-[#f58220] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 transform group-hover:scale-105 transition-all text-white">
            <Handshake size={22} className="stroke-[2.5]" />
          </span>
          <span className="font-bold text-2xl tracking-tight uppercase text-white">
            paylaş
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ne aramıştınız? (Örn. matkap, ekşi maya, saksı...)"
            className="w-full pl-11 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-slate-800 focus:text-slate-800 placeholder-slate-300 focus:placeholder-slate-400 border border-white/10 focus:border-[#f58220] rounded-full outline-none text-sm transition-all font-medium"
          />
          <Search className="absolute left-4 top-3 text-slate-300 pointer-events-none" size={16} />
        </div>

        {/* Actions / Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications on all screens (next to the Plus button) */}
          {currentUser && (
            <div className="shrink-0">
              <NotificationBell />
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              if (!currentUser) {
                onLoginClick();
              } else {
                setIsNewListingOpen(true);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-sm rounded-full transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-95 border-0"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="hidden sm:inline">Ücretsiz İlan Ver</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:block p-2.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            title={theme === "light" ? "Koyu Tema" : theme === "dark" ? "Sistem Teması" : "Açık Tema"}
          >
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Favorites */}
          {currentUser && (
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="hidden md:block p-2.5 rounded-full bg-white/10 hover:bg-white/15 relative transition-colors cursor-pointer border-0"
              title="Favorilerim"
            >
              <Bookmark size={18} />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#f58220] border-2 border-[#091a35] text-white text-[10px] font-black flex items-center justify-center">
                  {favoriteCount > 99 ? "99+" : favoriteCount}
                </span>
              )}
            </button>
          )}


          
          {/* Messages */}
          {currentUser && (
            <button
              onClick={() => setChatOpen(true)}
              className="hidden md:block p-2.5 rounded-full bg-white/10 hover:bg-white/15 relative transition-colors cursor-pointer"
              title="Mesajlar"
            >
              <MessageSquare size={20} />
              {unreadConversationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#f58220] border-2 border-[#091a35] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadConversationsCount}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/profile"
                className="h-10 w-10 rounded-full border-2 border-white/20 hover:border-[#f58220] bg-[#f58220] text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-sm select-none"
                title="Profilim"
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </Link>
              <button
                onClick={logoutUser}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-red-400 hover:text-red-300 transition-colors cursor-pointer hidden md:block"
                title="Çıkış Yap"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="hidden md:block px-5 py-2 border border-white/30 hover:border-white hover:bg-white/5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer text-white ml-2"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <NewListingModal
        isOpen={isNewListingOpen}
        onClose={() => setIsNewListingOpen(false)}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onInspectListing={(listing) => setSelectedListing(listing)}
      />

      <ListingDetailDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onOpenLogin={onLoginClick}
      />

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Menü"
        side="right"
      >
        <div className="p-5 flex flex-col gap-6">
          <div className="space-y-4">
            {/* Quick Actions */}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hızlı İşlemler</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsFavoritesOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark size={20} className={favoriteCount > 0 ? "text-[#f58220]" : ""} />
                    Favorilerim
                  </div>
                  {favoriteCount > 0 && (
                    <span className="bg-[#f58220] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {favoriteCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {mobileMenuExtra && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              {mobileMenuExtra}
            </div>
          )}
          
          {currentUser && (
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                onClick={() => {
                  logoutUser();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold"
              >
                <LogOut size={18} />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </Drawer>
    </header>
  );
}
