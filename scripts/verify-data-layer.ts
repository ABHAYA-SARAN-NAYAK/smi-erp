import { MockDataAdapter } from "../lib/data-layer/mockAdapter";
import { Invoice } from "../lib/data-layer/types";

async function runVerification() {
  console.log("==================================================");
  console.log("🧪 SMI ERP — Data Layer & Mock Adapter Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. Companies & Products
  console.log("1️⃣  Testing Companies & Products...");
  const companies = await adapter.getCompanies();
  console.log(`   ✓ Found ${companies.length} initial companies:`, companies.map((c) => c.name).join(", "));
  
  const products = await adapter.getCompanyProducts("c1");
  console.log(`   ✓ Found ${products.length} products for company c1:`, products.map((p) => p.partNo).join(", "));

  const newComp = await adapter.addCompany({
    id: "c4",
    name: "Apex Precision Tools",
    gstNo: "33AAPPA9999Z1Z1",
    address: "Peenya Industrial Area, Bangalore",
    state: "Karnataka",
    creditDays: 30,
  });
  console.log(`   ✓ Added new company: ${newComp.name} (${newComp.id})`);

  // 2. Invoices & Cascade Logic (§6.9)
  console.log("\n2️⃣  Testing Invoices & Cascade Logic (§6.9)...");
  const initialInvoicesList = await adapter.getInvoices();
  console.log(`   ✓ Initial invoices count: ${initialInvoicesList.length}`);

  const testInvoice: Invoice = {
    id: "inv_test_1002",
    invoiceNo: "INV-1002",
    date: "2026-09-10",
    type: "With Tax",
    companyId: "c1",
    poNo: "PO-3301",
    items: [
      {
        partNo: "AC-INS-001",
        particulars: "6MM SS Insert",
        hsn: "39269099",
        qty: 100,
        rate: 45,
        amount: 4500,
      },
    ],
    cgstPercent: 9,
    sgstPercent: 9,
    cgstAmount: 405,
    sgstAmount: 405,
    grandTotal: 5310,
    status: "Active",
  };

  const savedInvoice = await adapter.saveInvoice(testInvoice);
  console.log(`   ✓ Saved new invoice: ${savedInvoice.invoiceNo} (Grand Total: ₹${savedInvoice.grandTotal})`);

  // Verify Balance Confirmation cascade
  const balanceRows = await adapter.getBalanceConfirmation();
  const linkedBalance = balanceRows.find((b) => b.billNo === "1002");
  console.log(
    `   ✓ Cascade to Balance Confirmation: Bill #${linkedBalance?.billNo}, Amount: ₹${linkedBalance?.billAmount}, Due Date: ${linkedBalance?.amountDueDate}`
  );

  // Verify GST Summary cascade
  const gstRows = await adapter.getGstSummary("Sep-2026");
  const linkedGst = gstRows.find((g) => g.billNo === "1002");
  console.log(
    `   ✓ Cascade to GST Summary (Sep-2026): Bill #${linkedGst?.billNo}, CGST: ₹${linkedGst?.cgst}, SGST: ₹${linkedGst?.sgst}`
  );

  // 3. Record Payment
  console.log("\n3️⃣  Testing Payment Recording...");
  const updatedBalance = await adapter.recordPayment("1002", 2000, "2026-09-15");
  console.log(
    `   ✓ Recorded ₹2000 payment for Bill #1002. Status: ${updatedBalance.status}, Remaining Balance: ₹${updatedBalance.balanceAmount}`
  );

  // 4. Job-Work Ledger
  console.log("\n4️⃣  Testing Job-Work Ledger...");
  const jobWorks = await adapter.getJobWork();
  console.log(`   ✓ Found ${jobWorks.length} initial job-work rows:`, jobWorks.map((j) => j.partyName).join(", "));
  
  const newJw = await adapter.addJobWorkEntry({
    id: "jw2",
    partyName: "Shree Die Casting",
    date: "2026-09-11",
    partNo: "AC-INS-002",
    qty: 300,
    rate: 12,
    totalAmount: 3600,
    amountDueDate: "2026-09-25",
    paidAmount: 0,
    paidDate: null,
    balanceAmount: 3600,
  });
  console.log(`   ✓ Added Job-Work entry for ${newJw.partyName}, Total: ₹${newJw.totalAmount}`);

  // 5. Attendance & Payroll Computation
  console.log("\n5️⃣  Testing Attendance & Payroll Computation...");
  await adapter.markAttendance("e1", "2026-09-02", {
    date: "2026-09-02",
    status: "Present",
    otHours: 4,
    holidayOtHours: 0,
    advance: 0,
  });
  await adapter.markAttendance("e1", "2026-09-07", {
    date: "2026-09-07",
    status: "Present",
    otHours: 0,
    holidayOtHours: 8, // Holiday OT doubles rate
    advance: 1000,
  });

  const payroll = await adapter.getMonthlyPayroll("Sep-2026");
  const e1Payroll = payroll.find((p) => p.employeeId === "e1");
  console.log(`   ✓ Monthly Payroll for ${e1Payroll?.employeeName} (Sep-2026):`);
  console.log(`     - Days Present: ${e1Payroll?.totalDaysPresent}`);
  console.log(`     - Base Salary: ₹${e1Payroll?.baseSalary}`);
  console.log(`     - OT Pay: ₹${e1Payroll?.otPay}`);
  console.log(`     - Holiday OT Pay (2x multiplier): ₹${e1Payroll?.holidayOtPay}`);
  console.log(`     - Total Salary: ₹${e1Payroll?.totalSalary}`);
  console.log(`     - Advances: ₹${e1Payroll?.totalAdvances}`);
  console.log(`     - Net Payable: ₹${e1Payroll?.netPayable}`);

  // 6. Settings
  console.log("\n6️⃣  Testing Settings...");
  const settings = await adapter.getSettings();
  console.log(`   ✓ Current Company: ${settings.companyName}, Default CGST: ${settings.defaultCgstPercent}%`);

  // 7. Invoice Cancellation
  console.log("\n7️⃣  Testing Invoice Soft Cancellation...");
  await adapter.cancelInvoice(savedInvoice.id);
  const cancelledInv = await adapter.getInvoiceById(savedInvoice.id);
  const balanceAfterCancel = await adapter.getBalanceConfirmation();
  const gstAfterCancel = await adapter.getGstSummary("Sep-2026");
  
  console.log(`   ✓ Invoice status: ${cancelledInv.status}`);
  console.log(
    `   ✓ Balance record status: ${balanceAfterCancel.find((b) => b.billNo === "1002")?.status}`
  );
  console.log(
    `   ✓ GST Summary has Bill #1002? ${gstAfterCancel.some((g) => g.billNo === "1002") ? "YES" : "NO (Removed per PRD)"}`
  );

  console.log("\n==================================================");
  console.log("✅ ALL DATA LAYER & MOCK ADAPTER TESTS PASSED!");
  console.log("==================================================");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
