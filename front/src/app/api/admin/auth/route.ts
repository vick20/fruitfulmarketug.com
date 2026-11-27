import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  generateAdminSessionToken,
  isAuthenticatedAdminRequest,
  validateAdminCredentials,
} from "@/src/lib/admin/admin-auth";

export async function GET(request: NextRequest) {
  const isAuth = isAuthenticatedAdminRequest(request);
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";

    if (!validateAdminCredentials(password)) {
      return NextResponse.json(
        { error: "Incorrect administrator password. (Default is 'fruitful2025')" },
        { status: 401 }
      );
    }

    const token = generateAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      token,
      message: "Admin authentication successful.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Authentication request failed." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session cleared.",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
