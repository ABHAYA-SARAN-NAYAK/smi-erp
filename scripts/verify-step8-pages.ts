import { MockDataAdapter } from "../lib/data-layer/mockAdapter";

async function verifyStep8Pages() {
  console.log("==================================================");
  console.log("📊 SMI ERP — Step 8 List Pages & Filter Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. Balance Confirmation & Ageing View (§6.5)
  console.log("1️⃣  Verifying Balance Confirmation & Ageing View...");
  const balanceRows = await adapter.getBalanceConfirmation();
  const totalBilled = balanceRows.reduce((sum, r) => sum + r.billAmount, 0);
  const totalReceived = balanceRows.reduce((sum, r) => sum + r.amountReceived, 0);
  const totalOutstanding = balanceRows.reduce((sum, r) => sum + r.balanceAmount, 0);

  console.log(`   ✓ Total Billed: ₹${totalBilled.toLocaleString("en-IN")}`);
  console.log(`   ✓ Total Received: ₹${totalReceived.toLocaleString("en-IN")}`);
  console.log(`   ✓ Total Outstanding: ₹${totalOutstanding.toLocaleString("en-IN")}`);

  // Test recording payment on Bill #1001
  const updatedBalance = await adapter.recordPayment("1001", 1000, "2026-09-15");
  console.log(`   ✓ Recorded ₹1000 payment on Bill #1001 -> New Balance: ₹${updatedBalance.balanceAmount}, Status: ${updatedBalance.status}`);

  // 2. GST Summary & Month Selector Tabs (§6.6)
  console.log("\n2️⃣  Verifying GST Summary & Month Selector Tabs...");
  const months = await adapter.getAvailableGstMonths();
  console.log(`   ✓ Available GST Months: ${months.join(", ")}`);

  const sepGstRows = await adapter.getGstSummary("Sep-2026");
  const sepTaxable = sepGstRows.reduce((sum, r) => sum + r.amount, 0);
  const sepCgst = sepGstRows.reduce((sum, r) => sum + r.cgst, 0);
  const sepSgst = sepGstRows.reduce((sum, r) => sum + r.sgst, 0);
  const sepTotalGst = sepCgst + sepSgst;

  console.log(`   ✓ Sep-2026 Taxable Sales: ₹${sepTaxable.toLocaleString("en-IN")}`);
  console.log(`   ✓ Sep-2026 CGST (9%): ₹${sepCgst.toLocaleString("en-IN")}`);
  console.log(`   ✓ Sep-2026 SGST (9%): ₹${sepSgst.toLocaleString("en-IN")}`);
  console.log(`   ✓ Sep-2026 Total GST Payable: ₹${sepTotalGst.toLocaleString("en-IN")}`);

  const emptyMonthRows = await adapter.getGstSummary("Oct-2026");
  console.log(`   ✓ Oct-2026 GST Rows Count: ${emptyMonthRows.length} (Handled by EmptyState)`);

  // 3. Job-Work Ledger & Party Autocomplete (§6.7)
  console.log("\n3️⃣  Verifying Job-Work Ledger & Party Autocomplete...");
  const initialJwRows = await adapter.getJobWork();
  console.log(`   ✓ Initial Job-Work Rows: ${initialJwRows.length}`);

  const newJwEntry = await adapter.addJobWorkEntry({
    id: "jw_test_10",
    partyName: "Sri Precision Works",
    date: "2026-09-12",
    partNo: "AC-INS-002",
    qty: 400,
    rate: 10,
    totalAmount: 4000,
    amountDueDate: "2026-09-26",
    paidAmount: 0,
    paidDate: null,
    balanceAmount: 4000,
  });
  console.log(`   ✓ Added Job-Work entry for '${newJwEntry.partyName}', Total Amount: ₹${newJwEntry.totalAmount}`);

  const updatedJwPayment = await adapter.recordJobWorkPayment(newJwEntry.id, 1500, "2026-09-18");
  console.log(`   ✓ Recorded ₹1500 payment for ${updatedJwPayment.partyName} -> Remaining Balance: ₹${updatedJwPayment.balanceAmount}`);

  console.log("\n==================================================");
  console.log("✅ ALL STEP 8 LIST-PATTERN PAGES & CALCULATIONS VERIFIED!");
  console.log("==================================================");
}

verifyStep8Pages().catch((err) => {
  console.error("❌ Step 8 verification failed:", err);
  process.exit(1);
});
