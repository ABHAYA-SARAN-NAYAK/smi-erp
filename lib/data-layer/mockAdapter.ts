import { DataLayer } from "./interface";
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

// Import initial demo data
import initialCompanies from "../../data/mock-companies.json";
import initialProducts from "../../data/mock-products.json";
import initialEmployees from "../../data/mock-employees.json";
import initialInvoices from "../../data/mock-invoices.json";
import initialBalance from "../../data/mock-balance-confirmation.json";
import initialGst from "../../data/mock-gst-summary.json";
import initialJobWork from "../../data/mock-job-work.json";
import initialAttendance from "../../data/mock-attendance.json";
import initialSettings from "../../data/mock-settings.json";

const STORAGE_KEYS = {
  COMPANIES: "smi_companies",
  PRODUCTS: "smi_products",
  EMPLOYEES: "smi_employees",
  INVOICES: "smi_invoices",
  BALANCE: "smi_balance",
  GST: "smi_gst",
  JOB_WORK: "smi_job_work",
  ATTENDANCE: "smi_attendance",
  SETTINGS: "smi_settings",
};

// Helper for date math: add days to YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// Helper for month formatting: YYYY-MM-DD -> "MMM-YYYY" (e.g. "Sep-2026")
function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Unknown";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${months[date.getMonth()]}-${date.getFullYear()}`;
}

export class MockDataAdapter implements DataLayer {
  private companies: Company[];
  private products: Product[];
  private employees: Employee[];
  private invoices: Invoice[];
  private balanceRows: BalanceRow[];
  private gstRows: GstRow[];
  private jobWorkRows: JobWorkRow[];
  private attendanceEntries: AttendanceEntry[];
  private settings: Settings;

