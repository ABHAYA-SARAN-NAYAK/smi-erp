"use client";

import React, { useState } from "react";
import {
  StatCard,
  StatusPill,
  DataTable,
  FilterBar,
  Autocomplete,
  SidePanel,
  ToastProvider,
  useToast,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  Column,
} from "@/components/shared";
import { DollarSign, FileText, Users, AlertCircle, Sparkles } from "lucide-react";

interface SampleInvoiceRow {
  id: string;
  invoiceNo: string;
  date: string;
  company: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue" | "Cancelled";
}

const sampleData: SampleInvoiceRow[] = [
  { id: "1", invoiceNo: "INV-1001", date: "2026-09-05", company: "Acme Fabrication Pvt Ltd", amount: 10620, status: "Paid" },
  { id: "2", invoiceNo: "INV-1002", date: "2026-09-08", company: "Bluewave Hydraulics Ltd", amount: 18450, status: "Pending" },
  { id: "3", invoiceNo: "INV-1003", date: "2026-08-20", company: "Sunrise Rubber Components", amount: 42100, status: "Overdue" },
  { id: "4", invoiceNo: "INV-1004", date: "2026-09-01", company: "Apex Precision Tools", amount: 8900, status: "Cancelled" },
  { id: "5", invoiceNo: "INV-1005", date: "2026-09-12", company: "Acme Fabrication Pvt Ltd", amount: 15200, status: "Pending" },
];

