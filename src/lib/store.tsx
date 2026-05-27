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

// Helper: Firebase RTDB rejects undefined values. Strip them from objects.
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

  // Load theme on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("komsu_theme") as ThemeMode | null;
      if (saved) {
        setTheme(saved);
      }
    }
  }, [setTheme]);

  // Computed
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  // Presence Tracking
  useEffect(() => {
    if (!currentUser) return;

    try {
      const myConnectionsRef = ref(rtdb, `user_status/${currentUser.id}`);
      const connectedRef = ref(rtdb, ".info/connected");
      
      const unsubConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Set user as online
          set(myConnectionsRef, {
            state: "online",
            last_changed: rtdbTimestamp()
          }).catch(err => console.error("Failed to set online status", err));

          // Set user to offline on disconnect
          onDisconnect(myConnectionsRef).set({
            state: "offline",
            last_changed: rtdbTimestamp()
          }).catch(err => console.error("Failed to set onDisconnect status", err));
        }
      });

      return () => {
        unsubConnected();
        // Set offline when unmounting (logging out or closing)
        set(myConnectionsRef, {
          state: "offline",
          last_changed: rtdbTimestamp()
        }).catch(err => console.error("Failed to set offline status on cleanup", err));
      };
    } catch (e) {
      console.error("Presence tracking failed to init", e);
    }
  }, [currentUser]);

  // Load cached data on mount
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

  // Cache listings when they change
  useEffect(() => {
    if (listings.length > 0) {
      localStorage.setItem('komsu_listings', JSON.stringify(listings));
    }
  }, [listings]);

  // Cache feed posts when they change
  useEffect(() => {
    if (feedPosts.length > 0) {
      localStorage.setItem('komsu_feed_posts', JSON.stringify(feedPosts));
    }
  }, [feedPosts]);

  const clearError = () => setError(null);

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
              setError("Hesabınız topluluk kurallarını ihlal ettiği için engellenmiştir.");
              alert("Hesabınız topluluk kurallarını ihlal ettiği için engellenmiştir.");
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

    // Listen to Listings
    const qListings = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubListings = onSnapshot(qListings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(data);
    });

    // Listen to Feed Posts
    const qPosts = query(collection(db, "feed_posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
      setFeedPosts(data);
    });

    return () => {
      unsubscribeAuth();
      unsubListings();
      unsubPosts();
    };
  }, []);

  // Listen to User's Conversations (RTDB)
  useEffect(() => {
    if (!currentUser) return;

    const convRef = ref(rtdb, 'user_conversations/' + currentUser.id);
    const unsub = onValue(convRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawConvs = Object.values(data) as Conversation[];
        // Sanitize conversations: ensure buyer/seller exist and messages is a clean array
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
      console.error("Validation failed", err);
      const message = getValidationError(err, "Girdiler doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      const phoneQuery = query(collection(db, "users"), where("phone", "==", phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        setError("Bu telefon numarası zaten kullanımda.");
        setIsLoading(false);
        throw new Error("Bu telefon numarası zaten kullanımda.");
      }
    } catch (err) {
      if ((err as Error).message === "Bu telefon numarası zaten kullanımda.") throw err;
      console.error("Phone check failed", err);
      setError("Telefon kontrolü başarısız. Lütfen tekrar deneyin.");
      setIsLoading(false);
      throw new Error("Telefon kontrolü başarısız. Lütfen tekrar deneyin.");
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
      };
      
      await setDoc(doc(db, "users", user.uid), newUserData);

      await addDoc(collection(db, "feed_posts"), {
        type: "announcement",
        title: "ARAMIZA YENİ BİRİ KATILDI",
        content: `MERHABA. BEN ${name.toUpperCase()}. PLATFORMA KATILDIM. SİZLERLE YARDIMLAŞMAK VE PAYLAŞMAK İÇİN BURADAYIM!`,
        author: { id: user.uid, ...newUserData },
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
      });

      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string; code?: string };
      console.error("Registration failed", err);
      setError(firebaseErr.message || "Kayıt başarısız oldu. Lütfen tekrar deneyin.");
      const customError = new Error(firebaseErr.message || "Kayıt başarısız oldu.");
      (customError as unknown as { code: string }).code = firebaseErr.code || "";
      throw customError;
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
      console.error("Validation failed", err);
      const message = getValidationError(err, "Girdiler doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string; code?: string };
      console.error("Login failed", err);
      setError(firebaseErr.message || "Giriş başarısız oldu. Lütfen tekrar deneyin.");
      const customError = new Error(firebaseErr.message || "Giriş başarısız oldu.");
      (customError as unknown as { code: string }).code = firebaseErr.code || "";
      throw customError;
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
      return confirmationResult;
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to send OTP", err);
      setError(firebaseErr.message || "OTP gönderilemedi. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "OTP gönderilemedi. Lütfen tekrar deneyin.");
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
      }, { merge: true });

      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to verify OTP", err);
      setError(firebaseErr.message || "OTP doğrulaması başarısız. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "OTP doğrulaması başarısız. Lütfen tekrar deneyin.");
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
      console.error("Validation failed", err);
      setError("Profil bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setIsLoading(false);
      throw new Error("Profil bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
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
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Profile update failed", err);
      setError(firebaseErr.message || "Profil güncellenemedi. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "Profil güncellenemedi. Lütfen tekrar deneyin.");
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
      console.error("Validation failed", err);
      setError("İlan bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setIsLoading(false);
      throw new Error("İlan bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
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
        content: `YENİ BİR İLAN PAYLAŞTI: ${title.toUpperCase()} [${type === "borrow" ? "ÖDÜNÇ" : type === "gift" ? "HEDİYE" : type === "sell" ? "SATILIK" : "ARANIYOR"}]`,
        author: currentUser,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        category,
      });

      router.push("/");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to add listing", err);
      setError(firebaseErr.message || "İlan oluşturulamadı. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "İlan oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) {
        throw new Error("İlan bulunamadı");
      }

      if (listing.owner.id !== currentUser.id && currentUser.role !== "admin") {
        throw new Error("Bu ilanı silme yetkiniz yok");
      }

      await deleteDoc(doc(db, "listings", listingId));
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to delete listing", err);
      setError(firebaseErr.message || "İlan silinemedi. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "İlan silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const addFeedPost = async (content: string, type: FeedPost["type"], title?: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      feedPostSchema.parse({ content, type, title });
    } catch (err: any) {
      console.error("Validation failed", err);
      const message = getValidationError(err, "Paylaşım bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setError(message);
      setIsLoading(false);
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
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to add post", err);
      setError(firebaseErr.message || "Paylaşım oluşturulamadı. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "Paylaşım oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = async (listingId: string, seller: User): Promise<string> => {
    if (!currentUser) return "";

    setIsLoading(true);
    setError(null);
    
    const existing = conversations.find(c => c.listingId === listingId && (c.buyer.id === currentUser.id || c.seller.id === currentUser.id));
    if (existing) {
      setActiveConversationId(existing.id);
      setChatOpen(true);
      setIsLoading(false);
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
      console.error("Failed to start conversation", err);
      setError(firebaseErr.message || "Sohbet başlatılamadı. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "Sohbet başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      messageSchema.parse({ content });
    } catch (err) {
      console.error("Validation failed", err);
      setError("Mesaj doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
      setIsLoading(false);
      throw new Error("Mesaj doğrulanamadı. Lütfen bilgilerinizi kontrol edin.");
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

      // Create notification for receiver
      await createNotification(
        receiver.id,
        "message_received",
        "Yeni Mesaj",
        `${currentUser.name} size bir mesaj gönderdi.`
      );
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to send message", err);
      setError(firebaseErr.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
      throw new Error(firebaseErr.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);

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

      // Create notification for receiver
      await createNotification(
        receiver.id,
        "message_received",
        "Yeni Mesaj",
        `${currentUser.name}: ${content}`,
        `/?openChat=true`
      );
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to send rich message", err);
      setError(firebaseErr.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
      throw err;
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);

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
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to update listing", err);
      setError(firebaseErr.message || "İlan güncellenemedi. Lütfen tekrar deneyin.");
      throw err;
    } finally {
      setIsLoading(false);
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

        // Notify post author
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
      console.error(e);
      setError(firebaseErr.message || "Beğeni işlemi başarısız oldu.");
      throw new Error(firebaseErr.message || "Beğeni işlemi başarısız oldu.");
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

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

      // Notify post author
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
      console.error("Failed to add comment", err);
      setError(firebaseErr.message || "Yorum eklenemedi. Lütfen tekrar deneyin.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addListingComment = async (listingId: string, content: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

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
        console.warn("Failed to increment commentsCount (expected if firestore.rules are not deployed):", updateErr);
      }

      // Notify listing owner
      const listing = listings.find((l) => l.id === listingId);
      if (listing && listing.owner.id !== currentUser.id) {
        await createNotification(
          listing.owner.id,
          "listing_status_changed",
          "İlanınıza Yeni Soru",
          `${currentUser.name} "${listing.title}" ilanınıza yeni bir soru yazdı.`,
          `/?openListing=${listingId}&highlightComment=${commentDocRef.id}`
        );
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to add listing comment", err);
      setError(firebaseErr.message || "Yorum eklenemedi. Lütfen tekrar deneyin.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const answerListingComment = async (listingId: string, commentId: string, answerContent: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const commentRef = doc(db, "listings", listingId, "comments", commentId);
      await updateDoc(commentRef, {
        answer: answerContent,
        answeredAt: serverTimestamp()
      });

      // Notify the asker
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        if (commentData.author?.id && commentData.author.id !== currentUser.id) {
          const listing = listings.find((l) => l.id === listingId);
          await createNotification(
            commentData.author.id,
            "listing_status_changed",
            "Sorunuz Cevaplandı",
            `"${listing?.title || 'İlan'}" hakkındaki sorunuz ilan sahibi tarafından cevaplandı.`,
            `/?openListing=${listingId}&highlightComment=${commentId}`
          );
        }
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to answer listing comment", err);
      setError(firebaseErr.message || "Cevap eklenemedi. Lütfen tekrar deneyin.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- FAVORITES ---
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

        // Notify listing owner
        const listing = listings.find((l) => l.id === listingId);
        if (listing && listing.owner.id !== currentUser.id) {
          await createNotification(
            listing.owner.id,
            "listing_favorited",
            "Yeni Favori",
            `${currentUser.name} "${listing.title}" ilanınızı favorilere ekledi.`
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      setError("Favori işlemi başarısız oldu.");
    }
  };

  const isFavorited = (listingId: string): boolean => {
    return currentUser?.favorites?.includes(listingId) || false;
  };

  // --- REVIEWS ---
  const addReview = async (reviewedUserId: string, rating: number, comment: string, listingId?: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

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

      // Notify reviewed user
      await createNotification(
        reviewedUserId,
        "review_received",
        "Yeni Değerlendirme",
        `${currentUser.name} size ${rating} yıldız verdi.`
      );
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      console.error("Failed to add review", err);
      setError(firebaseErr.message || "Değerlendirme eklenemedi.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserReviews = async (userId: string): Promise<Review[]> => {
    try {
      const q = query(collection(db, "reviews"), where("reviewedUserId", "==", userId));
      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      // Sort client-side to avoid requiring a Firestore composite index
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

  // --- REPORTS ---
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
    } catch (err) {
      console.error("Failed to submit report", err);
      setError("Rapor gönderilemedi. Lütfen tekrar deneyin.");
      throw err;
    }
  };

  // --- NOTIFICATIONS ---
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
