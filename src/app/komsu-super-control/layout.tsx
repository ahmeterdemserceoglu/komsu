"use client";

import React from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, Flag, ArrowLeft, Shield } from "lucide-react";

const NAV_ITEMS = [
  { href: "/komsu-super-control", label: "Dashboard", icon: LayoutDashboard },
  { href: "/komsu-super-control/listings", label: "İlanlar", icon: Package },
  { href: "/komsu-super-control/users", label: "Kullanıcılar", icon: Users },
  { href: "/komsu-super-control/reports", label: "Raporlar", icon: Flag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  // Admin guard
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center max-w-sm shadow-lg">
          <div className="h-16 w-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-500" />
          </div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Erişim Engellendi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Bu sayfaya erişmek için admin yetkisine sahip olmalısınız.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-[#091a35] hover:bg-[#152a4e] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-[#091a35] text-white flex flex-col border-r border-[#152a4e] shrink-0 hidden md:flex">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
            <ArrowLeft size={14} /> Ana Sayfaya Dön
          </Link>
          <h2 className="font-bold text-lg mt-3 flex items-center gap-2">
            <Shield size={18} className="text-[#f58220]" />
            Admin Panel
          </h2>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#f58220] text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-[10px] text-slate-500 font-semibold">
            Giriş: {currentUser.name}
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#091a35] border-t border-[#152a4e] px-2 py-2 flex justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold ${
                isActive ? "text-[#f58220]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
