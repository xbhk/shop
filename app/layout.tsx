import type { Metadata } from "next";
import { Bungee, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/lib/cart";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const display = Bungee({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400"
});

export const metadata: Metadata = {
  title: "BuddyForge",
  description: "Build your favorite AI companion body and personality packs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans bg-lab`}>
        <CartProvider>
          <div className="min-h-screen">
            <SiteHeader />
            <main className="container py-10">{children}</main>
            <footer className="border-t bg-white/80">
              <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <p>Phase 1 layout demo for IEMS5718. No AI was harmed in testing.</p>
                <p>Designed by Limo (Lei Yiming) · Contact: shanshuilang0@gmail.com</p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
