"use client";

import React from "react";
import { useStore } from "@/lib/store";
import {
  Package,
  Users,
  MessageSquare,
  TrendingUp,
  Eye,
  Flag,
  ShieldAlert,
  Zap,
  Bell,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/schemas";
import Link from "next/link";
import { motion } from "framer-motion";

// Mock data to bring the dashboard to life
const MOCK_DATA = {
  totalUsers: 138,
  pendingReports: 5,
  criticalReports: [
    {
      id: "rep_001",
      reason: "Uygunsuz profil fotoğrafı",
      user: "Ayşe V.",
      time: "2 saat önce",
    },
    {
      id: "rep_002",
      reason: "Spam içerikli ilan",
      user: "Mehmet K.",
      time: "5 saat önce",
    },
     {
      id: "rep_003",
      reason: "Taciz edici mesaj",
      user: "Zeynep A.",
      time: "1 gün önce",
    },
  ],
  auditLog: [
    {
      admin: "Admin_1",
      action: "İlanı sildi: 'Eski Monitör'",
      time: "15 dakika önce",
      icon: XCircle,
      color: "text-red-500",
    },
    {
      admin: "Admin_2",
      action: "Kullanıcıyı doğruladı: 'Hasan T.'",
      time: "45 dakika önce",
      icon: CheckCircle,
      color: "text-green-500",
    },
  ],
};

export default function AdminDashboardV2() {
  const { listings, feedPosts, conversations } = useStore();

  const stats = [
    { label: "Toplam Kullanıcı", value: MOCK_DATA.totalUsers, icon: Users, color: "text-violet-500", bgColor: "bg-violet-50 dark:bg-violet-900/30" },
    { label: "Toplam İlan", value: listings.length, icon: Package, color: "text-sky-500", bgColor: "bg-sky-50 dark:bg-sky-900/30" },
    { label: "Bekleyen Raporlar", value: MOCK_DATA.pendingReports, icon: Flag, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Komuta Merkezi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platformun anlık durumu ve yönetim araçları.</p>
      </div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-5 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
              <stat.icon size={26} className={stat.color} />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action-Oriented Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Critical Reports */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" /> Acil Müdahale Gereken Raporlar
          </h3>
          <div className="space-y-3">
            {MOCK_DATA.criticalReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{report.reason}</p>
                  <p className="text-xs text-slate-500">Kullanıcı: <span className="font-medium">{report.user}</span> &bull; {report.time}</p>
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
             <Link href="/komsu-super-control/reports" className="w-full block text-center mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors">Tüm Raporları Gör</Link>
          </div>
        </motion.div>

        {/* Quick Actions & Audit Log */}
        <div className="space-y-6">
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-sky-500" /> Hızlı Eylemler
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/50 border border-transparent hover:border-sky-500 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"><Bell size={14}/> Duyuru Yayınla</button>
                 <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/50 border border-transparent hover:border-green-500 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"><CheckCircle size={14}/> Onay Bekleyenler</button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Eye size={18} className="text-slate-500" /> Yönetici Hareketleri
              </h3>
              <div className="space-y-3">
                {MOCK_DATA.auditLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <log.icon size={14} className={`mt-1 shrink-0 ${log.color}`} />
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight"><span className="font-semibold">{log.admin}</span> {log.action}</p>
                      <p className="text-[10px] text-slate-400">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
        </div>
      </div>
      
      {/* Existing Charts Row */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#f58220]" /> Kategori Dağılımı
          </h3>
          {/* ... existing chart code ... */}
        </motion.div>

        {/* Type Distribution */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Eye size={16} className="text-[#f58220]" /> İlan Türü Dağılımı
          </h3>
          {/* ... existing chart code ... */}
        </motion.div>
      </motion.div>

    </motion.div>
  );
}
