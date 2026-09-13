"use client";

import React, { useEffect, useState, useMemo } from "react";
import { dataLayer } from "@/lib/data-layer";
import { GstRow } from "@/lib/data-layer/types";
import {
  StatCard,
  DataTable,
  LoadingSkeleton,
  ErrorState,
  EmptyState,
  useToast,
  Column,
} from "@/components/shared";
import { PieChart, Calendar, Download, DollarSign, FileText } from "lucide-react";

export default function GstSummaryPage() {
  const { success } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("Sep-2026");
  const [gstRows, setGstRows] = useState<GstRow[]>([]);

  const loadInitialMonths = async () => {
    setLoading(true);
    setError(null);
    try {
      const months = await dataLayer.getAvailableGstMonths();
      // Ensure at least current month is available
      const defaultMonth = months[0] || "Sep-2026";
      setAvailableMonths(months.length > 0 ? months : [defaultMonth]);
      setSelectedMonth(defaultMonth);

      const rows = await dataLayer.getGstSummary(defaultMonth);
      setGstRows(rows);
    } catch (err: any) {
      console.error("Failed to load GST summary data:", err);
      setError(err.message || "Failed to load GST months");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialMonths();
  }, []);

  // Fetch GST rows when month selection changes
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    try {
      const rows = await dataLayer.getGstSummary(month);
      setGstRows(rows);
    } catch (err) {
      console.error("Failed to fetch GST rows for month:", month);
    }
  };

  // ── Stat Card Calculations (PRD §6.6) ──
  const totalTaxableAmount = useMemo(() => gstRows.reduce((sum, r) => sum + r.amount, 0), [gstRows]);
  const totalCgst = useMemo(() => gstRows.reduce((sum, r) => sum + r.cgst, 0), [gstRows]);
  const totalSgst = useMemo(() => gstRows.reduce((sum, r) => sum + r.sgst, 0), [gstRows]);
  const totalGstPayable = useMemo(() => totalCgst + totalSgst, [totalCgst, totalSgst]);
  const grandTotal = useMemo(() => gstRows.reduce((sum, r) => sum + r.totalAmount, 0), [gstRows]);

  // Export CSV
  const handleExportCsv = () => {
    if (gstRows.length === 0) return;

    const headers = ["S.No", "Bill No", "Bill Date", "Supplied To", "GSTIN", "Taxable Amount", "CGST", "SGST", "Total Amount"];
    const csvLines = [
      headers.join(","),
      ...gstRows.map((r) =>
        [
          r.sNo,
          `"${r.billNo}"`,
          r.billDate,
          `"${r.suppliedTo}"`,
          `"${r.gstNo}"`,
          r.amount,
          r.cgst,
          r.sgst,
          r.totalAmount,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GST_Summary_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success("Exported!", `GST Summary report for ${selectedMonth} exported as CSV.`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" rows={4} />
        <LoadingSkeleton variant="table" rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading GST Summary" message={error} onRetry={loadInitialMonths} />;
  }

  const columns: Column<GstRow>[] = [
    { key: "sNo", header: "S.No", width: "70px", align: "center" },
    { key: "billNo", header: "Bill #", width: "100px", sortable: true },
    { key: "billDate", header: "Bill Date", width: "110px", sortable: true },
    { key: "suppliedTo", header: "Supplied To (Client)", sortable: true },
    { key: "gstNo", header: "GSTIN", width: "150px" },
    {
      key: "amount",
      header: "Taxable Amount (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => `₹${row.amount.toLocaleString("en-IN")}`,
    },
    {
      key: "cgst",
      header: "CGST (9%)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.cgst.toLocaleString("en-IN")}`,
    },
    {
      key: "sgst",
      header: "SGST (9%)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.sgst.toLocaleString("en-IN")}`,
    },
    {
      key: "totalAmount",
      header: "Grand Total (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => (
        <span className="font-bold text-ink">
          ₹{row.totalAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-amber" />
            GST Tax Summary Report
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Monthly tax breakdown for CGST &amp; SGST filing (auto-populated from With Tax invoices).
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCsv}
          disabled={gstRows.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber text-white font-semibold rounded-lg text-xs hover:bg-amber/90 disabled:opacity-50 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export GST Report (.CSV)
        </button>
      </div>

      {/* ── Month Selector Tabs (PRD §6.6) ── */}
      <div className="bg-panel-bg border border-line rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber" />
          <span className="text-xs font-semibold text-ink">Select Filing Month:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {availableMonths.map((m) => {
            const isSelected = m === selectedMonth;
            return (
              <button
                key={m}
                onClick={() => handleMonthChange(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber text-white shadow-xs"
                    : "bg-slate-bg border border-line text-ink-soft hover:text-ink"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI Stat Cards (PRD §6.6) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Taxable Sales"
          value={`₹${totalTaxableAmount.toLocaleString("en-IN")}`}
          subtitle={`For ${selectedMonth}`}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Total CGST (9%)"
          value={`₹${totalCgst.toLocaleString("en-IN")}`}
          subtitle="Central GST Collected"
          icon={<FileText className="w-4 h-4 text-amber" />}
        />
        <StatCard
          title="Total SGST (9%)"
          value={`₹${totalSgst.toLocaleString("en-IN")}`}
          subtitle="State GST Collected"
          icon={<FileText className="w-4 h-4 text-amber" />}
        />
        <StatCard
          title="Total GST Payable"
          value={`₹${totalGstPayable.toLocaleString("en-IN")}`}
          subtitle="CGST + SGST Combined"
          badge={{ text: `${gstRows.length} Invoices`, variant: "warning" }}
          icon={<PieChart className="w-4 h-4 text-danger" />}
        />
      </div>

      {/* Data Table */}
      {gstRows.length > 0 ? (
        <DataTable
          columns={columns}
          data={gstRows}
          keyExtractor={(row) => row.billNo}
          pageSize={10}
        />
      ) : (
        <EmptyState
          title={`No GST Entries for ${selectedMonth}`}
          description="There are no 'With Tax' invoices issued in this month. Create a tax invoice to populate this tab."
        />
      )}
    </div>
  );
}
