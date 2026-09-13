"use client";

import React, { useEffect, useState, useMemo } from "react";
import { dataLayer } from "@/lib/data-layer";
import { JobWorkRow } from "@/lib/data-layer/types";
import {
  StatCard,
  DataTable,
  FilterBar,
  Autocomplete,
  AutocompleteOption,
  SidePanel,
  LoadingSkeleton,
  ErrorState,
  useToast,
  Column,
} from "@/components/shared";
import { Wrench, Plus, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default function JobWorkPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jobWorkRows, setJobWorkRows] = useState<JobWorkRow[]>([]);

  // Filter states
  const [searchVal, setSearchVal] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add Entry SidePanel State
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [partNo, setPartNo] = useState("");
  const [qty, setQty] = useState<number>(500);
  const [rate, setRate] = useState<number>(8);
  const [creditDays, setCreditDays] = useState<number>(14);
  const [adding, setAdding] = useState(false);

  // Payment Modal State
  const [payTarget, setPayTarget] = useState<JobWorkRow | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [paying, setPaying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await dataLayer.getJobWork();
      setJobWorkRows(rows);
    } catch (err: any) {
      console.error("Failed to load Job-Work data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique Parties List for Autocomplete
  const uniqueParties = useMemo(() => {
    const set = new Set(jobWorkRows.map((r) => r.partyName));
    return Array.from(set);
  }, [jobWorkRows]);

  const partyOptions: AutocompleteOption[] = useMemo(() => {
    return uniqueParties.map((p) => ({
      value: p,
      label: p,
      sublabel: "Outside Job-Work Vendor",
    }));
  }, [uniqueParties]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return jobWorkRows.filter((r) => {
      const matchSearch =
        !searchVal ||
        r.partyName.toLowerCase().includes(searchVal.toLowerCase()) ||
        r.partNo.toLowerCase().includes(searchVal.toLowerCase());
      const matchParty = !partyFilter || r.partyName === partyFilter;
      const matchStart = !startDate || r.date >= startDate;
      const matchEnd = !endDate || r.date <= endDate;

      return matchSearch && matchParty && matchStart && matchEnd;
    });
  }, [jobWorkRows, searchVal, partyFilter, startDate, endDate]);

  // ── Stat Cards (PRD §6.7) ──
  const totalPayable = useMemo(() => jobWorkRows.reduce((sum, r) => sum + r.totalAmount, 0), [jobWorkRows]);
  const totalPaid = useMemo(() => jobWorkRows.reduce((sum, r) => sum + r.paidAmount, 0), [jobWorkRows]);
  const totalOutstanding = useMemo(() => jobWorkRows.reduce((sum, r) => sum + r.balanceAmount, 0), [jobWorkRows]);

  // Submit New Entry
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !partNo || qty <= 0 || rate < 0) return;

    setAdding(true);
    try {
      const totalAmount = qty * rate;
      const dueDateObj = new Date(date);
      dueDateObj.setDate(dueDateObj.getDate() + creditDays);
      const amountDueDate = dueDateObj.toISOString().split("T")[0];

      const newEntry: JobWorkRow = {
        id: `jw_${Date.now()}`,
        partyName: partyName.trim(),
        date,
        partNo: partNo.trim(),
        qty,
        rate,
        totalAmount,
        amountDueDate,
        paidAmount: 0,
        paidDate: null,
        balanceAmount: totalAmount,
      };

      const created = await dataLayer.addJobWorkEntry(newEntry);
      setJobWorkRows((prev) => [...prev, created]);
      success("Entry Added!", `Job-Work entry for ${created.partyName} saved.`);
      setAddPanelOpen(false);

      // Reset form
      setPartyName("");
      setPartNo("");
      setQty(500);
      setRate(8);
    } catch (err: any) {
      toastError("Failed to Add Entry", err.message);
    } finally {
      setAdding(false);
    }
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget || payAmount <= 0) return;

    setPaying(true);
    try {
      const updated = await dataLayer.recordJobWorkPayment(payTarget.id, payAmount, payDate);
      setJobWorkRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      success("Payment Recorded!", `Recorded ₹${payAmount.toLocaleString("en-IN")} payment to ${payTarget.partyName}.`);
      setPayTarget(null);
      setPayAmount(0);
    } catch (err: any) {
      toastError("Payment Failed", err.message);
    } finally {
      setPaying(false);
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
    return <ErrorState title="Error Loading Job-Work Ledger" message={error} onRetry={loadData} />;
  }

  const columns: Column<JobWorkRow>[] = [
    { key: "partyName", header: "Party / Vendor Name", sortable: true },
    { key: "date", header: "Date", width: "100px", sortable: true },
    { key: "partNo", header: "Part No", width: "120px" },
    { key: "qty", header: "Qty", align: "right", isNumeric: true },
    { key: "rate", header: "Rate (₹)", align: "right", isNumeric: true },
    {
      key: "totalAmount",
      header: "Total (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => `₹${row.totalAmount.toLocaleString("en-IN")}`,
    },
    { key: "amountDueDate", header: "Due Date", width: "110px", sortable: true },
    {
      key: "paidAmount",
      header: "Paid (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.paidAmount.toLocaleString("en-IN")}`,
    },
    {
      key: "balanceAmount",
      header: "Balance (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => (
        <span className={row.balanceAmount > 0 ? "font-bold text-danger" : "text-success"}>
          ₹{row.balanceAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "120px",
      accessor: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {row.balanceAmount > 0 && (
            <button
              onClick={() => {
                setPayTarget(row);
                setPayAmount(row.balanceAmount);
              }}
              className="px-2.5 py-1 bg-amber-soft text-amber hover:bg-amber hover:text-white font-semibold rounded text-[11px] transition-colors shadow-xs"
            >
              + Payment
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber" />
            Job-Work Ledger (Outside Payables)
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Manage outside vendor processing charges, payments, and payable balances.
          </p>
        </div>

        <button
          onClick={() => setAddPanelOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber text-white font-semibold rounded-lg text-xs hover:bg-amber/90 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Add Job-Work Entry
        </button>
      </div>

      {/* ── KPI Stat Cards (PRD §6.7) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Job-Work Charges"
          value={`₹${totalPayable.toLocaleString("en-IN")}`}
          subtitle="Cumulative Payable"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Total Paid to Vendors"
          value={`₹${totalPaid.toLocaleString("en-IN")}`}
          subtitle="Vendor Payments Settled"
          trend={{ value: `${Math.round((totalPaid / (totalPayable || 1)) * 100)}% Paid`, direction: "up" }}
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
        />
        <StatCard
          title="Outstanding Payable Balance"
          value={`₹${totalOutstanding.toLocaleString("en-IN")}`}
          subtitle="Pending Vendor Payables"
          icon={<AlertCircle className="w-4 h-4 text-danger" />}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={{
          value: searchVal,
          onChange: setSearchVal,
          placeholder: "Search party name or part no...",
        }}
        selects={[
          {
            id: "party",
            label: "Party",
            value: partyFilter,
            onChange: setPartyFilter,
            options: [
              { value: "", label: "All Parties" },
              ...uniqueParties.map((p) => ({ value: p, label: p })),
            ],
          },
        ]}
        dateRange={{
          startDate,
          endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        hasActiveFilters={Boolean(searchVal || partyFilter || startDate || endDate)}
        onClearFilters={() => {
          setSearchVal("");
          setPartyFilter("");
          setStartDate("");
          setEndDate("");
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRows}
        keyExtractor={(row) => row.id}
        emptyTitle="No Job-Work Entries Found"
        emptyDescription="No records match your selected filters."
        pageSize={10}
      />

      {/* ── Add Entry SidePanel (PRD §6.7) ── */}
      <SidePanel
        isOpen={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        title="Add Job-Work Entry"
        subtitle="Record new outside processing work assigned to vendor."
        width="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-ink block mb-1">Party / Vendor Name *</label>
            <Autocomplete
              options={partyOptions}
              value={partyName}
              onChange={(val) => setPartyName(val)}
              placeholder="Select or type vendor name..."
              addNewLabel="Add Vendor"
              onAddNew={(query) => setPartyName(query)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
              />
            </div>
            <div>
              <label className="font-semibold text-ink block mb-1">Credit Days</label>
              <input
                type="number"
                min="0"
                value={creditDays}
                onChange={(e) => setCreditDays(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-ink block mb-1">Part Number *</label>
            <input
              type="text"
              required
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              placeholder="e.g. AC-INS-001"
              className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink focus:outline-none focus:border-amber font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink tabular-nums focus:outline-none focus:border-amber"
              />
            </div>
            <div>
              <label className="font-semibold text-ink block mb-1">Unit Rate (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink tabular-nums focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-bg border border-line rounded-xl flex items-center justify-between font-semibold">
            <span>Computed Total Amount:</span>
            <span className="font-display font-bold text-sm text-ink tabular-nums">
              ₹{(qty * rate).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddPanelOpen(false)}
              className="px-4 py-2 border border-line rounded-lg bg-panel-bg text-ink font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !partyName || !partNo}
              className="px-4 py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 disabled:opacity-50 shadow-xs"
            >
              {adding ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </SidePanel>

      {/* ── Record Payment SidePanel ── */}
      <SidePanel
        isOpen={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title={`Record Payment to ${payTarget?.partyName}`}
        subtitle={`Remaining Payable Balance: ₹${payTarget?.balanceAmount.toLocaleString("en-IN")}`}
        width="sm"
      >
        {payTarget && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-ink block mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={payTarget.balanceAmount}
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink font-semibold text-sm tabular-nums focus:outline-none focus:border-amber"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink font-medium focus:outline-none focus:border-amber"
              />
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 border border-line rounded-lg bg-panel-bg text-ink font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying || payAmount <= 0}
                className="px-4 py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 disabled:opacity-50 shadow-xs"
              >
                {paying ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </form>
        )}
      </SidePanel>
    </div>
  );
}
