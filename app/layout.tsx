import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://onepiece-oracle.com";

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "One Piece Oracle — AI-Powered Manga Q&A",
    template: "%s | One Piece Oracle",
  },
  description:
    "Search 1000+ One Piece chapters with AI precision. Get accurate answers with exact panel citations and SBS references. Free search, Pro AI answers.",
  keywords: [
    "One Piece",
    "manga",
    "Q&A",
    "RAG",
    "AI",
    "search",
    "panels",
    "SBS",
    "Eiichiro Oda",
    "Luffy",
    "Grand Line",
  ],
  authors: [{ name: "One Piece Oracle" }],
  creator: "One Piece Oracle",
  publisher: "One Piece Oracle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "One Piece Oracle",
    title: "One Piece Oracle — AI-Powered Manga Q&A",
    description:
      "Ask any One Piece question. Get answers with exact panel citations, SBS references, and AI-powered analysis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "One Piece Oracle — RAG-powered Q&A for One Piece manga",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "One Piece Oracle — AI-Powered Manga Q&A",
    description:
      "Ask any One Piece question. Get answers with exact panel citations + SBS references.",
    images: ["/og-image.png"],
    creator: "@onepiece_oracle",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
