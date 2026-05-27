"use client";

import ChatDrawer from "@/components/chat/ChatDrawer";
import MobileNav from "@/components/layout/MobileNav";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GlobalUI() {
  const pathname = usePathname();

  // Add padding to body on mobile so MobileNav doesn't cover content
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.add("pb-[calc(68px+env(safe-area-inset-bottom))]", "md:pb-0");
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.classList.remove("pb-[calc(68px+env(safe-area-inset-bottom))]", "md:pb-0");
      }
    };
  }, []);

  return (
    <>
      <ChatDrawer />
      <MobileNav />
    </>
  );
}
