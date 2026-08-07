"use client";
import { useEffect, useMemo } from "react";
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
    name: "Distribution",
    path: "/distribution-analytics",
    app: "supply-chain",
    baseUrl: scmBaseUrl,
  },
];

const othersItems: NavItem[] = [];

function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const activeNavItems = useMemo(() => {
    if (!user) return navItems;
    const username = user.username?.toLowerCase();
    const email = user.email?.toLowerCase();
    const roles = user.roles || [];

    // Head Cook Account: Inventory & Production ONLY
    if (username === "headcook" || email === "headcook@r3b2p.com" || roles.includes("Head Cook")) {
      return navItems.filter((item) => ["/inventory", "/production-quality"].includes(item.path));
    }

    // Inventory Manager Account: All operational modules + Dashboard. (Production is View Only)
    if (username === "inventorymanager" || email === "inventorymanager@r3b2p.com" || roles.includes("Inventory Manager")) {
      return navItems;
    }

    // System Admin / ERP-ADMIN (ERP-ADMIN / scmsuser / admin@r3b2p.com / Admin role): Full Access
    return navItems;
  }, [user]);

  useEffect(() => {
    console.log("CURRENT USER IN SCMS APP:", user);
    if (!isLoading && !user) {
      const hostUrl = process.env.NEXT_PUBLIC_SCMS_URL || "http://localhost:3000";
      const redirectUrl = encodeURIComponent(window.location.href);
      window.location.href = `${hostUrl}/signin?redirect=${redirectUrl}`;
    }
  }, [user, isLoading]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <AuthLayout
      navItems={activeNavItems}
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
