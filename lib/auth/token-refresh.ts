import type { JWT } from "next-auth/jwt";

type RefreshTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type RefreshCacheEntry = { promise: Promise<JWT>; expiresAt: number };

const refreshCache = new Map<string, RefreshCacheEntry>();
const REFRESH_CACHE_TTL_MS = 30_000;

export async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken;
  if (!refreshToken) return { ...token, error: "RefreshAccessTokenError" };

  const cached = refreshCache.get(refreshToken);
  if (cached && Date.now() < cached.expiresAt) return cached.promise;

  const promise = requestTokenRefresh(token, refreshToken);
  refreshCache.set(refreshToken, {
    promise,
    expiresAt: Date.now() + REFRESH_CACHE_TTL_MS,
  });

  promise.finally(() => {
    setTimeout(() => {
      const entry = refreshCache.get(refreshToken);
      if (entry?.promise === promise) refreshCache.delete(refreshToken);
    }, REFRESH_CACHE_TTL_MS);
  });

  return promise;
}

async function requestTokenRefresh(
  token: JWT,
  refreshToken: string,
): Promise<JWT> {
  try {
    const issuer = requiredEnvironment("AUTH_ISSUER").replace(/\/?$/, "/");
    const response = await fetch(`${issuer}connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requiredEnvironment("AUTH_CLIENT_ID"),
        client_secret: requiredEnvironment("AUTH_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    if (!response.ok || !isRefreshTokenResponse(payload))
      throw new Error("Refresh was rejected");

    return {
      ...token,
      accessToken: payload.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + payload.expires_in),
      refreshToken: payload.refresh_token ?? refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}

function isRefreshTokenResponse(value: unknown): value is RefreshTokenResponse {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.access_token === "string" && typeof data.expires_in === "number"
  );
}
