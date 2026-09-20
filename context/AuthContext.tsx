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

export type User = {
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
  activeAccount: "inventory_manager" | "admin";
  isAdmin: boolean;
  switchAccount: (account: "inventory_manager" | "admin") => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SCMS_SESSION_KEY = "scms_session_active";

function getAccountProfile(accountType: string): User {
  if (accountType === "admin") {
    return {
      id: "scms-admin",
      username: "scmsadmin",
      firstName: "System",
      lastName: "Admin",
      email: "admin@r3b2p.com",
      mustChangePassword: false,
      roles: ["Admin"],
      apps: [],
    };
  }
  return {
    id: "scms-user",
    username: "scmsuser",
    firstName: "Inventory",
    lastName: "Manager",
    email: "scmsuser@r3b2p.com",
    mustChangePassword: false,
    roles: ["InventoryManager"],
    apps: [],
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<"inventory_manager" | "admin">("inventory_manager");
  const [isLoading, setIsLoading] = useState(true);

  const applyAccount = (acc: string) => {
    const validAcc = acc === "admin" ? "admin" : "inventory_manager";
    setActiveAccount(validAcc);
    setUser(getAccountProfile(validAcc));
  };

  useEffect(() => {
    const init = () => {
      const hasSession = sessionStorage.getItem(SCMS_SESSION_KEY);
      const comingFromAuth = sessionStorage.getItem("scms_from_auth");

      if (hasSession || comingFromAuth) {
        sessionStorage.setItem(SCMS_SESSION_KEY, "1");
        sessionStorage.removeItem("scms_from_auth");
        const stored = typeof window !== "undefined" ? localStorage.getItem("activeAccount") || "inventory_manager" : "inventory_manager";
        applyAccount(stored);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    init();

    const handleStorageChange = () => {
      const stored = localStorage.getItem("activeAccount") || "inventory_manager";
      applyAccount(stored);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const switchAccount = (account: "inventory_manager" | "admin") => {
    localStorage.setItem("activeAccount", account);
    applyAccount(account);
    window.dispatchEvent(new Event("storage"));
  };

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

  const isAdmin = user.roles.includes("Admin") || activeAccount === "admin";

  return (
    <AuthContext.Provider value={{ user, isLoading, activeAccount, isAdmin, switchAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};