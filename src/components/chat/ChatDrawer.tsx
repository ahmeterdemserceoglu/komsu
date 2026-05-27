"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { X, Send, ArrowLeft, MessageSquare, Clock, MoreVertical, Check, CheckCheck, Tag, Search, User, Star, Camera, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReviewModal from "@/components/ui/ReviewModal";
import { ref, onValue } from "firebase/database";
import { rtdb, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function ChatDrawer() {
  const {
    currentUser, conversations, activeConversationId, isChatOpen,
    setChatOpen, setActiveConversationId, sendMessage, markMessageAsRead,
    sendMessageRich, setTypingState
  } = useStore();

  const [inputMessage, setInputMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Presence & Typing & Uploading States
  const [neighborTyping, setNeighborTyping] = useState(false);
  const [neighborStatus, setNeighborStatus] = useState<{ state: string; last_changed?: any } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeNeighbor = activeConv && activeConv.buyer && activeConv.seller
    ? (activeConv.buyer.id === currentUser?.id ? activeConv.seller : activeConv.buyer)
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, neighborTyping]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (activeConv && currentUser) {
      activeConv.messages?.forEach(msg => {
        if (msg.receiverId === currentUser.id && msg.status !== 'read') {
          markMessageAsRead(activeConv.id, msg.id);
        }
      });
    }
  }, [activeConversationId, activeConv, currentUser, markMessageAsRead]);

  // Handle typing state when typing inputMessage
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    if (inputMessage.trim() !== "") {
      setTypingState(activeConversationId, true);

      const delayDebounce = setTimeout(() => {
        setTypingState(activeConversationId, false);
      }, 2000);

      return () => clearTimeout(delayDebounce);
    } else {
      setTypingState(activeConversationId, false);
    }
  }, [inputMessage, activeConversationId, currentUser, setTypingState]);

  // Turn off typing state when unmounting or changing conversation
  useEffect(() => {
    return () => {
      if (activeConversationId) {
        setTypingState(activeConversationId, false);
      }
    };
  }, [activeConversationId, isChatOpen, setTypingState]);

  // Listen to neighbor presence status
  useEffect(() => {
    if (!activeNeighbor?.id) {
      setNeighborStatus(null);
      return;
    }

    const statusRef = ref(rtdb, `user_status/${activeNeighbor.id}`);
    const unsub = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNeighborStatus(data);
      } else {
        setNeighborStatus(null);
      }
    });

    return () => unsub();
  }, [activeNeighbor?.id]);

  // Listen to neighbor typing state
  useEffect(() => {
    if (!activeConversationId || !activeNeighbor?.id) {
      setNeighborTyping(false);
      return;
    }

    const typingRef = ref(rtdb, `typing_states/${activeConversationId}/${activeNeighbor.id}`);
    const unsub = onValue(typingRef, (snapshot) => {
      const isTyping = snapshot.val() === true;
      setNeighborTyping(isTyping);
    });

    return () => unsub();
  }, [activeConversationId, activeNeighbor?.id]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversationId) return;

    await sendMessageRich(activeConversationId, inputMessage.trim(), "text");
    setInputMessage("");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Görsel boyutu en fazla 5MB olabilir.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileRef = storageRef(storage, `chats/images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error", error);
          alert("Görsel yüklenemedi. Lütfen tekrar deneyin.");
          setUploadingImage(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessageRich(activeConversationId, "🖼️ Fotoğraf", "image", downloadUrl);
          setUploadingImage(false);
        }
      );
    } catch (e) {
      console.error(e);
      alert("Görsel yüklenirken hata oluştu.");
      setUploadingImage(false);
    }
  };

  const handleShareLocation = () => {
    if (!activeConversationId) return;

    if (!navigator.geolocation) {
      alert("Tarayıcınız konum paylaşımını desteklemiyor.");
      return;
    }

    if (!confirm("Buluşma noktasını koordine etmek için mevcut konumunuzu komşunuzla paylaşmak istiyor musunuz?")) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          address: "📍 Buluşma Konumu"
        };
        await sendMessageRich(
          activeConversationId,
          "📍 Buluşma Konumu",
          "location",
          undefined,
          locationData
        );
      },
      (error) => {
        console.error("Geolocation error", error);
        alert("Konum bilgisi alınamadı. Lütfen tarayıcı izinlerinizi kontrol edin.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isChatOpen) return null;

  // Filter conversations by search term
  const filteredConversations = conversations.filter((conv) => {
    if (!currentUser || !conv.buyer || !conv.seller) return false;
    const neighbor = conv.buyer.id === currentUser.id ? conv.seller : conv.buyer;
    if (!neighbor || !neighbor.name) return false;
    return neighbor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (conv.listingTitle && conv.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <AnimatePresence>
      {/* Backdrop overlay */}
      <motion.div
        key="chat-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={() => setChatOpen(false)}
        className="fixed inset-0 bg-slate-950 z-40 backdrop-blur-xs"
      />

      <motion.div
        key="chat-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[750px] lg:w-[850px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* MAIN CONTAINER HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-[#091a35] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <MessageSquare size={18} className="text-[#f58220] stroke-[2]" />
            </span>
            <div>
              <h2 className="font-bold text-sm tracking-wide">Mesaj Kutusu</h2>
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                {conversations.length} {filteredConversations.length === 1 ? "Görüşme" : "Görüşme"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer border-0"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: CONVERSATION LIST */}
          <div className={`w-full md:w-[280px] lg:w-[320px] flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shrink-0 ${activeConv ? "hidden md:flex" : "flex"}`}>
            {/* Search conversations */}
            {conversations.length > 0 && (
              <div className="p-3 border-b border-slate-100 dark:border-slate-900">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Sohbet veya ilan ara..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#f58220] transition-all"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/50 scrollbar-thin">
              {conversations.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-semibold text-xs leading-relaxed space-y-2">
                  <div className="h-10 w-10 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-350">
                    <MessageSquare size={18} />
                  </div>
                  <p>Henüz aktif bir sohbetiniz yok.</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Arama sonucu bulunamadı.
                </div>
              ) : (
                filteredConversations.map((conv, index) => {
                  if (!conv.buyer || !conv.seller) return null;
                  const neighbor = conv.buyer.id === currentUser?.id ? conv.seller : conv.buyer;
                  const isActive = conv.id === activeConversationId;
                  
                  // Calculate unread count for this conversation
                  const unreadCount = conv.messages?.filter(msg => 
                    msg.receiverId === currentUser?.id && msg.status !== 'read'
                  ).length || 0;

                  return (
                    <button
                      key={conv.id ? `${conv.id}-${index}` : `conv-${index}`}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full p-4 text-left transition-all cursor-pointer flex items-center gap-3 relative border-l-4 ${
                        isActive 
                          ? "bg-orange-50/40 dark:bg-orange-950/10 border-l-[#f58220]" 
                          : "border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      }`}
                    >
                      <span className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm border-2 border-white dark:border-slate-800">
                        {neighbor.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{neighbor.name}</h4>
                          {conv.messages && conv.messages.length > 0 && (
                            <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                              {formatTime(conv.messages[conv.messages.length - 1].createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.listingTitle && (
                          <div className="flex items-center gap-1 text-[9px] text-[#f58220] font-bold mt-0.5 truncate">
                            <Tag size={8} />
                            <span className="truncate">{conv.listingTitle}</span>
                          </div>
                        )}
                        <p className={`text-[10px] truncate mt-1 ${unreadCount > 0 ? "font-bold text-slate-800 dark:text-slate-100" : "font-semibold text-slate-400"}`}>
                          {conv.lastMessage || "..."}
                        </p>
                      </div>
                      
                      {unreadCount > 0 && (
                        <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-[#f58220] text-white text-[9px] font-black flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE CHAT SCREEN */}
          {activeConv && activeNeighbor ? (
            <div className="flex-1 flex flex-col bg-[#fcfdfe] dark:bg-slate-950 relative">
              
              {/* Active Neighbor Profile Header Bar */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer border-0"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  
                  <span className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-white dark:border-slate-800 shadow-sm relative">
                    {activeNeighbor.name.slice(0, 2).toUpperCase()}
                    {neighborStatus?.state === "online" && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm animate-pulse" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <Link
                      href={`/profile?userId=${activeNeighbor.id}`}
                      className="font-bold text-xs text-slate-800 dark:text-slate-200 hover:text-[#f58220] transition-colors truncate block"
                      onClick={() => setChatOpen(false)}
                    >
                      {activeNeighbor.name}
                    </Link>
                    <p className="text-[10px] text-slate-400 font-semibold truncate uppercase mt-0.5 flex items-center gap-1.5">
                      <span>{activeNeighbor.title || "Komşu"}</span>
                      <span>&bull;</span>
                      <span className={neighborStatus?.state === "online" ? "text-emerald-500 font-black lowercase" : "lowercase"}>
                        {neighborStatus?.state === "online" ? "çevrimiçi" : "çevrimdışı"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f58220]/10 hover:bg-[#f58220]/25 text-[#f58220] hover:text-[#e07216] font-bold text-[10px] rounded-full transition-all cursor-pointer active:scale-95 border-0"
                  >
                    <Star size={12} className="fill-[#f58220]" />
                    <span>Değerlendir</span>
                  </button>

                  {activeConv.listingTitle && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-full text-[10px] font-bold text-[#f58220] max-w-[200px] truncate">
                      <Tag size={10} />
                      <span className="truncate">{activeConv.listingTitle}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Listing Context Ribbon for Mobile */}
              {activeConv.listingTitle && (
                <div className="sm:hidden px-4 py-1.5 border-b border-slate-100 dark:border-slate-900 bg-orange-50/50 dark:bg-orange-950/5 flex items-center gap-1 text-[9px] font-bold text-slate-500">
                  <span className="text-[#f58220]">İlan:</span>
                  <span className="truncate font-semibold">{activeConv.listingTitle}</span>
                </div>
              )}

              {/* Chat Pane Messages Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 dark:bg-slate-950/30 scrollbar-thin">
                {activeConv.messages?.map((msg, index) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isSelected = selectedMessageId === msg.id;
                  return (
                    <div key={msg.id ? `${msg.id}-${index}` : `msg-${index}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[78%] ${isMe ? "ml-auto" : "mr-auto"}`}>
                      <div 
                        onDoubleClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                        className={`p-3.5 rounded-2xl text-[12px] leading-relaxed shadow-xs cursor-pointer transition-all ${
                          isMe 
                            ? "bg-gradient-to-br from-[#091a35] to-[#152a4e] text-white rounded-tr-none" 
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                        } ${isSelected ? "ring-2 ring-[#f58220] ring-offset-2 dark:ring-offset-slate-950" : ""}`}
                      >
                        {/* Rich Type Renderers */}
                        {msg.type === "image" && msg.mediaUrl ? (
                          <div className="space-y-1 overflow-hidden rounded-lg">
                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[240px] hover:opacity-90 transition-opacity">
                              <img
                                src={msg.mediaUrl}
                                alt="Fotoğraf"
                                className="w-full h-auto max-h-48 object-cover rounded-lg border border-white/10 shadow-sm"
                              />
                            </a>
                            <span className="block text-[9px] text-slate-400 italic mt-1 text-right">
                              {msg.content}
                            </span>
                          </div>
                        ) : msg.type === "location" && msg.location ? (
                          <div className="space-y-3 p-1 max-w-[240px] text-left">
                            <div className="flex items-start gap-2.5">
                              <span className="h-8 w-8 bg-[#f58220]/25 text-[#f58220] rounded-xl flex items-center justify-center shrink-0">
                                <MapPin size={18} className="fill-[#f58220]" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs">Buluşma Noktası</h4>
                                <p className="text-[9.5px] text-slate-400 mt-0.5 truncate">
                                  Konum paylaşıldı
                                </p>
                              </div>
                            </div>
                            
                            <a
                              href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#f58220] hover:bg-[#e07216] text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm text-center border-0"
                            >
                              Google Haritada Aç
                            </a>
                          </div>
                        ) : (
                          <div className="break-words font-medium">{msg.content}</div>
                        )}
                        
                        {isMe && msg.status && (
                          <div className="flex items-center gap-0.5 mt-1 justify-end opacity-85">
                            {msg.status === 'sent' && <Check size={11} className="text-white/60" />}
                            {msg.status === 'delivered' && <CheckCheck size={11} className="text-white/60" />}
                            {msg.status === 'read' && <CheckCheck size={11} className="text-[#f58220]" />}
                          </div>
                        )}
                      </div>
                      <div className={`text-[9px] text-slate-400 mt-1.5 flex items-center gap-1 ${isMe ? "mr-1.5" : "ml-1.5"}`}>
                        <Clock size={9.5} />
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing status indicator bubbles */}
                {neighborTyping && (
                  <div className="flex items-start gap-2.5 max-w-[78%] mr-auto animate-pulse">
                    <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-sm border border-white">
                      {activeNeighbor.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-semibold italic">Yazıyor</span>
                      <span className="flex gap-1">
                        <span className="h-1 w-1 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="h-1 w-1 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1 w-1 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.3s]" />
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Bar Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center shrink-0">
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Share Image Button */}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploadingImage}
                  className="h-9.5 w-9.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-[#f58220] flex items-center justify-center transition-all cursor-pointer shrink-0 border-0"
                  title="Fotoğraf Paylaş"
                >
                  {uploadingImage ? (
                    <svg className="animate-spin h-4.5 w-4.5 text-[#f58220]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Camera size={16} />
                  )}
                </button>

                {/* Share Location Button */}
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="h-9.5 w-9.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-[#f58220] flex items-center justify-center transition-all cursor-pointer shrink-0 border-0"
                  title="Konum Paylaş"
                >
                  <MapPin size={16} />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-medium text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] transition-all"
                />
                
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="h-9.5 w-9.5 rounded-xl bg-[#f58220] hover:bg-[#e07216] disabled:bg-slate-200 dark:disabled:bg-slate-850 text-white disabled:text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:pointer-events-none border-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          ) : (
            /* Empty State for Desktop Split View */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-950/20">
              <div className="h-16 w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-xs text-slate-350 dark:text-slate-600 mb-4 animate-pulse">
                <MessageSquare size={28} />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Sohbet Seçilmedi</h3>
              <p className="text-xs max-w-xs mt-1.5 leading-relaxed font-semibold">
                Lütfen soldaki listeden bir komşunuzu seçerek konuşmayı başlatın veya ilan sahiplerine mesaj gönderin.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      {isReviewModalOpen && activeNeighbor && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          reviewedUserId={activeNeighbor.id}
          reviewedUserName={activeNeighbor.name}
          listingId={activeConv?.listingId}
        />
      )}
    </AnimatePresence>
  );
}
