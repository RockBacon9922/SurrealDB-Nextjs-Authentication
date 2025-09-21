"use server";

import { decodeJwt } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// ---- Config helpers -------------------------------------------------------
const SUR_REALM = process.env.NEXT_PUBLIC_SURREAL_URL; // host (no path), e.g. db.example.com
const NS = process.env.NEXT_PUBLIC_SURREAL_NS;
const DB = process.env.NEXT_PUBLIC_SURREAL_DB;

if (!SUR_REALM || !NS || !DB) {
  throw new Error(
    "NEXT_PUBLIC_SURREAL_URL, NEXT_PUBLIC_SURREAL_NS, and NEXT_PUBLIC_SURREAL_DB must be set",
  );
}

const SUR_SIGNIN_URL = `https://${SUR_REALM}/signin`;
const IS_PROD = process.env.NODE_ENV === "production";

// Cookie names
const ACCESS_COOKIE = "surrealToken"; // readable by client (non-httpOnly)
const REFRESH_COOKIE = "refresh"; // httpOnly (server-only)

// ---- Cookie utilities -----------------------------------------------------
async function setAccessCookie(token: string) {
  // Default: 15m if we can't extract exp from JWT
  let maxAge = 60 * 15;
  try {
    const { exp } = decodeJwt(token) as { exp?: number };
    if (exp) {
      const seconds = Math.max(exp - Math.floor(Date.now() / 1000), 1);
      if (Number.isFinite(seconds)) maxAge = seconds;
    }
  } catch {
    // non-JWT tokens are okay; fall back to default
  }

  const cookiestore = await cookies();

  cookiestore.set({
    name: ACCESS_COOKIE,
    value: token,
    httpOnly: false, // client code must read it
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

async function setRefreshCookie(refresh: string) {
  // Conservative default: 30 days unless the value is a JWT with exp
  const cookieStore = await cookies();

  let maxAge = 60 * 60 * 24 * 30;
  try {
    const { exp } = decodeJwt(refresh) as { exp?: number };
    if (exp) {
      const seconds = Math.max(exp - Math.floor(Date.now() / 1000), 1);
      if (Number.isFinite(seconds)) maxAge = seconds;
    }
  } catch {
    // opaque refresh string — keep default
  }

  cookieStore.set({
    name: REFRESH_COOKIE,
    value: refresh,
    httpOnly: true, // server-only
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

async function clearAuthCookies() {
  const cookieStore = await cookies();
  try {
    cookieStore.set({
      name: ACCESS_COOKIE,
      value: "",
      path: "/",
      httpOnly: false,
      maxAge: 0,
    });
  } catch {}
  try {
    cookieStore.set({
      name: REFRESH_COOKIE,
      value: "",
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });
  } catch {}
}

// Optional, basic CSRF guard for server actions
async function assertSameOrigin() {
  const allowed = process.env.APP_ORIGIN; // e.g. https://app.example.com
  if (!allowed) return; // opt-out if not configured
  const h = await headers();
  const origin = h.get("origin");
  const referer = h.get("referer");
  if ((origin && origin === allowed) || referer?.startsWith(allowed)) return;
  throw new Error("Cross-origin call blocked");
}

// ---- Auth API -------------------------------------------------------------
export async function authenticate(
  email?: string,
  password?: string,
): Promise<{ success: boolean; token: string }> {
  assertSameOrigin();

  const cookieStore = await cookies();
  const refreshCookie = cookieStore.get(REFRESH_COOKIE)?.value;

  const headersObj = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  // 1) Try refresh flow first (if we already have a refresh cookie)
  if (refreshCookie) {
    const res = await fetch(SUR_SIGNIN_URL, {
      method: "POST",
      headers: headersObj,
      body: JSON.stringify({ NS, DB, AC: "client", refresh: refreshCookie }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as { token: string; refresh?: string };
      // Set BOTH cookies server-side
      setAccessCookie(data.token);
      if (data.refresh) setRefreshCookie(data.refresh);
      return { success: true, token: data.token };
    }
  }

  // 2) Fall back to credential flow if provided
  if (email && password) {
    const res = await fetch(SUR_SIGNIN_URL, {
      method: "POST",
      headers: headersObj,
      body: JSON.stringify({ NS, DB, AC: "client", email, code: password }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as { token: string; refresh?: string };
      setAccessCookie(data.token);
      if (data.refresh) setRefreshCookie(data.refresh);
      return { success: true, token: data.token };
    }
  }

  // 3) No valid method -> clear and bounce
  clearAuthCookies();
  redirect("/");
}

export async function invalidateAuth() {
  assertSameOrigin();
  clearAuthCookies();
}
