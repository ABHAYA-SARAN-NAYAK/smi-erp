"use client";

import React from "react";
import { InvoiceItem } from "@/lib/data-layer/types";
import { Settings, Company } from "@/lib/data-layer/types";

interface InvoicePreviewProps {
  invoiceNo: string;
  date: string;
  type: "With Tax" | "Without Tax";
  poNo?: string;
  company?: Company | null;
  items: InvoiceItem[];
  cgstPercent: number;
  sgstPercent: number;
  settings?: Settings | null;
}

export function InvoicePreview({
  invoiceNo,
  date,
  type,
  poNo,
  company,
  items,
  cgstPercent,
  sgstPercent,
  settings,
}: InvoicePreviewProps) {
  const taxableAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const isWithTax = type === "With Tax";

  const cgstAmount = isWithTax ? (taxableAmount * cgstPercent) / 100 : 0;
  const sgstAmount = isWithTax ? (taxableAmount * sgstPercent) / 100 : 0;
  const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount);

  // Auto-calculated due date based on company credit days
  const dueDate = company
    ? (() => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        d.setDate(d.getDate() + (company.creditDays || 30));
        return d.toISOString().split("T")[0];
      })()
    : date;

  return (
    <div
      id="invoice-paper-preview"
      className="bg-paper border border-line rounded-2xl p-8 shadow-lg text-ink space-y-6 text-xs max-w-2xl mx-auto transition-all"
      style={{ backgroundColor: "#fffdf8" }} // PRD §5 --paper
    >
      {/* ── Document Header ── */}
      <div className="border-b border-line pb-5 flex items-start justify-between">
        <div className="flex items-start gap-3">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Company logo"
              className="h-14 w-20 shrink-0 object-contain"
            />
          ) : null}
          <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {settings?.companyName || "SMI Industrial Components"}
          </h1>
          <p className="text-ink-soft text-[11px] mt-1 max-w-sm">
            {settings?.companyAddress || "Plot 12, Industrial Estate, Peenya, Bangalore"}
          </p>
          <div className="mt-2 text-[11px] text-ink-soft space-x-3">
            <span><strong>GSTIN:</strong> {settings?.companyGST || "29AACFA1234B1Z5"}</span>
            <span>•</span>
            <span><strong>Ph:</strong> {settings?.companyPhone || "9999999999"}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-amber-soft text-amber font-semibold uppercase tracking-wider rounded-md text-[10px] mb-2 border border-amber/30">
            {type === "With Tax" ? "TAX INVOICE" : "DELIVERY CHALLAN / BILL"}
          </div>
          <div className="font-display font-bold text-lg text-ink tabular-nums">
            #{invoiceNo || "INV-1001"}
          </div>
          <div className="text-ink-soft text-[11px] mt-1">
            <strong>Date:</strong> {date || "YYYY-MM-DD"}
          </div>
        </div>
      </div>

      {/* ── Bill To & Details Block ── */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-bg/40 rounded-xl border border-line">
        <div>
          <h4 className="font-semibold text-ink-soft uppercase text-[10px] tracking-wider mb-1">
            Billed To / Recipient
          </h4>
          {company ? (
            <div>
              <div className="font-bold text-ink text-sm font-display">{company.name}</div>
              <div className="text-[11px] text-ink-soft mt-0.5">{company.address}</div>
              <div className="text-[11px] text-ink-soft mt-1">
                <strong>GSTIN:</strong> {company.gstNo}
              </div>
              <div className="text-[11px] text-ink-soft">
                <strong>State:</strong> {company.state}
              </div>
            </div>
          ) : (
            <div className="text-ink-soft italic text-[11px]">Select a company...</div>
          )}
        </div>

        <div className="text-right space-y-1 text-[11px]">
          <div>
            <span className="text-ink-soft font-medium">P.O. Number:</span>{" "}
            <span className="font-semibold text-ink">{poNo || "N/A"}</span>
          </div>
          <div>
            <span className="text-ink-soft font-medium">Credit Term:</span>{" "}
            <span className="font-semibold text-ink">
              {company?.creditDays || 30} Days
            </span>
          </div>
          <div>
            <span className="text-ink-soft font-medium">Payment Due Date:</span>{" "}
            <span className="font-semibold text-amber">{dueDate}</span>
          </div>
        </div>
      </div>

      {/* ── Line Items Table ── */}
      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-bg border-b border-line text-ink-soft font-semibold text-[10px] uppercase">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Part No</th>
              <th className="py-2.5 px-3">Particulars / Description</th>
              <th className="py-2.5 px-3 text-center">HSN</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-paper">
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2.5 px-3 text-center text-ink-soft">{index + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-ink">{item.partNo}</td>
                  <td className="py-2.5 px-3 font-medium text-ink">{item.particulars}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-ink-soft">{item.hsn}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium">{item.qty}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                    ₹{item.rate.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-ink">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-soft italic">
                  No items added yet. Use the product picker or add custom rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Summary & Tax Breakdown Block ── */}
      <div className="flex justify-end pt-2">
        <div className="w-64 space-y-2 text-xs border-t border-line pt-3">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal (Taxable):</span>
            <span className="font-semibold text-ink tabular-nums">
              ₹{taxableAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {isWithTax && (
            <>
              <div className="flex justify-between text-ink-soft">
                <span>CGST ({cgstPercent}%):</span>
                <span className="font-medium text-ink tabular-nums">
                  ₹{cgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>SGST ({sgstPercent}%):</span>
                <span className="font-medium text-ink tabular-nums">
                  ₹{sgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2 border-t border-line font-display text-sm font-bold text-ink">
            <span>Grand Total:</span>
            <span className="text-amber tabular-nums">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer Terms ── */}
      <div className="border-t border-line pt-4 text-[10px] text-ink-soft flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">Terms &amp; Conditions:</p>
          <p>1. Payment due within credit terms specified above.</p>
          <p>2. Goods once sold will not be taken back unless defective.</p>
        </div>
        <div className="text-right">
          <p className="font-display font-semibold text-ink">
            For {settings?.companyName || "SMI Industrial Components"}
          </p>
          <div className="h-8" />
          <p className="border-t border-line/60 pt-1">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
