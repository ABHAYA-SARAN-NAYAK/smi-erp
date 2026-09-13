"use client";

import React, { useEffect, useState, useMemo } from "react";
import { dataLayer } from "@/lib/data-layer";
import { BalanceRow, Company } from "@/lib/data-layer/types";
import {
  StatCard,
  StatusPill,
  DataTable,
  FilterBar,
  SidePanel,
  LoadingSkeleton,
  ErrorState,
  useToast,
  Column,
} from "@/components/shared";
import { CreditCard, DollarSign, AlertCircle, CheckCircle2, Clock, ShieldAlert, AlertTriangle } from "lucide-react";

export default function BalanceConfirmationPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Filter states
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Recording State
  const [paymentRow, setPaymentRow] = useState<BalanceRow | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [recording, setRecording] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, compList] = await Promise.all([
        dataLayer.getBalanceConfirmation(),
        dataLayer.getCompanies(),
      ]);
      setBalanceRows(rows);
      setCompanies(compList);
    } catch (err: any) {
      console.error("Failed to load Balance Confirmation data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return balanceRows.filter((row) => {
      const matchComp = !companyFilter || row.company === companyFilter;
      const matchStart = !startDate || row.date >= startDate;
      const matchEnd = !endDate || row.date <= endDate;

      let matchStatus = true;
      if (statusFilter !== "All") {
        if (statusFilter === "Overdue") {
          matchStatus = row.balanceAmount > 0 && row.amountDueDate < todayStr && row.status !== "Cancelled";
        } else {
          matchStatus = row.status === statusFilter;
        }
      }

      return matchComp && matchStart && matchEnd && matchStatus;
    });
  }, [balanceRows, companyFilter, statusFilter, startDate, endDate, todayStr]);

  // Stat Card Calculations
  const activeRows = useMemo(() => balanceRows.filter((r) => r.status !== "Cancelled"), [balanceRows]);
  const totalBilled = useMemo(() => activeRows.reduce((sum, r) => sum + r.billAmount, 0), [activeRows]);
  const totalReceived = useMemo(() => activeRows.reduce((sum, r) => sum + r.amountReceived, 0), [activeRows]);
  const totalOutstanding = useMemo(() => activeRows.reduce((sum, r) => sum + r.balanceAmount, 0), [activeRows]);
  const overdueCount = useMemo(
    () => activeRows.filter((r) => r.balanceAmount > 0 && r.amountDueDate < todayStr).length,
    [activeRows, todayStr]
  );

  // Ageing Breakdown (0-30 / 30-60 / 60+ days)
  const ageingBreakdown = useMemo(() => {
    let bucket030 = 0;
    let bucket3060 = 0;
    let bucket60Plus = 0;

    const todayDate = new Date(todayStr).getTime();

    activeRows.forEach((r) => {
      if (r.balanceAmount <= 0) return;
      const dueDate = new Date(r.amountDueDate).getTime();
      const diffDays = Math.max(0, Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 30) bucket030 += r.balanceAmount;
      else if (diffDays <= 60) bucket3060 += r.balanceAmount;
      else bucket60Plus += r.balanceAmount;
    });

    return { bucket030, bucket3060, bucket60Plus };
  }, [activeRows, todayStr]);

  // Payment Recording Submission
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRow || payAmount <= 0) return;

    setRecording(true);
    try {
      const updated = await dataLayer.recordPayment(paymentRow.billNo, payAmount, payDate);
      setBalanceRows((prev) => prev.map((r) => (r.billNo === updated.billNo ? updated : r)));
      success("Payment Recorded!", `Recorded ₹${payAmount.toLocaleString("en-IN")} payment for Bill #${paymentRow.billNo}.`);
      setPaymentRow(null);
      setPayAmount(0);
    } catch (err: any) {
      toastError("Payment Failed", err.message);
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" rows={3} />
        <LoadingSkeleton variant="table" rows={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading Balance Confirmation" message={error} onRetry={loadData} />;
  }

  const columns: Column<BalanceRow>[] = [
    { key: "billNo", header: "Bill #", width: "90px", sortable: true },
    { key: "date", header: "Bill Date", width: "100px", sortable: true },
    { key: "company", header: "Company", sortable: true },
    { key: "poNo", header: "P.O. No", width: "100px" },
    { key: "description", header: "Description" },
    {
      key: "billAmount",
      header: "Billed (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => `₹${row.billAmount.toLocaleString("en-IN")}`,
    },
    {
      key: "amountDueDate",
      header: "Due Date",
      width: "110px",
      sortable: true,
      accessor: (row) => {
        const isOverdue = row.balanceAmount > 0 && row.amountDueDate < todayStr && row.status !== "Cancelled";
        return (
          <span className={isOverdue ? "text-[#ef4444] font-semibold flex items-center gap-1" : ""}>
            {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />}
            {row.amountDueDate}
          </span>
        );
      },
    },
    {
      key: "amountReceived",
      header: "Received (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.amountReceived.toLocaleString("en-IN")}`,
    },
    {
      key: "balanceAmount",
      header: "Balance (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => (
        <span className={row.balanceAmount > 0 ? "font-bold text-[#ef4444]" : "text-[#22c55e]"}>
          ₹{row.balanceAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "110px",
      accessor: (row) => {
        const isOverdue = row.balanceAmount > 0 && row.amountDueDate < todayStr && row.status !== "Cancelled";
        return <StatusPill status={isOverdue ? "Overdue" : row.status || "Pending"} />;
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "120px",
      accessor: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {row.balanceAmount > 0 && row.status !== "Cancelled" && (
            <button
              onClick={() => {
                setPaymentRow(row);
                setPayAmount(row.balanceAmount);
              }}
              className="px-3 py-1 bg-[#FB5607]/20 text-[#FB5607] hover:bg-[#FB5607] hover:text-white font-semibold rounded-lg text-xs transition-all border border-[#FB5607]/40 shadow-xs cursor-pointer"
            >
              + Payment
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 text-[#E9ECEF]">
      {/* Page Header */}
      <div className="border-b border-[#2a2d38] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#E9ECEF] tracking-tight flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-[#FB5607]" />
          Balance Confirmation &amp; Receivables Ledger
        </h1>
        <p className="text-xs sm:text-sm text-[#8b8fa3] mt-1">
          Track customer accounts, ageing breakdown (0-30 / 30-60 / 60+ days), and record payment receipts.
        </p>
      </div>

      {/* ── KPI Stat Cards with SOLID WALLET HERO CARD ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Billed"
          value={`₹${totalBilled.toLocaleString("en-IN")}`}
          subtitle="Cumulative Invoiced Amount"
          icon={<DollarSign className="w-4 h-4" />}
          category="jobwork"
        />
        <StatCard
          title="Total Received"
          value={`₹${totalReceived.toLocaleString("en-IN")}`}
          subtitle="Collections Received"
          trend={{ value: `${Math.round((totalReceived / (totalBilled || 1)) * 100)}% Settled`, direction: "up" }}
          icon={<CheckCircle2 className="w-4 h-4" />}
          category="labour"
        />
        {/* HERO CARD: Outstanding Balance → Solid Orange (#FB5607) Wallet Hero Card */}
        <StatCard
          title="Outstanding Balance"
          value={`₹${totalOutstanding.toLocaleString("en-IN")}`}
          subtitle="Accounts Receivable Balance"
          badge={{
            text: `${overdueCount} Overdue`,
            variant: overdueCount > 0 ? "danger" : "neutral",
          }}
          icon={<ShieldAlert className="w-5 h-5" />}
          isHero={true}
          heroVariant="orange"
        />
      </div>

      {/* ── Ageing Breakdown Section with BOLD SOLID DANGER RED 60+ DAYS BLOCK ── */}
      <div className="fintech-card rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#2a2d38] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#E9ECEF] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FB5607]" />
            Ageing Breakdown (Outstanding Receivables)
          </h3>
          <span className="text-[11px] text-[#8b8fa3] font-medium">Risk Categorization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 0 - 30 Days Bucket */}
          <div className="bg-[#121317] border border-[#2a2d38] rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#8b8fa3] uppercase tracking-wider">0 – 30 Days</div>
            <div className="text-2xl font-extrabold font-display text-[#E9ECEF] mt-2 tabular-nums">
              ₹{ageingBreakdown.bucket030.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-[#8b8fa3] mt-1">Current receivables within normal credit terms</p>
          </div>

          {/* 30 - 60 Days Bucket */}
          <div className="bg-[#121317] border border-[#f59e0b]/40 rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
              30 – 60 Days
            </div>
            <div className="text-2xl font-extrabold font-display text-[#E9ECEF] mt-2 tabular-nums">
              ₹{ageingBreakdown.bucket3060.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-[#8b8fa3] mt-1">Moderately aged — follow up required</p>
          </div>

          {/* 60+ Days (BOLD SOLID DANGER RED BLOCK --danger #ef4444) */}
          <div className="fintech-hero-danger rounded-xl p-5 border border-white/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
                60+ Days (High Risk)
              </div>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-white text-[#ef4444] rounded shadow-xs">Critical Risk</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2 tabular-nums drop-shadow-xs">
              ₹{ageingBreakdown.bucket60Plus.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] font-medium text-white/90 mt-1">Severely overdue — immediate collection action required</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        selects={[
          {
            id: "company",
            label: "Company",
            value: companyFilter,
            onChange: setCompanyFilter,
            options: [
              { value: "", label: "All Companies" },
              ...companies.map((c) => ({ value: c.name, label: c.name })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "Partially Paid", label: "Partially Paid" },
              { value: "Paid", label: "Paid" },
              { value: "Overdue", label: "Overdue" },
            ],
          },
        ]}
        dateRange={{
          startDate,
          endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        hasActiveFilters={Boolean(companyFilter || statusFilter !== "All" || startDate || endDate)}
        onClearFilters={() => {
          setCompanyFilter("");
          setStatusFilter("All");
          setStartDate("");
          setEndDate("");
        }}
      />

      {/* Data Table Container */}
      <DataTable
        columns={columns}
        data={filteredRows}
        keyExtractor={(row) => row.billNo}
        emptyTitle="No Balance Rows Found"
        emptyDescription="No records match your selected filter criteria."
        pageSize={10}
      />

      {/* ── Record Payment SidePanel ── */}
      <SidePanel
        isOpen={Boolean(paymentRow)}
        onClose={() => setPaymentRow(null)}
        title={`Record Payment for Bill #${paymentRow?.billNo}`}
        subtitle={`Company: ${paymentRow?.company} • Remaining Balance: ₹${paymentRow?.balanceAmount.toLocaleString("en-IN")}`}
        width="sm"
      >
        {paymentRow && (
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs text-[#E9ECEF]">
            <div>
              <label className="font-semibold text-[#E9ECEF] block mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={paymentRow.balanceAmount}
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-semibold text-sm tabular-nums focus:outline-none focus:border-[#FB5607]"
              />
              <p className="text-[11px] text-[#8b8fa3] mt-1">
                Max payment allowed: ₹{paymentRow.balanceAmount.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <label className="font-semibold text-[#E9ECEF] block mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-medium focus:outline-none focus:border-[#FB5607]"
              />
            </div>

            <div className="pt-4 border-t border-[#2a2d38] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentRow(null)}
                className="px-4 py-2 border border-[#2a2d38] rounded-xl bg-[#21232c] text-[#E9ECEF] font-semibold hover:bg-[#282b36] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recording || payAmount <= 0}
                className="btn-accent-primary px-4 py-2 rounded-xl text-white font-semibold disabled:opacity-50"
              >
                {recording ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </form>
        )}
      </SidePanel>
    </div>
  );
}
