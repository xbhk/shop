import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db-queries";
import {
  verifyPassword,
  createSession,
  deleteAllUserSessions,
  setAuthCookie
} from "@/lib/auth";
import { requireAdminCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = getUserByEmail(trimmedEmail);
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Either email or password is incorrect" },
        { status: 401 }
      );
    }

    // Session fixation prevention: clear all existing sessions before creating a new one
    deleteAllUserSessions(user.userid);
    const { sessionId } = createSession(user.userid);
    const cookie = setAuthCookie(sessionId);

    const response = NextResponse.json({
      userid: user.userid,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin
    });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
