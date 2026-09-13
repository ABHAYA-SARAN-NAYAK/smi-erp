"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { dataLayer } from "@/lib/data-layer";
import {
  Invoice,
  BalanceRow,
  JobWorkRow,
  PayrollRow,
  Company,
} from "@/lib/data-layer/types";
import {
  StatCard,
  StatusPill,
  DataTable,
  LoadingSkeleton,
  ErrorState,
  Column,
} from "@/components/shared";
import {
  FilePlus,
  DollarSign,
  PieChart,
  CreditCard,
  Wrench,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [jobWorkRows, setJobWorkRows] = useState<JobWorkRow[]>([]);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invList, balList, jwList, compList] = await Promise.all([
        dataLayer.getInvoices(),
        dataLayer.getBalanceConfirmation(),
        dataLayer.getJobWork(),
        dataLayer.getCompanies(),
      ]);

      setInvoices(invList);
      setBalanceRows(balList);
      setJobWorkRows(jwList);
      setCompanies(compList);

      const latestInvoiceDate = invList[0]?.date || new Date().toISOString().split("T")[0];
      const monthDate = new Date(latestInvoiceDate);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthKey = `${months[monthDate.getMonth()]}-${monthDate.getFullYear()}`;

      const payrollList = await dataLayer.getMonthlyPayroll(currentMonthKey);
      setPayrollRows(payrollList);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [companies]);

  // ── KPI Calculations ──
  const thisMonthSales = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "Active" && inv.date.startsWith("2026-09"))
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const gstPayableThisMonth = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "Active" && inv.type === "With Tax" && inv.date.startsWith("2026-09"))
      .reduce((sum, inv) => sum + (inv.cgstAmount + inv.sgstAmount), 0);
  }, [invoices]);

  const totalReceivable = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const activeBalanceRows = balanceRows.filter((b) => b.status !== "Cancelled");
    const total = activeBalanceRows.reduce((sum, b) => sum + b.balanceAmount, 0);
    const overdueCount = activeBalanceRows.filter(
      (b) => b.balanceAmount > 0 && b.amountDueDate < today
    ).length;

    return { total, overdueCount };
  }, [balanceRows]);

  const jobWorkPayable = useMemo(() => {
    return jobWorkRows.reduce((sum, jw) => sum + jw.balanceAmount, 0);
  }, [jobWorkRows]);

  const labourCost = useMemo(() => {
    return payrollRows.reduce((sum, p) => sum + p.totalSalary, 0);
  }, [payrollRows]);

  // Mini Tables Data
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [invoices]);

  const overdueReceivables = useMemo(() => {
    return balanceRows
      .filter((b) => b.balanceAmount > 0 && b.status !== "Cancelled")
      .sort((a, b) => (a.amountDueDate < b.amountDueDate ? -1 : 1))
      .slice(0, 5);
  }, [balanceRows]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" rows={3} />
        <LoadingSkeleton variant="table" rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading Home Dashboard" message={error} onRetry={loadDashboardData} />;
  }

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "invoiceNo",
      header: "Invoice No",
      sortable: true,
      width: "120px",
      accessor: (row) => <span className="font-mono-spec font-semibold text-[#FB5607]">{row.invoiceNo}</span>,
    },
    { key: "date", header: "Date", sortable: true, width: "110px" },
    {
      key: "companyId",
      header: "Company",
      accessor: (row) => companyMap.get(row.companyId) || row.companyId,
    },
    {
      key: "type",
      header: "Type",
      width: "110px",
      accessor: (row) => (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#21232c] border border-[#2a2d38] text-[#8b8fa3]">
          {row.type}
        </span>
      ),
    },
    {
      key: "grandTotal",
      header: "Amount (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => `₹${row.grandTotal.toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "100px",
      accessor: (row) => <StatusPill status={row.status} />,
    },
  ];

  const overdueColumns: Column<BalanceRow>[] = [
    {
      key: "billNo",
      header: "Bill #",
      width: "90px",
      accessor: (row) => <span className="font-mono-spec font-semibold text-[#E9ECEF]">{row.billNo}</span>,
    },
    { key: "company", header: "Company" },
    { key: "date", header: "Bill Date", width: "110px" },
    { key: "amountDueDate", header: "Due Date", width: "110px" },
    {
      key: "billAmount",
      header: "Billed (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.billAmount.toLocaleString("en-IN")}`,
    },
    {
      key: "balanceAmount",
      header: "Outstanding (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => (
        <span className="font-semibold text-[#ef4444]">
          ₹{row.balanceAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#E9ECEF] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#8b8fa3] mt-1 font-mono-spec">
            SYSTEM SPEC // Real-time Industrial Operations Summary
          </p>
        </div>

        {/* Solid Accent Primary Button (#FB5607) */}
        <Link
          href="/invoices/new"
          className="btn-accent-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs shrink-0 cursor-pointer"
        >
          <FilePlus className="w-4 h-4" />
          + New Invoice
        </Link>
      </div>

      {/* ── Glow Cards KPI Grid (Full Radial Glow + Light-emitting Icon Badges) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Sales → Glow Card Orange (#FB5607) */}
        <StatCard
          title="This Month's Sales"
          value={`₹${thisMonthSales.toLocaleString("en-IN")}`}
          subtitle="Sep 2026 Revenue"
          badge={{ text: "Sep 2026", variant: "neutral" }}
          icon={<DollarSign className="w-4 h-4" />}
          category="sales"
        />

        {/* 2. GST → Glow Card Violet (#8338EC) */}
        <StatCard
          title="GST Payable"
          value={`₹${gstPayableThisMonth.toLocaleString("en-IN")}`}
          subtitle="CGST + SGST (Sep)"
          trend={{ value: "18%", direction: "neutral" }}
          icon={<PieChart className="w-4 h-4" />}
          category="gst"
        />

        {/* 3. Receivables → Glow Card Red (#ef4444) */}
        <StatCard
          title="Receivables"
          value={`₹${totalReceivable.total.toLocaleString("en-IN")}`}
          subtitle="Accounts Receivable"
          badge={{
            text: `${totalReceivable.overdueCount} Overdue`,
            variant: totalReceivable.overdueCount > 0 ? "danger" : "neutral",
          }}
          icon={<CreditCard className="w-4 h-4" />}
          category="receivables"
        />

        {/* 4. Job-Work → Glow Card Blue (#3b82f6) */}
        <StatCard
          title="Job-Work Payable"
          value={`₹${jobWorkPayable.toLocaleString("en-IN")}`}
          subtitle="Outside Payables"
          trend={{ value: "Pending", direction: "neutral" }}
          icon={<Wrench className="w-4 h-4" />}
          category="jobwork"
        />

        {/* 5. Labour Cost → Glow Card Green (#22c55e) */}
        <StatCard
          title="Labour Cost"
          value={`₹${labourCost.toLocaleString("en-IN")}`}
          subtitle="Sep Payroll Total"
          trend={{ value: `${payrollRows.length} Staff`, direction: "neutral" }}
          icon={<Users className="w-4 h-4" />}
          category="labour"
        />
      </div>

      {/* ── Mini Tables Section with Glow Panels & Industrial Specs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices Glow Panel */}
        <div className="glow-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d38]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E9ECEF] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FB5607]" />
              Recent Invoices
            </h3>
            <Link
              href="/invoices/history"
              className="text-xs font-semibold text-[#FB5607] hover:underline flex items-center gap-1 font-mono-spec"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            columns={invoiceColumns}
            data={recentInvoices}
            keyExtractor={(row) => row.id}
            emptyTitle="No Recent Invoices"
            emptyDescription="Create your first invoice using the '+ New Invoice' button."
            pageSize={5}
          />
        </div>

        {/* Outstanding Receivables Glow Panel */}
        <div className="glow-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d38]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E9ECEF] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              Outstanding Receivables
            </h3>
            <Link
              href="/balance-confirmation"
              className="text-xs font-semibold text-[#FB5607] hover:underline flex items-center gap-1 font-mono-spec"
            >
              View Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            columns={overdueColumns}
            data={overdueReceivables}
            keyExtractor={(row) => row.billNo}
            emptyTitle="No Outstanding Receivables"
            emptyDescription="All billed invoices have been fully paid."
            pageSize={5}
          />
        </div>
      </div>
    </div>
  );
}
