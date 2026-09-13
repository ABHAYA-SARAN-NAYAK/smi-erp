import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_CONFIG, getJwtSecret } from "@/lib/auth/config";

// Protected routes requiring authentication
const PROTECTED_PREFIXES = [
  "/home",
  "/invoices",
  "/balance-confirmation",
  "/gst-summary",
  "/job-work",
  "/attendance",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current path matches any protected dashboard route
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Also protect root URL "/" -> redirect to login if unauthenticated or home if authenticated
  const isRoot = pathname === "/";

  if (isProtectedRoute || isRoot) {
    const token = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (token) {
      try {
        const secret = getJwtSecret();
        await jwtVerify(token, secret);
        isAuthenticated = true;
      } catch (err) {
        // Invalid or expired token
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      if (isProtectedRoute) {
        loginUrl.searchParams.set("reason", "expired");
      }
      return NextResponse.redirect(loginUrl);
    }

    if (isRoot && isAuthenticated) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // Redirect authenticated user away from /login to /home
  if (pathname === "/login") {
    const token = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;
    if (token) {
      try {
        const secret = getJwtSecret();
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/home", request.url));
      } catch (err) {
        // Token invalid, allow login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/home/:path*",
    "/invoices/:path*",
    "/balance-confirmation/:path*",
    "/gst-summary/:path*",
    "/job-work/:path*",
    "/attendance/:path*",
    "/settings/:path*",
  ],
};
