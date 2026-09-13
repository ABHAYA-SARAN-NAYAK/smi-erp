import { AUTH_CONFIG } from "./config";

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
}

// In-memory rate limiting store for failed login attempts
const failedAttemptsStore = new Map<string, AttemptRecord>();

/**
 * Checks if an IP or identifier is currently rate-limited.
 */
export function isRateLimited(identifier: string): { limited: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = failedAttemptsStore.get(identifier);

  if (!record) {
    return { limited: false };
  }

  // Reset window if window duration has passed
  if (now - record.firstAttemptTime > AUTH_CONFIG.RATE_LIMIT_WINDOW_MS) {
    failedAttemptsStore.delete(identifier);
    return { limited: false };
  }

  if (record.count >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS) {
    const remainingMs = AUTH_CONFIG.RATE_LIMIT_WINDOW_MS - (now - record.firstAttemptTime);
    return { limited: true, remainingMs };
  }

  return { limited: false };
}

/**
 * Logs a failed login attempt for an IP or identifier.
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = failedAttemptsStore.get(identifier);

  if (!record || now - record.firstAttemptTime > AUTH_CONFIG.RATE_LIMIT_WINDOW_MS) {
    failedAttemptsStore.set(identifier, { count: 1, firstAttemptTime: now });
  } else {
    record.count += 1;
  }
}

/**
 * Resets/clears failed login attempts after a successful login.
 */
export function clearFailedAttempts(identifier: string): void {
  failedAttemptsStore.delete(identifier);
}
