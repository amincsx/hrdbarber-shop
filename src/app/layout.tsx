import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "آرایشگاه HRD | رزرو نوبت",
  description: "سامانه رزرو نوبت آرایشگاه HRD - بهترین خدمات آرایشگری",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "آرایشگاه HRD",
    startupImage: [
      {
        url: "/logo.jpg",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#f8fafc",
    "msapplication-config": "/browserconfig.xml",
  },
  openGraph: {
    type: "website",
    siteName: "آرایشگاه HRD",
    title: "آرایشگاه HRD | رزرو نوبت",
    description: "سامانه رزرو نوبت آرایشگاه HRD - بهترین خدمات آرایشگری",
    url: "/",
    images: [
      {
        url: "/logo.jpg",
        width: 512,
        height: 512,
        alt: "آرایشگاه HRD",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "آرایشگاه HRD | رزرو نوبت",
    description: "سامانه رزرو نوبت آرایشگاه HRD - بهترین خدمات آرایشگری",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA and Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* iOS Status Bar */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="آرایشگاه HRD" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#1e40af" />
        <meta name="msapplication-TileColor" content="#1e40af" />
      </head>
      <body
        className={`${inter.variable} antialiased safe-top safe-bottom`}
        style={{ fontFamily: "'Vazirmatn', sans-serif" }}
      >
        <div className="mobile-full-height">
          {children}
        </div>
      </body>
    </html>
  );
}
