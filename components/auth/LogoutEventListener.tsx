"use client";

import { useEffect } from "react";
import { connectLogoutEvents } from "./logout-event-connection";

export function LogoutEventListener({
  accessToken,
  issuer,
}: {
  accessToken: string;
  issuer: string;
}) {
  useEffect(
    () => connectLogoutEvents({ accessToken, issuer }),
    [accessToken, issuer],
  );
  return null;
}
