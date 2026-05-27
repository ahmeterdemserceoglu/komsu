import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import GlobalUI from "@/components/layout/GlobalUI";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Paylaş — Komşu Paylaşım ve Yardımlaşma Platformu",
    template: "%s | Paylaş",
  },
  description:
    "Komşularınızla eşya paylaşımı, ödünç alma/verme, takas ve yardımlaşma platformu. Ücretsiz ilan verin, ihtiyaçlarınızı paylaşın.",
  keywords: [
    "komşu",
    "paylaşım",
    "ödünç",
    "takas",
    "yardımlaşma",
    "topluluk",
    "eşya paylaşım",
    "ücretsiz ilan",
    "hediye",
  ],
  authors: [{ name: "Paylaş Ekibi" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Paylaş",
    title: "Paylaş — Komşu Paylaşım ve Yardımlaşma Platformu",
    description:
      "Komşularınızla eşya paylaşımı, ödünç alma/verme, takas ve yardımlaşma platformu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paylaş — Komşu Paylaşım Platformu",
    description:
      "Komşularınızla eşya paylaşımı ve yardımlaşma platformu.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${sans.variable} h-[100dvh] antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] flex flex-col bg-background font-sans text-foreground overflow-x-hidden">
        <ErrorBoundary>
          <StoreProvider>
            <ToastProvider>
              {children}
              <GlobalUI />
            </ToastProvider>
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
