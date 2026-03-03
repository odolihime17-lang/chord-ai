import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI耳コピアシスタント | Guitar Chord Analysis",
  description: "曲名からコード進行とギタータブ譜を自動生成するプロトタイプ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased bg-slate-100`}>
        {children}
      </body>
    </html>
  );
}
