import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      userid: user.userid,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin
    }
  });
}
