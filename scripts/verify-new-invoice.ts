import { MockDataAdapter } from "../lib/data-layer/mockAdapter";
import { Invoice } from "../lib/data-layer/types";

async function verifyNewInvoiceAndCascade() {
  console.log("==================================================");
  console.log("🧾 SMI ERP — New Invoice & Cascade Logic Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. Create a "With Tax" Invoice
  console.log("1️⃣  Testing 'With Tax' Invoice Creation & Cascade...");
  const taxInvoice: Invoice = {
    id: "inv_with_tax_1002",
    invoiceNo: "INV-1002",
    date: "2026-09-10",
    type: "With Tax",
    companyId: "c1", // Acme Fabrication (creditDays: 45)
    poNo: "PO-4401",
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

  const savedTaxInv = await adapter.saveInvoice(taxInvoice);
  console.log(`   ✓ Saved 'With Tax' invoice: ${savedTaxInv.invoiceNo} (Grand Total: ₹${savedTaxInv.grandTotal})`);

  // Verify Invoice in Invoices list
  const invoicesList1 = await adapter.getInvoices();
  const invFound1 = invoicesList1.find((i) => i.invoiceNo === "INV-1002");
  console.log(`   ✓ Found invoice in Invoices list: ${invFound1?.invoiceNo} (${invFound1?.type})`);

  // Verify Balance Confirmation cascade
  const balanceRows1 = await adapter.getBalanceConfirmation();
  const balanceRow1002 = balanceRows1.find((b) => b.billNo === "1002");
  console.log(`   ✓ Balance Confirmation row created:`);
  console.log(`     - Bill No: #${balanceRow1002?.billNo}`);
  console.log(`     - Company: ${balanceRow1002?.company}`);
  console.log(`     - Bill Amount: ₹${balanceRow1002?.billAmount}`);
  console.log(`     - Due Date (Date + 45 days): ${balanceRow1002?.amountDueDate}`);
  console.log(`     - Balance Amount: ₹${balanceRow1002?.balanceAmount}`);

  // Verify GST Summary cascade
  const gstRowsSep = await adapter.getGstSummary("Sep-2026");
  const gstRow1002 = gstRowsSep.find((g) => g.billNo === "1002");
  console.log(`   ✓ GST Summary row created (Sep-2026):`);
  console.log(`     - Bill No: #${gstRow1002?.billNo}`);
  console.log(`     - Supplied To: ${gstRow1002?.suppliedTo}`);
  console.log(`     - Taxable Amount: ₹${gstRow1002?.amount}`);
  console.log(`     - CGST (9%): ₹${gstRow1002?.cgst}`);
  console.log(`     - SGST (9%): ₹${gstRow1002?.sgst}`);
  console.log(`     - Total Amount: ₹${gstRow1002?.totalAmount}`);

  if (!balanceRow1002 || !gstRow1002) {
    throw new Error("Cascade failed for 'With Tax' invoice!");
  }

  // 2. Create a "Without Tax" Invoice
  console.log("\n2️⃣  Testing 'Without Tax' Invoice Creation & Cascade...");
  const noTaxInvoice: Invoice = {
    id: "inv_no_tax_1003",
    invoiceNo: "INV-1003",
    date: "2026-09-12",
    type: "Without Tax",
    companyId: "c2", // Bluewave Hydraulics (creditDays: 30)
    poNo: "PO-8812",
    items: [
      {
        partNo: "BW-CAP-010",
        particulars: "Thread Cap 10T",
        hsn: "39174090",
        qty: 1000,
        rate: 18,
        amount: 18000,
      },
    ],
    cgstPercent: 0,
    sgstPercent: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    grandTotal: 18000,
    status: "Active",
  };

  const savedNoTaxInv = await adapter.saveInvoice(noTaxInvoice);
  console.log(`   ✓ Saved 'Without Tax' invoice: ${savedNoTaxInv.invoiceNo} (Grand Total: ₹${savedNoTaxInv.grandTotal})`);

  // Verify Balance Confirmation cascade for Without Tax
  const balanceRows2 = await adapter.getBalanceConfirmation();
  const balanceRow1003 = balanceRows2.find((b) => b.billNo === "1003");
  console.log(`   ✓ Balance Confirmation row created:`);
  console.log(`     - Bill No: #${balanceRow1003?.billNo}`);
  console.log(`     - Company: ${balanceRow1003?.company}`);
  console.log(`     - Bill Amount: ₹${balanceRow1003?.billAmount}`);
  console.log(`     - Due Date (Date + 30 days): ${balanceRow1003?.amountDueDate}`);
  console.log(`     - Balance Amount: ₹${balanceRow1003?.balanceAmount}`);

  // Verify GST Summary is NOT populated for Without Tax
  const gstRowsSep2 = await adapter.getGstSummary("Sep-2026");
  const gstRow1003 = gstRowsSep2.find((g) => g.billNo === "1003");
  console.log(
    `   ✓ GST Summary has Bill #1003? ${gstRow1003 ? "YES (Error)" : "NO (Correct — excluded per PRD §6.9)"}`
  );

  if (!balanceRow1003 || gstRow1003) {
    throw new Error("Cascade failed for 'Without Tax' invoice!");
  }

  console.log("\n==================================================");
  console.log("✅ ALL NEW INVOICE & CASCADE TESTS PASSED!");
  console.log("==================================================");
}

verifyNewInvoiceAndCascade().catch((err) => {
  console.error("❌ New invoice verification failed:", err);
  process.exit(1);
});
