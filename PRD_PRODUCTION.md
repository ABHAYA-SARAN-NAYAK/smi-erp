# PRD — SMI ERP (Production-Grade Build)
### Prepared as a senior full-stack/ERP architecture spec — for AI-agent-assisted development (Antigravity)

**Status:** Ready to build against **demo/mock data**. Google Sheets is the eventual system of record but is **not wired in yet** — build against a swappable data layer (see §7) so integration later is a config change, not a rewrite.

**Data note:** every example, company name, GST number, and figure in this document is **fake/demo data**, invented purely to build and test against. None of it is real client data.

---

## 1. Executive Summary

SMI ERP is a lightweight, production-quality business management system for a small industrial parts manufacturer: invoicing (with/without GST), accounts receivable, GST reporting, outside job-work payables, and staff attendance/payroll — unified in one dashboard, built to feel like real enterprise software, not a prototype.

**Build philosophy:**
- Build the entire application against a **mock data layer** first — fully functional, fully demo-able, zero dependency on the client's real spreadsheet.
- The data layer sits behind **one clean interface** (a repository/adapter pattern). Swapping mock data for live Google Sheets later means implementing that interface against the Sheets API — **no UI code changes**.
- Security, validation, and error handling are built in from day one, not retrofitted later.

---

## 2. Tech Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **React (Next.js, App Router)** | Industry standard, strong ecosystem, easy static/serverless deploy |
| Styling | **Tailwind CSS** + custom design tokens | Fast, consistent, matches the design system in §5 |
| Component base | **shadcn/ui** primitives, restyled to our tokens | Accessible, unstyled-by-default, easy to theme |
| State/data fetching | **TanStack Query (React Query)** | Clean caching/loading/error states against any backend |
| Forms & validation | **React Hook Form + Zod** | Type-safe validation, reused on client and server |
| PDF generation | **@react-pdf/renderer** or **jsPDF + html2canvas** | Pixel-accurate invoice PDFs |
| Auth | Custom session-based auth (see §8) | No third-party login required per client's request |
| Mock data layer (Phase 1) | Local JSON + in-memory/localForage-backed repository functions | Fast to build, fully swappable |
| Future data layer (Phase 2) | Google Apps Script Web App + Google Sheets | Zero-cost, client's system of record |
| Hosting | Vercel / Netlify (frontend) — free tier is sufficient | No server maintenance |

**Folder structure (recommended for the AI agent to scaffold):**
```
/app
  /(auth)/login
  /(dashboard)/home
  /(dashboard)/invoices/new
  /(dashboard)/invoices/history
  /(dashboard)/balance-confirmation
  /(dashboard)/gst-summary
  /(dashboard)/job-work
  /(dashboard)/attendance
  /(dashboard)/settings
/components
  /ui            (shadcn primitives, restyled)
  /invoice       (InvoiceForm, InvoicePreview, ProductPicker, ItemsTable)
  /shared        (DataTable, FilterBar, StatCard, StatusPill, KpiCard)
/lib
  /data-layer
    interface.ts          (the repository contract — see §7)
    mockAdapter.ts         (Phase 1 implementation, fake data)
    sheetsAdapter.ts        (Phase 2 stub, implemented later)
  /auth
  /pdf
  /validation (zod schemas)
/data
  mock-companies.json
  mock-products.json
  mock-employees.json
  mock-invoices.json
  mock-balance-confirmation.json
  mock-gst-summary.json
  mock-job-work.json
  mock-attendance.json
/styles
  tokens.css
```

---

## 3. Users & Roles

- **v1: single admin role.** One login, full access to everything.
- Architecture should not hard-block future roles — keep a `role` field on the user object now (`"admin"`), even though only one role exists, so RBAC can be added later without a schema migration.

---

## 4. Information Architecture

Left sidebar navigation (persistent across all authenticated pages):

```
🏠 Home
🧾 New Invoice
📄 Invoice History
💰 Balance Confirmation
📊 GST Summary
🔧 Job-Work Ledger
👷 Attendance & Payroll
⚙️ Settings
```

Top bar: page title, breadcrumb (if nested), user menu (logout) top-right.

---

## 5. Design System (UI/UX) — non-negotiable, this is the product's differentiator

