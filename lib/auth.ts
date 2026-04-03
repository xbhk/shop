import "server-only";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import db from "./db";

const AUTH_COOKIE_NAME = "buddyforge.auth";
const SESSION_MAX_AGE_SEC = 2 * 24 * 60 * 60; // 2 days
const BCRYPT_ROUNDS = 12;

export type AuthUser = {
  userid: number;
  email: string;
  name: string;
  is_admin: number;
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function createSession(userid: number): {
  sessionId: string;
  expiresAt: string;
} {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000).toISOString();

  db.prepare("INSERT INTO sessions (session_id, userid, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    userid,
    expiresAt
  );

  return { sessionId, expiresAt };
}

export function deleteSession(sessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE session_id = ?").run(sessionId);
}

export function deleteAllUserSessions(userid: number): void {
  db.prepare("DELETE FROM sessions WHERE userid = ?").run(userid);
}

function cleanExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export function getUserFromSession(sessionId: string): AuthUser | null {
  cleanExpiredSessions();

  const row = db
    .prepare(
      `SELECT u.userid, u.email, u.name, u.is_admin
       FROM sessions s
       JOIN users u ON s.userid = u.userid
       WHERE s.session_id = ? AND s.expires_at > datetime('now')`
    )
    .get(sessionId) as AuthUser | undefined;

  return row ?? null;
}

export function getCurrentUser(): AuthUser | null {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionId) return null;
  return getUserFromSession(sessionId);
}

export function getCurrentUserFromRequest(request: NextRequest): AuthUser | null {
  const sessionId = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionId) return null;
  return getUserFromSession(sessionId);
}

export function setAuthCookie(sessionId: string): {
  name: string;
  value: string;
  options: Record<string, unknown>;
} {
  return {
    name: AUTH_COOKIE_NAME,
    value: sessionId,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: SESSION_MAX_AGE_SEC,
      path: "/"
    }
  };
}

export function clearAuthCookie(): {
  name: string;
  value: string;
  options: Record<string, unknown>;
} {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/"
    }
  };
}

export { AUTH_COOKIE_NAME };
