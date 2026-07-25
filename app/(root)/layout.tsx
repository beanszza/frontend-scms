"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthLayout, NavItem, GridIcon } from "@r3b2p/uilib";
import { Handshake, ShoppingBag, Package, Factory, Truck } from "lucide-react";

const scmBaseUrl = process.env.NEXT_PUBLIC_SCMS_URL || "";

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
  {
    name: "Resources & Suppliers",
    path: "/resources-suppliers",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
  {
    name: "Orders and Procurement",
    path: "/orders-procurement",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
  {
    name: "Inventory",
    path: "/inventory",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
  {
    name: "Production & Quality",
    path: "/production-quality",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
  {
    name: "Distribution & Analytics",
    path: "/distribution-analytics",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
];

const othersItems: NavItem[] = [];

function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("CURRENT USER IN SCMS APP:", user);
    if (!isLoading && !user) {
      const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000";
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `${hostUrl}/signin?redirect=${redirectUrl}`;
    }
  }, [user, isLoading]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <AuthLayout
      navItems={navItems}
      othersItems={othersItems}
      user={user}
      mobileLogo="/images/logo/mobile.svg"
      desktopLogo="/images/logo/desktop.svg"
      onLogout={async () => {
        try {
          await logout();
        } catch (e) {
          console.error("Logout error:", e);
        }
        const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3004";
        const scmsUrl = process.env.NEXT_PUBLIC_SCMS_URL || "http://localhost:3000";
        window.location.href = `${hostUrl}/signin?redirect=${encodeURIComponent(scmsUrl)}`;
      }}
    >
      {children}
    </AuthLayout>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RootLayoutInner>{children}</RootLayoutInner>
    </AuthProvider>
  );
}
