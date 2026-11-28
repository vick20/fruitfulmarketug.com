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

function getMetadataBase(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://fruitfulmarketug.com";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return new URL("https://fruitfulmarketug.com");
  }
}

const SITE_TITLE =
  "Fruitful Market UG | Online Fresh Fruits and Vegetables Delivery in Uganda";
const SITE_DESCRIPTION =
  "Fruitful Market UG is an online fresh fruits and vegetables grocery store delivering to your doorstep in Uganda. Premium quality, affordable prices, and fast delivery.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Fruitful Market UG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fruitful UG",
  },
  openGraph: {
    type: "website",
    siteName: "Fruitful Market UG",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_UG",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fruitful Market UG - Fresh Fruits & Vegetables Delivery in Uganda",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
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
