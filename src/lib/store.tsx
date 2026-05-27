"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, doc, setDoc, onSnapshot, query, orderBy, where, getDoc, getDocs,
  serverTimestamp, addDoc, updateDoc, increment, deleteDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { 
  ref, onValue, push, set, onDisconnect, serverTimestamp as rtdbTimestamp 
} from "firebase/database";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile as updateAuthProfile, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { db, rtdb, auth, isConfigured } from "./firebase";
import { userSchema, loginSchema, listingSchema, feedPostSchema, messageSchema, profileUpdateSchema } from "./schemas";

// --- TYPES ---
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  neighborhood?: string;
  title: string;
  bio: string;
  skills: string[];
  joinedDate: string;
  role?: "user" | "admin" | "banned";
  favorites?: string[];
  isBanned?: boolean;
  isVerified?: boolean; // <-- Eklendi
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "borrow" | "ask" | "gift" | "sell";
  condition: "Yeni" | "Çok İyi" | "İyi" | "Kullanılmış";
  location: string;
  owner: User;
  imageUrl: string;
  imageUrls: string[];
  price?: number;
  createdAt: any;
  status: "available" | "reserved" | "completed" | "archived";
  commentsCount: number;
  favoritedBy?: string[];
  favoriteCount?: number;
}

