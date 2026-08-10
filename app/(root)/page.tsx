"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AnalyticsDashboardPage from "@/dashboard/page";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const username = user.username?.toLowerCase();
      const email = user.email?.toLowerCase();
      const roles = user.roles || [];
      const isHeadCook = username === "headcook" || email === "headcook@r3b2p.com" || roles.includes("Head Cook");

      if (isHeadCook) {
        router.replace("/production-quality");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const username = user?.username?.toLowerCase();
  const email = user?.email?.toLowerCase();
  const roles = user?.roles || [];
  const isHeadCook = username === "headcook" || email === "headcook@r3b2p.com" || roles.includes("Head Cook");

  if (isHeadCook) return null;

  return <AnalyticsDashboardPage />;
}
