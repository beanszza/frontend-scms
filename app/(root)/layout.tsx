"use client";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/shared/AppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
