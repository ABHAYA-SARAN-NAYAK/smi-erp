import { z } from "zod";

export const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  companyAddress: z.string().min(1, "Company Address is required"),
  companyPhone: z.string().min(10, "Valid phone number is required"),
  companyGST: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format (e.g. 33AAAAA0000A1Z0)"),
  companyState: z.string().min(1, "State is required"),
  logoUrl: z.string().optional(),
});

export const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, "Invoice Prefix is required"),
  lastInvoiceNo: z.number().int().nonnegative("Last Invoice Number must be non-negative"),
  defaultCgstPercent: z.number().min(0, "CGST % must be >= 0").max(50, "CGST % must be <= 50"),
  defaultSgstPercent: z.number().min(0, "SGST % must be >= 0").max(50, "SGST % must be <= 50"),
});

export const payrollSettingsSchema = z.object({
  holidayOtMultiplier: z.number().min(1, "Multiplier must be at least 1.0").max(5.0, "Multiplier max is 5.0"),
});

export const settingsSchema = companySettingsSchema
  .merge(invoiceSettingsSchema)
  .merge(payrollSettingsSchema);

export const changeAccountSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newUsername: z.string().min(3, "Username must be at least 3 characters").optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type SettingsInput = z.infer<typeof settingsSchema>;
export type ChangeAccountInput = z.infer<typeof changeAccountSchema>;
