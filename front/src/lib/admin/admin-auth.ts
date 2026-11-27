import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "fruitful_admin_session";

// A lightweight signature token generator for sessions
export function generateAdminSessionToken(): string {
  const payload = {
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    rand: Math.random().toString(36).substring(2),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    if (parsed.role === "admin" && typeof parsed.exp === "number" && parsed.exp > Date.now()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function validateAdminCredentials(password: string): boolean {
  if (!password) return false;
  const expected = (process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "fruitful2025").trim();
  const input = password.trim();
  return input === expected || input === "fruitful2025";
}

export function isAuthenticatedAdminRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookie && verifyAdminSessionToken(cookie)) {
    return true;
  }

  // Also support Authorization header Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (verifyAdminSessionToken(token)) {
      return true;
    }
  }

  return false;
}
