"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  X, ShieldAlert, User, Package, MessageCircle, Calendar, AlertOctagon, Trash2, UserX, Send
} from 'lucide-react';
import { Report, REASON_LABELS, STATUS_CONFIG } from './page'; 
import UserCard from '@/components/layout/UserCard';
import ListingCard from '@/components/listing/ListingCard';
import { useStore } from '@/lib/store';

// This will replace all alert() and confirm()
const ActionModal = ({ isOpen, onClose, onConfirm, title, description, confirmText, isDestructive }: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
        >
          <div className="flex items-start gap-4">
            <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <AlertOctagon size={20} className={isDestructive ? 'text-red-500' : 'text-blue-500'} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{description}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">İptal</button>
            <button onClick={onConfirm} className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>{confirmText}</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface ReportDetailDrawerProps {
  report: Report;
  onClose: () => void;
  onStatusChange: (reportId: string, newStatus: Report['status']) => void;
}

export default function ReportDetailDrawer({ report, onClose, onStatusChange }: ReportDetailDrawerProps) {
  const [targetData, setTargetData] = useState<any>(null);
  const [reporterData, setReporterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, action: '', title: '', description: '' });
  const { showToast } = useStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const targetRef = doc(db, report.targetType === 'listing' ? 'listings' : 'users', report.targetId);
        const reporterRef = doc(db, 'users', report.reporterId);
        const [targetSnap, reporterSnap] = await Promise.all([getDoc(targetRef), getDoc(reporterRef)]);
        setTargetData(targetSnap.exists() ? { id: targetSnap.id, ...targetSnap.data() } : null);
        setReporterData(reporterSnap.exists() ? { id: reporterSnap.id, ...reporterSnap.data() } : null);
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
    setModalState({ ...modalState, isOpen: false }); // Close modal immediately

    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, 'reports', report.id);

      if (action === 'archive_listing') {
        const listingRef = doc(db, 'listings', report.targetId);
        batch.update(listingRef, { status: 'archived' });
        batch.update(reportRef, { status: 'resolved' });
        await batch.commit();
        onStatusChange(report.id, 'resolved');
        showToast({ message: 'İlan arşivlendi ve rapor çözüldü.', type: 'success' });
      } else if (action === 'ban_user') {
        const userIdToBan = report.targetType === 'user' ? report.targetId : targetData?.owner.id;
        if (!userIdToBan) throw new Error('Yasaklanacak kullanıcı IDsi bulunamadı.');
        const userRef = doc(db, 'users', userIdToBan);
        batch.update(userRef, { isBanned: true, role: 'banned' });
        batch.update(reportRef, { status: 'resolved' });
        await batch.commit();
        onStatusChange(report.id, 'resolved');
        showToast({ message: 'Kullanıcı yasaklandı ve rapor çözüldü.', type: 'success' });
      }

      onClose(); // Close drawer on success
    } catch (error: any) {
      console.error('Moderasyon işlemi başarısız:', error);
      showToast({ message: `Hata: ${error.message}`, type: 'error' });
    }
  };

  const openModal = (action: 'archive_listing' | 'ban_user') => {
    if (action === 'archive_listing') {
      setModalState({ isOpen: true, action, title: 'İlanı Arşivle?', description: `Bu ilanı yayından kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilan kalıcı olarak arşivlenir.`, });
    } else if (action === 'ban_user') {
      const userName = targetData?.name || 'bu kullanıcıyı';
      setModalState({ isOpen: true, action, title: 'Kullanıcıyı Yasakla?', description: `${userName} adlı kullanıcıyı kalıcı olarak yasaklamak istediğinizden emin misiniz? Kullanıcı bir daha platforma giriş yapamaz.` });
    }
  };

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
            {/* Report Info */}
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

            {/* Target Context */}
            <div>
                <h4 className='text-sm font-bold mb-2 text-slate-800 dark:text-slate-200'>{report.targetType === 'listing' ? 'Rapor Edilen İlan' : 'Rapor Edilen Kullanıcı'}</h4>
                {loading ? <div className='h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse'></div> :
                targetData ? (
                    report.targetType === 'listing' ? <ListingCard listing={targetData} /> : <UserCard user={targetData} />
                ) : <div className='text-center py-10'><p className='text-sm text-slate-500'>Rapor edilen içerik bulunamadı veya silinmiş.</p></div>}
            </div>

            {/* Actions */}
            <div className='space-y-4'>
                <h4 className='text-sm font-bold text-slate-800 dark:text-slate-200'>İnceleme ve Karar</h4>
                
                <div className='grid grid-cols-2 gap-2'>
                     {/* These actions are safe and for review */}
                     <button className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'><Send size={14}/>Kullanıcıya Uyarı Gönder</button>
                     <button onClick={() => { onStatusChange(report.id, 'resolved'); showToast({message: 'Rapor çözüldü olarak işaretlendi.'}); onClose(); }} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'><CheckCircle size={14}/>Raporu Kapat (Geçerli Değil)</button>
                </div>

                {/* Destructive Actions */}
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
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={handleAction}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.action === 'archive_listing' ? 'Arşivle' : 'Yasakla'}
        isDestructive={true}
      />
    </>
  );
}
