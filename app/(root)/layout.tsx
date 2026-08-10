"use client";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/shared/AppShell";

function RootLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // The AuthContext will render RedirectToLogin, but this is a fallback.
      return;
    }

    if (!isLoading && user) {
      const username = user.username?.toLowerCase();
      const email = user.email?.toLowerCase();
      const roles = user.roles || [];
      const isHeadCook = username === "headcook" || email === "headcook@r3b2p.com" || roles.includes("Head Cook");

      if (isHeadCook && (pathname === "/" || pathname === "/dashboard" || pathname === "/reports" || pathname === "/audit-logs" || pathname === "/resources-suppliers" || pathname === "/orders-procurement" || pathname === "/distribution-analytics")) {
        router.replace("/production-quality");
      }
    }
  }, [user, isLoading, pathname, router]);

  return <AppShell>{children}</AppShell>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RootLayoutInner>{children}</RootLayoutInner>
    </AuthProvider>
  );
}
