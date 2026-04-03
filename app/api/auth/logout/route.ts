import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest, deleteAllUserSessions, clearAuthCookie, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (user) {
      deleteAllUserSessions(user.userid);
    } else {
      const sessionId = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (sessionId) {
        const { deleteSession } = await import("@/lib/auth");
        deleteSession(sessionId);
      }
    }

    const cookie = clearAuthCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
