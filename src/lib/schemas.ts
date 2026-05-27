import { z } from "zod";

// User Schema
export const userSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(50, "İsim en fazla 50 karakter olabilir"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli bir Türk telefon numarası girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  title: z.string().min(2, "Ünvan en az 2 karakter olmalı").max(30, "Ünvan en fazla 30 karakter olabilir").optional(),
  bio: z.string().max(200, "Bio en fazla 200 karakter olabilir").optional(),
});

// OTP Schema
export const otpSchema = z.object({
  phoneNumber: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli bir Türk telefon numarası girin"),
  code: z.string().length(6, "OTP kodu 6 haneli olmalı"),
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(50, "İsim en fazla 50 karakter olabilir"),
});

// Profile Update Schema (password not required)
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(50, "İsim en fazla 50 karakter olabilir"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli bir Türk telefon numarası girin"),
  title: z.string().min(2, "Ünvan en az 2 karakter olmalı").max(30, "Ünvan en fazla 30 karakter olabilir").optional(),
  bio: z.string().max(200, "Bio en fazla 200 karakter olabilir").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

// Listing Schema
export const listingSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalı").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalı").max(500, "Açıklama en fazla 500 karakter olabilir"),
  category: z.enum(["HARDWARE", "KITCHEN", "OUTDOOR", "BOOKS", "SPORTS", "ELECTRONICS", "MISC"]),
  type: z.enum(["borrow", "ask", "gift", "sell"]),
  condition: z.enum(["Yeni", "Çok İyi", "İyi", "Kullanılmış"]),
  location: z.string().min(3, "Konum en az 3 karakter olmalı").max(100, "Konum en fazla 100 karakter olabilir"),
  price: z.number().min(0, "Fiyat 0 veya pozitif olmalı").optional(),
  imageUrl: z.string().url("Geçerli bir URL girin").optional(),
});

export const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: "Alet & Hırdavat",
  KITCHEN: "Mutfak & Yemek",
  OUTDOOR: "Bahçe & Bitki",
  BOOKS: "Kitap & Hobi",
  SPORTS: "Spor & Aktivite",
  ELECTRONICS: "Elektronik",
  MISC: "Diğer",
};

export const TYPE_LABELS: Record<string, string> = {
  borrow: "Ödünç",
  ask: "Tavsiye",
  gift: "Hediye",
  sell: "Satılık",
};

export const TYPE_COLORS: Record<string, string> = {
  borrow: "bg-sky-500",
  ask: "bg-violet-500",
  gift: "bg-emerald-500",
  sell: "bg-orange-500",
};


// Feed Post Schema
export const feedPostSchema = z.object({
  content: z.string().min(5, "İçerik en az 5 karakter olmalı").max(300, "İçerik en fazla 300 karakter olabilir"),
  type: z.enum(["announcement", "discussion", "listing_share"]),
  title: z.string().max(100, "Başlık en fazla 100 karakter olabilir").optional(),
});

// Message Schema
export const messageSchema = z.object({
  content: z.string().min(1, "Mesaj boş olamaz").max(1000, "Mesaj en fazla 1000 karakter olabilir"),
});

export type UserInput = z.infer<typeof userSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type FeedPostInput = z.infer<typeof feedPostSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