**Principle:** feels like enterprise software (Linear/Stripe-level polish) with a warm, grounded identity referencing a well-made invoice ledger — not a generic admin-template look.

### Color tokens
```css
--ink: #1e2a4a;          /* primary structural color, nav, headings */
--ink-soft: #5b6688;     /* secondary text */
--paper: #fffdf8;        /* invoice/document surfaces */
--amber: #c98a2c;        /* single bold accent — primary actions, active states */
--amber-soft: #f6e6c8;   /* accent backgrounds, badges */
--slate-bg: #eef1f6;     /* app canvas background */
--panel-bg: #ffffff;     /* cards */
--line: #dde1ee;         /* borders, dividers */
--success: #2f8f5b;
--warning: #c98a2c;
--danger: #c0392b;
```

### Typography
- **Fraunces** (serif, display weight) — invoice/document headings, the company name wherever it appears as a "printed" element.
- **Inter** — all UI text, labels, tables, navigation, forms.
- Tabular figures (`font-variant-numeric: tabular-nums`) on every numeric table column.

### Components (build these once, reuse everywhere)
- `StatCard` — KPI card: big number, label, trend arrow, optional colored badge.
- `StatusPill` — color-coded pill: green=Paid/Complete, amber=Pending, red=Overdue/Cancelled.
- `DataTable` — sortable columns, sticky header, zebra-free clean row dividers, right-aligned tabular numbers, pagination, empty state, loading skeleton.
- `FilterBar` — consistent filter row (date range, entity dropdown with search, status select) used identically across every list page.
- `Autocomplete` — type-ahead search used for Company, Party, Product selection; supports "+ Add new" inline.
- `SidePanel` — slide-in panel from the right (used for the product picker, add-entry forms).
- `Toast` — success/error notifications, never use browser `alert()`/`confirm()`.
- `EmptyState`, `LoadingSkeleton`, `ErrorState` — every list/table must implement all three, not just the happy path.

### UX rules
- One primary amber button per screen — never two competing primary actions.
- Every destructive action (delete, cancel invoice) requires a confirmation dialog, styled, not a native `confirm()`.
- Every save/submit shows a loading state on the button and disables it during the request (prevent double-submit).
- Full keyboard navigation on forms (Tab order, Enter-to-submit where sensible).
- Responsive down to tablet width (1024px); desktop-first is fine for narrower breakpoints given this is an office tool.
- WCAG AA color contrast minimum throughout.

---

## 6. Functional Modules

### 6.1 Authentication
- Login page: username + password.
- On submit: credentials validated server-side (never trust client-side-only checks), a **signed, httpOnly session cookie** issued on success (see §8 for full security spec).
- Failed login shows a generic "Invalid username or password" (never reveal which field was wrong).
- Session expires after a configurable inactivity period (default 8 hours); expired session redirects to login with a "Session expired" message.
- Logout clears the session server-side, not just client-side.

**Demo credentials for build/testing:**
`admin` / `Demo@12345` (placeholder only — replaced with real client credentials at go-live, never committed to source control, see §8).

### 6.2 Home Dashboard
KPI cards (pulled from the data layer, all computed, none hardcoded):
- This Month's Sales
- GST Payable This Month
- Total Receivable Outstanding (+ overdue count badge)
- Job-Work Payable Outstanding
- This Month's Labour Cost

Below: Recent Invoices (last 5) and Overdue Payments mini-tables, "+ New Invoice" primary action.

### 6.3 New Invoice
- Toggle: **With Tax (CGST+SGST)** / **Without Tax**.
- Split layout: form (left) + live paper-style preview (right), as specified in the earlier Stitch prompts — build the actual preview as real DOM (not an image) so it can be captured to PDF via html2canvas/react-pdf.
- Company Autocomplete → on select: auto-fill GST No/Address/State, open Side Panel listing every product that company has bought (checkbox list with last rate + HSN), "+ Add new product" inline.
- Item table: Part No, Particulars, HSN, Qty, Rate, Amount (computed, never editable directly).
- Tax block (With Tax mode only): CGST %, SGST % (defaults from Settings), computed amounts, round-off.
- Auto invoice numbering: `{prefix}{lastInvoiceNo + 1}`, editable if needed but flagged if it collides with an existing number.
- Due date auto-computed from the selected company's Credit Days.
- **Save** writes the invoice via the data layer, which internally also upserts linked rows into Balance Confirmation and the correct month's GST tab (see §6.9 cascade logic) — all through the same interface, so in mock mode this just updates the mock JSON in memory/local storage, and in Sheets mode it writes to the real sheets, with zero UI change.
- **Download PDF** renders the exact preview to a PDF file.

