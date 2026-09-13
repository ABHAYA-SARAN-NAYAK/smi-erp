export interface Company {
  id: string;
  name: string;
  gstNo: string;
  address: string;
  state: string;
  creditDays: number;
}

export interface Product {
  id?: string;
  companyId: string;
  partNo: string;
  partName: string;
  hsn: string;
  rate: number;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  salaryType: "Monthly" | "Daily" | "Hourly";
  rate: number;
}

export interface InvoiceItem {
  partNo: string;
  particulars: string;
  hsn: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  type: "With Tax" | "Without Tax";
  companyId: string;
  poNo?: string;
  items: InvoiceItem[];
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  status: "Active" | "Cancelled";
}

export interface InvoiceFilters {
  search?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "Active" | "Cancelled" | "All";
}

export interface BalanceRow {
  billNo: string;
  date: string;
  company: string;
  poNo: string;
  description: string;
  unitPrice: number;
  billAmount: number;
  amountDueDate: string;
  debitNoteIfAny: number;
  actualReceivableAmount: number;
  amountReceivedDate: string | null;
  amountReceived: number;
  balanceAmount: number;
  status?: "Paid" | "Partially Paid" | "Overdue" | "Pending" | "Cancelled";
}

export interface BalanceFilters {
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "Paid" | "Partially Paid" | "Overdue" | "All";
}

export interface GstRow {
  sNo: number;
  billNo: string;
  billDate: string;
  suppliedTo: string;
  gstNo: string;
  amount: number; // Taxable Amount
  sgst: number;
  cgst: number;
  totalAmount: number; // Grand Total
  month: string; // e.g. "Sep-2026"
}

export interface JobWorkRow {
  id: string;
  partyName: string;
  date: string;
  partNo: string;
  qty: number;
  rate: number;
  totalAmount: number;
  amountDueDate: string;
  paidAmount: number;
  paidDate: string | null;
  balanceAmount: number;
}

export interface JobWorkFilters {
  partyName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceEntry {
  employeeId?: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent";
  otHours: number;
  holidayOtHours: number;
  advance?: number;
}

export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  designation: string;
  month: string; // e.g. "Sep-2026"
  totalDaysPresent: number;
  totalHours: number;
  otHours: number;
  holidayOtHours: number;
  baseSalary: number;
  otPay: number;
  holidayOtPay: number;
  totalSalary: number;
  totalAdvances: number;
  netPayable: number;
}

export interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyGST: string;
  companyState: string;
  logoUrl?: string;
  invoicePrefix: string;
  lastInvoiceNo: number;
  defaultCgstPercent: number;
  defaultSgstPercent: number;
  holidayOtMultiplier: number;
}
