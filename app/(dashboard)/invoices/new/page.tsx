"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dataLayer } from "@/lib/data-layer";
import { Company, Product, Settings, Invoice, InvoiceItem } from "@/lib/data-layer/types";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { LoadingSkeleton, ErrorState, useToast } from "@/components/shared";
import { ArrowLeft, FilePlus, Eye } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
  const router = useRouter();
  const { success } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyProductsMap, setCompanyProductsMap] = useState<Record<string, Product[]>>({});

  // Shared preview state
  const [previewState, setPreviewState] = useState<{
    invoiceNo: string;
    date: string;
    type: "With Tax" | "Without Tax";
    poNo?: string;
    company: Company | null;
    items: InvoiceItem[];
    cgstPercent: number;
    sgstPercent: number;
  }>({
    invoiceNo: "INV-1001",
    date: new Date().toISOString().split("T")[0],
    type: "With Tax",
    items: [],
    cgstPercent: 9,
    sgstPercent: 9,
    company: null,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compList, sett, invList] = await Promise.all([
        dataLayer.getCompanies(),
        dataLayer.getSettings(),
        dataLayer.getInvoices(),
      ]);

      setCompanies(compList);
      setSettings(sett);
      setInvoices(invList);

      const map: Record<string, Product[]> = {};
      for (const comp of compList) {
        map[comp.id] = await dataLayer.getCompanyProducts(comp.id);
      }
      setCompanyProductsMap(map);
    } catch (err: any) {
      console.error("Failed to load invoice initial data:", err);
      setError(err.message || "Failed to load settings or master data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveInvoice = async (invoice: Invoice) => {
    const saved = await dataLayer.saveInvoice(invoice);

    if (settings) {
      const numMatch = saved.invoiceNo.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        if (num > (settings.lastInvoiceNo || 0)) {
          await dataLayer.updateSettings({ lastInvoiceNo: num });
        }
      }
    }

    success("Invoice Saved Successfully!", `Invoice #${saved.invoiceNo} has been created and posted to Balance Confirmation & GST Summary.`);
    router.push("/invoices/history");
  };

  const handleAddNewCompany = async (company: Company): Promise<Company> => {
    const created = await dataLayer.addCompany(company);
    setCompanies((prev) => [...prev, created]);
    setCompanyProductsMap((prev) => ({ ...prev, [created.id]: [] }));
    return created;
  };

  const handleAddNewProduct = async (product: Product): Promise<Product> => {
    const created = await dataLayer.addProduct(product);
    setCompanyProductsMap((prev) => ({
      ...prev,
      [product.companyId]: [...(prev[product.companyId] || []), created],
    }));
    return created;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="form" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading New Invoice Form" message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 text-[#E9ECEF]">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex items-center justify-between border-b border-[#2a2d38] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/history"
            className="p-2 rounded-xl border border-[#2a2d38] bg-[#1a1c23] text-[#8b8fa3] hover:text-[#E9ECEF] hover:bg-[#21232c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-display text-[#E9ECEF] flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-[#FB5607]" />
              New Invoice Entry
            </h1>
            <p className="text-xs text-[#8b8fa3] font-mono-spec">
              SYSTEM SPEC // Live Paper Document Rendering & Cascade Engine
            </p>
          </div>
        </div>
      </div>

      {/* ── Split-Screen Layout (Form Left / Preview Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Invoice Form */}
        <div className="lg:col-span-6">
          <InvoiceForm
            companies={companies}
            settings={settings}
            existingInvoices={invoices}
            companyProductsMap={companyProductsMap}
            onSaveInvoice={handleSaveInvoice}
            onAddNewCompany={handleAddNewCompany}
            onAddNewProduct={handleAddNewProduct}
            onFormChange={setPreviewState}
          />
        </div>

        {/* Right Column: Live Paper Preview (Paper preview element stays paper-toned) */}
        <div className="lg:col-span-6 sticky top-20">
          <div className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-[#8b8fa3] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#FB5607]" />
              Live Paper Preview (Print Document)
            </span>
            <span className="text-[11px] text-[#FB5607] font-semibold font-mono-spec">Live Sync Active</span>
          </div>
          <InvoicePreview
            invoiceNo={previewState.invoiceNo}
            date={previewState.date}
            type={previewState.type}
            poNo={previewState.poNo}
            company={previewState.company}
            items={previewState.items}
            cgstPercent={previewState.cgstPercent}
            sgstPercent={previewState.sgstPercent}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
