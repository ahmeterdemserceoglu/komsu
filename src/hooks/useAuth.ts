"use client";

import { useStore } from "@/lib/store";

export function useAuth() {
  const { currentUser, loginUser, registerUser, logoutUser, isLoading, error, clearError } = useStore();

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    loginUser,
    registerUser,
    logoutUser,
    isLoading,
    error,
    clearError,
  };
}
