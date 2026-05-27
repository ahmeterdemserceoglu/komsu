"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStore, User } from "@/lib/store";
import { Search, Users as UsersIcon, Shield, ShieldAlert, ShieldCheck, UserCheck, UserX, AlertOctagon, Mail, Phone, Calendar } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminUsersPage() {
  const { currentUser } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => {
        const u = d.data();
        return { id: d.id, ...u, role: u.role || "user" } as User;
      });

      // Background self-healing migration loop for users with missing role
      snapshot.docs.forEach(async (d) => {
        const u = d.data();
        if (!u.role) {
          try {
            await updateDoc(doc(db, "users", d.id), { role: "user" });
          } catch (err) {
            console.error(`Failed to self-heal user role for ${d.id}`, err);
          }
        }
      });

      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert("Kendi admin yetkinizi kaldıramazsınız!");
      return;
    }

    const newRole = targetUser.role === "admin" ? "user" : "admin";
    const confirmMsg = targetUser.role === "admin"
      ? `"${targetUser.name}" isimli kullanıcının admin yetkisini kaldırmak istediğinizden emin misiniz?`
      : `"${targetUser.name}" isimli kullanıcıyı ADMIN yapmak istediğinizden emin misiniz?`;

    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, "users", targetUser.id), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      alert(`Kullanıcı başarıyla ${newRole === "admin" ? "Admin yapıldı" : "Standart üye yapıldı"}.`);
    } catch (err) {
      console.error("Failed to toggle admin role", err);
      alert("Yetki değiştirilirken bir hata oluştu.");
    }
  };

  const handleToggleBan = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert("Kendi hesabınızı engelleyemezsiniz!");
      return;
    }

    const isCurrentlyBanned = targetUser.role === "banned" || targetUser.isBanned;
    const confirmMsg = isCurrentlyBanned
      ? `"${targetUser.name}" isimli kullanıcının engelini kaldırmak istediğinizden emin misiniz?`
      : `"${targetUser.name}" isimli kullanıcıyı ENGELLEMEK (yasaklamak) istediğinizden emin misiniz? Bu işlem kullanıcının oturumunu anında sonlandıracaktır.`;

    if (!confirm(confirmMsg)) return;

    try {
      if (isCurrentlyBanned) {
        await updateDoc(doc(db, "users", targetUser.id), { 
          role: "user",
          isBanned: false
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: "user", isBanned: false } : u))
        );
        alert("Kullanıcı engeli başarıyla kaldırıldı.");
      } else {
        await updateDoc(doc(db, "users", targetUser.id), { 
          role: "banned",
          isBanned: true
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: "banned", isBanned: true } : u))
        );
        alert("Kullanıcı başarıyla engellendi.");
      }
    } catch (err) {
      console.error("Failed to toggle ban status", err);
      alert("İşlem gerçekleştirilirken bir hata oluştu.");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (u.phone?.includes(search) ?? false)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{users.length} kayıtlı kullanıcı</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, email veya telefon ara..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:border-[#f58220] text-slate-800 dark:text-slate-200"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={40} className="text-slate-300" />}
          title="Kullanıcı bulunamadı"
          description="Arama kriterlerinize uygun kullanıcı yok."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isBanned = user.role === "banned" || user.isBanned;
            
            return (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={user.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                        {user.name}
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                            Siz
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#f58220] font-semibold">{user.title}</p>
                    </div>
                    {user.role === "admin" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1 animate-none">
                        <Shield size={10} />
                        ADMIN
                      </span>
                    ) : isBanned ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold border border-red-200 dark:border-red-800 flex items-center gap-1 animate-pulse">
                        <AlertOctagon size={10} />
                        YASAKLI
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                        ÜYE
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {user.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        {user.email}
                      </p>
                    )}
                    {user.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        {user.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      {user.joinedDate}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      ID: {user.id.slice(0, 12)}...
                    </p>
                  </div>

                  {/* Moderator Controls */}
                  <div className="flex gap-2 w-full">
                    {/* Admin Toggle */}
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={isSelf || isBanned}
                      title={isSelf ? "Kendi yetkinizi kaldıramazsınız" : isBanned ? "Yasaklı bir kullanıcının yetkisi değiştirilemez" : ""}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelf || isBanned
                          ? "bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50"
                          : user.role === "admin"
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-250 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <>
                          <ShieldAlert size={12} />
                          Yetki Kaldır
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          Admin Yap
                        </>
                      )}
                    </button>

                    {/* Ban Toggle */}
                    <button
                      onClick={() => handleToggleBan(user)}
                      disabled={isSelf}
                      title={isSelf ? "Kendinizi engelleyemezsiniz" : ""}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelf
                          ? "bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50"
                          : isBanned
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                          : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-250 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/40"
                      }`}
                    >
                      {isBanned ? (
                        <>
                          <UserCheck size={12} />
                          Engeli Kaldır
                        </>
                      ) : (
                        <>
                          <UserX size={12} />
                          Yasakla (Ban)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