  constructor() {
    this.companies = this.loadFromStorage(STORAGE_KEYS.COMPANIES, initialCompanies as Company[]);
    this.products = this.loadFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts as Product[]);
    this.employees = this.loadFromStorage(STORAGE_KEYS.EMPLOYEES, initialEmployees as Employee[]);
    this.invoices = this.loadFromStorage(STORAGE_KEYS.INVOICES, initialInvoices as Invoice[]);
    this.balanceRows = this.loadFromStorage(STORAGE_KEYS.BALANCE, initialBalance as BalanceRow[]);
    this.gstRows = this.loadFromStorage(STORAGE_KEYS.GST, initialGst as GstRow[]);
    this.jobWorkRows = this.loadFromStorage(STORAGE_KEYS.JOB_WORK, initialJobWork as JobWorkRow[]);
    this.attendanceEntries = this.loadFromStorage(STORAGE_KEYS.ATTENDANCE, initialAttendance as AttendanceEntry[]);
    this.settings = this.loadFromStorage(STORAGE_KEYS.SETTINGS, initialSettings as Settings);
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) return JSON.parse(item);
      } catch (e) {
        console.warn(`Failed to read ${key} from localStorage`, e);
      }
    }
    return JSON.parse(JSON.stringify(defaultValue));
  }

  private saveToStorage<T>(key: string, value: T): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Failed to save ${key} to localStorage`, e);
      }
    }
  }

  // ── Companies ──────────────────────────────────────────────
  async getCompanies(): Promise<Company[]> {
    return [...this.companies];
  }

  async getCompanyProducts(companyId: string): Promise<Product[]> {
    return this.products.filter((p) => p.companyId === companyId);
  }

  async addCompany(company: Company): Promise<Company> {
    const newCompany: Company = {
      ...company,
      id: company.id || `c_${Date.now()}`,
    };
    this.companies.push(newCompany);
    this.saveToStorage(STORAGE_KEYS.COMPANIES, this.companies);
    return newCompany;
  }

  async addProduct(product: Product): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: product.id || `p_${Date.now()}`,
    };
    this.products.push(newProduct);
    this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return newProduct;
  }

  // ── Invoices & Cascade Logic ───────────────────────────────
  async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    let result = [...this.invoices];

    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (inv) =>
            inv.invoiceNo.toLowerCase().includes(query) ||
            inv.items.some((i) => i.particulars.toLowerCase().includes(query))
        );
      }
      if (filters.companyId) {
        result = result.filter((inv) => inv.companyId === filters.companyId);
      }
      if (filters.dateFrom) {
        result = result.filter((inv) => inv.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        result = result.filter((inv) => inv.date <= filters.dateTo!);
      }
      if (filters.status && filters.status !== "All") {
        result = result.filter((inv) => inv.status === filters.status);
      }
    }

    return result;
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) {
      throw new Error(`Invoice with ID ${id} not found`);
    }
    return { ...inv };
  }

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const existingIndex = this.invoices.findIndex((i) => i.id === invoice.id);
    if (existingIndex >= 0) {
      return this.updateInvoice(invoice.id, invoice);
    }

    // New Invoice
    const newInvoice = { ...invoice };
    if (!newInvoice.id) {
      newInvoice.id = `inv_${Date.now()}`;
    }

    this.invoices.push(newInvoice);
    this.saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);

    // Run Cross-Cutting Cascade Updates (§6.9)
    await this.applyInvoiceCascade(newInvoice);

    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Invoice): Promise<Invoice> {
    const index = this.invoices.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Cannot update non-existent invoice ${id}`);
    }

    const updatedInvoice = { ...invoice, id };
    this.invoices[index] = updatedInvoice;
    this.saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);

    // Re-run Cross-Cutting Cascade Updates (§6.9)
    await this.applyInvoiceCascade(updatedInvoice);

    return updatedInvoice;
  }

  async cancelInvoice(id: string): Promise<void> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return;

    inv.status = "Cancelled";
    this.saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);

    // Extract bill number
    const billNo = inv.invoiceNo.replace(/^[^\d]+/, "") || inv.invoiceNo;

    // Update Balance row if exists
    const bIndex = this.balanceRows.findIndex((b) => b.billNo === billNo);
    if (bIndex !== -1) {
      this.balanceRows[bIndex].status = "Cancelled";
      this.balanceRows[bIndex].balanceAmount = 0;
      this.saveToStorage(STORAGE_KEYS.BALANCE, this.balanceRows);
    }

    // Remove from GST Summary
    this.gstRows = this.gstRows.filter((g) => g.billNo !== billNo);
    this.saveToStorage(STORAGE_KEYS.GST, this.gstRows);
  }

  /**
   * Cascade Logic (PRD §6.9):
   * When an invoice is created or edited:
   * 1. Extract billNo from invoiceNo.
   * 2. Upsert row into Balance Confirmation matching key `billNo`.
   * 3. If "With Tax", upsert row into GST Summary for that month matching key `billNo`.
   */
  private async applyInvoiceCascade(invoice: Invoice): Promise<void> {
    const company = this.companies.find((c) => c.id === invoice.companyId);
    const companyName = company ? company.name : "Unknown Company";
    const companyGst = company ? company.gstNo : "";
    const creditDays = company ? company.creditDays : 30;

    const billNo = invoice.invoiceNo.replace(/^[^\d]+/, "") || invoice.invoiceNo;
    const amountDueDate = addDays(invoice.date, creditDays);
    const taxableAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);

    if (invoice.status === "Active") {
      // 1. Balance Confirmation Upsert
      const existingBIndex = this.balanceRows.findIndex((b) => b.billNo === billNo);
      const existingB = existingBIndex >= 0 ? this.balanceRows[existingBIndex] : null;
      const amountReceived = existingB ? existingB.amountReceived : 0;
      const balanceAmount = invoice.grandTotal - amountReceived;

      const newBalanceRow: BalanceRow = {
        billNo,
        date: invoice.date,
        company: companyName,
        poNo: invoice.poNo || (existingB ? existingB.poNo : ""),
        description: invoice.items.map((i) => i.particulars).join(", "),
        unitPrice: invoice.items[0]?.rate || 0,
        billAmount: invoice.grandTotal,
        amountDueDate,
        debitNoteIfAny: existingB ? existingB.debitNoteIfAny : 0,
        actualReceivableAmount: invoice.grandTotal,
        amountReceivedDate: existingB ? existingB.amountReceivedDate : null,
        amountReceived,
        balanceAmount,
        status: balanceAmount <= 0 ? "Paid" : amountReceived > 0 ? "Partially Paid" : "Pending",
      };

      if (existingBIndex >= 0) {
        this.balanceRows[existingBIndex] = newBalanceRow;
      } else {
        this.balanceRows.push(newBalanceRow);
      }
      this.saveToStorage(STORAGE_KEYS.BALANCE, this.balanceRows);

      // 2. GST Summary Upsert
      const monthKey = getMonthKey(invoice.date);
      if (invoice.type === "With Tax") {
        const existingGIndex = this.gstRows.findIndex((g) => g.billNo === billNo);
        const newGstRow: GstRow = {
          sNo: existingGIndex >= 0 ? this.gstRows[existingGIndex].sNo : this.gstRows.length + 1,
          billNo,
          billDate: invoice.date,
          suppliedTo: companyName,
          gstNo: companyGst,
          amount: taxableAmount,
          sgst: invoice.sgstAmount,
          cgst: invoice.cgstAmount,
          totalAmount: invoice.grandTotal,
          month: monthKey,
        };

        if (existingGIndex >= 0) {
          this.gstRows[existingGIndex] = newGstRow;
        } else {
          this.gstRows.push(newGstRow);
        }
        this.saveToStorage(STORAGE_KEYS.GST, this.gstRows);
      } else {
        // Without Tax -> remove from GST summary if present
        this.gstRows = this.gstRows.filter((g) => g.billNo !== billNo);
        this.saveToStorage(STORAGE_KEYS.GST, this.gstRows);
      }
    }
  }

  // ── Balance Confirmation ──────────────────────────────────
  async getBalanceConfirmation(filters?: BalanceFilters): Promise<BalanceRow[]> {
    let result = [...this.balanceRows];

    if (filters) {
      if (filters.company) {
        result = result.filter((b) =>
          b.company.toLowerCase().includes(filters.company!.toLowerCase())
        );
      }
      if (filters.dateFrom) {
        result = result.filter((b) => b.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        result = result.filter((b) => b.date <= filters.dateTo!);
      }
      if (filters.status && filters.status !== "All") {
        const today = new Date().toISOString().split("T")[0];
        if (filters.status === "Overdue") {
          result = result.filter(
            (b) => b.balanceAmount > 0 && b.amountDueDate < today && b.status !== "Cancelled"
          );
        } else {
          result = result.filter((b) => b.status === filters.status);
        }
      }
    }

    return result;
  }

  async recordPayment(billNo: string, amount: number, date: string): Promise<BalanceRow> {
    const row = this.balanceRows.find((b) => b.billNo === billNo);
    if (!row) {
      throw new Error(`Balance record for Bill No ${billNo} not found`);
    }

    row.amountReceived += amount;
    row.amountReceivedDate = date;
    row.balanceAmount = row.billAmount - row.amountReceived;
    row.status = row.balanceAmount <= 0 ? "Paid" : "Partially Paid";

    this.saveToStorage(STORAGE_KEYS.BALANCE, this.balanceRows);
    return { ...row };
  }

  // ── GST Summary ───────────────────────────────────────────
  async getGstSummary(month: string): Promise<GstRow[]> {
    return this.gstRows.filter((g) => g.month === month);
  }

  async getAvailableGstMonths(): Promise<string[]> {
    const months = Array.from(new Set(this.gstRows.map((g) => g.month)));
    return months;
  }

  // ── Job Work Ledger ───────────────────────────────────────
  async getJobWork(filters?: JobWorkFilters): Promise<JobWorkRow[]> {
    let result = [...this.jobWorkRows];

    if (filters) {
      if (filters.partyName) {
        result = result.filter((jw) =>
          jw.partyName.toLowerCase().includes(filters.partyName!.toLowerCase())
        );
      }
      if (filters.dateFrom) {
        result = result.filter((jw) => jw.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        result = result.filter((jw) => jw.date <= filters.dateTo!);
      }
    }

    return result;
  }

  async addJobWorkEntry(entry: JobWorkRow): Promise<JobWorkRow> {
    const newEntry: JobWorkRow = {
      ...entry,
      id: entry.id || `jw_${Date.now()}`,
      balanceAmount: entry.totalAmount - (entry.paidAmount || 0),
    };
    this.jobWorkRows.push(newEntry);
    this.saveToStorage(STORAGE_KEYS.JOB_WORK, this.jobWorkRows);
    return newEntry;
  }

  async recordJobWorkPayment(id: string, amount: number, date: string): Promise<JobWorkRow> {
    const jw = this.jobWorkRows.find((item) => item.id === id);
    if (!jw) {
      throw new Error(`Job-work record ${id} not found`);
    }

    jw.paidAmount += amount;
    jw.paidDate = date;
    jw.balanceAmount = jw.totalAmount - jw.paidAmount;

    this.saveToStorage(STORAGE_KEYS.JOB_WORK, this.jobWorkRows);
    return { ...jw };
  }

  // ── Attendance & Payroll ──────────────────────────────────
  async getEmployees(): Promise<Employee[]> {
    return [...this.employees];
  }

  async markAttendance(
    employeeId: string,
    date: string,
    entry: AttendanceEntry
  ): Promise<void> {
    const existingIndex = this.attendanceEntries.findIndex(
      (a) => a.employeeId === employeeId && a.date === date
    );

    const newRecord: AttendanceEntry = {
      ...entry,
      employeeId,
      date,
    };

    if (existingIndex >= 0) {
      this.attendanceEntries[existingIndex] = newRecord;
    } else {
      this.attendanceEntries.push(newRecord);
    }

    this.saveToStorage(STORAGE_KEYS.ATTENDANCE, this.attendanceEntries);
  }

  async getMonthlyPayroll(month: string): Promise<PayrollRow[]> {
    const result: PayrollRow[] = [];
    const multiplier = this.settings.holidayOtMultiplier || 2;

    for (const emp of this.employees) {
      const empEntries = this.attendanceEntries.filter((a) => {
        const mKey = getMonthKey(a.date);
        return a.employeeId === emp.id && mKey === month;
      });

      const totalDaysPresent = empEntries.filter((e) => e.status === "Present").length;
      const otHours = empEntries.reduce((sum, e) => sum + (e.otHours || 0), 0);
      const holidayOtHours = empEntries.reduce((sum, e) => sum + (e.holidayOtHours || 0), 0);
      const totalAdvances = empEntries.reduce((sum, e) => sum + (e.advance || 0), 0);

      let baseSalary = 0;
      let otPay = 0;
      let holidayOtPay = 0;
      let totalHours = totalDaysPresent * 8 + otHours + holidayOtHours;

      if (emp.salaryType === "Monthly") {
        baseSalary = emp.rate;
        const hourlyRate = emp.rate / (26 * 8); // 26 working days * 8 hours
        otPay = otHours * hourlyRate;
        holidayOtPay = holidayOtHours * hourlyRate * multiplier;
      } else if (emp.salaryType === "Daily") {
        baseSalary = totalDaysPresent * emp.rate;
        const hourlyRate = emp.rate / 8;
        otPay = otHours * hourlyRate;
        holidayOtPay = holidayOtHours * hourlyRate * multiplier;
      } else if (emp.salaryType === "Hourly") {
        baseSalary = totalDaysPresent * 8 * emp.rate;
        otPay = otHours * emp.rate;
        holidayOtPay = holidayOtHours * emp.rate * multiplier;
      }

      const totalSalary = Math.round(baseSalary + otPay + holidayOtPay);
      const netPayable = Math.max(0, totalSalary - totalAdvances);

      result.push({
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        month,
        totalDaysPresent,
        totalHours,
        otHours,
        holidayOtHours,
        baseSalary: Math.round(baseSalary),
        otPay: Math.round(otPay),
        holidayOtPay: Math.round(holidayOtPay),
        totalSalary,
        totalAdvances,
        netPayable,
      });
    }

    return result;
  }

  // ── Settings ──────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    return { ...this.settings };
  }
}
