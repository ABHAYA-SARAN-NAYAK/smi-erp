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
  getEmployees(options?: { includeInactive?: boolean }): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee>;
  addEmployee(employee: Employee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee>;
  changeEmployeeRate(id: string, salaryType: Employee["salaryType"], rate: number, effectiveFrom: string): Promise<Employee>;
  deactivateEmployee(id: string, lastWorkingDate: string): Promise<Employee>;
  reactivateEmployee(id: string, joiningDate: string): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  getHolidays(): Promise<import("./types").Holiday[]>;
  addHoliday(holiday: import("./types").Holiday): Promise<import("./types").Holiday>;
  removeHoliday(id: string): Promise<void>;
  getPayrollMonthStatus(month: string): Promise<import("./types").PayrollMonthState>;
  setPayrollMonthStatus(month: string, status: import("./types").PayrollMonthStatus): Promise<import("./types").PayrollMonthState>;
  markSalaryPaid(payment: import("./types").SalaryPayment): Promise<import("./types").SalaryPayment>;
  getEmployeeAuditLog(employeeId: string): Promise<import("./types").EmployeeAuditEvent[]>;
  getAttendance(): Promise<AttendanceEntry[]>;
  markAttendance(employeeId: string, date: string, entry: AttendanceEntry): Promise<void>;
  getMonthlyPayroll(month: string): Promise<PayrollRow[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
}
