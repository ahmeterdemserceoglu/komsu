"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { collection, getDocs, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Package,
  Users,
  TrendingUp,
  Eye,
  Flag,
  ShieldAlert,
  Zap,
  Bell,
  CheckCircle,
  XCircle,
  ArrowRight,
  X,
  Send,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Mock data to bring the dashboard to life
const MOCK_DATA = {
  totalUsers: 138,
  pendingReports: 5,
  criticalReports: [
    { id: "rep_001", reason: "Uygunsuz profil fotoğrafı", user: "Ayşe V.", time: "2 saat önce" },
    { id: "rep_002", reason: "Spam içerikli ilan", user: "Mehmet K.", time: "5 saat önce" },
    { id: "rep_003", reason: "Taciz edici mesaj", user: "Zeynep A.", time: "1 gün önce" },
  ],
  auditLog: [
    { admin: "Admin_1", action: "İlanı sildi: 'Eski Monitör'", time: "15 dakika önce", icon: XCircle, color: "text-red-500" },
    { admin: "Admin_2", action: "Kullanıcıyı doğruladı: 'Hasan T.'", time: "45 dakika önce", icon: CheckCircle, color: "text-green-500" },
  ],
};

const AnnouncementModal = ({ isOpen, onClose, onSubmit }: any) => {
    const [content, setContent] = useState({ title: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!content.title || !content.message) return;
        setIsSubmitting(true);
        await onSubmit(content);
        setIsSubmitting(false);
        setContent({ title: '', message: '' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><Bell size={18}/>Genel Duyuru Yayınla</h3>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Duyuru Başlığı</label>
                                    <input 
                                        type="text"
                                        value={content.title}
                                        onChange={(e) => setContent({...content, title: e.target.value})}
                                        placeholder="Örn: Sistem Bakım Çalışması"
                                        className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#f58220]"
                                    />
                                </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Duyuru Mesajı</label>
                                    <textarea 
                                        value={content.message}
                                        onChange={(e) => setContent({...content, message: e.target.value})}
                                        placeholder="Tüm kullanıcılara gönderilecek mesajı buraya yazın..."
                                        rows={5}
                                        className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#f58220]"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">İptal</button>
                                <button type="submit" disabled={isSubmitting || !content.title || !content.message} className="px-6 py-2 text-sm font-bold text-white bg-[#091a35] rounded-lg hover:bg-[#152a4e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isSubmitting ? <><div className='h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin'></div> Yollanıyor...</> : <><Send size={14}/>Tüm Üyelere Yolla</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function AdminDashboardV2() {
  const { listings, showToast } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSendAnnouncement = async ({ title, message }: { title: string; message: string }) => {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        if (usersSnapshot.empty) {
            showToast({ message: "Bildirim gönderilecek kullanıcı bulunamadı.", type: "error" });
            return;
        }

        const batch = writeBatch(db);
        usersSnapshot.forEach(userDoc => {
            const notificationRef = doc(collection(db, `users/${userDoc.id}/notifications`));
            batch.set(notificationRef, {
                type: "announcement",
                title: title,
                message: message,
                read: false,
                createdAt: serverTimestamp(),
                link: "/", // Link to homepage or a specific announcements page
                fromUser: null
            });
        });

        await batch.commit();
        showToast({ message: `${usersSnapshot.size} kullanıcıya duyuru başarıyla gönderildi.`, type: "success" });
        setIsModalOpen(false);

    } catch (error: any) {
        console.error("Duyuru gönderilemedi:", error);
        showToast({ message: `Hata: ${error.message}`, type: "error" });
    }
  };

  const stats = [
    { label: "Toplam Kullanıcı", value: MOCK_DATA.totalUsers, icon: Users, color: "text-violet-500", bgColor: "bg-violet-50 dark:bg-violet-900/30" },
    { label: "Toplam İlan", value: listings.length, icon: Package, color: "text-sky-500", bgColor: "bg-sky-50 dark:bg-sky-900/30" },
    { label: "Bekleyen Raporlar", value: MOCK_DATA.pendingReports, icon: Flag, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  ];
  
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } } };

  return (
    <>
        <AnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSendAnnouncement} />
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
                <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-5 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]">
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${stat.bgColor}`}><stat.icon size={26} className={stat.color} /></div>
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-red-500" /> Acil Müdahale Gereken Raporlar</h3>
                <div className="space-y-3">
                    {MOCK_DATA.criticalReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{report.reason}</p>
                            <p className="text-xs text-slate-500">Kullanıcı: <span className="font-medium">{report.user}</span> &bull; {report.time}</p>
                        </div>
                        <Link href={`/komsu-super-control/reports?reportId=${report.id}`} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    ))}
                    <Link href="/komsu-super-control/reports" className="w-full block text-center mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors">Tüm Raporları Gör</Link>
                </div>
                </motion.div>

                {/* Quick Actions & Audit Log */}
                <div className="space-y-6">
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Zap size={18} className="text-sky-500" /> Hızlı Eylemler</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsModalOpen(true)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/50 border border-transparent hover:border-sky-500 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"><Bell size={14}/> Duyuru Yayınla</button>
                        <Link href="/komsu-super-control/users?filter=pending_approval" className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/50 border border-transparent hover:border-green-500 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"><CheckCircle size={14}/> Onay Bekleyenler</Link>
                    </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Eye size={18} className="text-slate-500" /> Yönetici Hareketleri</h3>
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
        </motion.div>
    </>
  );
}
