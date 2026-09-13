import {
  Company,
  Product,
  Invoice,
  InvoiceFilters,
  BalanceRow,
  BalanceFilters,
  GstRow,
  JobWorkRow,
  JobWorkFilters,
  Employee,
  AttendanceEntry,
  PayrollRow,
  Settings,
} from "./types";

export interface DataLayer {
  // Companies
  getCompanies(): Promise<Company[]>;
  getCompanyProducts(companyId: string): Promise<Product[]>;
  addCompany(company: Company): Promise<Company>;
  addProduct(product: Product): Promise<Product>;

  // Invoices
  getInvoices(filters?: InvoiceFilters): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice>;
  saveInvoice(invoice: Invoice): Promise<Invoice>; // handles create + cascade
  updateInvoice(id: string, invoice: Invoice): Promise<Invoice>; // handles edit + cascade
  cancelInvoice(id: string): Promise<void>;

  // Balance Confirmation
  getBalanceConfirmation(filters?: BalanceFilters): Promise<BalanceRow[]>;
  recordPayment(billNo: string, amount: number, date: string): Promise<BalanceRow>;

  // GST
  getGstSummary(month: string): Promise<GstRow[]>;
  getAvailableGstMonths(): Promise<string[]>;

  // Job Work
  getJobWork(filters?: JobWorkFilters): Promise<JobWorkRow[]>;
  addJobWorkEntry(entry: JobWorkRow): Promise<JobWorkRow>;
  recordJobWorkPayment(id: string, amount: number, date: string): Promise<JobWorkRow>;

  // Attendance & Payroll
  getEmployees(): Promise<Employee[]>;
  markAttendance(employeeId: string, date: string, entry: AttendanceEntry): Promise<void>;
  getMonthlyPayroll(month: string): Promise<PayrollRow[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
}
