/**
 * Payroll Math Verification Script (Node.js compatible)
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

// Attach to globalThis so the adapter thinks it's in a browser
(globalThis as Record<string, unknown>).window = { localStorage: mockLocalStorage };
(globalThis as Record<string, unknown>).localStorage = mockLocalStorage;

// ── Now import the adapter (it will find "window.localStorage") ──
import { MockDataAdapter } from "../lib/data-layer/mockAdapter";

async function main() {
  console.log("==================================================");
  console.log("📅 SMI ERP — Attendance & Payroll Math Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. List employees
  const employees = await adapter.getEmployees();
  console.log(`1️⃣  Found ${employees.length} employees:`);
  employees.forEach((e) =>
    console.log(`   - ${e.name} (${e.designation}): ${e.salaryType} @ ₹${e.rate}`)
  );

  // 2. Mark attendance for Ravi Kumar (e1, Monthly ₹18,000)
  console.log("\n2️⃣  Marking Ravi Kumar (Monthly ₹18,000) attendance for Sep-2026...");
  await adapter.markAttendance("e1", "2026-09-01", {
    date: "2026-09-01", status: "Present", otHours: 0, holidayOtHours: 0, advance: 0,
  });
  await adapter.markAttendance("e1", "2026-09-02", {
    date: "2026-09-02", status: "Present", otHours: 4, holidayOtHours: 0, advance: 0,
  });
  await adapter.markAttendance("e1", "2026-09-07", {
    date: "2026-09-07", status: "Present", otHours: 0, holidayOtHours: 8, advance: 2000,
  });
  await adapter.markAttendance("e1", "2026-09-08", {
    date: "2026-09-08", status: "Absent", otHours: 0, holidayOtHours: 0, advance: 0,
  });
  console.log("   ✓ 4 days marked (3 Present + 1 Absent, 4h regular OT, 8h Holiday OT, ₹2,000 advance)");

  // 3. Mark attendance for Suresh M (e2, Daily ₹550)
  console.log("\n3️⃣  Marking Suresh M (Daily ₹550) attendance...");
  await adapter.markAttendance("e2", "2026-09-01", {
    date: "2026-09-01", status: "Present", otHours: 0, holidayOtHours: 0, advance: 0,
  });
  await adapter.markAttendance("e2", "2026-09-03", {
    date: "2026-09-03", status: "Present", otHours: 0, holidayOtHours: 4, advance: 500,
  });
  console.log("   ✓ 2 days marked (2 Present, 4h Holiday OT, ₹500 advance)");

  // 4. Fetch payroll
  console.log("\n4️⃣  Fetching getMonthlyPayroll('Sep-2026')...\n");
  const payroll = await adapter.getMonthlyPayroll("Sep-2026");

  let allPassed = true;

  // ── Ravi Kumar ──
  const ravi = payroll.find((p) => p.employeeId === "e1");
  if (!ravi) { console.error("   ❌ Ravi Kumar not found in payroll!"); process.exit(1); }

  const raviHourly = 18000 / (26 * 8); // ≈ 86.54
  const expectedRaviOt = Math.round(4 * raviHourly);           // ≈ 346
  const expectedRaviHot = Math.round(8 * raviHourly * 2);      // ≈ 1385
  const expectedRaviBase = 18000;
  const expectedRaviTotal = Math.round(expectedRaviBase + 4 * raviHourly + 8 * raviHourly * 2);
  const expectedRaviNet = Math.max(0, expectedRaviTotal - 2000);

  console.log("   ┌──────────────────────────────────────────────────────────────┐");
  console.log("   │  📋 RAVI KUMAR — Monthly ₹18,000 / Supervisor               │");
  console.log("   ├──────────────────────────────────────────────────────────────┤");
  console.log(`   │  Hourly Rate           = ₹18,000 / (26 × 8) = ₹${raviHourly.toFixed(2)}`);
  console.log(`   │  Days Present           : ${ravi.totalDaysPresent}   (expected: 3)`);
  console.log(`   │  Regular OT Hours       : ${ravi.otHours}   (expected: 4)`);
  console.log(`   │  Holiday OT Hours       : ${ravi.holidayOtHours}   (expected: 8)`);
  console.log(`   │  Base Salary            : ₹${ravi.baseSalary}   (expected: ₹${expectedRaviBase})`);
  console.log(`   │  Regular OT Pay         : ₹${ravi.otPay}   (expected: ₹${expectedRaviOt})`);
  console.log(`   │  Holiday OT Pay (2×)    : ₹${ravi.holidayOtPay}   (expected: ₹${expectedRaviHot})`);
  console.log(`   │  Total Gross            : ₹${ravi.totalSalary}   (expected: ₹${expectedRaviTotal})`);
  console.log(`   │  Advances               : ₹${ravi.totalAdvances}   (expected: ₹2000)`);
  console.log(`   │  Net Payable            : ₹${ravi.netPayable}   (expected: ₹${expectedRaviNet})`);

  const raviTests = [
    ["Days Present", ravi.totalDaysPresent, 3],
    ["OT Hours", ravi.otHours, 4],
    ["Holiday OT Hours", ravi.holidayOtHours, 8],
    ["Base Salary", ravi.baseSalary, expectedRaviBase],
    ["OT Pay", ravi.otPay, expectedRaviOt],
    ["Holiday OT Pay", ravi.holidayOtPay, expectedRaviHot],
    ["Total Salary", ravi.totalSalary, expectedRaviTotal],
    ["Advances", ravi.totalAdvances, 2000],
    ["Net Payable", ravi.netPayable, expectedRaviNet],
  ] as const;

  console.log("   │");
  for (const [name, actual, expected] of raviTests) {
    const pass = actual === expected;
    if (!pass) allPassed = false;
    console.log(`   │  ${pass ? "✅" : "❌"} ${name}: ${actual} ${pass ? "==" : "!="} ${expected}`);
  }
  console.log("   └──────────────────────────────────────────────────────────────┘");

  // ── Suresh M ──
  const suresh = payroll.find((p) => p.employeeId === "e2");
  if (!suresh) { console.error("   ❌ Suresh M not found in payroll!"); process.exit(1); }

  const sureshHourly = 550 / 8; // 68.75
  const expectedSureshBase = 2 * 550; // 1100
  const expectedSureshHot = Math.round(4 * sureshHourly * 2); // 550
  const expectedSureshTotal = Math.round(expectedSureshBase + 4 * sureshHourly * 2);
  const expectedSureshNet = Math.max(0, expectedSureshTotal - 500);

  console.log("\n   ┌──────────────────────────────────────────────────────────────┐");
  console.log("   │  📋 SURESH M — Daily ₹550 / Operator                        │");
  console.log("   ├──────────────────────────────────────────────────────────────┤");
  console.log(`   │  Hourly Rate           = ₹550 / 8 = ₹${sureshHourly.toFixed(2)}`);
  console.log(`   │  Days Present           : ${suresh.totalDaysPresent}   (expected: 2)`);
  console.log(`   │  Holiday OT Hours       : ${suresh.holidayOtHours}   (expected: 4)`);
  console.log(`   │  Base Salary            : ₹${suresh.baseSalary}   (expected: ₹${expectedSureshBase})`);
  console.log(`   │  Holiday OT Pay (2×)    : ₹${suresh.holidayOtPay}   (expected: ₹${expectedSureshHot})`);
  console.log(`   │  Total Gross            : ₹${suresh.totalSalary}   (expected: ₹${expectedSureshTotal})`);
  console.log(`   │  Advances               : ₹${suresh.totalAdvances}   (expected: ₹500)`);
  console.log(`   │  Net Payable            : ₹${suresh.netPayable}   (expected: ₹${expectedSureshNet})`);

  const sureshTests = [
    ["Days Present", suresh.totalDaysPresent, 2],
    ["Holiday OT Hours", suresh.holidayOtHours, 4],
    ["Base Salary", suresh.baseSalary, expectedSureshBase],
    ["Holiday OT Pay", suresh.holidayOtPay, expectedSureshHot],
    ["Total Salary", suresh.totalSalary, expectedSureshTotal],
    ["Advances", suresh.totalAdvances, 500],
    ["Net Payable", suresh.netPayable, expectedSureshNet],
  ] as const;

  console.log("   │");
  for (const [name, actual, expected] of sureshTests) {
    const pass = actual === expected;
    if (!pass) allPassed = false;
    console.log(`   │  ${pass ? "✅" : "❌"} ${name}: ${actual} ${pass ? "==" : "!="} ${expected}`);
  }
  console.log("   └──────────────────────────────────────────────────────────────┘");

  // ── Holiday OT 2x proof ──
  console.log("\n   🔍 HOLIDAY OT 2× MULTIPLIER PROOF:");
  const raviRegularRateForHOT = 8 * raviHourly; // what 8h at 1x would pay
  console.log(`      Ravi: 8h Holiday OT at 1× = ₹${Math.round(raviRegularRateForHOT)}, at 2× = ₹${ravi.holidayOtPay}`);
  console.log(`      Ratio: ${(ravi.holidayOtPay / Math.round(raviRegularRateForHOT)).toFixed(2)}× (should be 2.00×)`);

  console.log("\n==================================================");
  if (allPassed) {
    console.log("✅ ALL ATTENDANCE & PAYROLL MATH TESTS PASSED!");
  } else {
    console.log("❌ SOME TESTS FAILED — check the output above");
  }
  console.log("==================================================");

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Script error:", err);
  process.exit(1);
});
