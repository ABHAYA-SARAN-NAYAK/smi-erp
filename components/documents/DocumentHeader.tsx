"use client";

import React from "react";
import { DEFAULT_INVOICE_LOGO_URL } from "@/lib/data-layer/mockAdapter";
import { Settings } from "@/lib/data-layer/types";
import { formatInvoiceDate, splitPhoneNumbers } from "@/lib/formatters/invoice";

interface DocumentHeaderProps { settings?: Settings | null; kind: "invoice" | "salary"; invoiceNo?: string; date?: string; month?: string; tax?: boolean; }

export function DocumentHeader({ settings, kind, invoiceNo, date, month, tax }: DocumentHeaderProps) {
  const logo = settings?.logoUrl || DEFAULT_INVOICE_LOGO_URL;
  const phones = splitPhoneNumbers(settings?.companyPhone);
  return <header className="document-header">
    <div className={`document-logo-slot ${logo ? "has-logo" : ""}`}>{logo ? <img src={logo} alt="Company logo" className="document-logo" crossOrigin="anonymous" /> : null}</div>
    <div className="document-company"><h1>{settings?.companyName || "—"}</h1><p>{settings?.companyAddress || "—"}</p>{kind === "invoice" && <div className="document-contact"><span>GSTIN: {settings?.companyGST || "—"}</span><span>State: {settings?.companyState || "—"}</span><span className="document-phone">Ph: {phones.join(" / ")}</span></div>}</div>
    <div className="document-meta"><div className="document-badge">{kind === "salary" ? "SALARY SLIP" : tax ? "TAX INVOICE" : "INVOICE"}</div><div className="document-number">{kind === "salary" ? month : `#${invoiceNo}`}</div>{kind === "invoice" && <div>Date: {formatInvoiceDate(date)}</div>}</div>
  </header>;
}
