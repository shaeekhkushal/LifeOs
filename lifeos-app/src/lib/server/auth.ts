import type { NextRequest } from "next/server";
import { findUserBySession } from "@/lib/server/database";

export const sessionCookieName = "lifeos_session";
export const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

export function getRequestUser(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  return token ? findUserBySession(token) : null;
}

export function validPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 6 && password.length <= 128;
}
