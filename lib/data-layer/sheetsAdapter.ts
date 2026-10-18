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

/**
 * Phase 2 Stub — Google Sheets Data Adapter
 *
 * PER AGENTS.md §3 & PRD §14:
 * This file is an empty/stub implementation. Do NOT wire up against real Google Sheets
 * until Phase 2 is explicitly authorized by the user with real Sheet IDs.
 */
export class SheetsDataAdapter implements DataLayer {
  private notImplemented(): never {
    throw new Error("SheetsDataAdapter is not implemented yet (Phase 2). Use MockDataAdapter.");
  }

  async getCompanies(): Promise<Company[]> { this.notImplemented(); }
  async getCompanyProducts(_companyId: string): Promise<Product[]> { this.notImplemented(); }
  async addCompany(_company: Company): Promise<Company> { this.notImplemented(); }
  async addProduct(_product: Product): Promise<Product> { this.notImplemented(); }

  async getInvoices(_filters?: InvoiceFilters): Promise<Invoice[]> { this.notImplemented(); }
  async getInvoiceById(_id: string): Promise<Invoice> { this.notImplemented(); }
  async saveInvoice(_invoice: Invoice): Promise<Invoice> { this.notImplemented(); }
  async updateInvoice(_id: string, _invoice: Invoice): Promise<Invoice> { this.notImplemented(); }
  async cancelInvoice(_id: string): Promise<void> { this.notImplemented(); }

  async getBalanceConfirmation(_filters?: BalanceFilters): Promise<BalanceRow[]> { this.notImplemented(); }
  async recordPayment(_billNo: string, _amount: number, _date: string): Promise<BalanceRow> { this.notImplemented(); }

  async getGstSummary(_month: string): Promise<GstRow[]> { this.notImplemented(); }
  async getAvailableGstMonths(): Promise<string[]> { this.notImplemented(); }

  async getJobWork(_filters?: JobWorkFilters): Promise<JobWorkRow[]> { this.notImplemented(); }
  async addJobWorkEntry(_entry: JobWorkRow): Promise<JobWorkRow> { this.notImplemented(); }
  async recordJobWorkPayment(_id: string, _amount: number, _date: string): Promise<JobWorkRow> { this.notImplemented(); }

  async getEmployees(): Promise<Employee[]> { this.notImplemented(); }
  async getAttendance(): Promise<AttendanceEntry[]> { this.notImplemented(); }
  async markAttendance(_employeeId: string, _date: string, _entry: AttendanceEntry): Promise<void> { this.notImplemented(); }
  async getMonthlyPayroll(_month: string): Promise<PayrollRow[]> { this.notImplemented(); }

  async getSettings(): Promise<Settings> { this.notImplemented(); }
  async updateSettings(_settings: Partial<Settings>): Promise<Settings> { this.notImplemented(); }
}
