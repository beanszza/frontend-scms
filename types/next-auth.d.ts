import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    systems: string[];
    roles: string[];
    accessToken: string;
    error?: string;
    user: DefaultSession["user"];
  }

  interface Profile {
    systems?: string;
    role?: string | string[];
    roles?: string | string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    systems?: string[];
    roles?: string[];
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
