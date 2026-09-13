import { SignJWT, jwtVerify } from "jose";
import { AUTH_CONFIG, getJwtSecret } from "./config";
import { cookies } from "next/headers";

export interface SessionPayload {
  sub: string;
  username: string;
  role: "admin";
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates a signed JWT session token valid for 8 hours (PRD §6.1 & §9.1).
 */
export async function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_CONFIG.SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies a JWT session token. Returns payload if valid, null if expired or invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Sets the httpOnly, Secure, SameSite=Strict session cookie on response headers (PRD §9.1).
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: AUTH_CONFIG.SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Removes the session cookie (Server Logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Gets the current session from request cookies.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
