import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function GET(request: NextRequest) {
  await signOut({ redirect: false });

  const issuer = process.env.AUTH_ISSUER;
  if (!issuer) throw new Error("AUTH_ISSUER is required");

  const appUrl = process.env.AUTH_URL;
  if (!appUrl) throw new Error("AUTH_URL is required");
  const postLogoutUrl = appUrl.replace(/\/?$/, "/");
  const logoutUrl = new URL("connect/logout", issuer);
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutUrl);

  const response = NextResponse.redirect(logoutUrl);
  clearAuthCookies(request, response);
  return response;
}

function clearAuthCookies(request: NextRequest, response: NextResponse) {
  for (const { name } of request.cookies.getAll()) {
    if (!/^(__Secure-|__Host-)?authjs\./.test(name)) continue;
    response.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }
}
