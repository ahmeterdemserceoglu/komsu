"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/lib/schemas/profile.schema";
import { X, Save, Loader2, Check, User, Mail, Phone, Briefcase, FileText, AlertTriangle } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputField = ({ control, name, label, icon: Icon, placeholder, type = "text", maxLength }: any) => {
  return (
    <div className="relative">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 select-none mb-1">
            <Icon size={14} className="text-[#f58220]" />
            {label}
        </label>
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState: { error, isDirty, invalid } }) => (
                 <div className="relative">
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all pointer-events-none ${error ? 'border-red-500' : (isDirty ? 'border-green-500' : 'border-transparent')} `}>
                         <div className={`absolute -inset-[1.5px] rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 blur opacity-0 transition-opacity ${!error && field.value ? 'opacity-100' : ''}`}/>
                    </div>
                    <input
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all relative"
                    />
                      {error && <AlertTriangle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"/>}
                 </div>
            )}
        />
    </div>
  );
};

export default function EditProfileModalV2({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, updateUserProfile, isLoading, error: apiError, clearError } = useStore();

  const { handleSubmit, control, reset, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '', email: '', phone: '', title: '', bio: ''
    }
  });

  useEffect(() => {
    if (currentUser && isOpen) {
      reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        title: currentUser.title || '',
        bio: currentUser.bio || ''
      });
    }
  }, [currentUser, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      clearError();
      reset();
    }
  }, [isOpen, clearError, reset]);

  const onSubmit = async (data: ProfileFormData) => {
      try {
          await updateUserProfile(data.name, data.email, data.phone, data.title, data.bio);
      } catch (err) {
          // error is handled by store and displayed via apiError
      }
  };

  useEffect(() => {
      if(isSubmitSuccessful) {
          setTimeout(() => { onClose(); }, 1200);
      }
  }, [isSubmitSuccessful, onClose]);

  const combinedErrors = { ...errors, api: apiError ? { message: apiError } : undefined };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#091a35]/65 backdrop-blur-md" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
              <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-tr from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20"><User size={20} className="text-white" /></div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white">Profili Düzenle</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                  {Object.values(combinedErrors).map((error, i) => error?.message && (
                    <motion.div key={i} initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="mb-1 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-red-500 shrink-0" />
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">{error.message}</span>
                    </motion.div>
                  ))}

                  <InputField control={control} name="name" label="Ad Soyad" icon={User} placeholder="Adınız ve soyadınız" />
                  <InputField control={control} name="email" label="E-posta" icon={Mail} placeholder="ornek@email.com" type="email" />
                  <InputField control={control} name="phone" label="Telefon" icon={Phone} placeholder="0555 123 45 67" type="tel" />
                  <InputField control={control} name="title" label="Ünvan / Meslek" icon={Briefcase} placeholder="Örn: Tasarımcı, Öğretmen" />
                  
                  <div className="relative">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 select-none mb-1"><FileText size={14} className="text-[#f58220]"/>Hakkımda</label>
                      <Controller name="bio" control={control} render={({ field }) => (
                        <textarea {...field} rows={3} maxLength={200} placeholder="Kendiniz hakkında kısaca bilgi verin..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all resize-none" />
                      )}/>
                       <Controller name="bio" control={control} render={({ field }) => <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{field.value?.length || 0}/200</span>}/>
                  </div>

                  <button type="submit" disabled={isSubmitting || isSubmitSuccessful} className="w-full py-3 bg-[#091a35] hover:bg-[#152a4e] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]">
                    {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Kaydediliyor...</>) 
                    : isSubmitSuccessful ? (<motion.div initial={{scale:0.8}} animate={{scale:1}} className='flex items-center gap-2'><Check size={18} /> Kaydedildi!</motion.div>) 
                    : (<><Save size={18} /> Değişiklikleri Kaydet</>)}
                  </button>
              </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
