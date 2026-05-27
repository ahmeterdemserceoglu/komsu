"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, useStore } from '@/lib/store';
import { X, ShieldAlert, User as UserIcon, AlertOctagon, ShieldCheck, UserX, Edit2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { ActionModal } from "@/components/ui/ActionModal";

interface UserDetailDrawerProps {
  user: User;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

export default function UserDetailDrawer({ user, onClose, onUserUpdate }: UserDetailDrawerProps) {
  const [modalState, setModalState] = useState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
  const { showToast, currentUser } = useStore();

  const handleAction = async () => {
    const action = modalState.action;
    setModalState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const userRef = doc(db, "users", user.id);
      let updatedData: Partial<User> = {};
      let toastMessage = '';

      if (action === 'toggle_admin') {
        updatedData = { role: user.role === 'admin' ? 'user' : 'admin' };
        toastMessage = `Kullanıcı başarıyla ${updatedData.role === 'admin' ? 'Admin yapıldı' : 'Standart üye yapıldı'}.`;
      } else if (action === 'toggle_ban') {
        updatedData = { isBanned: !user.isBanned, role: !user.isBanned ? 'banned' : 'user' };
        toastMessage = `Kullanıcı engeli başarıyla ${!user.isBanned ? 'kaldırıldı' : 'uygulandı'}.`;
      } else if (action === 'toggle_verified') {
        updatedData = { isVerified: !user.isVerified };
        toastMessage = `Kullanıcı ${updatedData.isVerified ? 'doğrulandı' : 'doğrulaması kaldırıldı'}.`;
      }

      await updateDoc(userRef, updatedData);
      onUserUpdate({ ...user, ...updatedData });
      showToast({ message: toastMessage, type: 'success' });
      setModalState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
      onClose(); // Close drawer on success

    } catch (error: any) {
      console.error('Kullanıcı güncellenirken hata:', error);
      showToast({ message: `Hata: ${error.message}`, type: 'error' });
      setModalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openModal = (action: 'toggle_admin' | 'toggle_ban' | 'toggle_verified') => {
    if (user.id === currentUser?.id && (action === 'toggle_admin' || action === 'toggle_ban')) {
      showToast({ message: 'Kendi hesabınız üzerinde bu işlemi yapamazsınız.', type: 'error' });
      return;
    }

    let title = '', description = '';
    if (action === 'toggle_admin') {
        title = user.role === 'admin' ? 'Admin Yetkisini Kaldır?' : 'Admin Yap?';
        description = `${user.name} adlı kullanıcının yetkilerini değiştirmek üzeresiniz.`;
    } else if (action === 'toggle_ban') {
        title = user.isBanned ? 'Kullanıcı Engelini Kaldır?' : 'Kullanıcıyı Yasakla?';
        description = `${user.name} adlı kullanıcıyı ${user.isBanned ? 'tekrar aktifleştirmek' : 'kalıcı olarak yasaklamak'} istediğinizden emin misiniz?`;
    } else if (action === 'toggle_verified') {
        title = user.isVerified ? 'Doğrulamayı Kaldır?' : 'Kullanıcıyı Doğrula?';
        description = `${user.name} adlı kullanıcıya ${user.isVerified ? 'verilen doğrulanmış hesap rozetini kaldırmak' : 'doğrulanmış hesap rozeti vermek'} istediğinizden emin misiniz?`;
    }
    setModalState({ isOpen: true, action, title, description, isSubmitting: false });
  };

  const isSelf = user.id === currentUser?.id;

  const getModalActionType = () => {
      switch(modalState.action) {
          case 'toggle_admin':
              return user.role === 'admin' ? 'reject' : 'approve';
          case 'toggle_ban':
              return user.isBanned ? 'approve' : 'ban';
          case 'toggle_verified':
              return user.isVerified ? 'reject' : 'approve';
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
        className="fixed top-0 right-0 z-40 h-full w-full max-w-md bg-slate-50 dark:bg-slate-950 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><UserIcon size={20} />Kullanıcı Detayı</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
            {/* User Info */}
            <div className='flex items-center gap-4'>
                <Avatar name={user.name} size='lg' verified={user.isVerified}/>
                <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-bold text-xl text-slate-800 dark:text-slate-100 truncate'>{user.name}</h3>
                      {user.role === 'admin' && <ShieldCheck size={16} className='text-green-500' />}
                    </div>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>{user.email}</p>
                </div>
            </div>

             {/* Actions */}
             <div className='space-y-4'>
                <h4 className='text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>Yönetimsel Eylemler</h4>
                
                <div className='grid grid-cols-1 gap-3'>
                     <button onClick={() => openModal('toggle_verified')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
                         <ShieldCheck size={14}/> {user.isVerified ? 'Doğrulamayı Kaldır' : 'Hesabı Doğrula'}
                     </button>
                </div>

                 {/* Admin Notes */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                     <h5 className='font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2'><Edit2 size={14}/>Yönetici Notları</h5>
                     <textarea placeholder='Bu kullanıcı hakkında bir not ekle (sadece adminler görür)...' className='w-full text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#f58220]' rows={2}></textarea>
                     <button className='px-4 py-1.5 text-xs font-bold text-white bg-[#091a35] rounded-lg hover:bg-[#152a4e]'>Notu Kaydet</button>
                </div>

                {/* Destructive Actions */}
                <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3'>
                     <h5 className='font-bold text-red-600 dark:text-red-400 flex items-center gap-2'><AlertOctagon size={16}/>Tehlikeli Bölge</h5>
                     <div className='grid grid-cols-2 gap-3'>
                         <button disabled={isSelf} onClick={() => openModal('toggle_admin')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                             <ShieldAlert size={14}/>{user.role === 'admin' ? 'Yetkiyi Al' : 'Admin Yap'}
                         </button>
                         <button disabled={isSelf} onClick={() => openModal('toggle_ban')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                             <UserX size={14}/>{user.isBanned ? 'Engeli Kaldır' : 'Yasakla'}
                         </button>
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
