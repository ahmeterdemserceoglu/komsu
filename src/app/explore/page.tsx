"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Compass,
  MapPin,
  Sparkles,
  Users,
  Award,
  TrendingUp,
  ChevronRight,
  BookOpen,
  Wrench,
  CookingPot,
  Sprout,
  Mountain,
  Laptop,
  Package,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CATEGORIES_DATA = [
  {
    id: "HARDWARE",
    name: "Alet & Hırdavat",
    icon: Wrench,
    desc: "Matkaplar, budama makasları, tamir setleri ve kendin-yap aletleri.",
    sharesCount: 128,
    activeUsers: 42,
    carbonSavings: "512 kg CO₂",
    popularItem: "Darbeli Matkap",
    events: [
      {
        id: "evt_1",
        title: "Ortak Alet Bakım & Bileme Günü",
        desc: "Elinizdeki körelmiş makasları, bıçakları ve paslanmış el aletlerini getirin; birlikte temizleyelim, bileyelim ve bakımlarını yapalım.",
        date: "30 Mayıs, Cumartesi",
        time: "14:00",
        location: "Kadıköy Tasarım Atölyesi",
        host: "Ahmet Yılmaz",
        category: "Marangozluk & Bakım",
      },
      {
        id: "evt_2",
        title: "Ahşap Paletlerden Sokak Kedilerine Yuva Atölyesi",
        desc: "Atık ahşap paletleri kullanarak sokaktaki dostlarımız için korunaklı ve sıcak kedi evleri inşa ediyoruz. Çekiç ve çiviler bizden!",
        date: "08 Haziran, Pazartesi",
        time: "18:30",
        location: "Kadıköy Sanat Parkı",
        host: "Zeynep Demir",
        category: "Kendin Yap (DIY)",
      },
    ],
  },
  {
    id: "KITCHEN",
    name: "Mutfak & Yemek",
    icon: CookingPot,
    desc: "Mutfak robotları, hassas teraziler, taze mayalar ve fırıncılık ekipmanları.",
    sharesCount: 74,
    activeUsers: 28,
    carbonSavings: "296 kg CO₂",
    popularItem: "Ekşi Maya Rehberi",
    events: [
      {
        id: "evt_3",
        title: "Ekşi Maya Paylaşımı & Ev Yapımı Pizza Günü",
        desc: "Yıllanmış aktif ekşi mayaları paylaşıyoruz ve taş fırında ev yapımı çıtır pizzanın sırlarını uygulamalı olarak öğreniyoruz.",
        date: "31 Mayıs, Pazar",
        time: "11:00",
        location: "Bostan Fırın ve Paylaşım Alanı",
        host: "Can Kaya",
        category: "Mutfak & Fırıncılık",
      },
    ],
  },
  {
    id: "OUTDOOR",
    name: "Bahçe & Bitki",
    icon: Sprout,
    desc: "Budama makasları, saksılar, tırpanlar, tohumlar ve peyzaj ekipmanları.",
    sharesCount: 65,
    activeUsers: 28,
    carbonSavings: "260 kg CO₂",
    popularItem: "Çim Biçme Makinesi",
    events: [
      {
        id: "evt_5",
        title: "Tohum & Fide Takas Günü",
        desc: "Yazlık sebze fidelerinizi ve ata tohumlarınızı getirin, bostanlarımızı yeşillendirecek yeni türler takas edelim.",
        date: "06 Haziran, Cumartesi",
        time: "10:30",
        location: "Kuzguncuk Bostanı",
        host: "Fatma Yurt",
        category: "Bahçe & Ekoloji",
      }
    ],
  },
  {
    id: "BOOKS",
    name: "Kitap & Hobi",
    icon: BookOpen,
    desc: "Romanlar, teknik kitaplar, dergiler, kutu oyunları ve hobi malzemeleri.",
    sharesCount: 96,
    activeUsers: 35,
    carbonSavings: "384 kg CO₂",
    popularItem: "Edebi Eserler",
    events: [
      {
        id: "evt_4",
        title: "Büyük Kitap Takas Şenliği & Kahve Buluşması",
        desc: "Okuyup bitirdiğiniz ve kütüphanenizde yer açmak istediğiniz kitapları getirin, kahve eşliğinde yeni maceralara yelken açalım.",
        date: "05 Haziran, Cuma",
        time: "17:00",
        location: "Merkez Parkı Kamelyalar",
        host: "Merve Çelik",
        category: "Kitap Takası",
      },
    ],
  },
  {
    id: "SPORTS",
    name: "Spor & Aktivite",
    icon: Mountain,
    desc: "Kamp çadırları, katlanır sandalyeler, bisiklet ekipmanları ve spor aletleri.",
    sharesCount: 52,
    activeUsers: 22,
    carbonSavings: "208 kg CO₂",
    popularItem: "Kamp Seti",
    events: [
      {
        id: "evt_6",
        title: "Hafta Sonu Kamp Hazırlığı & Çadır Kurma Atölyesi",
        desc: "Kampçılığa yeni başlayanlar için çadır nasıl kurulur, mat ve uyku tulumu nasıl seçilir pratik olarak gösteriyoruz.",
        date: "13 Haziran, Cumartesi",
        time: "15:00",
        location: "Belgrad Ormanı",
        host: "Deniz Kaya",
        category: "Kampçılık",
      }
    ],
  },
  {
    id: "ELECTRONICS",
    name: "Elektronik",
    icon: Laptop,
    desc: "Monitörler, projeksiyon cihazları, ses sistemleri ve dijital aksesuarlar.",
    sharesCount: 88,
    activeUsers: 39,
    carbonSavings: "704 kg CO₂",
    popularItem: "Taşınabilir Projeksiyon",
    events: [
      {
        id: "evt_7",
        title: "Eski Konsollarla Retro Oyun Gecesi",
        desc: "Nostaljik atari ve Playstation konsollarını dev ekrana bağlıyoruz; Mario, Street Fighter turnuvalarıyla çocukluğumuza dönüyoruz.",
        date: "12 Haziran, Cuma",
        time: "20:00",
        location: "Kadıköy Ortak Yaşam Alanı",
        host: "Ali Tekin",
        category: "Eğlence",
      }
    ],
  },
  {
    id: "MISC",
    name: "Diğer",
    icon: Package,
    desc: "Kategorilendirilmemiş diğer tüm paylaşım ve takas eşyaları.",
    sharesCount: 35,
    activeUsers: 15,
    carbonSavings: "140 kg CO₂",
    popularItem: "Katlanır Masa",
    events: [],
  },
];

