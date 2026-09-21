import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/token-refresh";

const issuer = requiredEnvironment("AUTH_ISSUER");
const clientId = requiredEnvironment("AUTH_CLIENT_ID");
const clientSecret = requiredEnvironment("AUTH_CLIENT_SECRET");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "authservice",
      name: "Auth Service",
      type: "oidc",
      issuer,
      clientId,
      clientSecret,
      authorization: {
        params: {
          scope: "openid profile email roles systems offline_access",
        },
      },
    },
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, profile, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.error = undefined;
      }

      if (profile?.systems)
        token.systems = (profile.systems as string).split(",");
      if (profile) {
        const rawRoles = profile.role ?? profile.roles ?? [];
        token.roles = Array.isArray(rawRoles)
          ? rawRoles
          : typeof rawRoles === "string"
            ? [rawRoles]
            : [];
      }

      if (!token.expiresAt || Date.now() < (token.expiresAt - 60) * 1000)
        return token;
      return token.refreshToken
        ? refreshAccessToken(token)
        : { ...token, error: "RefreshAccessTokenError" };
    },
    async session({ session, token }) {
      session.systems = (token.systems as string[]) ?? [];
      session.roles = (token.roles as string[]) ?? [];
      session.accessToken = (token.accessToken as string) ?? "";
      if (token.error) session.error = token.error as string;
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPath = pathname.startsWith("/api/auth");
      const isSignInPage = pathname === "/signin";

      if (auth?.error === "RefreshAccessTokenError") {
        return isAuthPath || isSignInPage;
      }
      if (auth?.user && (isAuthPath || isSignInPage)) {
        return Response.redirect(new URL(requiredEnvironment("AUTH_URL")));
      }
      if (!auth?.user && !isAuthPath && !isSignInPage) return false;

      if (auth?.user) {
        const response = NextResponse.next();
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
      return true;
    },
  },
});

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}
