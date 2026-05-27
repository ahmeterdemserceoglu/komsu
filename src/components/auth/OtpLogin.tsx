"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { ConfirmationResult } from "firebase/auth";

interface OtpLoginProps {
  onBack: () => void;
}

export default function OtpLogin({ onBack }: OtpLoginProps) {
  const { sendOtp, verifyOtp, isLoading, error, clearError } = useStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");
    
    if (!validatePhone(phoneNumber)) {
      setLocalError("Lütfen geçerli bir telefon numarası girin (Örn. 0555 123 45 67).");
      return;
    }
    
    try {
      // Normalize phone number to +90 format for Firebase
      let normalizedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+90' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+90')) {
        normalizedPhone = '+90' + normalizedPhone;
      }
      
      const result = await sendOtp(normalizedPhone);
      setConfirmationResult(result);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!confirmationResult) return;

    try {
      await verifyOtp(confirmationResult, otpCode, name);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-4">
      {!confirmationResult ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Telefon Numarası
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <Phone size={15} />
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="Örn. 0555 123 45 67"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#091a35] hover:bg-[#152a4e] dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                OTP Gönderiliyor...
              </>
            ) : (
              <>
                OTP Gönder
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 text-xs font-semibold transition-colors cursor-pointer"
          >
            Geri Dön
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              OTP Kodu
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6 haneli kod"
              maxLength={6}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all text-center tracking-widest"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Adınız Soyadınız
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] outline-none transition-all"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              "Doğrula ve Giriş Yap"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmationResult(null);
              setOtpCode("");
            }}
            className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 text-xs font-semibold transition-colors cursor-pointer"
          >
            Farklı Numara
          </button>
        </form>
      )}

      {(error || localError) && (
        <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs rounded-xl font-semibold">
          {error || localError}
        </div>
      )}

      <div id="recaptcha-container" className="hidden" />
    </div>
  );
}
