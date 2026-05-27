"use client";

import React, { useState } from "react";
import { useStore, Notification } from "@/lib/store";
import { Bell, MessageSquare, Bookmark, Zap, Star, AlertTriangle, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CountBadge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

const notifIcons: Record<Notification["type"], React.ReactNode> = {
  message_received: <MessageSquare size={16} className="text-blue-500" />,
  listing_favorited: <Bookmark size={16} className="text-[#f58220]" />,
  post_liked: <Zap size={16} className="text-amber-500" />,
  post_commented: <MessageSquare size={16} className="text-emerald-500" />,
  listing_status_changed: <AlertTriangle size={16} className="text-orange-500" />,
  review_received: <Star size={16} className="text-amber-400" />,
};

export default function NotificationBell() {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const formatTime = (timestamp: unknown) => {
    if (!timestamp) return "";
    const ts = timestamp as { toDate?: () => Date };
    const date = ts.toDate ? ts.toDate() : new Date(timestamp as string);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes}dk önce`;
    if (hours < 24) return `${hours}sa önce`;
    return `${days}g önce`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 relative transition-colors cursor-pointer border-0"
        title="Bildirimler"
      >
        <Bell size={20} className="text-white" />
        {unreadNotificationCount > 0 && (
          <CountBadge count={unreadNotificationCount} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Bildirimler
                  {unreadNotificationCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#f58220] text-white text-[10px] font-bold">
                      {unreadNotificationCount}
                    </span>
                  )}
                </h3>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[10px] font-bold text-[#f58220] hover:text-[#e07216] cursor-pointer flex items-center gap-1 border-0 bg-transparent"
                  >
                    <CheckCheck size={12} />
                    Tümünü Oku
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                      Henüz bildiriminiz yok
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) markNotificationRead(notif.id);
                        setIsOpen(false);
                        if (notif.link) {
                          router.push(notif.link);
                        }
                      }}
                      className={`w-full text-left p-3 flex items-start gap-3 border-b border-slate-50 dark:border-slate-800 transition-colors cursor-pointer border-0 ${
                        notif.read
                          ? "bg-white dark:bg-slate-900"
                          : "bg-orange-50/40 dark:bg-orange-900/10"
                      } hover:bg-slate-50 dark:hover:bg-slate-800`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {notifIcons[notif.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#f58220] shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
