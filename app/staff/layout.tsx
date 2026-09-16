import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Cuisine | Grill Dufour",
  description: "Tableau de bord cuisine — gestion des commandes en temps réel.",
  robots: "noindex, nofollow",
  manifest: "/manifest-staff.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cuisine",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1a1e",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
