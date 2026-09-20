"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

export function RedirectToLogin() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";

  useEffect(() => {
    sessionStorage.setItem("scms_from_auth", "1");
    const returnUrl = encodeURIComponent("https://localhost:3003/?client_id=scms-client");
    window.location.href = `https://localhost:5001/Account/Login?returnUrl=${returnUrl}`;
  }, [callbackUrl]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background font-sans text-sm text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      <span className="font-medium text-xs tracking-wider uppercase">Loading...</span>
    </div>
  );
}
