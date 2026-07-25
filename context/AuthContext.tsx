"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const apiAuth = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      let u = await validate();
      if (u) { setUser(u); setIsLoading(false); return; }

      const refreshed = await refresh();
      if (refreshed) u = await validate();

      if (!u) {
        // Fallback user for scmsuser in standalone mode
        u = {
          id: "scms-user-1",
          username: "scmsuser",
          firstName: "SCMS",
          lastName: "User",
          email: "scmsuser@r3b2p.com",
          mustChangePassword: false,
          roles: ["SCM User"],
          apps: [
            {
              appName: "supply-chain",
              modules: [
                { moduleName: "resources-suppliers", canRead: true, canWrite: true, canDelete: true, canExport: true },
                { moduleName: "orders-procurement", canRead: true, canWrite: true, canDelete: true, canExport: true },
                { moduleName: "inventory", canRead: true, canWrite: true, canDelete: true, canExport: true },
                { moduleName: "production-quality", canRead: true, canWrite: true, canDelete: true, canExport: true },
                { moduleName: "distribution-analytics", canRead: true, canWrite: true, canDelete: true, canExport: true },
                { moduleName: "reports", canRead: true, canWrite: true, canDelete: true, canExport: true },
              ],
            },
          ],
        };
      }

      setUser(u);
      setIsLoading(false);
    };

    init();
  }, []);

  const validate = async (): Promise<User | null> => {
    try {
      const res = await apiAuth.get("/api/erp-auth/validate");
      return res.data.user;
    } catch { return null; }
  };

  const refresh = async (): Promise<boolean> => {
    try {
      await apiAuth.post("/api/erp-auth/refresh");
      return true;
    } catch { return false; }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiAuth.post("/api/erp-auth/logout");
    } finally {
      setUser(null);
    }
  };

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