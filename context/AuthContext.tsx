"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { RedirectToLogin } from "@/components/shared/RedirectToLogin";
import { Loader2 } from "lucide-react";

type ModuleAccess = {
  moduleName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
};

type AppAccess = {
  appName: string;
  modules: ModuleAccess[];
};

type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  mustChangePassword: boolean;
  roles: string[];
  apps: AppAccess[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SCMS_SESSION_KEY = "scms_session_active";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = () => {
      const hasSession = sessionStorage.getItem(SCMS_SESSION_KEY);
      const comingFromAuth = sessionStorage.getItem("scms_from_auth");

      if (hasSession || comingFromAuth) {
        // User either has an active session OR just came back from br-auth login
        sessionStorage.setItem(SCMS_SESSION_KEY, "1");
        sessionStorage.removeItem("scms_from_auth");
        setUser({
          id: "scms-user",
          username: "scmsuser",
          firstName: "SCMS",
          lastName: "User",
          email: "scmsuser@r3b2p.com",
          mustChangePassword: false,
          roles: ["Admin"],
          apps: [],
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const logout = async (): Promise<void> => {
    sessionStorage.removeItem(SCMS_SESSION_KEY);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background font-sans text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        <span className="font-medium text-xs tracking-wider uppercase">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <RedirectToLogin />;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};