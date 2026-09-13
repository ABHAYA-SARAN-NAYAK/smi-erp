import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { changeAccountSchema } from "@/lib/validation/settings";

export async function POST(request: Request) {
  try {
    // 1. Verify authenticated session (PRD §9.1)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthenticated session" }, { status: 401 });
    }

    // 2. Validate input body server-side with Zod
    const body = await request.json().catch(() => ({}));
    const parseResult = changeAccountSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { currentPassword, newUsername, newPassword } = parseResult.data;

    // 3. Verify current password hash with bcrypt (PRD §9.1)
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      AUTH_CONFIG.DEMO_ADMIN.passwordHash
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Incorrect current password." },
        { status: 400 }
      );
    }

    // 4. Hash new password with bcrypt cost factor 10
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update in-memory demo account config
    AUTH_CONFIG.DEMO_ADMIN.passwordHash = newHash;
    if (newUsername && newUsername.trim()) {
      AUTH_CONFIG.DEMO_ADMIN.username = newUsername.trim();
    }

    return NextResponse.json({
      success: true,
      message: "Account credentials updated successfully.",
      username: AUTH_CONFIG.DEMO_ADMIN.username,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating account credentials." },
      { status: 500 }
    );
  }
}
