import { z } from "zod";

export const invoiceItemSchema = z.object({
  partNo: z.string().min(1, "Part number is required"),
  particulars: z.string().min(1, "Particulars/Description is required"),
  hsn: z.string().min(1, "HSN code is required"),
  qty: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be non-negative"),
  amount: z.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNo: z.string().min(1, "Invoice number is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  type: z.enum(["With Tax", "Without Tax"]),
  companyId: z.string().min(1, "Please select a company"),
  poNo: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  cgstPercent: z.number().min(0).max(100),
  sgstPercent: z.number().min(0).max(100),
  cgstAmount: z.number().min(0),
  sgstAmount: z.number().min(0),
  grandTotal: z.number().positive("Grand total must be positive"),
  status: z.enum(["Active", "Cancelled"]).default("Active"),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
