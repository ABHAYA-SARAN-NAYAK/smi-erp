import type { Metadata } from "next";
import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";

/**
 * PRD §5 Typography:
 * - Inter: all UI text, labels, tables, navigation, forms.
 * - Fraunces: invoice/document headings, the company name wherever
 *   it appears as a "printed" element (serif, display weight).
 *
 * Both are loaded via next/font/google for automatic self-hosting
 * and font-display: swap. Their CSS variable names (--font-inter,
 * --font-fraunces) are referenced in globals.css @theme inline.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMI ERP",
  description:
    "Lightweight production-quality business management system — invoicing, accounts receivable, GST reporting, job-work payables, and staff attendance/payroll.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, fraunces.variable)}>
      <body>{children}</body>
    </html>
  );
}
