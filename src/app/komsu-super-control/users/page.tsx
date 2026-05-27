"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStore, User } from "@/lib/store";
import { Search, Users as UsersIcon, Shield, AlertOctagon, AtSign } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import UserDetailDrawer from "./UserDetailDrawer"; // This will be created next

// A lean User Card for the list view
const UserListCard = ({ user, onClick }: { user: User; onClick: () => void }) => {
  const isBanned = user.role === "banned" || user.isBanned;
  const isAdmin = user.role === "admin";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><AtSign size={12}/>{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
           {isAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Shield size={10} /> ADMIN
              </span>
            ) : isBanned ? (
              <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold border border-red-200 dark:border-red-800 flex items-center gap-1">
                <AlertOctagon size={10} /> YASAKLI
              </span>
            ) : (
               <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${user.isVerified ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                {user.isVerified ? 'DOĞRULANMIŞ' : 'ÜYE'}
              </span>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminUsersPageV2() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), role: d.data().role || 'user' } as User));
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

  const handleUserUpdate = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if(selectedUser?.id === updatedUser.id) {
          setSelectedUser(updatedUser);
      }
  };

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kullanıcı Kontrol Merkezi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{users.length} kayıtlı kullanıcıyı yönetin.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim veya email ile ara..."
          className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-[#f58220]/50 text-slate-800 dark:text-slate-200 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 h-[88px] animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserListCard key={user.id} user={user} onClick={() => setSelectedUser(user)} />
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState
                  icon={<UsersIcon size={40} className="text-slate-400" />}
                  title="Kullanıcı bulunamadı"
                  description="Arama kriterlerinize uygun kullanıcı yok."
                />
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedUser && (
          <UserDetailDrawer 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
