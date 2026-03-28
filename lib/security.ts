import "server-only";

import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_TOKEN_BYTES = 32;
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;
const FALLBACK_SECURITY_SECRET = crypto.randomBytes(32);

export const ADMIN_SESSION_COOKIE_NAME = "buddyforge.admin.sid";

function getSecuritySecret(): Buffer {
  const configuredSecret = process.env.SECURITY_TOKEN_SECRET;

  if (typeof configuredSecret === "string" && configuredSecret.length >= 32) {
    return Buffer.from(configuredSecret, "utf8");
  }

  return FALLBACK_SECURITY_SECRET;
}

export function generateOpaqueToken(byteLength: number = DEFAULT_TOKEN_BYTES): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function isOpaqueToken(value: unknown, minLength: number = 32): value is string {
  return (
    typeof value === "string"
    && value.length >= minLength
    && /^[A-Za-z0-9_-]+$/.test(value)
  );
}

function signNonce(sessionId: string, nonce: string): string {
  return crypto
    .createHmac("sha256", getSecuritySecret())
    .update(`${sessionId}:${nonce}`)
    .digest("base64url");
}

function timingSafeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getOrCreateAdminSessionId(request: NextRequest): string {
  const existingSessionId = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return isOpaqueToken(existingSessionId) ? existingSessionId : generateOpaqueToken();
}

export function attachAdminSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/"
  });
}

export function issueAdminCsrfToken(sessionId: string): string {
  const nonce = generateOpaqueToken();
  const signature = signNonce(sessionId, nonce);
  return `${nonce}.${signature}`;
}

export function verifyAdminCsrfToken(sessionId: string, token: string): boolean {
  const [nonce, signature, ...rest] = token.split(".");

  if (!nonce || !signature || rest.length > 0) {
    return false;
  }

  if (!isOpaqueToken(nonce) || !isOpaqueToken(signature)) {
    return false;
  }

  const expectedSignature = signNonce(sessionId, nonce);
  return timingSafeEqualText(expectedSignature, signature);
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}

export function requireAdminCsrf(request: NextRequest): NextResponse | null {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const csrfToken = request.headers.get("x-csrf-token");

  if (!isOpaqueToken(sessionId)) {
    return NextResponse.json({ error: "Missing or invalid admin session" }, { status: 403 });
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site requests are not allowed" }, { status: 403 });
  }

  if (!csrfToken || !verifyAdminCsrfToken(sessionId, csrfToken)) {
    return NextResponse.json({ error: "Missing or invalid CSRF token" }, { status: 403 });
  }

  return null;
}

export function generateRandomUploadStem(): string {
  return `upload-${generateOpaqueToken(18)}`;
}
