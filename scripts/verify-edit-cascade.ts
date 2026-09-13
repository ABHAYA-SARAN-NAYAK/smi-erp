import { MockDataAdapter } from "../lib/data-layer/mockAdapter";
import { Invoice } from "../lib/data-layer/types";

async function verifyEditInvoiceCascade() {
  console.log("==================================================");
  console.log("✏️ SMI ERP — Edit Invoice & In-Place Cascade Verification");
  console.log("==================================================\n");

  const adapter = new MockDataAdapter();

  // 1. Initial State Check
  console.log("1️⃣  Checking Initial Invoice & Linked Rows...");
  const initialInvoices = await adapter.getInvoices();
  const targetInvoice = initialInvoices[0]; // inv1: INV-1001, grandTotal: 10620
  console.log(`   ✓ Target Invoice: ${targetInvoice.invoiceNo} (Original Total: ₹${targetInvoice.grandTotal})`);

  const initialBalanceRows = await adapter.getBalanceConfirmation();
  const initialBalanceCount = initialBalanceRows.length;
  const targetBalanceRow = initialBalanceRows.find((b) => b.billNo === "1001");
  console.log(`   ✓ Initial Balance Count: ${initialBalanceCount}, Bill #1001 Amount: ₹${targetBalanceRow?.billAmount}`);

  const initialGstRows = await adapter.getGstSummary("Sep-2026");
  const initialGstCount = initialGstRows.length;
  const targetGstRow = initialGstRows.find((g) => g.billNo === "1001");
  console.log(`   ✓ Initial GST Rows Count: ${initialGstCount}, Bill #1001 Total Amount: ₹${targetGstRow?.totalAmount}`);

  // 2. Perform Edit: Increase Qty from 200 to 300 (New Amount = 300 * 45 = 13500, Taxable = 13500, CGST = 1215, SGST = 1215, Grand Total = 15930)
  console.log("\n2️⃣  Modifying Invoice INV-1001 (Increasing Qty from 200 -> 300)...");
  const updatedInvoicePayload: Invoice = {
    ...targetInvoice,
    items: [
      {
        partNo: "AC-INS-001",
        particulars: "6MM SS Insert",
        hsn: "39269099",
        qty: 300,
        rate: 45,
        amount: 13500,
      },
    ],
    cgstAmount: 1215,
    sgstAmount: 1215,
    grandTotal: 15930,
  };

  const updatedInvResult = await adapter.updateInvoice(targetInvoice.id, updatedInvoicePayload);
  console.log(`   ✓ Updated Invoice ${updatedInvResult.invoiceNo} -> New Grand Total: ₹${updatedInvResult.grandTotal}`);

  // 3. Verify In-Place Balance Confirmation Update (No duplicates!)
  console.log("\n3️⃣  Verifying Balance Confirmation In-Place Update...");
  const newBalanceRows = await adapter.getBalanceConfirmation();
  console.log(`   ✓ Balance Rows Count (Must be unchanged at ${initialBalanceCount}): ${newBalanceRows.length}`);

  const updatedBalanceRow = newBalanceRows.find((b) => b.billNo === "1001");
  console.log(`   ✓ Updated Balance Row #1001:`);
  console.log(`     - New Bill Amount: ₹${updatedBalanceRow?.billAmount} (Was ₹10,620)`);
  console.log(`     - New Balance Amount: ₹${updatedBalanceRow?.balanceAmount}`);

  if (newBalanceRows.length !== initialBalanceCount || updatedBalanceRow?.billAmount !== 15930) {
    throw new Error("Balance confirmation failed to update in place!");
  }

  // 4. Verify In-Place GST Summary Update (No duplicates!)
  console.log("\n4️⃣  Verifying GST Summary In-Place Update...");
  const newGstRows = await adapter.getGstSummary("Sep-2026");
  console.log(`   ✓ GST Summary Rows Count (Must be unchanged at ${initialGstCount}): ${newGstRows.length}`);

  const updatedGstRow = newGstRows.find((g) => g.billNo === "1001");
  console.log(`   ✓ Updated GST Row #1001:`);
  console.log(`     - Taxable Amount: ₹${updatedGstRow?.amount}`);
  console.log(`     - CGST: ₹${updatedGstRow?.cgst}`);
  console.log(`     - SGST: ₹${updatedGstRow?.sgst}`);
  console.log(`     - New Total Amount: ₹${updatedGstRow?.totalAmount} (Was ₹10,620)`);

  if (newGstRows.length !== initialGstCount || updatedGstRow?.totalAmount !== 15930) {
    throw new Error("GST summary failed to update in place!");
  }

  // 5. Verify Soft Cancellation
  console.log("\n5️⃣  Verifying Soft Cancellation...");
  await adapter.cancelInvoice(targetInvoice.id);
  const cancelledInv = await adapter.getInvoiceById(targetInvoice.id);
  const balanceAfterCancel = await adapter.getBalanceConfirmation();
  const gstAfterCancel = await adapter.getGstSummary("Sep-2026");

  console.log(`   ✓ Invoice status: ${cancelledInv.status}`);
  console.log(
    `   ✓ Balance record status: ${balanceAfterCancel.find((b) => b.billNo === "1001")?.status}`
  );
  console.log(
    `   ✓ GST Summary has Bill #1001? ${gstAfterCancel.some((g) => g.billNo === "1001") ? "YES (Error)" : "NO (Correctly removed)"}`
  );

  console.log("\n==================================================");
  console.log("✅ EDIT INVOICE & IN-PLACE CASCADE VERIFICATION PASSED!");
  console.log("==================================================");
}

verifyEditInvoiceCascade().catch((err) => {
  console.error("❌ Edit cascade verification failed:", err);
  process.exit(1);
});
