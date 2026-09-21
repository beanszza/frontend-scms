import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/signin", request.url));
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
  return response;
}