### 6.4 Invoice History
- Search (invoice no, company), filters (date range, company, status: Active/Cancelled).
- Table: Invoice No, Date, Company, Amount, Type, Status, actions (View / Edit / Download).
- **Edit** reopens the New Invoice form pre-filled; on re-save, cascades the update to linked Balance Confirmation and GST rows (match by Invoice/Bill No — update in place, never duplicate).
- **Cancel** (soft) sets status to Cancelled, excludes it from GST/Balance totals but keeps the record visible with a red "Cancelled" pill and a filter to show/hide cancelled invoices.

### 6.5 Balance Confirmation
- Stat cards: Total Billed, Total Received, Total Outstanding.
- Ageing view: 0–30 / 30–60 / 60+ days outstanding, as a simple bar breakdown.
- Filters: Company, Month/date range, Status (Paid/Partially Paid/Overdue).
- Table matches the schema in §7 exactly. Balance Amount computed as `Bill Amount − Amount Received`, never stored as a manually-entered value.
- Overdue rows (today > Amount Due Date and Balance > 0) visually flagged red.

### 6.6 GST Summary
- Month picker/dropdown.
- Stat cards: Total Taxable Amount, Total CGST, Total SGST, Total GST Payable — computed live from that month's rows, never a stored/typed total.
- Table matches schema in §7.
- Export button (Excel/PDF) for the selected month.

### 6.7 Job-Work / Labour Payable Ledger
- Stat cards: Total Payable, Total Paid, Outstanding Balance.
- Party Name Autocomplete (same pattern as Company, with "+ Add new party").
- Table matches schema in §7; Balance Amount computed, never stored.
- "+ Add Entry" opens a side panel form.

### 6.8 Attendance & Payroll
- Employee list (under 10 — simple selector, no pagination needed).
- Calendar grid per employee per month: click a day to mark Present / Absent / OT hours / Holiday OT.
- **Holiday OT pay = normal daily/hourly rate × 2** (multiplier configurable in Settings, default 2).
- Advances logged per employee with date + amount.
- Auto-computed monthly summary per employee: Total Hours, OT Hours, Holiday OT Hours, Total Salary, Total Advances, **Net Payable** — all computed, never manually entered.
- Downloadable salary slip PDF per employee per month.

### 6.9 Cross-cutting: Invoice Cascade Logic
This is the core "smart" behavior of the whole system — implement it once, centrally, in the data layer (not scattered across UI components):

```
onSaveInvoice(invoice):
  1. Validate invoice (Zod schema — required fields, positive amounts, valid dates)
  2. Write/update the Invoices record
  3. If invoice.status == "Active":
     a. Upsert a matching row in Balance Confirmation (match key: Bill No)
        - due date = invoice.date + company.creditDays
     b. If invoice.type == "With Tax":
        - Determine invoice month → find or auto-create that month's GST tab
        - Upsert a matching row in GST Summary for that month (match key: Bill No)
  4. If this was an EDIT (not new): re-run steps 3a/3b against the EXISTING linked rows
     (update in place) rather than creating new ones.
  5. Return the saved invoice + success/error state to the UI.
```

### 6.10 Settings
Sectioned form: Company Details (incl. logo upload), Invoice Settings (prefix, last invoice no, default CGST/SGST %), Payroll Settings (Holiday OT multiplier), Account (change username/password — see §8 for how password changes must be handled securely).

---

## 7. Data Layer Contract (the abstraction that makes Phase 2 painless)

Define one TypeScript interface. **Every module calls only these functions — never a specific data source directly.**

