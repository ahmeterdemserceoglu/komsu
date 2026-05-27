"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Flag, CheckCircle, Clock, AlertTriangle, ShieldAlert, Users, Package } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import ReportDetailDrawer from "./ReportDetailDrawer"; // Will create this next

// Simplified Report interface for the main page
export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: any;
  // Added for context
  targetData?: any; 
  reporterData?: any;
}

export const REASON_LABELS: Record<string, string> = {
  spam: "Spam / Yanıltıcı",
  inappropriate: "Uygunsuz İçerik",
  fraud: "Dolandırıcılık",
  harassment: "Taciz / Tehdit",
  other: "Diğer",
};

export const STATUS_CONFIG = {
  pending: { label: "Bekliyor", icon: Clock, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
  reviewed: { label: "İnceleniyor", icon: AlertTriangle, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/30" },
  resolved: { label: "Çözüldü", icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/30" },
};


// Report Card Component
const ReportCard = ({ report, onClick }: { report: Report; onClick: () => void }) => {
  const statusInfo = STATUS_CONFIG[report.status];
  const Icon = statusInfo.icon;
  const TargetIcon = report.targetType === 'user' ? Users : Package;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.bgColor}`}>
            <Icon size={22} className={statusInfo.color} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
              {REASON_LABELS[report.reason] || report.reason}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <TargetIcon size={12} />
              <span>#{report.targetId.slice(0, 8)}...</span>
              <span className="hidden sm:inline">&bull; Raporlayan: {report.reporterName}</span>
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
    </motion.div>
  );
};


export default function AdminReportsPageV2() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
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

  const filteredReports = useMemo(() => {
    if (statusFilter === "all") return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  const updateReportStatusInList = (reportId: string, newStatus: Report['status']) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Rapor Merkezi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {reports.length} toplam rapor, <span className="font-semibold text-amber-500">{reports.filter(r => r.status === 'pending').length}</span> bekliyor.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekleyen" },
          { key: "reviewed", label: "İnceleniyor" },
          { key: "resolved", label: "Çözüldü" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${ 
              statusFilter === f.key
                ? "bg-[#091a35] border-transparent text-white shadow-md"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-[92px] animate-pulse">
               <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
               <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="space-y-4 pt-4">
            <AnimatePresence>
              {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                      <ReportCard key={report.id} report={report} onClick={() => setSelectedReport(report)} />
                  ))
              ) : (
                  <EmptyState
                      icon={<Flag size={40} className="text-slate-400 dark:text-slate-600" />}
                      title="Rapor bulunamadı"
                      description="Bu filtrede gösterilecek bir rapor yok."
                  />
              )}
            </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedReport && (
          <ReportDetailDrawer 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)}
            onStatusChange={updateReportStatusInList}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
