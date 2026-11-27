import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartProvider from "../contexts/CartContext";
import { Toaster } from "../components/ui/sonner";
import StorefrontChrome from "../components/StorefrontChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0E3725",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Fruitful Market UG | Online Fresh Fruits and Vegetables Delivery in Uganda",
  description:
    "Fruitful Market UG is an online fresh fruits and vegetables grocery store delivering to your doorstep in Uganda. Premium quality, affordable prices, and fast delivery.",
  applicationName: "Fruitful Market UG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fruitful UG",
  },
  icons: {
    icon: "/pwa-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <CartProvider>
          <StorefrontChrome>{children}</StorefrontChrome>
          <Toaster position="bottom-right" theme="light" richColors />
        </CartProvider>
      </body>
    </html>
  );
}
