import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KoraBuild Admin Dashboard",
  description: "Comprehensive admin interface for managing KoraBuild construction projects, contractors, and users",
  keywords: ["construction", "project management", "admin dashboard", "KoraBuild"],
  authors: [{ name: "KoraBuild Team" }],
  robots: "noindex, nofollow", // Admin dashboard should not be indexed
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