function DemoContent() {
  const { success, error, info } = useToast();

  // State controls for demo
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [tableState, setTableState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const companyOptions = [
    { value: "c1", label: "Acme Fabrication Pvt Ltd", sublabel: "Peenya, Bangalore" },
    { value: "c2", label: "Bluewave Hydraulics Ltd", sublabel: "Andheri MIDC, Mumbai" },
    { value: "c3", label: "Sunrise Rubber Components", sublabel: "Guindy, Chennai" },
  ];

  // Filtered table data
  const filteredData = sampleData.filter((item) => {
    const matchSearch =
      item.invoiceNo.toLowerCase().includes(searchVal.toLowerCase()) ||
      item.company.toLowerCase().includes(searchVal.toLowerCase());
    const matchStatus = statusFilter === "All" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<SampleInvoiceRow>[] = [
    { key: "invoiceNo", header: "Invoice No", sortable: true, width: "120px" },
    { key: "date", header: "Date", sortable: true, width: "120px" },
    { key: "company", header: "Company", sortable: true },
    {
      key: "amount",
      header: "Amount (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => `₹${row.amount.toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      accessor: (row) => <StatusPill status={row.status} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-bg p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-soft text-amber rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-ink">
              SMI ERP — Shared Component Showcase
            </h1>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Build Order Step 3: Interactive demonstration of all PRD §5 shared components.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => success("Action completed!", "Invoice was saved successfully.")}
            className="px-3 py-1.5 bg-amber text-white font-semibold rounded-lg text-xs hover:bg-amber/90 transition-colors shadow-xs"
          >
            Trigger Toast
          </button>
          <button
            onClick={() => setSidePanelOpen(true)}
            className="px-3 py-1.5 bg-ink text-white font-semibold rounded-lg text-xs hover:bg-ink/90 transition-colors shadow-xs"
          >
            Open SidePanel
          </button>
        </div>
      </div>

      {/* 1. StatCards Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft">
          1. KPI Stat Cards (`StatCard`)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="This Month's Sales"
            value="₹1,45,200"
            subtitle="vs. ₹1,20,000 last month"
            trend={{ value: "+21%", direction: "up" }}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard
            title="Total Outstanding"
            value="₹42,100"
            subtitle="Overdue invoices"
            badge={{ text: "3 Overdue", variant: "danger" }}
            icon={<AlertCircle className="w-4 h-4 text-danger" />}
          />
          <StatCard
            title="GST Payable (Sep)"
            value="₹13,068"
            subtitle="CGST + SGST (18%)"
            trend={{ value: "+8%", direction: "up" }}
            icon={<FileText className="w-4 h-4" />}
          />
          <StatCard
            title="Labour Cost"
            value="₹54,000"
            subtitle="3 Active Employees"
            trend={{ value: "0%", direction: "neutral" }}
            icon={<Users className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* 2. StatusPills Showcase */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft">
          2. Status Pills (`StatusPill`)
        </h2>
        <div className="p-4 bg-panel-bg border border-line rounded-xl flex flex-wrap gap-4 items-center">
          <StatusPill status="Paid" />
          <StatusPill status="Complete" />
          <StatusPill status="Active" />
          <StatusPill status="Pending" />
          <StatusPill status="Partially Paid" />
          <StatusPill status="Overdue" />
          <StatusPill status="Cancelled" />
          <StatusPill status="Absent" />
          <StatusPill status="Present" />
        </div>
      </section>

      {/* 3. Autocomplete Showcase */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft">
          3. Autocomplete (`Autocomplete` with "+ Add new" support)
        </h2>
        <div className="p-5 bg-panel-bg border border-line rounded-xl max-w-md space-y-2">
          <label className="text-xs font-semibold text-ink">Select Company:</label>
          <Autocomplete
            options={companyOptions}
            value={selectedCompany}
            onChange={(val) => setSelectedCompany(val)}
            placeholder="Type company name (e.g. Acme)..."
            addNewLabel="Add Company"
            onAddNew={(query) => {
              info("Inline Add Triggered", `You clicked "+ Add Company" for query: "${query}"`);
            }}
          />
          {selectedCompany && (
            <p className="text-xs text-ink-soft mt-2">
              Selected ID: <code className="font-mono text-ink">{selectedCompany}</code>
            </p>
          )}
        </div>
      </section>

      {/* 4. DataTable & FilterBar Showcase */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft">
            4. Data Table (`DataTable`) & Filter Bar (`FilterBar`)
          </h2>
          {/* State Switcher for Demo */}
          <div className="flex items-center gap-1 bg-slate-bg border border-line p-1 rounded-lg text-xs">
            <button
              onClick={() => setTableState("normal")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                tableState === "normal" ? "bg-panel-bg text-ink shadow-xs" : "text-ink-soft"
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setTableState("loading")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                tableState === "loading" ? "bg-panel-bg text-ink shadow-xs" : "text-ink-soft"
              }`}
            >
              Loading
            </button>
            <button
              onClick={() => setTableState("empty")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                tableState === "empty" ? "bg-panel-bg text-ink shadow-xs" : "text-ink-soft"
              }`}
            >
              Empty
            </button>
            <button
              onClick={() => setTableState("error")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                tableState === "error" ? "bg-panel-bg text-ink shadow-xs" : "text-ink-soft"
              }`}
            >
              Error
            </button>
          </div>
        </div>

        <FilterBar
          search={{
            value: searchVal,
            onChange: setSearchVal,
            placeholder: "Search by invoice no or company...",
          }}
          selects={[
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "All", label: "All Statuses" },
                { value: "Paid", label: "Paid" },
                { value: "Pending", label: "Pending" },
                { value: "Overdue", label: "Overdue" },
                { value: "Cancelled", label: "Cancelled" },
              ],
            },
          ]}
          hasActiveFilters={Boolean(searchVal || statusFilter !== "All")}
          onClearFilters={() => {
            setSearchVal("");
            setStatusFilter("All");
          }}
        />

        <DataTable
          columns={columns}
          data={tableState === "empty" ? [] : filteredData}
          keyExtractor={(row) => row.id}
          loading={tableState === "loading"}
          error={tableState === "error" ? "Database connection timeout" : null}
          onRetry={() => setTableState("normal")}
          onRowClick={(row) => info("Row Clicked", `Clicked invoice ${row.invoiceNo}`)}
          pageSize={3}
        />
      </section>

      {/* 5. Standalone States Showcase */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft">
          5. Standalone States (`EmptyState`, `LoadingSkeleton`, `ErrorState`)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmptyState
            title="No Pending Approvals"
            description="All job-work entries for this period have been settled."
          />
          <LoadingSkeleton variant="form" />
          <ErrorState
            title="Sync Failed"
            message="Could not load recent activity. Please check your network."
            onRetry={() => success("Retried!", "Re-synced successfully.")}
          />
        </div>
      </section>

      {/* 6. SidePanel Component */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        title="SidePanel Drawer Demo"
        subtitle="Used for product selection and inline entry forms."
        footer={
          <>
            <button
              onClick={() => setSidePanelOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-line bg-panel-bg text-ink hover:bg-slate-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                success("Submitted!", "Side panel form submitted.");
                setSidePanelOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber text-white hover:bg-amber/90 transition-colors shadow-xs"
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-ink">
          <p className="text-ink-soft">
            This slide-in panel comes from the right with backdrop blur and escape/click-outside dismiss.
          </p>
          <div className="space-y-2">
            <label className="font-semibold text-ink">Sample Form Field:</label>
            <input
              type="text"
              placeholder="Enter details..."
              className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
            />
          </div>
          <div className="p-3 bg-amber-soft/50 border border-amber/30 rounded-lg text-ink">
            💡 <strong>UX Rule:</strong> One primary amber action per screen/panel.
          </div>
        </div>
      </SidePanel>
    </div>
  );
}

export default function DemoPage() {
  return (
    <ToastProvider>
      <DemoContent />
    </ToastProvider>
  );
}
