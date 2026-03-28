import { NextRequest, NextResponse } from "next/server";

import {
  attachAdminSessionCookie,
  getOrCreateAdminSessionId,
  issueAdminCsrfToken
} from "@/lib/security";

export async function GET(request: NextRequest) {
  const sessionId = getOrCreateAdminSessionId(request);
  const csrfToken = issueAdminCsrfToken(sessionId);

  const response = NextResponse.json(
    { csrfToken },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  attachAdminSessionCookie(response, sessionId);
  return response;
}
