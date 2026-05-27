"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { X, User, Mail, Lock, Phone, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtpLogin from "./OtpLogin";
import Modal from "../ui/Modal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionMessage?: string;
}

export default function LoginModal({ isOpen, onClose, actionMessage }: LoginModalProps) {
  const { registerUser, loginUser } = useStore();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "otp">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");

  // Consent States
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  const [agreePromo, setAgreePromo] = useState(false);

  const [legalModalType, setLegalModalType] = useState<"terms" | "kvkk" | null>(null);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    let cleaned = numbers;
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(0, 11);
    } else {
      cleaned = cleaned.substring(0, 10);
    }

    if (cleaned.length === 0) return "";
    
    if (cleaned.startsWith("0")) {
      if (cleaned.length <= 1) return "0";
      if (cleaned.length <= 4) return `0 (${cleaned.slice(1, 4)})`;
      if (cleaned.length <= 7) return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}`;
      if (cleaned.length <= 9) return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)}`;
      return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    } else {
      if (cleaned.length <= 3) return `(${cleaned})`;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}`;
      if (cleaned.length <= 8) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
  };

  const validatePhone = (phoneStr: string): boolean => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      return digits.length === 11 && digits.startsWith("05");
    }
    return digits.length === 10 && digits.startsWith("5");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (activeTab === "login") {
        if (!email.trim() || !password.trim()) {
          setError("Lütfen tüm alanları doldurun.");
          setIsLoading(false);
          return;
        }
        await loginUser(email.trim(), password.trim());
      } else {
        if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
          setError("Lütfen gerekli tüm alanları doldurun.");
          setIsLoading(false);
          return;
        }
        if (!validatePhone(phone)) {
          setError("Lütfen geçerli bir telefon numarası girin (Örn. 0555 123 45 67).");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Şifre en az 6 karakter olmalıdır.");
          setIsLoading(false);
          return;
        }
        if (!agreeTerms || !agreeKvkk) {
          setError("Kayıt olabilmek için yasal sözleşmeleri ve KVKK onayını kabul etmelisiniz.");
          setIsLoading(false);
          return;
        }
        await registerUser(
          name.trim(),
          email.trim(),
          phone.trim(),
          password.trim(),
          title.trim() || "Üye",
          `Merhaba! Paylaşım ve yardımlaşma ağına katıldım!`
        );
      }
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta deneyin veya giriş yapın.");
      } else if (err.code === "auth/weak-password") {
        setError("Şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin.");
      } else if (err.code === "auth/invalid-email") {
        setError("Lütfen geçerli bir e-posta adresi girin.");
      } else if (err.code === "auth/user-not-found") {
        setError("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Lütfen önce kayıt olun.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Hatalı şifre girdiniz. Lütfen tekrar deneyin veya şifrenizi sıfırlayın.");
      } else if (err.message?.includes("telefon numarası zaten kullanımda")) {
        setError("Bu telefon numarası zaten kullanımda. Lütfen farklı bir numara deneyin.");
      } else {
        setError(err.message || "İşlem gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin.");
      }
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#091a35]/65 backdrop-blur-md"
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-100/80 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#091a35] px-6 py-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-bold text-lg flex items-center gap-1.5">
                  <Sparkles size={18} className="text-[#f58220]" />
                  <span className="text-[#f58220] font-black text-xl tracking-tight">paylaş</span>'a Katılın
                </h3>
                <p className="text-slate-300 text-xs mt-0.5 font-medium">Eşya paylaşımı ve yardımlaşmaya hemen başlayın!</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Scrollable Area */}
            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
              {actionMessage && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-[11px] rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-[#f58220]" />
                  <span>{actionMessage}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-[11px] rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB SELECTORS */}
              <div className="flex bg-slate-100/80 dark:bg-slate-950 p-1 rounded-xl mb-6 relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer ${
                    activeTab === "login" ? "text-slate-800 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  E-posta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("otp");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer ${
                    activeTab === "otp" ? "text-slate-800 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 cursor-pointer ${
                    activeTab === "register" ? "text-slate-800 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  Kayıt Ol
                </button>
                
                {/* Sliding Background */}
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute top-1 bottom-1 left-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm z-0 border border-slate-100 dark:border-slate-700"
                  animate={{ x: activeTab === "login" ? 0 : activeTab === "otp" ? "100%" : "200%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  style={{ width: "calc(33.33% - 4px)" }}
                />
              </div>

              {activeTab === "otp" ? (
                <OtpLogin onBack={() => setActiveTab("login")} />
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {activeTab === "register" ? (
                      <motion.div
                        key="register-fields"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                      {/* Register: Full Name */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Adınız Soyadınız
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                            <User size={15} />
                          </span>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Örn. Ahmet Yılmaz"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Register: Phone Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Telefon Numarası
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                            <Phone size={15} />
                          </span>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                            placeholder="Örn. 0555 123 45 67"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Register: Title / Profession */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Meslek / Uzmanlık <span className="text-slate-400 dark:text-slate-500 lowercase italic font-normal">(isteğe bağlı)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                            <BookOpen size={15} />
                          </span>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn. Tasarımcı, Öğretmen, Hobici"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Email (Always needed) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password (Always needed) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Şifre
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                        <Lock size={15} />
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Consent Checkboxes (Register only) */}
                  {activeTab === "register" && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-2.5 text-left text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={() => {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!agreeTerms) {
                              setLegalModalType("terms");
                            } else {
                              setAgreeTerms(false);
                            }
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-800 text-[#f58220] focus:ring-[#f58220] accent-[#f58220] cursor-pointer"
                        />
                        <span 
                          onClick={() => {
                            if (!agreeTerms) setLegalModalType("terms");
                            else setAgreeTerms(false);
                          }}
                          className="text-[10.5px] font-semibold leading-normal select-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          <span className="text-[#f58220] hover:underline font-bold">Kullanım Koşulları</span>{" "}
                          ve{" "}
                          <span className="text-[#f58220] hover:underline font-bold">Topluluk Kuralları</span>
                          'nı okudum, kabul ediyorum. *
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5 text-left text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={agreeKvkk}
                          onChange={() => {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!agreeKvkk) {
                              setLegalModalType("kvkk");
                            } else {
                              setAgreeKvkk(false);
                            }
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-800 text-[#f58220] focus:ring-[#f58220] accent-[#f58220] cursor-pointer"
                        />
                        <span 
                          onClick={() => {
                            if (!agreeKvkk) setLegalModalType("kvkk");
                            else setAgreeKvkk(false);
                          }}
                          className="text-[10.5px] font-semibold leading-normal select-none cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          <span className="text-[#f58220] hover:underline font-bold">KVKK Aydınlatma Metni</span>{" "}
                          kapsamında kişisel verilerimin işlenmesine ve komşularımla paylaşılmasına açık rıza veriyorum. *
                        </span>
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer text-left text-slate-500 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={agreePromo}
                          onChange={(e) => setAgreePromo(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-800 text-[#f58220] focus:ring-[#f58220] accent-[#f58220] cursor-pointer"
                        />
                        <span className="text-[10.5px] font-semibold leading-normal select-none hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                          Mahallemdeki yeni ilanlar, etkinlikler ve duyurular hakkında bilgilendirme iletileri (E-posta/SMS) almayı kabul ediyorum.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#f58220] hover:bg-[#e07216] disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        İşlem yapılıyor...
                      </>
                    ) : activeTab === "login" ? (
                      "Giriş Yap"
                    ) : (
                      "Kayıt Ol & Başla"
                    )}
                  </button>
                </form>
              )}

              {/* RULES SECTION (En Sonda Kurallar) */}
              <div className="mt-6 pt-5 border-t border-slate-100/80 dark:border-slate-800 text-left">
                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-350 uppercase tracking-widest mb-2.5">
                  Platform Kullanım Kuralları
                </span>
                <ul className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 space-y-2 pl-1 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-[#f58220] font-black">1.</span>
                    <span><strong>Saygı & Güven:</strong> Tüm üyeler birbirine saygılı davranmalı, güvenli paylaşım ve dürüst takas prensiplerine uymalıdır.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#f58220] font-black">2.</span>
                    <span><strong>Ticari Amaç Gütmeme:</strong> Eşya paylaşımı, ödünç verme ve hediye işlemleri tamamen karşılıksız ve yardımlaşma odaklı olmalıdır.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#f58220] font-black">3.</span>
                    <span><strong>Doğru Tanımlama:</strong> Platformda listelenen tüm alet ve eşyaların başlıkları, açıklamaları ve kondisyonları gerçeği yansıtmalıdır.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Dynamic Legal Consents Modal */}
      {legalModalType && (
        <Modal
          isOpen={legalModalType !== null}
          onClose={() => setLegalModalType(null)}
          title={legalModalType === "terms" ? "Kullanım Koşulları & Topluluk Sözleşmesi" : "KVKK Aydınlatma Metni & Açık Rıza"}
          size="lg"
        >
          <div className="space-y-4 max-h-[50vh] overflow-y-auto text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-2 font-medium">
            {legalModalType === "terms" ? (
              <>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">paylaş Mahalle Yardımlaşma Sözleşmesi</p>
                <p><strong>paylaş</strong> platformuna üye olarak mahallenizdeki döngüsel ekonomiye ve çevre dostu yardımlaşma ekosistemine dahil olmaktasınız. Güvenli bir topluluk için lütfen aşağıdaki kuralları kabul edin:</p>
                
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">1. Topluluk İlkeleri & Saygı</h4>
                <p>Tüm paylaşımlar karşılıklı saygı ve güven esasına dayanır. Kırıcı, ayrımcı, tehditkar dil kullanımı kesinlikle yasaktır ve doğrudan hesap dondurma sebebidir.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">2. Eşya Kullanımı ve Sorumluluk</h4>
                <p>Ödünç aldığınız eşyaları kendi malınız gibi özenle kullanmalı ve taahhüt edilen zamanda, temiz olarak geri teslim etmelisiniz. Eşyada oluşabilecek hasarlar veya kayıplardan tamamen ödünç alan üye sorumludur.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">3. Ticari Amaç Gütmeme</h4>
                <p>Eşya ödünç verme, hediye etme ve yardımlaşma tamamen karşılıksızdır. Satılık ilanları dışındaki alanlarda ticari faaliyet, kar amacı güden kiralama veya reklam yapmak yasaktır.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">4. Hesap Güvenliği</h4>
                <p>Hesabınızın ve verdiğiniz ilanların doğruluğundan siz sorumlusunuz. Profilinizde yanıltıcı bilgi veremez, başkası adına profil oluşturamazsınız.</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Kişisel Verilerin Korunması Aydınlatma Metni</p>
                <p><strong>paylaş</strong> olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. 6698 sayılı KVKK kapsamında verilerinizin işlenme detayları aşağıdadır:</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">1. İşlenen Kişisel Verileriniz</h4>
                <p>Üyeliğiniz sırasında toplanan Ad-Soyad, E-posta, Telefon Numarası, Meslek/Ünvan ve Mahalle/İlçe konum bilginiz platform işleyişi kapsamında işlenmektedir.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">2. Verilerin İşlenme Amacı</h4>
                <p>Kişisel verileriniz; üyeliğin doğrulanması, komşuların güvenli şekilde birbiriyle iletişime geçmesi, ilanların yakınlık derecesine göre listelenmesi ve güvenli teslimat süreçlerinin koordine edilmesi amacıyla işlenir.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">3. Üçüncü Kişilerle Paylaşım</h4>
                <p>Telefon numaranız ve adınız, sadece sizin onay verdiğiniz (sohbet başlattığınız) komşularınızla paylaşılır. Verileriniz reklam, pazarlama veya ticari kazanç amacıyla asla üçüncü taraf şirketlerle paylaşılmaz veya satılmaz.</p>

                <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-3">4. Haklarınız</h4>
                <p>KVKK'nın 11. maddesi uyarınca dilediğiniz zaman verilerinizin silinmesini, güncellenmesini veya işlenme durumunu öğrenmeyi talep etme hakkınız saklıdır.</p>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={() => setLegalModalType(null)}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border-0"
            >
              Kapat
            </button>
            <button
              onClick={() => {
                if (legalModalType === "terms") setAgreeTerms(true);
                else setAgreeKvkk(true);
                setLegalModalType(null);
              }}
              className="px-5 py-2.5 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-0"
            >
              Okudum, Kabul Ediyorum
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
