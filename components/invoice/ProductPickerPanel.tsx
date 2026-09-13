"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/lib/data-layer/types";
import { SidePanel } from "@/components/shared/SidePanel";
import { Plus, Check, Search, Package } from "lucide-react";

interface ProductPickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  companyName: string;
  onAddSelectedProducts: (selectedProducts: Product[]) => void;
  onAddNewProduct: (newProd: Omit<Product, "id">) => Promise<Product>;
}

export function ProductPickerPanel({
  isOpen,
  onClose,
  products,
  companyName,
  onAddSelectedProducts,
  onAddNewProduct,
}: ProductPickerPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New product form fields
  const [newPartNo, setNewPartNo] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newHsn, setNewHsn] = useState("");
  const [newRate, setNewRate] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
    setSearch("");
    setIsAddingNew(false);
  }, [isOpen]);

  const filteredProducts = products.filter(
    (p) =>
      p.partNo.toLowerCase().includes(search.toLowerCase()) ||
      p.partName.toLowerCase().includes(search.toLowerCase()) ||
      p.hsn.includes(search)
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDoneSelection = () => {
    const chosen = products.filter((p) => p.id && selectedIds.has(p.id));
    onAddSelectedProducts(chosen);
    onClose();
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNo || !newPartName || !newHsn) return;

    setSubmitting(true);
    try {
      const created = await onAddNewProduct({
        companyId: "", // caller sets companyId
        partNo: newPartNo,
        partName: newPartName,
        hsn: newHsn,
        rate: Number(newRate) || 0,
      });

      // Auto check the newly created product
      if (created && created.id) {
        setSelectedIds((prev) => new Set(prev).add(created.id!));
      }

      setIsAddingNew(false);
      setNewPartNo("");
      setNewPartName("");
      setNewHsn("");
      setNewRate(0);
    } catch (err) {
      console.error("Failed to add product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Select Company Products"
      subtitle={`Products available for ${companyName || "selected company"}`}
      width="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-line bg-panel-bg text-ink hover:bg-slate-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDoneSelection}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber text-white hover:bg-amber/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Add Selected ({selectedIds.size})
          </button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Part No, Name or HSN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
          />
        </div>

        {/* Existing Products List */}
        {!isAddingNew && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = p.id ? selectedIds.has(p.id) : false;
                return (
                  <div
                    key={p.id || p.partNo}
                    onClick={() => p.id && toggleSelect(p.id)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-soft/40 border-amber"
                        : "bg-panel-bg border-line hover:border-ink-soft/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="mt-0.5 rounded text-amber focus:ring-amber border-line cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-ink flex items-center gap-2">
                          <span>{p.partName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-bg text-ink-soft border border-line font-mono">
                            {p.partNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-soft mt-0.5">
                          HSN: {p.hsn}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-medium text-ink tabular-nums">
                      ₹{p.rate}/unit
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 border border-line rounded-xl text-center bg-slate-bg/30 text-ink-soft">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No products found for this company.</p>
              </div>
            )}
          </div>
        )}

        {/* Inline + Add New Product Form Trigger */}
        {!isAddingNew ? (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="w-full py-2.5 px-3 border border-dashed border-amber/60 text-amber font-semibold rounded-xl bg-amber-soft/20 hover:bg-amber-soft/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Register New Product Inline
          </button>
        ) : (
          <form onSubmit={handleCreateProductSubmit} className="p-4 border border-amber/40 bg-amber-soft/20 rounded-xl space-y-3">
            <h4 className="font-semibold text-ink flex items-center justify-between">
              Register New Company Product
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-ink-soft hover:text-ink text-[11px]"
              >
                Cancel
              </button>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">Part No *</label>
                <input
                  type="text"
                  required
                  value={newPartNo}
                  onChange={(e) => setNewPartNo(e.target.value)}
                  placeholder="e.g. AC-INS-003"
                  className="w-full px-2.5 py-1.5 bg-panel-bg border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-ink block mb-1">HSN Code *</label>
                <input
                  type="text"
                  required
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="e.g. 39269099"
                  className="w-full px-2.5 py-1.5 bg-panel-bg border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-ink block mb-1">Part Name / Description *</label>
              <input
                type="text"
                required
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="e.g. 10MM Brass Insert"
                className="w-full px-2.5 py-1.5 bg-panel-bg border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-ink block mb-1">Default Unit Rate (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={newRate}
                onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-panel-bg border border-line rounded-lg text-ink focus:outline-none focus:border-amber"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 transition-colors"
            >
              {submitting ? "Saving..." : "Save Product & Select"}
            </button>
          </form>
        )}
      </div>
    </SidePanel>
  );
}
