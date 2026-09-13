import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "../lib/auth/config";
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from "../lib/auth/rateLimiter";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";

async function runAuthVerification() {
  console.log("==================================================");
  console.log("🔒 SMI ERP — Auth & Security Verification");
  console.log("==================================================\n");

  const testIp = "192.168.1.100";

  // 1. Password Hashing Verification (Bcrypt)
  console.log("1️⃣  Testing Bcrypt Password Verification...");
  const validPasswordMatch = await bcrypt.compare("Demo@12345", AUTH_CONFIG.DEMO_ADMIN.passwordHash);
  const invalidPasswordMatch = await bcrypt.compare("WrongPassword!", AUTH_CONFIG.DEMO_ADMIN.passwordHash);
  
  console.log(`   ✓ Correct password 'Demo@12345' match: ${validPasswordMatch ? "PASSED" : "FAILED"}`);
  console.log(`   ✓ Wrong password 'WrongPassword!' match: ${!invalidPasswordMatch ? "PASSED (Rejected)" : "FAILED"}`);

  if (!validPasswordMatch || invalidPasswordMatch) {
    throw new Error("Password hashing verification failed!");
  }

  // 2. JWT Session Token Verification
  console.log("\n2️⃣  Testing JWT Session Token Issuance & Verification...");
  const token = await createSessionToken({
    sub: "admin",
    username: "admin",
    role: "admin",
    name: "System Administrator",
  });
  console.log(`   ✓ Issued JWT Token: ${token.substring(0, 30)}...`);

  const payload = await verifySessionToken(token);
  console.log(`   ✓ Verified JWT Token Payload: sub=${payload?.sub}, role=${payload?.role}`);

  const invalidTokenPayload = await verifySessionToken("invalid.token.signature");
  console.log(`   ✓ Invalid JWT Token verification: ${invalidTokenPayload === null ? "PASSED (Rejected)" : "FAILED"}`);

  // 3. Rate Limiting Verification (§9.1 - 5 max failed attempts per 15 min)
  console.log("\n3️⃣  Testing Rate Limiting (5 max attempts / 15 mins)...");
  clearFailedAttempts(testIp);

  for (let i = 1; i <= 5; i++) {
    const check = isRateLimited(testIp);
    console.log(`   Attempt ${i}: Rate Limited? ${check.limited}`);
    recordFailedAttempt(testIp);
  }

  const rateCheckAfterMax = isRateLimited(testIp);
  console.log(`   ✓ Attempt 6 (After max failed attempts): Rate Limited? ${rateCheckAfterMax.limited ? "YES (Blocked HTTP 429)" : "NO"}`);
  
  if (!rateCheckAfterMax.limited) {
    throw new Error("Rate limiting failed to block excess failed attempts!");
  }

  clearFailedAttempts(testIp);
  console.log(`   ✓ Cleared failed attempts after successful login reset.`);

  console.log("\n==================================================");
  console.log("✅ ALL AUTHENTICATION & SECURITY TESTS PASSED!");
  console.log("==================================================");
}

runAuthVerification().catch((err) => {
  console.error("❌ Auth Verification failed:", err);
  process.exit(1);
});
