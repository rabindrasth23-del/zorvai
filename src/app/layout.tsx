import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";

// --- Font Setup (zero layout shift via next/font) ---

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"], // enable optical sizing — this is what makes it look premium
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// --- Metadata ---

export const metadata: Metadata = {
  title: {
    default: "Zorvai — AI Study Coach",
    template: "%s | Zorvai",
  },
  description:
    "AI-powered study coach with a structured Learn → Recall → Challenge → Feedback cycle. Real improvement, not just answers.",
  applicationName: "Zorvai",
  keywords: [
    "AI study coach",
    "study app",
    "learning",
    "education",
    "spaced repetition",
    "active recall",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Zorvai",
    title: "Zorvai — AI Study Coach",
    description:
      "AI-powered study coaching with a structured learning cycle. Real improvement, guaranteed.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Zorvai Logo",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#161514" },
  ],
};

// --- Root Layout (Server Component — no "use client") ---

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
