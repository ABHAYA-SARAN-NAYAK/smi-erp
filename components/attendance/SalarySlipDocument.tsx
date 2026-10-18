"use client";

import React, { useEffect, useRef, useState } from "react";
import { PayrollRow, Employee, Settings } from "@/lib/data-layer/types";

interface SalarySlipDocumentProps { payroll: PayrollRow; employee?: Employee | null; settings?: Settings | null; }

export function SalarySlipDocument({ payroll, employee, settings }: SalarySlipDocumentProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => { const shell = shellRef.current; if (!shell) return; const update = () => setScale(Math.min(1, shell.clientWidth / 794)); update(); const observer = new ResizeObserver(update); observer.observe(shell); return () => observer.disconnect(); }, []);
  return <div ref={shellRef} className="invoice-preview-shell" style={{ height: 1123 * scale }}><div className="salary-slip-preview-stage" style={{ width: 794, height: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }}><div id="salary-slip-paper" className="invoice-document salary-slip-document" style={{ backgroundColor: "#fffdf8" }}>
    <header className="invoice-document-header"><div className="invoice-company-block"><h1>{settings?.companyName || "SRI MUGAMBIGAI INDUSTRIES"}</h1><p>{settings?.companyAddress || "No. 116, Perumal Nagar, Tirumudivakkam, Chennai – 600044"}</p></div><div /><div className="invoice-doc-meta"><div className="invoice-badge">SALARY SLIP</div><div className="invoice-number">{payroll.month}</div></div></header>
    <section className="invoice-billed-block"><div><h4>EMPLOYEE DETAILS</h4><strong>{payroll.employeeName}</strong><span>{payroll.designation}</span><span>Salary Type: {employee?.salaryType || "Monthly"}</span></div><div className="invoice-meta-grid"><span>Days Present:</span><strong>{payroll.totalDaysPresent} Days</strong><span>OT Hours:</span><strong>{payroll.otHours} hrs</strong><span>Holiday OT:</span><strong className="invoice-accent">{payroll.holidayOtHours} hrs</strong></div></section>
    <section className="invoice-table-wrap"><table className="invoice-items-table"><thead><tr><th>Earnings / Pay Components</th><th>Amount (₹)</th><th>Deductions</th><th>Amount (₹)</th></tr></thead><tbody><tr><td>Base Salary ({employee?.salaryType})</td><td className="num nowrap">₹{payroll.baseSalary.toLocaleString("en-IN")}</td><td>Salary Advances Given</td><td className="num nowrap invoice-accent">₹{payroll.totalAdvances.toLocaleString("en-IN")}</td></tr><tr><td>Regular Overtime Pay</td><td className="num nowrap">₹{payroll.otPay.toLocaleString("en-IN")}</td><td /><td /></tr><tr><td className="invoice-accent">Holiday OT Pay (2x Rate)</td><td className="num nowrap invoice-accent">₹{payroll.holidayOtPay.toLocaleString("en-IN")}</td><td /><td /></tr></tbody><tfoot><tr><th>Gross Earnings:</th><th className="num nowrap">₹{payroll.totalSalary.toLocaleString("en-IN")}</th><th>Total Deductions:</th><th className="num nowrap invoice-accent">₹{payroll.totalAdvances.toLocaleString("en-IN")}</th></tr></tfoot></table></section>
    <div className="invoice-summary"><div><strong>NET SALARY PAYABLE:</strong><strong className="invoice-accent">₹{payroll.netPayable.toLocaleString("en-IN")}</strong></div></div>
    <footer className="invoice-footer"><div><b>Employee Signature:</b><div className="signature-line" /><span>({payroll.employeeName})</span></div><div className="signature"><b>Authorized Signature:</b><div /><span>For {settings?.companyName || "SRI MUGAMBIGAI INDUSTRIES"}</span></div></footer>
  </div></div></div>;
}
