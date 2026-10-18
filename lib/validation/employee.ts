import { z } from "zod";

const cleanText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const employeeInputSchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(2).max(60)),
  designation: z.string().transform(cleanText).pipe(z.string().min(1).max(60)),
  salaryType: z.enum(["Monthly", "Daily", "Hourly"]),
  rate: z.number().positive().max(10_000_000).refine((value) => Number.isInteger(value * 100), "Rate supports up to 2 decimals"),
  shiftHours: z.number().positive().max(24).default(8),
  weeklyOff: z.enum(["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).default("Sunday"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  notes: z.string().transform(cleanText).pipe(z.string().max(200)).optional(),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
