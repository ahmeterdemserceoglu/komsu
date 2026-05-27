"use client";

import { useStore } from "@/lib/store";
import { Home, LayoutList, Plus, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";

export default function MobileNav() {
  const { currentUser, conversations, setChatOpen } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const unreadConversationsCount = conversations.filter(conv => {
    if (!currentUser) return false;
    return conv.messages?.some(msg => 
      msg.receiverId === currentUser.id && msg.status !== 'read'
    );
  }).length;

  const handleAuthRequiredAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      action();
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0b1329] border-t border-slate-200 dark:border-slate-800 md:hidden flex items-center justify-around pb-[env(safe-area-inset-bottom)] min-h-[68px]">
        <Link href="/" className={`p-3 flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/' ? 'text-[#f58220]' : 'text-slate-500 dark:text-slate-400'}`}>
          <Home size={22} className={pathname === '/' ? 'fill-[#f58220]/20' : ''} />
          <span className="text-[9px] font-medium">Ana Sayfa</span>
        </Link>
        <Link href="/feed" className={`p-3 flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/feed' ? 'text-[#f58220]' : 'text-slate-500 dark:text-slate-400'}`}>
          <LayoutList size={22} className={pathname === '/feed' ? 'fill-[#f58220]/20' : ''} />
          <span className="text-[9px] font-medium">Feed</span>
        </Link>
        
        <div className="relative -top-5 z-50">
          <button 
            onClick={(e) => handleAuthRequiredAction(e, () => router.push('/listing/new'))}
            className="h-14 w-14 rounded-full bg-[#f58220] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 transform active:scale-95 transition-all border-4 border-white dark:border-[#0b1329]"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
        
        <button 
          onClick={(e) => handleAuthRequiredAction(e, () => setChatOpen(true))} 
          className="p-3 flex flex-col items-center gap-1 w-16 transition-colors text-slate-500 dark:text-slate-400 relative"
        >
          <MessageSquare size={22} />
          <span className="text-[9px] font-medium">Mesajlar</span>
          {unreadConversationsCount > 0 && (
            <span className="absolute top-2 right-3 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0b1329]">
              {unreadConversationsCount}
            </span>
          )}
        </button>
        
        <button 
          onClick={(e) => handleAuthRequiredAction(e, () => router.push('/profile'))}
          className={`p-3 flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/profile' ? 'text-[#f58220]' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <User size={22} className={pathname === '/profile' ? 'fill-[#f58220]/20' : ''} />
          <span className="text-[9px] font-medium">Profil</span>
        </button>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        actionMessage="Bu işlem için giriş yapmalısınız."
      />
    </>
  );
}
