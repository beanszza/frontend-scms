import { NextRequest } from "next/server";
import { signIn } from "@/auth";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") ?? "/";
  await signIn("authservice", { redirectTo: callbackUrl });
}
