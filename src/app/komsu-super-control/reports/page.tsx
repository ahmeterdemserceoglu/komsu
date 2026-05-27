"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Flag, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: any;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam / Yanıltıcı",
  inappropriate: "Uygunsuz İçerik",
  fraud: "Dolandırıcılık",
  harassment: "Taciz / Tehdit",
  other: "Diğer",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
        setReports(data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleStatusChange = async (reportId: string, newStatus: "reviewed" | "resolved") => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to update report status", err);
    }
  };

  const handleRemoveListing = async (report: Report) => {
    if (!confirm("Bu ilanı yayından kaldırmak istediğinizden emin misiniz?")) return;
    try {
      const listingRef = doc(db, "listings", report.targetId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const listingData = listingSnap.data();
        const ownerId = listingData.owner.id;
        
        // Update listing status to "archived" instead of deleting
        await updateDoc(listingRef, { status: "archived" });
        
        // Notify owner
        await addDoc(collection(db, "notifications", ownerId, "items"), {
          type: "listing_status_changed",
          title: "İlanınız Yayından Kaldırıldı",
          message: `"${listingData.title}" başlıklı ilanınız moderasyon kurallarını ihlal ettiği için yayından kaldırılmıştır (arşivlenmiştir).`,
          read: false,
          createdAt: serverTimestamp(),
          link: "",
          fromUser: null
        });
      } else {
        alert("İlan veritabanında bulunamadı. Zaten silinmiş veya yayından kaldırılmış olabilir.");
      }
      
      // Resolve report
      await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: "resolved" } : r))
      );
      alert("İlan başarıyla yayından kaldırıldı ve rapor çözüldü.");
    } catch (err) {
      console.error("Failed to remove listing", err);
      alert("İlan yayından kaldırılırken hata oluştu.");
    }
  };

  const handleBanUser = async (report: Report) => {
    let targetUid = "";
    let targetName = "";
    
    if (report.targetType === "user") {
      targetUid = report.targetId;
      targetName = "bu kullanıcıyı";
    } else {
      // Fetch listing to get owner ID
      try {
        const listingSnap = await getDoc(doc(db, "listings", report.targetId));
        if (listingSnap.exists()) {
          targetUid = listingSnap.data().owner.id;
          targetName = listingSnap.data().owner.name;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    if (!targetUid) {
      alert("Kullanıcı bilgisi bulunamadı.");
      return;
    }
    
    if (!confirm(`Sistem kurallarını ihlal ettiği gerekçesiyle ${targetName} engellemek (yasaklamak) istediğinizden emin misiniz?`)) return;
    
    try {
      await updateDoc(doc(db, "users", targetUid), { 
        isBanned: true,
        role: "banned"
      });
      
      // Resolve report
      await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: "resolved" } : r))
      );
      alert("Kullanıcı başarıyla yasaklandı ve rapor çözüldü.");
    } catch (err) {
      console.error("Failed to ban user", err);
      alert("Kullanıcı engellenirken hata oluştu.");
    }
  };

  const handleWarnUser = async (report: Report) => {
    let targetUid = "";
    let targetName = "";
    
    if (report.targetType === "user") {
      targetUid = report.targetId;
      targetName = "Kullanıcıya";
    } else {
      try {
        const listingSnap = await getDoc(doc(db, "listings", report.targetId));
        if (listingSnap.exists()) {
          targetUid = listingSnap.data().owner.id;
          targetName = listingSnap.data().owner.name;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    if (!targetUid) {
      alert("Kullanıcı bilgisi bulunamadı.");
      return;
    }
    
    const warningMsg = prompt(`${targetName} göndermek istediğiniz uyarı mesajını yazın:`);
    if (!warningMsg || !warningMsg.trim()) return;
    
    try {
      await addDoc(collection(db, "notifications", targetUid, "items"), {
        type: "listing_status_changed",
        title: "Moderatör Uyarısı",
        message: warningMsg.trim(),
        read: false,
        createdAt: serverTimestamp(),
        link: "",
        fromUser: null
      });
      
      // Mark as reviewed
      await updateDoc(doc(db, "reports", report.id), { status: "reviewed" });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: "reviewed" } : r))
      );
      alert("Uyarı mesajı başarıyla iletildi.");
    } catch (err) {
      console.error("Failed to send warning", err);
      alert("Uyarı gönderilemedi.");
    }
  };

  const filtered = reports.filter((r) => statusFilter === "all" || r.status === statusFilter);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Rapor Yönetimi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {reports.length} rapor — {pendingCount} bekleyen
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekleyen" },
          { key: "reviewed", label: "İncelendi" },
          { key: "resolved", label: "Çözüldü" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              statusFilter === f.key
                ? "bg-[#091a35] border-[#091a35] text-white"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Flag size={40} className="text-slate-300" />}
          title="Rapor bulunamadı"
          description="Seçilen filtreye uygun rapor yok."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    report.status === "pending"
                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-500"
                      : report.status === "reviewed"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-500"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                  }`}>
                    {report.status === "pending" ? <Clock size={20} /> : report.status === "reviewed" ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {REASON_LABELS[report.reason] || report.reason}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {report.targetType === "listing" ? "İlan" : "Kullanıcı"} — #{report.targetId.slice(0, 8)} — Raporlayan: {report.reporterName}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  report.status === "pending"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    : report.status === "reviewed"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}>
                  {report.status === "pending" ? "Bekliyor" : report.status === "reviewed" ? "İncelendi" : "Çözüldü"}
                </span>
              </div>

              {report.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3">
                  &quot;{report.description}&quot;
                </p>
              )}

              {report.status !== "resolved" && (
                <div className="flex flex-wrap gap-2">
                  {report.status === "pending" && (
                    <button
                      onClick={() => handleStatusChange(report.id, "reviewed")}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer border-0"
                    >
                      İncelendi Olarak İşaretle
                    </button>
                  )}

                  {/* Warn User */}
                  <button
                    onClick={() => handleWarnUser(report)}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer border-0"
                  >
                    Uyarı Gönder
                  </button>

                  {/* Remove Listing */}
                  {report.targetType === "listing" && (
                    <button
                      onClick={() => handleRemoveListing(report)}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer border-0"
                    >
                      İlanı Yayından Kaldır
                    </button>
                  )}

                  {/* Ban User */}
                  <button
                    onClick={() => handleBanUser(report)}
                    className="px-3 py-1.5 bg-[#091a35] hover:bg-[#152a4e] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border-0"
                  >
                    Kullanıcıyı Yasakla (Ban)
                  </button>

                  <button
                    onClick={() => handleStatusChange(report.id, "resolved")}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer border-0"
                  >
                    Çözüldü Olarak İşaretle
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
