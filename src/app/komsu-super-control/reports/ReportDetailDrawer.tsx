"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, ShieldAlert, User as UserIcon, Package, MessageCircle, Calendar, AlertOctagon, Trash2, UserX, Send, CheckCircle } from 'lucide-react';
import { Report, REASON_LABELS, STATUS_CONFIG } from './page';
import UserCard from '@/components/layout/UserCard';
import ListingCard from '@/components/listing/ListingCard';
import { useStore, User, Listing } from '@/lib/store';
import { ActionModal } from '@/components/ui/ActionModal';

interface ReportDetailDrawerProps {
  report: Report;
  onClose: () => void;
  onStatusChange: (reportId: string, newStatus: Report['status']) => void;
}

export default function ReportDetailDrawer({ report, onClose, onStatusChange }: ReportDetailDrawerProps) {
  const [targetData, setTargetData] = useState<User | Listing | null>(null);
  const [reporterData, setReporterData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
  const { showToast, currentUser, logoutUser } = useStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const targetRef = doc(db, report.targetType === 'listing' ? 'listings' : 'users', report.targetId);
        const reporterRef = doc(db, 'users', report.reporterId);
        const [targetSnap, reporterSnap] = await Promise.all([getDoc(targetRef), getDoc(reporterRef)]);
        
        if (targetSnap.exists()) {
            setTargetData({ id: targetSnap.id, ...targetSnap.data() } as User | Listing);
        } else {
            setTargetData(null);
        }

        if (reporterSnap.exists()) {
            setReporterData({ id: reporterSnap.id, ...reporterSnap.data() } as User);
        } else {
            setReporterData(null)
        }

      } catch (error) {
        console.error('Failed to fetch report details:', error);
        showToast({ message: 'Rapor detayları yüklenemedi.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [report, showToast]);

  const handleAction = async () => {
    const action = modalState.action;
    setModalState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, 'reports', report.id);

      if (action === 'resolve_report') {
          batch.update(reportRef, { status: 'resolved' });
          await batch.commit();
          onStatusChange(report.id, 'resolved');
          showToast({ message: 'Rapor çözüldü olarak işaretlendi.', type: 'success' });
      } else if (action === 'archive_listing') {
        if (report.targetType !== 'listing') throw new Error("Hedef bir ilan değil.");
        const listingRef = doc(db, 'listings', report.targetId);
        batch.update(listingRef, { status: 'archived' });
        batch.update(reportRef, { status: 'resolved' });
        await batch.commit();
        onStatusChange(report.id, 'resolved');
        showToast({ message: 'İlan arşivlendi ve rapor çözüldü.', type: 'success' });
      } else if (action === 'ban_user') {
        const targetIsListing = report.targetType === 'listing';
        const userIdToBan = targetIsListing ? (targetData as Listing)?.owner.id : report.targetId;

        if (!userIdToBan) throw new Error('Yasaklanacak kullanıcı IDsi bulunamadı.');
        const userRef = doc(db, 'users', userIdToBan);
        batch.update(userRef, { isBanned: true, role: 'banned' });
        batch.update(reportRef, { status: 'resolved' });
        await batch.commit();
        onStatusChange(report.id, 'resolved');
        showToast({ message: 'Kullanıcı yasaklandı ve rapor çözüldü.', type: 'success' });
      }

      setModalState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
      onClose(); 
    } catch (error: any) {
      console.error('Moderasyon işlemi başarısız:', error);
      showToast({ message: `Hata: ${error.message}`, type: 'error' });
      setModalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openModal = (action: 'archive_listing' | 'ban_user' | 'resolve_report') => {
      let title = '', description = '';
      switch(action){
          case 'archive_listing':
              title = 'İlanı Arşivle?';
              description = 'Bu ilanı yayından kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilan kalıcı olarak arşivlenir.';
              break;
          case 'ban_user':
              const userName = (targetData as User)?.name || 'bu kullanıcıyı';
              title = 'Kullanıcıyı Yasakla?';
              description = `${userName} adlı kullanıcıyı kalıcı olarak yasaklamak istediğinizden emin misiniz? Kullanıcı bir daha platforma giriş yapamaz.`;
              break;
          case 'resolve_report':
              title = 'Raporu Kapat?';
              description = 'Bu raporun geçersiz olduğuna ve bir işlem yapılmasına gerek olmadığına emin misiniz?';
              break;
      }
    setModalState({ isOpen: true, action, title, description, isSubmitting: false });
  };

  const getModalActionType = () => {
      switch(modalState.action) {
          case 'archive_listing':
          case 'ban_user':
              return 'ban';
          case 'resolve_report':
              return 'approve';
          default: 
              return 'default';
      }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 40 }}
        className="fixed top-0 right-0 z-40 h-full w-full max-w-lg bg-slate-50 dark:bg-slate-950 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><ShieldAlert size={20} />Rapor Detayı</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
            <div className='space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800'>
                <div className='flex justify-between items-start'>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{REASON_LABELS[report.reason]}</p>
                        <p className='text-xs text-slate-500'>ID: {report.id}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_CONFIG[report.status].bgColor} ${STATUS_CONFIG[report.status].color}`}>{STATUS_CONFIG[report.status].label}</div>
                </div>
                {report.description && <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg"> &ldquo;{report.description}&rdquo;</p>}
                 <div className='text-xs text-slate-400 flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800'>
                    <span className='flex items-center gap-1.5'><MessageCircle size={12}/>Raporlayan: <span className='font-semibold text-slate-600 dark:text-slate-200'>{reporterData?.name || '...'}</span></span>
                    <span className='flex items-center gap-1.5'><Calendar size={12}/>Tarih: <span className='font-semibold text-slate-600 dark:text-slate-200'>{new Date(report.createdAt.seconds * 1000).toLocaleString()}</span></span>
                 </div>
            </div>

            <div>
                <h4 className='text-sm font-bold mb-2 text-slate-800 dark:text-slate-200'>{report.targetType === 'listing' ? 'Rapor Edilen İlan' : 'Rapor Edilen Kullanıcı'}</h4>
                {loading ? <div className='h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse'></div> :
                targetData ? (
                    report.targetType === 'listing' ? <ListingCard item={targetData as Listing} onClick={() => {}} /> : <UserCard currentUser={targetData as User} onLoginClick={() => {}} onLogout={() => {}} />
                ) : <div className='text-center py-10'><p className='text-sm text-slate-500'>Rapor edilen içerik bulunamadı veya silinmiş.</p></div>}
            </div>

            <div className='space-y-4'>
                <h4 className='text-sm font-bold text-slate-800 dark:text-slate-200'>İnceleme ve Karar</h4>
                <div className='grid grid-cols-2 gap-2'>
                     <button disabled className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-slate-200/80 dark:bg-slate-800 transition-colors opacity-50 cursor-not-allowed'><Send size={14}/>Kullanıcıya Uyarı Gönder</button>
                     <button onClick={() => openModal('resolve_report')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 transition-colors'><CheckCircle size={14}/>Raporu Kapat (Geçerli Değil)</button>
                </div>

                <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3'>
                     <h5 className='font-bold text-red-600 dark:text-red-400 flex items-center gap-2'><AlertOctagon size={16}/>Yıkıcı Eylemler</h5>
                     <p className='text-xs text-red-500/80'>Bu bölgedeki eylemler kalıcı sonuçlar doğurabilir. Dikkatli olun.</p>
                     <div className='grid grid-cols-2 gap-2'>
                         {report.targetType === 'listing' && <button onClick={() => openModal('archive_listing')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors'><Trash2 size={14}/>İlanı Arşivle</button>}
                         <button onClick={() => openModal('ban_user')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors'><UserX size={14}/>Kullanıcıyı Yasakla</button>
                     </div>
                </div>
            </div>
        </div>
      </motion.div>

      <ActionModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleAction}
        title={modalState.title}
        description={modalState.description}
        action={getModalActionType()}
        isSubmitting={modalState.isSubmitting}
      />
    </>
  );
}
