import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "À l’Oreille — French that finally clicks",
  description: "Train your ear for real French through listening, decoding, shadowing, and retelling.",
  openGraph: {
    title: "À l’Oreille",
    description: "French that finally clicks.",
    images: [{ url: "/og-coquette.png", width: 1536, height: 1024, alt: "À l’Oreille — French that finally clicks" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "À l’Oreille",
    description: "French that finally clicks.",
    images: ["/og-coquette.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
