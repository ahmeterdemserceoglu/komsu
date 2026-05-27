"use client";

import { User } from "@/lib/store";
import Link from "next/link";
import { Hand } from "lucide-react";

interface UserCardProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function UserCard({ currentUser, onLoginClick, onLogout }: UserCardProps) {
  if (currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
        <span className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-inner border border-white mb-3 select-none">
          {currentUser.name.slice(0, 2).toUpperCase()}
        </span>
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 line-clamp-1">{currentUser.name}</h2>
        <p className="text-slate-400 dark:text-slate-550 text-xs font-semibold uppercase mt-0.5 tracking-wider">{currentUser.title}</p>

        <div className="grid grid-cols-2 gap-2 w-full mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link
            href="/profile"
            className="py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center border border-slate-200 dark:border-slate-750"
          >
            Profilim
          </Link>
          <button
            onClick={onLogout}
            className="py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
      <div className="h-14 w-14 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mx-auto mb-4">
        <Hand className="text-[#f58220]" size={28} />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Aramıza Katılın!</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
        İlan vermek, diğer kullanıcılarla sohbet etmek ve eşya paylaşmak için hemen giriş yapın.
      </p>
      <button
        onClick={onLoginClick}
        className="w-full py-2.5 bg-[#091a35] hover:bg-[#152a4e] dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl mt-4 transition-colors cursor-pointer shadow-sm"
      >
        Giriş Yap / Üye Ol
      </button>
    </div>
  );
}