export interface FeedPost {
  id: string;
  type: "announcement" | "discussion" | "listing_share";
  title?: string;
  content: string;
  author: User;
  createdAt: any;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  category?: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: any;
  postId: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: any;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'location';
  mediaUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Conversation {
  id: string;
  listingId?: string;
  listingTitle?: string;
  buyer: User;
  seller: User;
  messages: Message[];
  lastMessage: string;
  updatedAt: any;
}

export interface Notification {
  id: string;
  type: "message_received" | "listing_favorited" | "post_liked" | "post_commented" | "listing_status_changed" | "review_received";
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  link?: string;
  fromUser?: { id: string; name: string };
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewedUserId: string;
  listingId?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export type ThemeMode = "light" | "dark" | "system";
export type ToastType = { message: string; type: "success" | "error" | "info" };

interface StoreContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  listings: Listing[];
  feedPosts: FeedPost[];
  conversations: Conversation[];
  notifications: Notification[];
  unreadNotificationCount: number;
  activeConversationId: string | null;
  isChatOpen: boolean;
  listingsPage: number;
  listingsPerPage: number;
  isLoading: boolean;
  error: string | null;
  theme: ThemeMode;
  toast: ToastType | null; // <-- Eklendi
  showToast: (toast: ToastType) => void; // <-- Eklendi
  hideToast: () => void; // <-- Eklendi
  clearError: () => void;
  setTheme: (theme: ThemeMode) => void;
  registerUser: (name: string, email: string, phone: string, password: string, title?: string, bio?: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, code: string, name: string) => Promise<void>;
  updateUserProfile: (name: string, email: string, phone: string, title?: string, bio?: string) => Promise<void>;
  addListing: (title: string, description: string, category: string, type: Listing["type"], condition: Listing["condition"], location: string, price?: number, imageUrl?: string, imageUrls?: string[]) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  addFeedPost: (content: string, type: FeedPost["type"], title?: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  sendMessageRich: (
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'location',
    mediaUrl?: string,
    location?: { lat: number; lng: number; address: string }
  ) => Promise<void>;
  setTypingState: (conversationId: string, isTyping: boolean) => Promise<void>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<void>;
  updateListing: (listingId: string, title: string, description: string, category: string, type: Listing["type"], condition: string, location: string, price?: number, imageUrl?: string, imageUrls?: string[]) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  addListingComment: (listingId: string, content: string) => Promise<void>;
  answerListingComment: (listingId: string, commentId: string, answerContent: string) => Promise<void>;
  startConversation: (listingId: string, seller: User) => Promise<string>;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  isFavorited: (listingId: string) => boolean;
  addReview: (reviewedUserId: string, rating: number, comment: string, listingId?: string) => Promise<void>;
  getUserReviews: (userId: string) => Promise<Review[]>;
  addReport: (targetType: "listing" | "user", targetId: string, reason: string, description: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  createNotification: (userId: string, type: Notification["type"], title: string, message: string, link?: string) => Promise<void>;
  setChatOpen: (open: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  setListingsPage: (page: number) => void;
  logoutUser: () => void;
}

const getValidationError = (err: any, fallback: string) => {
  if (!err) return fallback;
  if (Array.isArray(err.issues) && err.issues[0]?.message) {
    return err.issues[0].message;
  }
  if (Array.isArray(err.errors) && err.errors[0]?.message) {
    return err.errors[0].message;
  }
  return err.message || fallback;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const stripUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) cleaned[key] = stripUndefined(val);
    }
    return cleaned;
  }
  return obj;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatOpen, setChatOpen] = useState<boolean>(false);
  const [listingsPage, setListingsPage] = useState<number>(1);
  const listingsPerPage = 12;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null); // <-- Eklendi

  // Theme
  const [theme, setThemeState] = useState<ThemeMode>("light");

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("komsu_theme", newTheme);
      const root = document.documentElement;
      root.classList.remove("dark", "light");
      if (newTheme === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(newTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("komsu_theme") as ThemeMode | null;
      if (saved) {
        setTheme(saved);
      }
    }
  }, [setTheme]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!currentUser) return;

    try {
      const myConnectionsRef = ref(rtdb, `user_status/${currentUser.id}`);
      const connectedRef = ref(rtdb, ".info/connected");
      
      const unsubConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          set(myConnectionsRef, {
            state: "online",
            last_changed: rtdbTimestamp()
          }).catch(err => console.error("Failed to set online status", err));

          onDisconnect(myConnectionsRef).set({
            state: "offline",
            last_changed: rtdbTimestamp()
          }).catch(err => console.error("Failed to set onDisconnect status", err));
        }
      });

      return () => {
        unsubConnected();
        set(myConnectionsRef, {
          state: "offline",
          last_changed: rtdbTimestamp()
        }).catch(err => console.error("Failed to set offline status on cleanup", err));
      };
    } catch (e) {
      console.error("Presence tracking failed to init", e);
    }
  }, [currentUser]);

  useEffect(() => {
    const cachedListings = localStorage.getItem('komsu_listings');
    const cachedFeedPosts = localStorage.getItem('komsu_feed_posts');
    
    if (cachedListings) {
      try {
        setListings(JSON.parse(cachedListings));
      } catch (e) {
        console.error('Failed to parse cached listings', e);
      }
    }
    
    if (cachedFeedPosts) {
      try {
        setFeedPosts(JSON.parse(cachedFeedPosts));
      } catch (e) {
        console.error('Failed to parse cached feed posts', e);
      }
    }
  }, []);

  useEffect(() => {
    if (listings.length > 0) {
      localStorage.setItem('komsu_listings', JSON.stringify(listings));
    }
  }, [listings]);

  useEffect(() => {
    if (feedPosts.length > 0) {
      localStorage.setItem('komsu_feed_posts', JSON.stringify(feedPosts));
    }
  }, [feedPosts]);

  const clearError = () => setError(null);
  
  // Toast Notifications
  const showToast = useCallback((toastData: ToastType) => {
    setToast(toastData);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  // Initialize Auth & Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user document
        const userUnsub = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isBanned || data.role === "banned") {
              signOut(auth);
              setCurrentUser(null);
              setIsAuthLoading(false);
              showToast({ message: "Hesabınız askıya alınmıştır.", type: "error" });
            } else {
              if (!data.role) {
                updateDoc(doc(db, "users", firebaseUser.uid), { role: "user" }).catch((err) => {
                  console.error("Failed to automatically migrate user role to 'user'", err);
                });
                data.role = "user";
              }
              setCurrentUser({ id: docSnap.id, ...data } as User);
              setIsAuthLoading(false);
            }
          } else {
            setCurrentUser(null);
            setIsAuthLoading(false);
          }
        });
        return () => userUnsub();
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    const qListings = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubListings = onSnapshot(qListings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(data);
    }, (error) => {
        console.error("Listing snapshot error:", error);
        showToast({ message: "İlanlar yüklenirken bir hata oluştu.", type: "error" });
    });

    const qPosts = query(collection(db, "feed_posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
      setFeedPosts(data);
     }, (error) => {
        console.error("Feed post snapshot error:", error);
        showToast({ message: "Paylaşımlar yüklenirken bir hata oluştu.", type: "error" });
    });

    return () => {
      unsubscribeAuth();
      unsubListings();
      unsubPosts();
    };
  }, [showToast]);

  // Listen to User's Conversations (RTDB)
  useEffect(() => {
    if (!currentUser) return;

    const convRef = ref(rtdb, 'user_conversations/' + currentUser.id);
    const unsub = onValue(convRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawConvs = Object.values(data) as Conversation[];
        const defaultUser = { id: '', name: 'Bilinmeyen', title: '', bio: '', skills: [], joinedDate: '' } as User;
        const convs = rawConvs
          .filter(c => c != null && typeof c === 'object' && c.id)
          .map(c => ({
            ...c,
            buyer: (c.buyer && typeof c.buyer === 'object') ? c.buyer : defaultUser,
            seller: (c.seller && typeof c.seller === 'object') ? c.seller : defaultUser,
            messages: (Array.isArray(c.messages)
              ? c.messages.filter((m: any) => m != null)
              : (c.messages && typeof c.messages === 'object')
                ? Object.values(c.messages).filter((m: any) => m != null)
                : []) as Message[],
          }));
        convs.sort((a, b) => {
          const timeA = a.updatedAt ? (typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt).getTime()) : 0;
          const timeB = b.updatedAt ? (typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt).getTime()) : 0;
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
        setConversations(convs);
      } else {
        setConversations([]);
      }
    });

    return () => unsub();
  }, [currentUser]);

  // Listen to Notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifQuery = query(
      collection(db, "notifications", currentUser.id, "items"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(notifQuery, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(data);
    });

    return () => unsub();
  }, [currentUser]);

  // --- ACTIONS ---

  const registerUser = async (name: string, email: string, phone: string, password: string, title?: string, bio?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      userSchema.parse({ name, email, phone, password, title, bio });
    } catch (err: any) {
      const message = getValidationError(err, "Girdiler doğrulanamadı.");
      showToast({ message, type: "error" });
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      const phoneQuery = query(collection(db, "users"), where("phone", "==", phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        const message = "Bu telefon numarası zaten kullanımda.";
        showToast({ message, type: "error" });
        setIsLoading(false);
        throw new Error(message);
      }
    } catch (err) {
      if ((err as Error).message === "Bu telefon numarası zaten kullanımda.") throw err;
      const message = "Telefon kontrolü başarısız.";
      showToast({ message, type: "error" });
      setIsLoading(false);
      throw new Error(message);
    }

    const joinedDate = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const newUserData = {
        name,
        email,
        phone,
        neighborhood: "",
        title: title || "Üye",
        bio: bio || "Paylaşım ve yardımlaşma platformu üyesi.",
        skills: [title || "Paylaşım"],
        joinedDate,
        role: "user",
        favorites: [],
        isVerified: false,
      };
      
      await setDoc(doc(db, "users", user.uid), newUserData);

      await addDoc(collection(db, "feed_posts"), {
        type: "announcement",
        title: "ARAMIZA YENİ BİRİ KATILDI",
        content: `MERHABA. BEN ${name.toUpperCase()}. PLATFORMA KATILDIM!`,
        author: { id: user.uid, ...newUserData },
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
      });

      showToast({ message: "Hoş geldin! Hesabın başarıyla oluşturuldu.", type: "success" });
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string; code?: string };
      const message = firebaseErr.message || "Kayıt başarısız oldu.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      loginSchema.parse({ email, password });
    } catch (err: any) {
      const message = getValidationError(err, "Girdiğiniz bilgiler hatalı.");
      showToast({ message, type: "error" });
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
       showToast({ message: "Tekrar hoş geldin!", type: "success" });
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string; code?: string };
      const message = firebaseErr.message || "Giriş başarısız oldu.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      showToast({ message: "Doğrulama kodu gönderildi.", type: "info" });
      return confirmationResult;
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "OTP gönderilemedi.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, code: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmationResult.confirm(code);
      
      const userDocRef = doc(db, "users", result.user.uid);
      await setDoc(userDocRef, {
        id: result.user.uid,
        name: name,
        phone: result.user.phoneNumber,
        title: "Üye",
        bio: "Telefon ile giriş yaptı",
        skills: [],
        joinedDate: new Date().toLocaleDateString("tr-TR"),
        role: "user",
        favorites: [],
        isVerified: false,
      }, { merge: true });

      showToast({ message: "Başarıyla giriş yaptın!", type: "success" });
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "OTP doğrulaması başarısız.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (name: string, email: string, phone: string, title?: string, bio?: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    
    try {
      profileUpdateSchema.parse({ name, email, phone, title, bio });
    } catch (err) {
      const message = "Profil bilgileri doğrulanamadı.";
      showToast({ message, type: "error" });
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, {
        name,
        email,
        phone,
        title: title || currentUser.title,
        bio: bio || currentUser.bio,
      });

      await updateAuthProfile(auth.currentUser!, { displayName: name });
      showToast({ message: "Profilin başarıyla güncellendi.", type: "success" });
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "Profil güncellenemedi.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addListing = async (title: string, description: string, category: string, type: Listing["type"], condition: Listing["condition"], location: string, price?: number, imageUrl?: string, imageUrls?: string[]) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      listingSchema.parse({ title, description, category, type, condition, location, price });
    } catch (err) {
      const message = "İlan bilgileri doğrulanamadı.";
      showToast({ message, type: "error" });
      setIsLoading(false);
      throw new Error(message);
    }

    const resolvedImageUrls = imageUrls || (imageUrl ? [imageUrl] : []);

    const newListingData: Record<string, unknown> = {
      title,
      description,
      category,
      type,
      condition,
      location,
      owner: currentUser,
      imageUrl: resolvedImageUrls[0] || (type === "borrow" ? "borrow" : type === "gift" ? "gift" : type === "sell" ? "sell" : "ask"),
      imageUrls: resolvedImageUrls,
      createdAt: serverTimestamp(),
      status: "available",
      commentsCount: 0,
      favoritedBy: [],
      favoriteCount: 0,
    };

    if (type === "sell" && price !== undefined && price > 0) {
      newListingData.price = price;
    }

    try {
      await addDoc(collection(db, "listings"), newListingData);
      
      await addDoc(collection(db, "feed_posts"), {
        type: "listing_share",
        content: `YENİ BİR İLAN PAYLAŞTI: ${title.toUpperCase()}`,
        author: currentUser,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        category,
      });

      showToast({ message: "İlanın başarıyla yayınlandı!", type: "success" });
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "İlan oluşturulamadı.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!currentUser) return;

    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) throw new Error("İlan bulunamadı");
      if (listing.owner.id !== currentUser.id && currentUser.role !== "admin") throw new Error("Bu ilanı silme yetkiniz yok");
      await deleteDoc(doc(db, "listings", listingId));
      showToast({ message: "İlan başarıyla silindi.", type: "success" });
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "İlan silinemedi.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeedPost = async (content: string, type: FeedPost["type"], title?: string) => {
    if (!currentUser) return;

    try {
      feedPostSchema.parse({ content, type, title });
    } catch (err: any) {
      const message = getValidationError(err, "Paylaşım bilgileri hatalı.");
      showToast({ message, type: "error" });
      throw new Error(message);
    }

    const postData = {
      type,
      title: title || "",
      content,
      author: currentUser,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      commentsCount: 0,
    };

    try {
      await addDoc(collection(db, "feed_posts"), postData);
      showToast({ message: "Paylaşımın yapıldı.", type: "success" });
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      const message = firebaseErr.message || "Paylaşım oluşturulamadı.";
      showToast({ message, type: "error" });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = async (listingId: string, seller: User): Promise<string> => {
    if (!currentUser) return "";

    const existing = conversations.find(c => c.listingId === listingId && (c.buyer.id === currentUser.id || c.seller.id === currentUser.id));
    if (existing) {
      setActiveConversationId(existing.id);
      setChatOpen(true);
      return existing.id;
    }

    const newConvId = push(ref(rtdb, 'conversations')).key!.replace(/\//g, '_');
    const convData = {
      id: newConvId,
      listingId,
      buyer: currentUser,
      seller,
      messages: [],
      lastMessage: "SİSTEM: BAĞLANTI KURULDU.",
      updatedAt: rtdbTimestamp()
    };

    try {
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${newConvId}`), convData);
      await set(ref(rtdb, `user_conversations/${seller.id}/${newConvId}`), convData);
      
      setActiveConversationId(newConvId);
      setChatOpen(true);
      return newConvId;
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Sohbet başlatılamadı.", type: "error" });
      throw new Error(firebaseErr.message || "Sohbet başlatılamadı.");
    } 
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!currentUser) return;

    try {
      messageSchema.parse({ content });
    } catch (err) {
      showToast({ message: "Mesaj gönderilemedi.", type: "error" });
      throw new Error("Mesaj gönderilemedi.");
    }

    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const receiver = conv.buyer.id === currentUser.id ? conv.seller : conv.buyer;
    
    const newMessage = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      receiverId: receiver.id,
      content,
      createdAt: rtdbTimestamp(),
      status: 'sent' as const
    };

    const updatedMessages = stripUndefined([...(conv.messages || []), newMessage]);

    try {
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/messages`), updatedMessages);
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/lastMessage`), content);
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/updatedAt`), rtdbTimestamp());
      
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/messages`), updatedMessages);
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/lastMessage`), content);
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/updatedAt`), rtdbTimestamp());

      await createNotification(
        receiver.id,
        "message_received",
        "Yeni Mesaj",
        `${currentUser.name} size bir mesaj gönderdi.`
      );
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Mesaj gönderilemedi.", type: "error" });
      throw new Error(firebaseErr.message || "Mesaj gönderilemedi.");
    }
  };

  const setTypingState = async (conversationId: string, isTyping: boolean) => {
    if (!currentUser) return;
    try {
      await set(ref(rtdb, `typing_states/${conversationId}/${currentUser.id}`), isTyping);
    } catch (err) {
      console.error("Failed to update typing state", err);
    }
  };

  const sendMessageRich = async (
    conversationId: string,
    content: string,
    type: 'text' | 'image' | 'location',
    mediaUrl?: string,
    location?: { lat: number; lng: number; address: string }
  ) => {
    if (!currentUser) return;

    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const receiver = conv.buyer.id === currentUser.id ? conv.seller : conv.buyer;
    
    const newMessage: Record<string, any> = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      receiverId: receiver.id,
      content,
      createdAt: rtdbTimestamp(),
      status: 'sent' as const,
      type,
    };
    if (mediaUrl !== undefined) newMessage.mediaUrl = mediaUrl;
    if (location !== undefined) newMessage.location = location;

    const updatedMessages = stripUndefined([...(conv.messages || []), newMessage]);

    try {
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/messages`), updatedMessages);
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/lastMessage`), content);
      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/updatedAt`), rtdbTimestamp());
      
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/messages`), updatedMessages);
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/lastMessage`), content);
      await set(ref(rtdb, `user_conversations/${receiver.id}/${conversationId}/updatedAt`), rtdbTimestamp());

      await createNotification(
        receiver.id,
        "message_received",
        "Yeni Mesaj",
        `${currentUser.name}: ${content}`,
        `/?openChat=true`
      );
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Mesaj gönderilemedi.", type: "error" });
      throw err;
    }
  };

  const markMessageAsRead = async (conversationId: string, messageId: string) => {
    if (!currentUser) return;

    try {
      const conv = conversations.find(c => c.id === conversationId);
      if (!conv) return;

      const updatedMessages = (conv.messages || []).map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' as const } : msg
      );

      await set(ref(rtdb, `user_conversations/${currentUser.id}/${conversationId}/messages`), updatedMessages);
    } catch (err) {
      console.error("Failed to mark message as read", err);
    }
  };

  const updateListing = async (listingId: string, title: string, description: string, category: string, type: Listing["type"], condition: string, location: string, price?: number, imageUrl?: string, imageUrls?: string[]) => {
    if (!currentUser) return;

    try {
      const listingRef = doc(db, "listings", listingId);
      const listing = listings.find(l => l.id === listingId);
      
      if (!listing || (listing.owner.id !== currentUser.id && currentUser.role !== "admin")) {
        throw new Error("Bu ilanı düzenleme yetkiniz yok.");
      }

      const updateData: Record<string, unknown> = {
        title,
        description,
        category,
        type,
        condition,
        location,
        imageUrl: imageUrl || (imageUrls && imageUrls[0]) || listing.imageUrl,
        imageUrls: imageUrls || listing.imageUrls || [],
      };

      if (type === "sell" && price !== undefined) {
        updateData.price = price;
      }

      await updateDoc(listingRef, updateData);
      showToast({ message: "İlan başarıyla güncellendi.", type: "success" });
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "İlan güncellenemedi.", type: "error" });
      throw err;
    } 
  };

  const toggleLikePost = async (postId: string) => {
    if (!currentUser) return;

    const postRef = doc(db, "feed_posts", postId);
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likedBy?.includes(currentUser.id);
    
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: post.likedBy.filter(id => id !== currentUser.id)
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...(post.likedBy || []), currentUser.id]
        });

        if (post.author.id !== currentUser.id) {
          await createNotification(
            post.author.id,
            "post_liked",
            "Beğeni",
            `${currentUser.name} paylaşımınızı beğendi.`
          );
        }
      }
    } catch (e: unknown) {
      const firebaseErr = e as { message?: string };
      showToast({ message: firebaseErr.message || "Beğeni işlemi başarısız oldu.", type: "error" });
      throw new Error(firebaseErr.message || "Beğeni işlemi başarısız oldu.");
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!currentUser) return;

    try {
      const commentsRef = collection(db, "feed_posts", postId, "comments");
      await addDoc(commentsRef, {
        content,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          phone: currentUser.phone,
          title: currentUser.title,
          bio: currentUser.bio,
          joinedDate: currentUser.joinedDate
        },
        createdAt: serverTimestamp(),
        postId
      });

      const postRef = doc(db, "feed_posts", postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      const post = feedPosts.find((p) => p.id === postId);
      if (post && post.author.id !== currentUser.id) {
        await createNotification(
          post.author.id,
          "post_commented",
          "Yeni Yorum",
          `${currentUser.name} paylaşımınıza yorum yaptı.`
        );
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Yorum eklenemedi.", type: "error" });
      throw err;
    }
  };

  const addListingComment = async (listingId: string, content: string) => {
    if (!currentUser) return;

    try {
      const commentsRef = collection(db, "listings", listingId, "comments");
      const commentDocRef = await addDoc(commentsRef, {
        content,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          title: currentUser.title,
          bio: currentUser.bio,
          joinedDate: currentUser.joinedDate
        },
        createdAt: serverTimestamp(),
        listingId
      });

      try {
        const listingRef = doc(db, "listings", listingId);
        await updateDoc(listingRef, {
          commentsCount: increment(1)
        });
      } catch (updateErr) {
        console.warn("Could not increment comment count.", updateErr);
      }

      const listing = listings.find((l) => l.id === listingId);
      if (listing && listing.owner.id !== currentUser.id) {
        await createNotification(
          listing.owner.id,
          "listing_status_changed",
          "İlanınıza Yeni Soru",
          `${currentUser.name} "${listing.title}" ilanınıza bir soru sordu.`,
          `/?openListing=${listingId}&highlightComment=${commentDocRef.id}`
        );
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Yorum eklenemedi.", type: "error" });
      throw err;
    }
  };

  const answerListingComment = async (listingId: string, commentId: string, answerContent: string) => {
    if (!currentUser) return;

    try {
      const commentRef = doc(db, "listings", listingId, "comments", commentId);
      await updateDoc(commentRef, {
        answer: answerContent,
        answeredAt: serverTimestamp()
      });

      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        if (commentData.author?.id && commentData.author.id !== currentUser.id) {
          const listing = listings.find((l) => l.id === listingId);
          await createNotification(
            commentData.author.id,
            "listing_status_changed",
            "Sorunuz Cevaplandı",
            `"${listing?.title || 'İlan'}" hakkındaki sorunuz cevaplandı.`,
            `/?openListing=${listingId}&highlightComment=${commentId}`
          );
        }
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Cevap gönderilemedi.", type: "error" });
      throw err;
    }
  };

  const toggleFavorite = async (listingId: string) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.id);
      const listingRef = doc(db, "listings", listingId);
      const alreadyFavorited = currentUser.favorites?.includes(listingId);

      if (alreadyFavorited) {
        await updateDoc(userRef, { favorites: arrayRemove(listingId) });
        await updateDoc(listingRef, {
          favoritedBy: arrayRemove(currentUser.id),
          favoriteCount: increment(-1),
        });
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(listingId) });
        await updateDoc(listingRef, {
          favoritedBy: arrayUnion(currentUser.id),
          favoriteCount: increment(1),
        });

        const listing = listings.find((l) => l.id === listingId);
        if (listing && listing.owner.id !== currentUser.id) {
          await createNotification(
            listing.owner.id,
            "listing_favorited",
            "Yeni Favori",
            `${currentUser.name} "${listing.title}" ilanınızı favoriledi.`
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      showToast({ message: "Favori işlemi başarısız.", type: "error" });
    }
  };

  const isFavorited = (listingId: string): boolean => {
    return currentUser?.favorites?.includes(listingId) || false;
  };

  const addReview = async (reviewedUserId: string, rating: number, comment: string, listingId?: string) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "reviews"), {
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        reviewedUserId,
        listingId: listingId || "",
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      await createNotification(
        reviewedUserId,
        "review_received",
        "Yeni Değerlendirme",
        `${currentUser.name} size ${rating} yıldız verdi.`
      );
      showToast({ message: "Değerlendirmeniz için teşekkürler!", type: "success" });
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      showToast({ message: firebaseErr.message || "Değerlendirme gönderilemedi.", type: "error" });
      throw err;
    }
  };

  const getUserReviews = async (userId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, "reviews"), where("reviewedUserId", "==", userId));
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      reviews.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      return reviews;
    } catch (err) {
      console.error("Failed to get reviews", err);
      return [];
    }
  };

  const addReport = async (targetType: "listing" | "user", targetId: string, reason: string, description: string) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "reports"), {
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        targetType,
        targetId,
        reason,
        description,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      showToast({ message: "Raporun bize ulaştı. Teşekkür ederiz.", type: "success" });
    } catch (err) {
      console.error("Failed to submit report", err);
      showToast({ message: "Rapor gönderilemedi.", type: "error" });
      throw err;
    }
  };

  const createNotification = async (userId: string, type: Notification["type"], title: string, message: string, link?: string) => {
    try {
      await addDoc(collection(db, "notifications", userId, "items"), {
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
        link: link || "",
        fromUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
      });
    } catch (err) {
      console.error("Failed to create notification", err);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const notifRef = doc(db, "notifications", currentUser.id, "items", notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;

    try {
      const unread = notifications.filter((n) => !n.read);
      const promises = unread.map((n) =>
        updateDoc(doc(db, "notifications", currentUser.id, "items", n.id), { read: true })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const logoutUser = () => {
    signOut(auth);
    localStorage.removeItem("komsu_user");
    setCurrentUser(null);
    router.push("/");
  };

  return (
    <StoreContext.Provider value={{
      currentUser, isAuthLoading, listings, feedPosts, conversations, notifications, unreadNotificationCount,
      activeConversationId, isChatOpen,
      listingsPage, listingsPerPage, isLoading, error, theme, clearError, setTheme,
      toast, showToast, hideToast, // <-- Eklendi
      registerUser, loginUser, sendOtp, verifyOtp, updateUserProfile, addListing, deleteListing, addFeedPost, sendMessage, sendMessageRich, markMessageAsRead, updateListing, addComment, addListingComment, answerListingComment, startConversation, toggleLikePost,
      toggleFavorite, isFavorited, addReview, getUserReviews, addReport,
      markNotificationRead, markAllNotificationsRead, createNotification,
      setChatOpen, setActiveConversationId, setListingsPage, logoutUser,
      setTypingState
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