export default function ExplorePage() {
  const [selectedCat, setSelectedCat] = useState("HARDWARE");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-stone-500">
        <div className="h-10 w-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold uppercase tracking-wider">Kategoriler Yükleniyor...</p>
      </div>
    );
  }

  const currentCatData = CATEGORIES_DATA.find((cat) => cat.id === selectedCat) || CATEGORIES_DATA[0];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
  };

  return (
    <div className="min-h-screen bg-background pb-12 relative overflow-hidden">
      {/* Decorative gradient meshes */}
      <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] bg-brand-cream/30 rounded-full filter blur-[130px] pointer-events-none opacity-80"></div>
      <div className="absolute bottom-[-10%] left-[-15%] w-[50%] h-[50%] bg-brand-sage/15 rounded-full filter blur-[120px] pointer-events-none opacity-60"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-card-bg/85 backdrop-blur-md border-b border-border-custom px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-custom hover:bg-stone-50 dark:hover:bg-stone-900 text-xs font-bold text-stone-600 dark:text-stone-400 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> <span>Panoya Dön</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-brand-green text-background flex items-center justify-center text-md font-bold font-display shadow-md shadow-brand-green/20">
            P
          </span>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">paylas</span>
        </div>
      </header>

      {/* Main Content explore */}
      <main className="w-full px-4 md:px-8 lg:px-12 py-8 space-y-8">
        
        {/* Banner Title */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:text-left space-y-2"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider">
            <Compass size={12} className="animate-spin-slow" /> Kategorileri Keşfet
          </span>
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-foreground">
            Paylaşım ve Takas Vitrini
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-xs md:text-sm max-w-xl">
            Kategori bazlı paylaşım istatistiklerini inceleyin, yaklaşan takas etkinliklerine göz atın ve alet ağınızı büyütün.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Categories list cards (5 Cols) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-4 xl:col-span-3 space-y-4"
          >
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-450 px-1">
              KATEGORİ LİSTESİ
            </span>

            {CATEGORIES_DATA.map((cat) => {
              const isSelected = selectedCat === cat.id;
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  variants={itemVariants}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`w-full flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 relative group cursor-pointer ${\
                    isSelected
                      ? "border-brand-green bg-brand-green/5 shadow-md shadow-brand-green/5 scale-[1.01]"
                      : "border-border-custom hover:border-brand-green/30 hover:bg-stone-50 dark:hover:bg-stone-900/30"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-3.5xl h-11 w-11 rounded-xl bg-card-bg border border-border-custom flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <Icon size={24} className="text-stone-700 dark:text-stone-300" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[200px] md:max-w-[260px]">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-stone-400 group-hover:text-brand-green transition-colors">
                    <span className="text-[10px] font-bold">{cat.sharesCount} Eşya</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* RIGHT: Detailed statistics & Events (7 Cols) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Category Stats Card */}
            <motion.div
              key={`stats-${selectedCat}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="bg-card-bg border border-border-custom rounded-2xl p-6 space-y-5 noise-overlay shadow-md relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"><currentCatData.icon size={22} className="text-stone-700 dark:text-stone-300" /></span>
                  <h2 className="font-display font-semibold text-lg text-foreground">
                    {currentCatData.name} Raporu
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 dark:bg-stone-900 py-1 px-2.5 rounded-lg border border-border-custom">
                  Metrikler
                </span>
              </div>

              {/* Stats Bento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="bg-stone-50 dark:bg-stone-900/50 border border-border-custom rounded-xl p-3.5 space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Üye Sayısı</span>
                  <div className="flex items-center gap-1 text-stone-900 dark:text-stone-100 font-display font-extrabold text-lg">
                    <Users size={14} className="text-brand-green shrink-0" />
                    <span>{currentCatData.activeUsers}</span>
                  </div>
                </div>

                <div className="bg-stone-50 dark:bg-stone-900/50 border border-border-custom rounded-xl p-3.5 space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-stone-450">Eşya Sayısı</span>
                  <div className="flex items-center gap-1 text-stone-900 dark:text-stone-100 font-display font-extrabold text-lg">
                    <Award size={14} className="text-brand-green shrink-0" />
                    <span>{currentCatData.sharesCount}</span>
                  </div>
                </div>

                <div className="bg-stone-50 dark:bg-stone-900/50 border border-border-custom rounded-xl p-3.5 space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-stone-400">CO₂ Tasarruf</span>
                  <div className="flex items-center gap-1 text-stone-900 dark:text-stone-100 font-display font-extrabold text-xs md:text-sm font-semibold truncate">
                    <TrendingUp size={14} className="text-brand-green shrink-0" />
                    <span>{currentCatData.carbonSavings}</span>
                  </div>
                </div>

                <div className="bg-stone-50 dark:bg-stone-900/50 border border-border-custom rounded-xl p-3.5 space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-stone-400">En Çok Aranan</span>
                  <span className=\"block text-[11px] font-extrabold text-brand-clay uppercase tracking-wider truncate py-0.5\">
                    {currentCatData.popularItem}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Events Card */}
            <motion.div
              key={`events-${selectedCat}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card-bg border border-border-custom rounded-2xl p-6 space-y-4 noise-overlay shadow-md"
            >
              <h3 className="font-display font-semibold text-md text-foreground flex items-center justify-between border-b border-stone-100 dark:border-stone-850 pb-2">
                <span className="flex items-center gap-2">
                  <Calendar className="text-brand-green" size={16} /> Yaklaşan Takas & Paylaşım Etkinlikleri
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold">
                  {currentCatData.events.length} Etkinlik
                </span>
              </h3>

              <div className="space-y-4">
                {currentCatData.events.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 space-y-2">
                    <BookOpen className="mx-auto text-stone-300" size={32} />
                    <p className="text-xs font-semibold">Bu kategoride aktif bir etkinlik bulunmuyor.</p>
                    <p className="text-[10px] text-stone-500">İlk takas veya atölye etkinliğini başlatmak için panoya yazabilirsiniz!</p>
                  </div>
                ) : (
                  currentCatData.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 border border-border-custom rounded-xl space-y-3 bg-stone-50/40 dark:bg-stone-900/20 hover:border-brand-green/20 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[9px] font-extrabold uppercase">
                          {evt.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                          <span>{evt.date}</span>
                          <span>&bull;</span>
                          <span className="text-brand-clay">{evt.time}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-350 leading-relaxed">
                          {evt.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-850/60 text-[10px] font-bold">
                        <span className="text-stone-450">Konum: <span className="text-stone-750 dark:text-stone-250">{evt.location}</span></span>
                        <span className="text-brand-green">Düzenleyen: {evt.host}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

          </div>

        </div>

      </main>
    </div>
  );
}
