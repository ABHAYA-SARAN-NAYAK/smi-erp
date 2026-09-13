/**
 * SMI ERP — Auth Config & Credentials (PRD §6.1 & §9.1)
 *
 * Password for the demo admin account is hashed with bcrypt.
 * Plaintext passwords are NEVER stored in source control or memory.
 */
export const AUTH_CONFIG = {
  // 8 hours in seconds
  SESSION_MAX_AGE_SECONDS: 8 * 60 * 60,
  COOKIE_NAME: "smi_session",
  
  // Rate limiting: max 5 failed attempts per 15 minutes (in ms)
  MAX_FAILED_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,

  // Demo Admin Account (hashed with bcrypt cost factor 10)
  // Plaintext: "Demo@12345"
  DEMO_ADMIN: {
    username: "admin",
    passwordHash: "$2b$10$vPTE0TUimfHhS7fETh.Xgujhen9ELpdXnKMszcBxTD/xw8xKRWb4e",
    role: "admin" as const,
    name: "System Administrator",
  },
};

export function getJwtSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET || "smi-erp-super-secret-jwt-key-change-in-production-2026";
  return new TextEncoder().encode(secretStr);
}