```ts
interface DataLayer {
  // Companies
  getCompanies(): Promise<Company[]>;
  getCompanyProducts(companyId: string): Promise<Product[]>;
  addCompany(company: Company): Promise<Company>;
  addProduct(product: Product): Promise<Product>;

  // Invoices
  getInvoices(filters?: InvoiceFilters): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice>;
  saveInvoice(invoice: Invoice): Promise<Invoice>;   // handles create + cascade
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
```

**Phase 1:** `mockAdapter.ts` implements this against the JSON files in `/data`, using in-memory state (persisted to `localStorage` between sessions so demo data survives a refresh).

**Phase 2 (later, when the client's Sheet IDs arrive):** `sheetsAdapter.ts` implements the exact same interface, calling the Google Apps Script Web App instead. The app's `.env`/config simply points to whichever adapter is active — **no component, page, or form changes required.**

---

## 8. Demo/Fake Data (for building and testing — NOT real client data)

### Companies (`mock-companies.json`)
```json
[
  { "id": "c1", "name": "Acme Fabrication Pvt Ltd", "gstNo": "29AACFA1234B1Z5", "address": "Plot 12, Industrial Estate, Peenya, Bangalore 560058", "state": "Karnataka", "creditDays": 45 },
  { "id": "c2", "name": "Bluewave Hydraulics Ltd", "gstNo": "27AAACB5678C1ZQ", "address": "45 Andheri MIDC, Mumbai 400093", "state": "Maharashtra", "creditDays": 30 },
  { "id": "c3", "name": "Sunrise Rubber Components", "gstNo": "33AABCS9012D1ZR", "address": "18 Guindy Industrial Area, Chennai 600032", "state": "Tamil Nadu", "creditDays": 60 }
]
```

### Company Products (`mock-products.json`)
```json
[
  { "companyId": "c1", "partNo": "AC-INS-001", "partName": "6MM SS Insert", "hsn": "39269099", "rate": 45 },
  { "companyId": "c1", "partNo": "AC-INS-002", "partName": "8MM Nipple Insert", "hsn": "39269099", "rate": 62 },
  { "companyId": "c2", "partNo": "BW-CAP-010", "partName": "Thread Cap 10T", "hsn": "39174090", "rate": 18 },
  { "companyId": "c3", "partNo": "SR-KIT-005", "partName": "TR Kit Standard", "hsn": "40169990", "rate": 260 }
]
```

### Employees (`mock-employees.json`)
```json
[
  { "id": "e1", "name": "Ravi Kumar", "designation": "Supervisor", "salaryType": "Monthly", "rate": 18000 },
  { "id": "e2", "name": "Suresh M", "designation": "Operator", "salaryType": "Daily", "rate": 550 },
  { "id": "e3", "name": "Kavitha R", "designation": "Helper", "salaryType": "Hourly", "rate": 55 }
]
```

### Sample Invoice (`mock-invoices.json`)
```json
[
  {
    "id": "inv1",
    "invoiceNo": "INV-1001",
    "date": "2026-09-05",
    "type": "With Tax",
    "companyId": "c1",
    "items": [
      { "partNo": "AC-INS-001", "particulars": "6MM SS Insert", "hsn": "39269099", "qty": 200, "rate": 45, "amount": 9000 }
    ],
    "cgstPercent": 9, "sgstPercent": 9,
    "cgstAmount": 810, "sgstAmount": 810,
    "grandTotal": 10620,
    "status": "Active"
  }
]
```

### Sample Balance Confirmation row
```json
{ "billNo": "1001", "date": "2026-09-05", "company": "Acme Fabrication Pvt Ltd", "poNo": "PO-2291", "description": "6MM SS Insert", "unitPrice": 45, "billAmount": 10620, "amountDueDate": "2026-10-20", "debitNoteIfAny": 0, "actualReceivableAmount": 10620, "amountReceivedDate": null, "amountReceived": 0, "balanceAmount": 10620 }
```

### Sample GST Summary row (tab: `Sep-2026`)
```json
{ "sNo": 1, "billNo": "1001", "billDate": "2026-09-05", "suppliedTo": "Acme Fabrication Pvt Ltd", "gstNo": "29AACFA1234B1Z5", "amount": 9000, "sgst": 810, "cgst": 810, "totalAmount": 10620 }
```

### Sample Job-Work row
```json
{ "partyName": "Ganesh Job Works", "date": "2026-09-08", "partNo": "AC-INS-001", "qty": 500, "rate": 8, "totalAmount": 4000, "amountDueDate": "2026-09-22", "paidAmount": 0, "paidDate": null, "balanceAmount": 4000 }
```

### Sample Settings object
```json
{
  "companyName": "Demo Industries Pvt Ltd",
  "companyAddress": "12 Sample Street, Demo City 600000",
  "companyPhone": "9999999999",
  "companyGST": "33AAAAA0000A1Z0",
  "companyState": "Tamil Nadu",
  "invoicePrefix": "INV-",
  "lastInvoiceNo": 1000,
  "defaultCgstPercent": 9,
  "defaultSgstPercent": 9,
  "holidayOtMultiplier": 2
}
```

*(Build and demo the entire app against this fake data set. Swap in the real Settings/Companies/Products/Employees only once the client's Google Sheets are ready — see §7.)*

---

## 9. Security Requirements (production-grade, non-negotiable)

This is a real business tool handling financial data — treat it like one.

### 9.1 Authentication & Session Security
- **Never store passwords in plaintext**, anywhere — not in code, not in a config file, not in the mock data layer. Even for the demo/admin account, hash with **bcrypt or argon2** before storing.
- Session tokens are **signed, httpOnly, Secure, SameSite=Strict cookies** — never store auth tokens in `localStorage` or `sessionStorage` (vulnerable to XSS token theft).
- Rate-limit login attempts (e.g. max 5 attempts per 15 minutes per IP) to block brute-force attacks.
- Session expiry + server-side invalidation on logout (not just clearing a client-side flag).
- No credentials, API keys, or Sheet IDs ever committed to source control — use environment variables (`.env.local`, excluded via `.gitignore`) for all secrets, both in mock and future Sheets-connected phases.

### 9.2 Input Validation & Injection Prevention
- **Validate every input server-side** (via Zod schemas shared between client and server) — never trust client-side validation alone, since it can be bypassed.
- Sanitize all user-entered text before rendering (React does this by default via JSX escaping — never use `dangerouslySetInnerHTML` with unsanitized input).
- Enforce type/range checks on all numeric fields (no negative quantities, no negative rates, dates must be valid and logically ordered — e.g. due date can't be before invoice date).

### 9.3 Data Access Security
- The data layer functions are the **only** path to data — no component ever reaches into a data source directly, which also means access-control checks (once multi-role is added) only need to live in one place.
- When Phase 2 connects to Google Apps Script: the Web App URL/endpoint is never exposed in client-visible source beyond what's necessary, secrets/API endpoints loaded from environment config, and the Apps Script itself validates the session/auth token on every request (not just trusting that requests come from the dashboard).
- Google Sheets themselves stay **private** to the dedicated Google account — the Apps Script Web App is the only path in, it is not a public read/write door to the raw spreadsheet.

### 9.4 Application Security Hardening
- All traffic over **HTTPS only** (enforced at the hosting layer).
- Standard security headers: `Content-Security-Policy`, `X-Frame-Options: DENY` (prevent clickjacking), `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- CSRF protection on all state-changing requests (double-submit cookie or same-site cookie strategy).
- Dependencies kept current — run `npm audit` (or equivalent) as part of the build process; do not ship with known-critical vulnerabilities in dependencies.
- No sensitive data (financial figures, GST numbers) ever logged to browser console or third-party analytics in production builds.

### 9.5 Data Integrity & Auditability
- Every write operation (invoice save/edit/cancel, payment recorded, attendance marked) should be timestamped and attributable (who/when) — even in single-user v1, log this internally so it's ready for multi-user audit trails later.
- Cascade updates (§6.9) must be **idempotent** — re-running a save on the same invoice should update existing linked rows, never create duplicates.
- Confirm destructive actions (cancel invoice, delete entry) with an explicit styled confirmation dialog — no silent deletes.

### 9.6 Error Handling
- Never expose stack traces, internal error messages, or raw exceptions to the end user — show a friendly error + toast, log the technical detail server-side/internally only.
- Every data-layer call wrapped in proper try/catch with a defined error shape the UI knows how to render (`ErrorState` component, not a blank crash).

---

## 10. Non-Functional Requirements

- **Performance:** initial dashboard load under 2 seconds on a typical broadband connection; list views under 1 second for realistic data volumes (hundreds of rows).
- **Reliability:** the app should degrade gracefully if the data layer errors (show `ErrorState`, allow retry) rather than white-screening.
- **Accessibility:** WCAG AA, full keyboard operability, screen-reader-friendly labels on all form fields and icon-only buttons.
- **Browser support:** latest Chrome, Edge, Firefox, Safari — no IE11 requirement.
- **Cost:** $0 recurring for Phase 1 (mock data, free hosting tiers) and Phase 2 (Google Sheets + Apps Script are free).

---

## 11. Build Order for the AI Agent

1. Scaffold the project (Next.js + Tailwind + shadcn) and set up the design tokens from §5.
2. Build the `DataLayer` interface + `mockAdapter` + the JSON demo data from §8.
3. Build shared components first: `DataTable`, `StatCard`, `StatusPill`, `Autocomplete`, `SidePanel`, `Toast`, `EmptyState`/`LoadingSkeleton`/`ErrorState`.
4. Build Auth (login page + session handling per §9.1), using the hashed demo credentials.
5. Build Home Dashboard (KPI cards wired to mock data).
6. Build New Invoice (the most complex screen) — form, live preview, product-picker side panel, PDF export, save → cascade logic against the mock adapter.
7. Build Invoice History (list, view, edit-with-cascade, cancel).
8. Build Balance Confirmation, GST Summary, Job-Work Ledger (all follow the same list/filter/stat-card pattern).
9. Build Attendance & Payroll (calendar grid + payroll computation + salary slip PDF).
10. Build Settings.
11. Full test pass against §12 checklist.
12. **Stop here and wait** — do not build `sheetsAdapter.ts` against real data until the client's Sheet IDs and real Masters data arrive (see the companion Setup Guide for that phase).

---

## 12. Testing & QA Checklist

- [ ] Login blocks access when unauthenticated; session expires correctly; rate limiting triggers after repeated failed attempts.
- [ ] New Invoice: company autocomplete, product side-panel selection, tax on/off toggle, PDF output matches live preview exactly.
- [ ] Editing a saved invoice updates (not duplicates) its linked Balance Confirmation and GST rows.
- [ ] Cancelling an invoice removes it from GST/Balance totals but keeps it visible with a Cancelled status.
- [ ] Balance Confirmation: recording a payment recalculates Balance Amount and clears the row from "overdue" once paid.
- [ ] GST Summary: switching months shows the correct auto-created tab's data; a brand-new month with no invoices shows a clean empty state, not an error.
- [ ] Job-Work Ledger: new party can be added inline and immediately reused.
- [ ] Attendance: marking Holiday OT correctly doubles the rate; monthly payroll summary recomputes live.
- [ ] All forms reject invalid input (negative numbers, missing required fields, malformed dates) with clear inline errors.
- [ ] No console errors, no exposed stack traces, no secrets visible in browser dev tools/network tab.
- [ ] Full flow works end-to-end using only the mock data layer, with no real client data anywhere in the codebase.

---

## 13. Out of Scope for This Build Phase

- Real Google Sheets connection (`sheetsAdapter.ts` stays a stub until Sheet IDs + real Masters data arrive).
- IGST / interstate tax logic (CGST+SGST only, per client's current requirement).
- Multi-user roles/permissions beyond the single admin account.
- Payment gateway integration, WhatsApp/email reminders, inventory tracking (all noted as future roadmap only).

---

## 14. Phase 2 Preview (do not build yet — for context only)

Once the client's Google Sheets exist and their IDs are provided:
1. Implement `sheetsAdapter.ts` against the same `DataLayer` interface, calling a Google Apps Script Web App (`doGet`/`doPost`) that reads/writes the real sheets.
2. Swap the active adapter via environment config.
3. Replace all mock JSON/demo data with the real Masters data (Companies, Products, Employees) and real historical Balance Confirmation/GST data.
4. Re-run the full §12 checklist against live data before go-live.

No UI, component, or business-logic code should need to change for this phase — that is the entire point of the abstraction in §7.
