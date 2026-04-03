import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db-queries";
import { hashPassword, createSession, setAuthCookie } from "@/lib/auth";
import { requireAdminCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { email, password, confirmPassword, name } = body;

    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase().slice(0, 200);
    const trimmedName = name.trim().slice(0, 100);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (!trimmedName) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const existingUser = getUserByEmail(trimmedEmail);
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const userid = createUser(trimmedEmail, passwordHash, trimmedName);

    const { sessionId } = createSession(userid);
    const cookie = setAuthCookie(sessionId);

    const response = NextResponse.json(
      { userid, email: trimmedEmail, name: trimmedName },
      { status: 201 }
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
