"use client";

import React, { useState, useEffect } from "react";
import {
  Company,
  Product,
  Settings,
  Invoice,
  InvoiceItem,
} from "@/lib/data-layer/types";
import { Autocomplete, AutocompleteOption } from "@/components/shared/Autocomplete";
import { ProductPickerPanel } from "./ProductPickerPanel";
import { invoiceSchema } from "@/lib/validation/invoice";
import { downloadInvoicePdf } from "@/lib/pdf/exportPdf";
import {
  Plus,
  Trash2,
  Download,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";

interface InvoiceFormProps {
  companies: Company[];
  settings: Settings | null;
  existingInvoices: Invoice[];
  companyProductsMap: Record<string, Product[]>;
  initialInvoice?: Invoice | null;
  onSaveInvoice: (invoice: Invoice) => Promise<void>;
  onAddNewCompany: (company: Company) => Promise<Company>;
  onAddNewProduct: (product: Product) => Promise<Product>;
  onFormChange?: (state: {
    invoiceNo: string;
    date: string;
    type: "With Tax" | "Without Tax";
    poNo?: string;
    company: Company | null;
    items: InvoiceItem[];
    cgstPercent: number;
    sgstPercent: number;
  }) => void;
}

export function InvoiceForm({
  companies,
  settings,
  existingInvoices,
  companyProductsMap,
  initialInvoice,
  onSaveInvoice,
  onAddNewCompany,
  onAddNewProduct,
  onFormChange,
}: InvoiceFormProps) {
  // Form State
  const [invoiceType, setInvoiceType] = useState<"With Tax" | "Without Tax">("With Tax");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [poNo, setPoNo] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [cgstPercent, setCgstPercent] = useState<number>(settings?.defaultCgstPercent || 9);
  const [sgstPercent, setSgstPercent] = useState<number>(settings?.defaultSgstPercent || 9);

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;
  const currentCompanyProducts = selectedCompanyId
    ? companyProductsMap[selectedCompanyId] || []
    : [];

  // Auto-generate or prefill invoice fields
  useEffect(() => {
    if (initialInvoice) {
      setInvoiceType(initialInvoice.type);
      setInvoiceNo(initialInvoice.invoiceNo);
      setDate(initialInvoice.date);
      setPoNo(initialInvoice.poNo || "");
      setSelectedCompanyId(initialInvoice.companyId);
      setItems(initialInvoice.items);
      setCgstPercent(initialInvoice.cgstPercent);
      setSgstPercent(initialInvoice.sgstPercent);
    } else if (settings && !invoiceNo) {
      const prefix = settings.invoicePrefix || "INV-";
      const nextNo = (settings.lastInvoiceNo || 1000) + 1;
      setInvoiceNo(`${prefix}${nextNo}`);
    }
  }, [settings, initialInvoice]);

  // Sync Live Preview with Parent
  useEffect(() => {
    if (onFormChange) {
      onFormChange({
        invoiceNo,
        date,
        type: invoiceType,
        poNo,
        company: selectedCompany,
        items,
        cgstPercent: invoiceType === "With Tax" ? cgstPercent : 0,
        sgstPercent: invoiceType === "With Tax" ? sgstPercent : 0,
      });
    }
  }, [invoiceNo, date, invoiceType, poNo, selectedCompany, items, cgstPercent, sgstPercent, onFormChange]);

  const isWithTax = invoiceType === "With Tax";

  const companyOptions: AutocompleteOption[] = companies.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `GST: ${c.gstNo} • ${c.state}`,
  }));

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const cgstAmount = isWithTax ? Math.round((subtotal * cgstPercent) / 100) : 0;
  const sgstAmount = isWithTax ? Math.round((subtotal * sgstPercent) / 100) : 0;
  const grandTotal = Math.round(subtotal + cgstAmount + sgstAmount);

  // Handlers for Items Table
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        partNo: `PART-${prev.length + 101}`,
        particulars: "Machined Component",
        hsn: "8483",
        qty: 1,
        rate: 500,
        amount: 500,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === "qty") {
        target.qty = Math.max(1, parseInt(val, 10) || 1);
        target.amount = target.qty * target.rate;
      } else if (field === "rate") {
        target.rate = Math.max(0, parseFloat(val) || 0);
        target.amount = target.qty * target.rate;
      } else {
        (target as any)[field] = val;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAddProductsFromPicker = (selectedProducts: Product[]) => {
    const newItems: InvoiceItem[] = selectedProducts.map((p) => ({
      partNo: p.partNo,
      particulars: p.partName,
      hsn: p.hsn,
      qty: 1,
      rate: p.rate,
      amount: p.rate,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setPickerOpen(false);
  };

  // Submit Invoice Form (PRD §6.3)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const draftInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : `inv_${Date.now()}`,
      invoiceNo: invoiceNo.trim(),
      date,
      type: invoiceType,
      companyId: selectedCompanyId,
      poNo: poNo.trim() || undefined,
      items,
      cgstPercent: isWithTax ? cgstPercent : 0,
      sgstPercent: isWithTax ? sgstPercent : 0,
      cgstAmount,
      sgstAmount,
      grandTotal,
      status: initialInvoice ? initialInvoice.status : "Active",
    };

    // Zod validation (PRD §9.2)
    const result = invoiceSchema.safeParse(draftInvoice);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation error";
      setErrorMsg(firstError);
      return;
    }

    setSaving(true);
    try {
      await onSaveInvoice(draftInvoice);
    } catch (err: any) {
      console.error("Save invoice error:", err);
      setErrorMsg(err.message || "Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf("invoice-paper-preview", `${invoiceNo || "Invoice"}.pdf`);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      setErrorMsg("Failed to generate PDF download.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="glow-panel rounded-2xl p-6 shadow-xl space-y-6 text-xs text-[#E9ECEF]">
      {/* ── Tax Mode Segmented Toggle ── */}
      <div className="flex items-center justify-between border-b border-[#2a2d38] pb-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#E9ECEF]">Create Invoice</h2>
          <p className="text-[#8b8fa3] text-[11px] font-mono-spec">INDUSTRIAL SPEC // Line Item Configuration</p>
        </div>

        {/* With Tax / Without Tax Toggle */}
        <div className="bg-[#1e2028] border border-[#2a2d38] p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInvoiceType("With Tax")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              invoiceType === "With Tax"
                ? "bg-[#FB5607] text-white shadow-md shadow-[#FB5607]/30"
                : "text-[#8b8fa3] hover:text-[#E9ECEF]"
            }`}
          >
            With Tax (CGST+SGST)
          </button>
          <button
            type="button"
            onClick={() => setInvoiceType("Without Tax")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              invoiceType === "Without Tax"
                ? "bg-[#FB5607] text-white shadow-md shadow-[#FB5607]/30"
                : "text-[#8b8fa3] hover:text-[#E9ECEF]"
            }`}
          >
            Without Tax
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Invoice Header Metadata ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-[#E9ECEF] block mb-1">Invoice Number *</label>
            <input
              type="text"
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#FB5607] font-mono-spec font-semibold focus:outline-none focus:border-[#FB5607]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#E9ECEF] block mb-1">Invoice Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-medium focus:outline-none focus:border-[#FB5607]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#E9ECEF] block mb-1">P.O. Number (Optional)</label>
            <input
              type="text"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              placeholder="e.g. PO-9921"
              className="w-full px-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-mono-spec focus:outline-none focus:border-[#FB5607]"
            />
          </div>
        </div>

        {/* ── Company Selection Autocomplete ── */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#E9ECEF] block">Select Company / Client *</label>
          <Autocomplete
            options={companyOptions}
            value={selectedCompanyId}
            onChange={(val) => {
              setSelectedCompanyId(val);
              if (val) setPickerOpen(true);
            }}
            placeholder="Type to search company name..."
            addNewLabel="Register New Company"
            onAddNew={async (query) => {
              const created = await onAddNewCompany({
                id: `c_${Date.now()}`,
                name: query || "New Client Pvt Ltd",
                gstNo: "33AAAAB0000A1Z0",
                address: "Peenya Industrial Estate, Bangalore",
                state: "Karnataka",
                creditDays: 30,
              });
              if (created) setSelectedCompanyId(created.id);
            }}
          />
        </div>

        {/* ── Line Items Table ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#E9ECEF] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#FB5607]" />
              Line Items ({items.length})
            </h3>
            <div className="flex items-center gap-2">
              {selectedCompanyId && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-3 py-1.5 bg-[#8338EC]/20 text-[#a855f7] border border-[#8338EC]/40 hover:bg-[#8338EC] hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  + Pick Products
                </button>
              )}
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1.5 bg-[#21232c] text-[#E9ECEF] border border-[#2a2d38] hover:bg-[#282b36] font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#FB5607]" />
                + Custom Row
              </button>
            </div>
          </div>

          <div className="border border-[#2a2d38] rounded-xl overflow-hidden bg-[#16181f]">
            <table className="w-full text-left text-xs text-[#E9ECEF]">
              <thead className="bg-[#121317] border-b border-[#2a2d38] text-[#8b8fa3] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-28">Part No</th>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3 w-24">HSN</th>
                  <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d38]/80">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#21232c] transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.partNo}
                          onChange={(e) => handleItemChange(idx, "partNo", e.target.value)}
                          className="w-full px-2 py-1 bg-[#1e2028] border border-[#2a2d38] rounded-lg font-mono-spec text-[11px] text-[#FB5607] focus:outline-none focus:border-[#FB5607]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.particulars}
                          onChange={(e) => handleItemChange(idx, "particulars", e.target.value)}
                          className="w-full px-2 py-1 bg-[#1e2028] border border-[#2a2d38] rounded-lg text-[#E9ECEF] focus:outline-none focus:border-[#FB5607]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(idx, "hsn", e.target.value)}
                          className="w-full px-2 py-1 bg-[#1e2028] border border-[#2a2d38] rounded-lg text-center font-mono-spec text-[11px] text-[#8b8fa3] focus:outline-none focus:border-[#FB5607]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                          className="w-full px-2 py-1 bg-[#1e2028] border border-[#2a2d38] rounded-lg text-right tabular-nums text-[#E9ECEF] focus:outline-none focus:border-[#FB5607]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                          className="w-full px-2 py-1 bg-[#1e2028] border border-[#2a2d38] rounded-lg text-right tabular-nums text-[#E9ECEF] focus:outline-none focus:border-[#FB5607]"
                        />
                      </td>
                      <td className="p-2 text-right font-semibold tabular-nums text-[#E9ECEF]">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#8b8fa3] hover:text-[#ef4444] p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#8b8fa3] italic font-mono-spec">
                      No items added yet. Click "+ Pick Products" or "+ Custom Row".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Tax Configuration (With Tax Mode Only) ── */}
        {isWithTax && (
          <div className="p-4 bg-[#16181f] border border-[#2a2d38] rounded-xl grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-[#E9ECEF] block mb-1">CGST Rate (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="any"
                value={cgstPercent}
                onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-semibold focus:outline-none focus:border-[#FB5607]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#E9ECEF] block mb-1">SGST Rate (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="any"
                value={sgstPercent}
                onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-semibold focus:outline-none focus:border-[#FB5607]"
              />
            </div>
          </div>
        )}

        {/* ── Action Buttons Footer ── */}
        <div className="pt-4 border-t border-[#2a2d38] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2.5 border border-[#2a2d38] bg-[#21232c] text-[#E9ECEF] font-semibold rounded-xl hover:bg-[#282b36] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#8b8fa3]" />}
            Download PDF
          </button>

          {/* Primary Orange Save Action Button */}
          <button
            type="submit"
            disabled={saving || items.length === 0 || !selectedCompanyId}
            className="btn-accent-primary px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Invoice...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save &amp; Post Invoice
              </>
            )}
          </button>
        </div>
      </form>

      {/* Product Picker Side Panel */}
      <ProductPickerPanel
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={currentCompanyProducts}
        companyName={selectedCompany?.name || ""}
        onAddSelectedProducts={handleAddProductsFromPicker}
        onAddNewProduct={async (newProd) => {
          const created = await onAddNewProduct({
            ...newProd,
            companyId: selectedCompanyId,
          });
          return created;
        }}
      />
    </div>
  );
}
