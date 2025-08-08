import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { ClientOnly } from '@/components/ui/client-only';
import { AdminAuthProvider } from '@/components/auth/AdminAuthProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KoraBuild Admin Dashboard",
  description: "Comprehensive admin interface for managing construction project management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
        <ClientOnly>
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
