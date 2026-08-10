"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function RedirectToLogin() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";

  useEffect(() => {
    signIn("authservice", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="p-xl font-sans text-body-md text-muted-foreground">
      Redirecting to sign in...
    </div>
  );
}
