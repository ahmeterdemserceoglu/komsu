"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce" />
        <span className="h-3 w-3 bg-[#091a35] rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="h-3 w-3 bg-[#f58220] rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Yönlendiriliyorsunuz...</div>
    </div>
  );
}
