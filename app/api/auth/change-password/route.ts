import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUserPassword } from "@/lib/db-queries";
import {
  getCurrentUserFromRequest,
  verifyPassword,
  hashPassword,
  deleteAllUserSessions,
  clearAuthCookie
} from "@/lib/auth";
import { requireAdminCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireAdminCsrf(request);
    if (csrfError) return csrfError;

    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    const dbUser = getUserById(user.userid);
    if (!dbUser || !verifyPassword(currentPassword, dbUser.password)) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const newHash = hashPassword(newPassword);
    updateUserPassword(user.userid, newHash);

    deleteAllUserSessions(user.userid);

    const cookie = clearAuthCookie();
    const response = NextResponse.json({ success: true, message: "Password changed. Please log in again." });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
