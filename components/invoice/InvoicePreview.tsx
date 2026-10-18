"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { InvoiceItem, Settings, Company } from "@/lib/data-layer/types";
import { DEFAULT_INVOICE_LOGO_URL } from "@/lib/data-layer/mockAdapter";
import { addDateOnlyDays, formatInvoiceDate, splitPhoneNumbers } from "@/lib/formatters/invoice";

interface InvoicePreviewProps {
  invoiceNo: string; date: string; type: "With Tax" | "Without Tax"; poNo?: string;
  company?: Company | null; items: InvoiceItem[]; cgstPercent: number; sgstPercent: number; settings?: Settings | null;
}

export function InvoicePreview(props: InvoicePreviewProps) {
  const { invoiceNo, date, type, poNo, company, items, cgstPercent, sgstPercent, settings } = props;
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const taxableAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const isWithTax = type === "With Tax";
  const cgstAmount = isWithTax ? (taxableAmount * cgstPercent) / 100 : 0;
  const sgstAmount = isWithTax ? (taxableAmount * sgstPercent) / 100 : 0;
  const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount);
  const dueDate = useMemo(() => company ? addDateOnlyDays(date, company.creditDays || 30) : date, [company, date]);
  const phones = splitPhoneNumbers(settings?.companyPhone);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const update = () => setScale(Math.min(1, element.clientWidth / 794));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={shellRef} className="invoice-preview-shell" style={{ height: 1123 * scale }}>
      <div className="invoice-preview-stage" style={{ width: 794, height: 1123, transform: `scale(${scale})` }}>
        <div id="invoice-paper-preview" className="invoice-document" style={{ backgroundColor: "#fffdf8" }}>
          <header className="invoice-document-header">
            {settings?.logoUrl || DEFAULT_INVOICE_LOGO_URL ? <img src={settings?.logoUrl || DEFAULT_INVOICE_LOGO_URL} alt="Company logo" className="invoice-logo" /> : null}
            <div className="invoice-company-block">
              <h1>{settings?.companyName || "SRI MUGAMBIGAI INDUSTRIES"}</h1>
              <p>{settings?.companyAddress || "No. 116, Perumal Nagar, Tirumudivakkam, Chennai – 600044"}</p>
              <div className="invoice-contact-grid">
                <span><b>GSTIN:</b> {settings?.companyGST || "—"}</span>
                <span><b>State:</b> {settings?.companyState || "Tamil Nadu"}</span>
                <span className="invoice-phone-list"><b>Ph:</b> {phones.map((phone, index) => <React.Fragment key={phone}><span>{phone}</span>{index < phones.length - 1 ? <span>/</span> : null}</React.Fragment>)}</span>
              </div>
            </div>
            <div className="invoice-doc-meta">
              <div className="invoice-badge">{isWithTax ? "TAX INVOICE" : "INVOICE"}</div>
              <div className="invoice-number">#{invoiceNo || "INV-1001"}</div>
              <div>Date: {formatInvoiceDate(date)}</div>
            </div>
          </header>
          <section className="invoice-billed-block">
            <div>
              <h4>BILLED TO / RECIPIENT</h4>
              {company ? <><strong>{company.name}</strong><p>{company.address}</p><span><b>GSTIN:</b> {company.gstNo}</span><span><b>State:</b> {company.state}</span></> : <em>Select a company...</em>}
            </div>
            <div className="invoice-meta-grid">
              <span>P.O. Number:</span><strong>{poNo || "—"}</strong>
              <span>Credit Term:</span><strong>{company?.creditDays || 30} Days</strong>
              <span>Payment Due Date:</span><strong className="invoice-accent">{formatInvoiceDate(dueDate)}</strong>
            </div>
          </section>
          <section className="invoice-table-wrap">
            <table className="invoice-items-table"><colgroup><col className="col-no" /><col className="col-part" /><col className="col-desc" /><col className="col-hsn" /><col className="col-qty" /><col className="col-rate" /><col className="col-amount" /></colgroup><thead><tr><th>#</th><th>Part No</th><th>Particulars / Description</th><th>HSN</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead><tbody>{items.length ? items.map((item, index) => <tr key={`${item.partNo}-${index}`}><td>{index + 1}</td><td className="nowrap mono">{item.partNo}</td><td>{item.particulars}</td><td className="nowrap mono">{item.hsn}</td><td className="num nowrap">{item.qty}</td><td className="num nowrap">₹{item.rate.toLocaleString("en-IN")}</td><td className="num nowrap"><b>₹{item.amount.toLocaleString("en-IN")}</b></td></tr>) : <tr><td colSpan={7} className="empty-row">No items added yet.</td></tr>}</tbody></table>
          </section>
          <div className="invoice-summary"><div><span>Subtotal (Taxable):</span><b>₹{taxableAmount.toLocaleString("en-IN")}</b>{isWithTax && <><span>CGST ({cgstPercent}%):</span><b>₹{cgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b><span>SGST ({sgstPercent}%):</span><b>₹{sgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></>}<strong>Grand Total:</strong><strong className="invoice-accent">₹{grandTotal.toLocaleString("en-IN")}</strong></div></div>
          <footer className="invoice-footer"><div><b>Terms &amp; Conditions:</b><span>1. Payment due within credit terms specified above.</span><span>2. Goods once sold will not be taken back unless defective.</span></div><div className="signature"><b>For {settings?.companyName || "SRI MUGAMBIGAI INDUSTRIES"}</b><div /><span>Authorized Signatory</span></div></footer>
        </div>
      </div>
    </div>
  );
}
