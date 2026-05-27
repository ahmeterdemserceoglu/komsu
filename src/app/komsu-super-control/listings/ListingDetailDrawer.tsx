"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Listing, User, useStore } from '@/lib/store';
import { X, Package, AlertOctagon, Edit, Trash2, User as UserIcon } from 'lucide-react';
import ListingCard from '@/components/listing/ListingCard';
import { ActionModal } from "@/components/ui/ActionModal";

interface ListingDetailDrawerProps {
  listing: Listing;
  onClose: () => void;
  onListingUpdate: (listing: Partial<Listing> & { id: string }) => void;
}

// A simplified user card for display purposes within the drawer
const SimpleUserCard = ({ user }: { user: User }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center font-bold text-lg text-white">
            {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{user.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
    </div>
);

export default function ListingDetailDrawer({ listing, onClose, onListingUpdate }: ListingDetailDrawerProps) {
  const [ownerData, setOwnerData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Correctly include isSubmitting in the state definition
  const [modalState, setModalState] = useState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
  // const { showToast } = useStore(); // Commented out until store is fixed

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!listing.owner?.id) return;
      setLoading(true);
      try {
        const userRef = doc(db, 'users', listing.owner.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setOwnerData({ id: userSnap.id, ...userSnap.data() } as User);
        }
      } catch (error) {
        console.error('Failed to fetch owner details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerData();
  }, [listing.owner?.id]);

  const handleAction = async () => {
    const action = modalState.action;
    setModalState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const listingRef = doc(db, "listings", listing.id);
      let updatedData: any = {};
      let toastMessage = '';

      if (action === 'archive_listing') {
        updatedData = { status: listing.status === 'archived' ? 'available' : 'archived' };
        toastMessage = `İlan başarıyla ${listing.status === 'archived' ? 'yayına alındı' : 'arşivlendi'}.`;
      }

      await updateDoc(listingRef, updatedData);
      onListingUpdate({ id: listing.id, ...updatedData });
      // showToast({ message: toastMessage, type: 'success' });
      onClose();

    } catch (error: any) {
      console.error('İlan güncellenirken hata:', error);
      // showToast({ message: `Hata: ${error.message}`, type: 'error' });
    } finally {
      setModalState({ isOpen: false, action: '', title: '', description: '', isSubmitting: false });
    }
  };

  const openModal = (action: 'archive_listing') => {
    let title = '', description = '';
    if (action === 'archive_listing') {
        title = listing.status === 'archived' ? 'İlanı Tekrar Yayınla?' : 'İlanı Arşivle?';
        description = `Bu ilanı ${listing.status === 'archived' ? 'tekrar yayına almak' : 'arşivlemek'} istediğinizden emin misiniz? Arşivlenmiş ilanlar kullanıcılara görünmez.`;
    }
    setModalState({ isOpen: true, action, title, description, isSubmitting: false });
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
          <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><Package size={20} />İlan Detayı</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
            {/* Listing Preview */}
             <div>
                <h4 className='text-sm font-bold mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider'>İlan Önizlemesi</h4>
                {/* Correctly passing props to ListingCard */}
                <ListingCard item={listing} onClick={() => {}} />
            </div>

            {/* Owner Preview */}
            <div>
                <h4 className='text-sm font-bold mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider'>İlan Sahibi</h4>
                {loading ? <div className='h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse'></div> :
                ownerData ? <SimpleUserCard user={ownerData} /> : <div className='text-center py-10'><p className='text-sm text-slate-500'>İlan sahibi bulunamadı.</p></div>}
            </div>

            {/* Actions */}
            <div className='space-y-4'>
                 <h4 className='text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>Yönetim Eylemleri</h4>
                
                 <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3'>
                     <h5 className='font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2'><Edit size={14}/>İlanı Düzenle</h5>
                     <p className='text-xs text-slate-500'>İlanın temel bilgilerini (başlık, açıklama vb.) buradan güncelleyebilirsiniz. Bu özellik yakında eklenecektir.</p>
                     <button disabled className='px-4 py-1.5 text-xs font-bold text-white bg-[#091a35] rounded-lg opacity-50 cursor-not-allowed'>Düzenlemeyi Aç</button>
                </div>

                {/* Destructive Actions */}
                <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3'>
                     <h5 className='font-bold text-red-600 dark:text-red-400 flex items-center gap-2'><AlertOctagon size={16}/>Tehlikeli Bölge</h5>
                     <div className='grid grid-cols-1 gap-3'>
                         <button onClick={() => openModal('archive_listing')} className='p-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors'>
                             <Trash2 size={14}/>{listing.status === 'archived' ? 'Tekrar Yayınla' : 'İlanı Arşivle'}
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
        // Correctly using the 'action' prop for styling and text
        action={modalState.action === 'archive_listing' ? (listing.status === 'archived' ? 'approve' : 'delete') : 'default'}
        isSubmitting={modalState.isSubmitting}
      />
    </>
  );
}
