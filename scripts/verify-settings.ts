/**
 * Settings & Account Verification Script (Node.js compatible)
 * Mocks localStorage so MockDataAdapter can run outside the browser.
 */

// ── Mock localStorage for Node ────────────────────────────
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

(globalThis as Record<string, unknown>).window = { localStorage: mockLocalStorage };
(globalThis as Record<string, unknown>).localStorage = mockLocalStorage;

import { MockDataAdapter } from "../lib/data-layer/mockAdapter";
import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "../lib/auth/config";

async function main() {
  console.log("==================================================");
  console.log("⚙️ SMI ERP — Settings & Security Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. Fetch initial settings
  const initialSettings = await adapter.getSettings();
  console.log("1️⃣  Initial Settings:");
  console.log(`   - Company: ${initialSettings.companyName}`);
  console.log(`   - Prefix: ${initialSettings.invoicePrefix}, Last No: ${initialSettings.lastInvoiceNo}`);
  console.log(`   - CGST: ${initialSettings.defaultCgstPercent}%, SGST: ${initialSettings.defaultSgstPercent}%`);
  console.log(`   - Holiday OT Multiplier: ${initialSettings.holidayOtMultiplier}x`);

  // 2. Update Settings
  console.log("\n2️⃣  Updating Settings via DataLayer...");
  const updatedSettings = await adapter.updateSettings({
    companyName: "SMI Global Engineering Solutions Pvt Ltd",
    companyAddress: "100 Industrial Estate, Coimbatore, TN 641001",
    invoicePrefix: "SMI-INV-",
    lastInvoiceNo: 1500,
    defaultCgstPercent: 9,
    defaultSgstPercent: 9,
    holidayOtMultiplier: 2.5,
    logoUrl: "data:image/png;base64,mockLogoDataString",
  });

  console.log("   ✓ Settings updated successfully");

  // 3. Verify updated settings persistent in adapter
  console.log("\n3️⃣  Verifying re-read settings...");
  const readBack = await adapter.getSettings();

  const settingsTests = [
    ["Company Name", readBack.companyName, "SMI Global Engineering Solutions Pvt Ltd"],
    ["Invoice Prefix", readBack.invoicePrefix, "SMI-INV-"],
    ["Last Invoice No", readBack.lastInvoiceNo, 1500],
    ["Holiday OT Multiplier", readBack.holidayOtMultiplier, 2.5],
    ["Logo URL", readBack.logoUrl, "data:image/png;base64,mockLogoDataString"],
  ] as const;

  let allPassed = true;
  for (const [name, actual, expected] of settingsTests) {
    const pass = actual === expected;
    if (!pass) allPassed = false;
    console.log(`   ${pass ? "✅" : "❌"} ${name}: "${actual}" ${pass ? "==" : "!="} "${expected}"`);
  }

  // 4. Verify Password Hashing Security (PRD §9.1)
  console.log("\n4️⃣  Verifying Password Hashing & Bcrypt Security...");
  const demoHash = AUTH_CONFIG.DEMO_ADMIN.passwordHash;
  const isMatch = await bcrypt.compare("Demo@12345", demoHash);
  console.log(`   - Current demo password ("Demo@12345") bcrypt check: ${isMatch ? "✅ VALID" : "❌ INVALID"}`);
  
  if (!isMatch) allPassed = false;

  // Simulate updating password to "NewSecret@2026"
  const newHash = await bcrypt.hash("NewSecret@2026", 10);
  const verifyNew = await bcrypt.compare("NewSecret@2026", newHash);
  const verifyWrong = await bcrypt.compare("WrongPassword", newHash);
  
  console.log(`   - New password ("NewSecret@2026") hash verify: ${verifyNew ? "✅ VALID" : "❌ INVALID"}`);
  console.log(`   - Wrong password ("WrongPassword") reject: ${!verifyWrong ? "✅ REJECTED" : "❌ ACCEPTED"}`);

  if (!verifyNew || verifyWrong) allPassed = false;

  console.log("\n==================================================");
  if (allPassed) {
    console.log("✅ ALL SETTINGS & SECURITY VERIFICATION TESTS PASSED!");
  } else {
    console.log("❌ SOME TESTS FAILED");
  }
  console.log("==================================================");

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Script error:", err);
  process.exit(1);
});
