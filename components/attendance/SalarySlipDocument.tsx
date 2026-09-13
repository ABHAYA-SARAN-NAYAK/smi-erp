"use client";

import React from "react";
import { PayrollRow, Employee, Settings } from "@/lib/data-layer/types";

interface SalarySlipDocumentProps {
  payroll: PayrollRow;
  employee?: Employee | null;
  settings?: Settings | null;
}

export function SalarySlipDocument({
  payroll,
  employee,
  settings,
}: SalarySlipDocumentProps) {
  return (
    <div
      id="salary-slip-paper"
      className="bg-paper border border-line rounded-2xl p-8 shadow-lg text-ink space-y-6 text-xs max-w-2xl mx-auto"
      style={{ backgroundColor: "#fffdf8" }} // PRD §5 --paper
    >
      {/* Header */}
      <div className="border-b border-line pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">
            {settings?.companyName || "SMI Industrial Components"}
          </h1>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {settings?.companyAddress || "Peenya Industrial Area, Bangalore"}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-amber-soft text-amber font-semibold uppercase tracking-wider rounded-md text-[10px] border border-amber/30 mb-1">
            SALARY SLIP
          </div>
          <p className="font-display font-bold text-sm text-ink">{payroll.month}</p>
        </div>
      </div>

      {/* Employee Details Box */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-bg/40 rounded-xl border border-line">
        <div className="space-y-1">
          <div>
            <span className="text-ink-soft">Employee Name:</span>{" "}
            <span className="font-bold text-ink font-display">{payroll.employeeName}</span>
          </div>
          <div>
            <span className="text-ink-soft">Designation:</span>{" "}
            <span className="font-semibold text-ink">{payroll.designation}</span>
          </div>
          <div>
            <span className="text-ink-soft">Salary Type:</span>{" "}
            <span className="font-semibold text-ink">{employee?.salaryType || "Monthly"}</span>
          </div>
        </div>

        <div className="space-y-1 text-right">
          <div>
            <span className="text-ink-soft">Days Present:</span>{" "}
            <span className="font-semibold text-ink tabular-nums">{payroll.totalDaysPresent} Days</span>
          </div>
          <div>
            <span className="text-ink-soft">OT Hours:</span>{" "}
            <span className="font-semibold text-ink tabular-nums">{payroll.otHours} hrs</span>
          </div>
          <div>
            <span className="text-ink-soft">Holiday OT (2x):</span>{" "}
            <span className="font-semibold text-amber tabular-nums">{payroll.holidayOtHours} hrs</span>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions Table */}
      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-bg border-b border-line text-ink-soft font-semibold text-[10px] uppercase">
            <tr>
              <th className="py-2.5 px-4">Earnings / Pay Components</th>
              <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              <th className="py-2.5 px-4">Deductions</th>
              <th className="py-2.5 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="py-2.5 px-4 font-medium">Base Salary ({employee?.salaryType})</td>
              <td className="py-2.5 px-4 text-right tabular-nums">
                ₹{payroll.baseSalary.toLocaleString("en-IN")}
              </td>
              <td className="py-2.5 px-4 font-medium text-ink-soft">Salary Advances Given</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-danger font-medium">
                ₹{payroll.totalAdvances.toLocaleString("en-IN")}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium">Regular Overtime Pay</td>
              <td className="py-2.5 px-4 text-right tabular-nums">
                ₹{payroll.otPay.toLocaleString("en-IN")}
              </td>
              <td className="py-2.5 px-4"></td>
              <td className="py-2.5 px-4"></td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-amber">
                Holiday OT Pay (2x Rate)
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-amber">
                ₹{payroll.holidayOtPay.toLocaleString("en-IN")}
              </td>
              <td className="py-2.5 px-4"></td>
              <td className="py-2.5 px-4"></td>
            </tr>
          </tbody>
          <tfoot className="bg-slate-bg/50 font-semibold border-t border-line">
            <tr>
              <td className="py-3 px-4 font-bold text-ink">Gross Earnings:</td>
              <td className="py-3 px-4 text-right tabular-nums font-bold text-ink">
                ₹{payroll.totalSalary.toLocaleString("en-IN")}
              </td>
              <td className="py-3 px-4 font-bold text-ink">Total Deductions:</td>
              <td className="py-3 px-4 text-right tabular-nums font-bold text-danger">
                ₹{payroll.totalAdvances.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Net Salary Payable */}
      <div className="p-4 bg-amber-soft/40 border border-amber/30 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-ink tracking-wider">
            NET SALARY PAYABLE:
          </span>
          <p className="text-[10px] text-ink-soft">Gross Earnings minus Advances</p>
        </div>
        <div className="font-display text-2xl font-bold text-amber tabular-nums">
          ₹{payroll.netPayable.toLocaleString("en-IN")}
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="border-t border-line pt-6 flex items-center justify-between text-[10px] text-ink-soft">
        <div>
          <p className="font-semibold text-ink">Employee Signature:</p>
          <div className="h-8" />
          <p className="border-t border-line/60 pt-1">({payroll.employeeName})</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-ink">Authorized Signature:</p>
          <div className="h-8" />
          <p className="border-t border-line/60 pt-1">For {settings?.companyName || "SMI ERP"}</p>
        </div>
      </div>
    </div>
  );
}
