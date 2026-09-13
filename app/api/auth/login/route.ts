import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/auth";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from "@/lib/auth/rateLimiter";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    // 1. Determine client identifier (IP address or fallback)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 2. Rate Limiting Check (PRD §9.1)
    const rateCheck = isRateLimited(ip);
    if (rateCheck.limited) {
      const minutesLeft = Math.ceil((rateCheck.remainingMs || 0) / 60000);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
        },
        { status: 429 }
      );
    }

    // 3. Input Validation Server-Side (Zod — PRD §9.2)
    const body = await request.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      // Generic error per PRD §6.1 to prevent field probing
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const { username, password } = parseResult.data;

    // 4. Verify username against seeded admin account
    if (username !== AUTH_CONFIG.DEMO_ADMIN.username) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // 5. Verify bcrypt password hash (PRD §9.1)
    const isPasswordValid = await bcrypt.compare(
      password,
      AUTH_CONFIG.DEMO_ADMIN.passwordHash
    );

    if (!isPasswordValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // 6. Successful Login -> Clear rate limit counter
    clearFailedAttempts(ip);

    // 7. Issue httpOnly, Secure, SameSite=Strict session cookie (PRD §9.1)
    const token = await createSessionToken({
      sub: AUTH_CONFIG.DEMO_ADMIN.username,
      username: AUTH_CONFIG.DEMO_ADMIN.username,
      role: AUTH_CONFIG.DEMO_ADMIN.role,
      name: AUTH_CONFIG.DEMO_ADMIN.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        username: AUTH_CONFIG.DEMO_ADMIN.username,
        name: AUTH_CONFIG.DEMO_ADMIN.name,
        role: AUTH_CONFIG.DEMO_ADMIN.role,
      },
    });
  } catch (error) {
    // Hide internal error details per PRD §9.6
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
