import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { barberId: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const barberId = decodeURIComponent(resolvedParams.barberId);
  
  return {
    title: `داشبورد ${barberId} | آرایشگاه HRD`,
    description: `پنل مدیریت رزروها برای ${barberId}`,
    manifest: `/api/manifest/${encodeURIComponent(resolvedParams.barberId)}`,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: `داشبورد ${barberId}`,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

export default function BarberDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

