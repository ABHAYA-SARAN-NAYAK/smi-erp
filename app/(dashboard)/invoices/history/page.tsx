"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { dataLayer } from "@/lib/data-layer";
import { Invoice, Company, Product, Settings } from "@/lib/data-layer/types";
import {
  DataTable,
  FilterBar,
  StatusPill,
  LoadingSkeleton,
  ErrorState,
  SidePanel,
  ConfirmDialog,
  useToast,
  Column,
} from "@/components/shared";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { downloadInvoicePdf } from "@/lib/pdf/exportPdf";
import {
  FileText,
  FilePlus,
  Eye,
  Edit,
  Download,
  Ban,
  Filter,
} from "lucide-react";

export default function InvoiceHistoryPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [companyProductsMap, setCompanyProductsMap] = useState<Record<string, Product[]>>({});

  // Filter states
  const [searchVal, setSearchVal] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal / SidePanel states
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [cancelTargetInvoice, setCancelTargetInvoice] = useState<Invoice | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invList, compList, sett] = await Promise.all([
        dataLayer.getInvoices(),
        dataLayer.getCompanies(),
        dataLayer.getSettings(),
      ]);

      setInvoices(invList);
      setCompanies(compList);
      setSettings(sett);

      const map: Record<string, Product[]> = {};
      for (const comp of compList) {
        map[comp.id] = await dataLayer.getCompanyProducts(comp.id);
      }
      setCompanyProductsMap(map);
    } catch (err: any) {
      console.error("Failed to load invoice history data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [companies]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const compName = companyMap.get(inv.companyId) || "";
      const matchSearch =
        !searchVal ||
        inv.invoiceNo.toLowerCase().includes(searchVal.toLowerCase()) ||
        compName.toLowerCase().includes(searchVal.toLowerCase()) ||
        inv.items.some((i) => i.particulars.toLowerCase().includes(searchVal.toLowerCase()));

      const matchCompany = !companyFilter || inv.companyId === companyFilter;
      const matchStatus = statusFilter === "All" || inv.status === statusFilter;
      const matchStart = !startDate || inv.date >= startDate;
      const matchEnd = !endDate || inv.date <= endDate;

      return matchSearch && matchCompany && matchStatus && matchStart && matchEnd;
    });
  }, [invoices, searchVal, companyFilter, statusFilter, startDate, endDate, companyMap]);

  // ── Actions ──
  const handleEditSave = async (updatedInvoice: Invoice) => {
    try {
      const saved = await dataLayer.updateInvoice(updatedInvoice.id, updatedInvoice);
      setInvoices((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      setEditInvoice(null);
      success("Invoice Updated!", `Invoice #${saved.invoiceNo} and linked Balance/GST rows updated in place.`);
    } catch (err: any) {
      toastError("Failed to Update", err.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetInvoice) return;
    setCancelling(true);
    try {
      await dataLayer.cancelInvoice(cancelTargetInvoice.id);
      setInvoices((prev) =>
        prev.map((i) => (i.id === cancelTargetInvoice.id ? { ...i, status: "Cancelled" } : i))
      );
      success("Invoice Cancelled", `Invoice #${cancelTargetInvoice.invoiceNo} has been soft-cancelled.`);
      setCancelTargetInvoice(null);
    } catch (err: any) {
      toastError("Cancellation Failed", err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      const comp = companies.find((c) => c.id === inv.companyId);
      setViewInvoice(inv);
      // Wait for DOM to render view modal
      setTimeout(async () => {
        await downloadInvoicePdf("invoice-paper-preview", `${inv.invoiceNo}_${comp?.name || "Client"}.pdf`);
      }, 300);
    } catch (err) {
      toastError("Download Error", "Could not generate PDF download.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="table" rows={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading Invoice History" message={error} onRetry={loadData} />;
  }

  const columns: Column<Invoice>[] = [
    { key: "invoiceNo", header: "Invoice No", sortable: true, width: "120px" },
    { key: "date", header: "Date", sortable: true, width: "110px" },
    {
      key: "companyId",
      header: "Company Name",
      sortable: true,
      accessor: (row) => companyMap.get(row.companyId) || row.companyId,
    },
    {
      key: "type",
      header: "Tax Type",
      width: "110px",
      accessor: (row) => (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-bg border border-line text-ink-soft">
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
      accessor: (row) => (
        <span className="font-semibold tabular-nums">
          ₹{row.grandTotal.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "110px",
      accessor: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "160px",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewInvoice(row)}
            title="View Invoice"
            className="p-1.5 rounded-md hover:bg-slate-bg text-ink-soft hover:text-ink transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {row.status === "Active" && (
            <button
              onClick={() => setEditInvoice(row)}
              title="Edit Invoice"
              className="p-1.5 rounded-md hover:bg-slate-bg text-ink-soft hover:text-amber transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleDownloadPdf(row)}
            title="Download PDF"
            className="p-1.5 rounded-md hover:bg-slate-bg text-ink-soft hover:text-ink transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {row.status === "Active" && (
            <button
              onClick={() => setCancelTargetInvoice(row)}
              title="Cancel Invoice"
              className="p-1.5 rounded-md hover:bg-red-50 text-ink-soft hover:text-danger transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber" />
            Invoice History
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Search, view, edit, download PDF, or soft-cancel generated invoices.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber text-white font-semibold rounded-lg text-xs hover:bg-amber/90 transition-all shadow-sm shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          + New Invoice
        </Link>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={{
          value: searchVal,
          onChange: setSearchVal,
          placeholder: "Search invoice #, company, or item...",
        }}
        selects={[
          {
            id: "company",
            label: "Company",
            value: companyFilter,
            onChange: setCompanyFilter,
            options: [
              { value: "", label: "All Companies" },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Cancelled", label: "Cancelled" },
            ],
          },
        ]}
        dateRange={{
          startDate,
          endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        hasActiveFilters={Boolean(
          searchVal || companyFilter || statusFilter !== "All" || startDate || endDate
        )}
        onClearFilters={() => {
          setSearchVal("");
          setCompanyFilter("");
          setStatusFilter("All");
          setStartDate("");
          setEndDate("");
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(row) => row.id}
        emptyTitle="No Invoices Found"
        emptyDescription="No invoices match your filter criteria."
        pageSize={10}
      />

      {/* ── View Invoice Modal / SidePanel ── */}
      <SidePanel
        isOpen={Boolean(viewInvoice)}
        onClose={() => setViewInvoice(null)}
        title={`Invoice ${viewInvoice?.invoiceNo}`}
        subtitle={`Paper preview for ${companyMap.get(viewInvoice?.companyId || "")}`}
        width="lg"
        footer={
          <button
            onClick={() => viewInvoice && handleDownloadPdf(viewInvoice)}
            className="px-4 py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        }
      >
        {viewInvoice && (
          <InvoicePreview
            invoiceNo={viewInvoice.invoiceNo}
            date={viewInvoice.date}
            type={viewInvoice.type}
            poNo={viewInvoice.poNo}
            company={companies.find((c) => c.id === viewInvoice.companyId)}
            items={viewInvoice.items}
            cgstPercent={viewInvoice.cgstPercent}
            sgstPercent={viewInvoice.sgstPercent}
            settings={settings}
          />
        )}
      </SidePanel>

      {/* ── Edit Invoice SidePanel ── */}
      <SidePanel
        isOpen={Boolean(editInvoice)}
        onClose={() => setEditInvoice(null)}
        title={`Edit Invoice #${editInvoice?.invoiceNo}`}
        subtitle="Re-saving will update linked Balance Confirmation and GST Summary rows in place."
        width="xl"
      >
        {editInvoice && (
          <InvoiceForm
            companies={companies}
            settings={settings}
            existingInvoices={invoices}
            companyProductsMap={companyProductsMap}
            initialInvoice={editInvoice}
            onSaveInvoice={handleEditSave}
            onAddNewCompany={async (c) => {
              const res = await dataLayer.addCompany(c);
              setCompanies((prev) => [...prev, res]);
              return res;
            }}
            onAddNewProduct={async (p) => {
              const res = await dataLayer.addProduct(p);
              return res;
            }}
          />
        )}
      </SidePanel>

      {/* ── Soft Cancel Confirmation Dialog (PRD §5 & PRD §9.5) ── */}
      <ConfirmDialog
        isOpen={Boolean(cancelTargetInvoice)}
        onClose={() => setCancelTargetInvoice(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Invoice"
        message={`Are you sure you want to soft-cancel Invoice #${cancelTargetInvoice?.invoiceNo}? This will mark it as Cancelled, remove it from GST Summary, and set its balance to ₹0.`}
        confirmLabel="Yes, Cancel Invoice"
        variant="danger"
        loading={cancelling}
      />
    </div>
  );
}
