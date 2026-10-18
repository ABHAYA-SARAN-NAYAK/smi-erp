"use client";

import React, { useEffect, useState, useMemo } from "react";
import { dataLayer } from "@/lib/data-layer";
import {
  Employee,
  PayrollRow,
  AttendanceEntry,
  Settings,
} from "@/lib/data-layer/types";
import {
  StatCard,
  StatusPill,
  DataTable,
  SidePanel,
  LoadingSkeleton,
  ErrorState,
  useToast,
  Column,
} from "@/components/shared";
import { SalarySlipDocument } from "@/components/attendance/SalarySlipDocument";
import { downloadInvoicePdf } from "@/lib/pdf/exportPdf";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Award,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

export default function AttendancePage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("Oct-2026");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceEntry[]>([]);

  // Day Edit Modal State
  const [editingDayDate, setEditingDayDate] = useState<string | null>(null);
  const [dayStatus, setDayStatus] = useState<"Present" | "Absent">("Present");
  const [otHours, setOtHours] = useState<number>(0);
  const [holidayOtHours, setHolidayOtHours] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [savingDay, setSavingDay] = useState(false);

  // Salary Slip Modal State
  const [viewSlipPayroll, setViewSlipPayroll] = useState<PayrollRow | null>(null);
  const [downloadingSlip, setDownloadingSlip] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empList, sett] = await Promise.all([
        dataLayer.getEmployees(),
        dataLayer.getSettings(),
      ]);

      setEmployees(empList);
      setSettings(sett);
      const defaultEmp = empList[0]?.id || "";
      setSelectedEmployeeId(defaultEmp);

      const [payroll, attendance] = await Promise.all([
        dataLayer.getMonthlyPayroll(selectedMonth),
        dataLayer.getAttendance(),
      ]);
      setPayrollRows(payroll);
      setAllAttendance(attendance);
    } catch (err: any) {
      console.error("Failed to load attendance data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshPayroll = async () => {
    try {
      const [payroll, attendance] = await Promise.all([
        dataLayer.getMonthlyPayroll(selectedMonth),
        dataLayer.getAttendance(),
      ]);
      setPayrollRows(payroll);
      setAllAttendance(attendance);
    } catch (e) {
      console.error("Payroll refresh error", e);
    }
  };

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  const monthDays = useMemo(() => {
    const [monthName, yearText] = selectedMonth.split("-");
    const monthIndex = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ].indexOf(monthName);
    const year = Number(yearText);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days: { dayNum: number; dateStr: string }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const day = String(i).padStart(2, "0");
      const month = String(monthIndex + 1).padStart(2, "0");
      days.push({ dayNum: i, dateStr: `${year}-${month}-${day}` });
    }

    return days;
  }, [selectedMonth]);

  // Handle Day Click
  const handleOpenDayModal = (dateStr: string) => {
    setEditingDayDate(dateStr);

    // Look up existing record for this date
    const existing = allAttendance.find(
      (a) => a.employeeId === selectedEmployeeId && a.date === dateStr
    );

    if (existing) {
      setDayStatus(existing.status);
      setOtHours(existing.otHours || 0);
      setHolidayOtHours(existing.holidayOtHours || 0);
      setAdvanceAmount(existing.advance || 0);
    } else {
      setDayStatus("Present");
      setOtHours(0);
      setHolidayOtHours(0);
      setAdvanceAmount(0);
    }
  };

  // Submit Day Attendance Record
  const handleSaveDayAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDayDate || !selectedEmployeeId) return;

    setSavingDay(true);
    try {
      const entry: AttendanceEntry = {
        date: editingDayDate,
        status: dayStatus,
        otHours: Number(otHours) || 0,
        holidayOtHours: Number(holidayOtHours) || 0,
        advance: Number(advanceAmount) || 0,
      };

      await dataLayer.markAttendance(selectedEmployeeId, editingDayDate, entry);

      // Local update
      setAllAttendance((prev) => {
        const filtered = prev.filter(
          (a) => !(a.employeeId === selectedEmployeeId && a.date === editingDayDate)
        );
        return [...filtered, { ...entry, employeeId: selectedEmployeeId }];
      });

      await refreshPayroll();

      success(
        "Attendance Saved!",
        `Updated attendance for ${selectedEmployee?.name} on ${editingDayDate}.`
      );
      setEditingDayDate(null);
    } catch (err: any) {
      toastError("Failed to Save", err.message);
    } finally {
      setSavingDay(false);
    }
  };

  // Salary Slip PDF Download
  const handleDownloadSalarySlip = async (payroll: PayrollRow) => {
    setViewSlipPayroll(payroll);
    setDownloadingSlip(true);
    try {
      setTimeout(async () => {
        await downloadInvoicePdf(
          "salary-slip-paper",
          `SalarySlip_${payroll.employeeName.replace(/\s+/g, "_")}_${payroll.month}.pdf`
        );
        setDownloadingSlip(false);
      }, 300);
    } catch (err) {
      toastError("Download Error", "Could not generate Salary Slip PDF.");
      setDownloadingSlip(false);
    }
  };

  // ── Stat Card Totals (PRD §6.8) ──
  const totalLabourCost = useMemo(
    () => payrollRows.reduce((sum, p) => sum + p.totalSalary, 0),
    [payrollRows]
  );
  const totalOtPay = useMemo(
    () => payrollRows.reduce((sum, p) => sum + p.otPay + p.holidayOtPay, 0),
    [payrollRows]
  );
  const totalAdvances = useMemo(
    () => payrollRows.reduce((sum, p) => sum + p.totalAdvances, 0),
    [payrollRows]
  );
  const totalNetPayable = useMemo(
    () => payrollRows.reduce((sum, p) => sum + p.netPayable, 0),
    [payrollRows]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" rows={4} />
        <LoadingSkeleton variant="table" rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading Attendance" message={error} onRetry={loadData} />;
  }

  const columns: Column<PayrollRow>[] = [
    { key: "employeeName", header: "Employee Name", sortable: true },
    { key: "designation", header: "Designation", width: "120px" },
    { key: "totalDaysPresent", header: "Present", align: "center", width: "80px" },
    { key: "otHours", header: "OT (hrs)", align: "right", isNumeric: true },
    {
      key: "holidayOtHours",
      header: "Holiday OT (2x)",
      align: "right",
      isNumeric: true,
      accessor: (row) => (
        <span className={row.holidayOtHours > 0 ? "font-bold text-amber" : ""}>
          {row.holidayOtHours} hrs
        </span>
      ),
    },
    {
      key: "baseSalary",
      header: "Base Pay (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${row.baseSalary.toLocaleString("en-IN")}`,
    },
    {
      key: "holidayOtPay",
      header: "OT + Holiday Pay (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => `₹${(row.otPay + row.holidayOtPay).toLocaleString("en-IN")}`,
    },
    {
      key: "totalSalary",
      header: "Gross Salary (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => (
        <span className="font-semibold text-ink">
          ₹{row.totalSalary.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "totalAdvances",
      header: "Advances (₹)",
      align: "right",
      isNumeric: true,
      accessor: (row) => (
        <span className={row.totalAdvances > 0 ? "text-danger" : ""}>
          ₹{row.totalAdvances.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "netPayable",
      header: "Net Payable (₹)",
      align: "right",
      isNumeric: true,
      sortable: true,
      accessor: (row) => (
        <span className="font-bold text-success text-sm">
          ₹{row.netPayable.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "120px",
      accessor: (row) => (
        <button
          onClick={() => handleDownloadSalarySlip(row)}
          className="px-2.5 py-1 border border-line bg-panel-bg hover:bg-amber hover:text-white hover:border-amber font-semibold rounded text-[11px] transition-colors shadow-xs flex items-center gap-1 ml-auto"
        >
          <Download className="w-3 h-3" />
          Slip PDF
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber" />
            Attendance &amp; Monthly Payroll
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Calendar attendance logging, 2x Holiday OT pay calculation, advances tracking, and salary slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink">Month:</span>
          <span className="px-3 py-1.5 bg-amber-soft text-amber font-bold rounded-lg border border-amber/30 text-xs">
            {selectedMonth}
          </span>
        </div>
      </div>

      {/* ── KPI Stat Cards (PRD §6.8) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Labour Cost"
          value={`₹${totalLabourCost.toLocaleString("en-IN")}`}
          subtitle="Gross Payroll Earnings"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Total OT & Holiday Pay"
          value={`₹${totalOtPay.toLocaleString("en-IN")}`}
          subtitle="Includes 2x Holiday OT Rate"
          trend={{ value: "2x Multiplier", direction: "up" }}
          icon={<Award className="w-4 h-4 text-amber" />}
        />
        <StatCard
          title="Salary Advances Logged"
          value={`₹${totalAdvances.toLocaleString("en-IN")}`}
          subtitle="Deducted from Net Salary"
          icon={<Clock className="w-4 h-4 text-danger" />}
        />
        <StatCard
          title="Net Payroll Payable"
          value={`₹${totalNetPayable.toLocaleString("en-IN")}`}
          subtitle="Final Net Amount to Disburse"
          icon={<Users className="w-4 h-4 text-success" />}
        />
      </div>

      {/* ── Employee Selector Cards ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
          <Users className="w-4 h-4 text-amber" />
          Select Employee to View / Mark Attendance Calendar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const isSelected = emp.id === selectedEmployeeId;
            const empPayroll = payrollRows.find((p) => p.employeeId === emp.id);

            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployeeId(emp.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-amber-soft/40 border-amber shadow-md"
                    : "bg-panel-bg border-line hover:border-ink-soft/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-ink text-sm font-display">{emp.name}</h4>
                    <p className="text-[11px] text-ink-soft">{emp.designation}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-bg border border-line text-ink-soft">
                    {emp.salaryType} (₹{emp.rate})
                  </span>
                </div>

                {empPayroll && (
                  <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[11px]">
                    <span className="text-ink-soft">
                      Present: <strong>{empPayroll.totalDaysPresent} Days</strong>
                    </span>
                    <span className="text-ink font-bold">
                      Net: ₹{empPayroll.netPayable.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Calendar Grid for Selected Employee (PRD §6.8) ── */}
      {selectedEmployee && (
        <div className="bg-panel-bg border border-line rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-ink text-sm font-display flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber" />
                Attendance Calendar: {selectedEmployee.name} ({selectedMonth})
              </h3>
              <p className="text-[11px] text-ink-soft">
                Click any day to mark Present/Absent, regular OT, or Holiday OT (2x rate).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-success/15 border border-success/60" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-soft border border-amber" /> Holiday OT (2x)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-danger/15 border border-danger/60" /> Absent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5">
            {monthDays.map((d) => {
              const entry = allAttendance.find(
                (a) => a.employeeId === selectedEmployeeId && a.date === d.dateStr
              );

              const isPresent = entry?.status === "Present";
              const hasHolidayOt = (entry?.holidayOtHours || 0) > 0;
              const hasAdvance = (entry?.advance || 0) > 0;

              return (
                <div
                  key={d.dateStr}
                  onClick={() => handleOpenDayModal(d.dateStr)}
                  className={`p-2.5 border rounded-xl cursor-pointer text-center transition-all hover:scale-105 ${
                    hasHolidayOt
                      ? "bg-amber-soft border-amber/70"
                      : isPresent
                      ? "bg-success/15 border-success/60"
                      : entry?.status === "Absent"
                      ? "bg-danger/15 border-danger/60"
                      : "bg-slate-bg border-line hover:border-amber/70"
                  }`}
                >
                  <div className="font-bold text-ink text-xs font-display">Day {d.dayNum}</div>

                  <div className="mt-1 flex flex-col items-center gap-0.5 text-[10px]">
                    {isPresent ? (
                      <span className="text-success font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Present
                      </span>
                    ) : entry?.status === "Absent" ? (
                      <span className="text-danger font-medium flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" /> Absent
                      </span>
                    ) : (
                      <span className="text-ink-soft">Not Set</span>
                    )}

                    {hasHolidayOt && (
                      <span className="px-1 bg-amber text-white font-bold rounded text-[9px]">
                        {entry?.holidayOtHours}h Holiday OT
                      </span>
                    )}

                    {!hasHolidayOt && (entry?.otHours || 0) > 0 && (
                      <span className="text-ink font-semibold">{entry?.otHours}h OT</span>
                    )}

                    {hasAdvance && (
                      <span className="text-danger font-semibold">₹{entry?.advance} Adv</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Auto-Computed Monthly Payroll Summary Table (PRD §6.8) ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber" />
          Auto-Computed Monthly Payroll Summary ({selectedMonth})
        </h3>

        <DataTable
          columns={columns}
          data={payrollRows}
          keyExtractor={(row) => row.employeeId}
          pageSize={10}
        />
      </div>

      {/* ── Mark Day Attendance SidePanel ── */}
      <SidePanel
        isOpen={Boolean(editingDayDate)}
        onClose={() => setEditingDayDate(null)}
        title={`Log Attendance: ${selectedEmployee?.name}`}
        subtitle={`Date: ${editingDayDate}`}
        width="sm"
      >
        <form onSubmit={handleSaveDayAttendance} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-ink block mb-1">Attendance Status *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDayStatus("Present")}
                className={`py-2 rounded-lg font-semibold border transition-all ${
                  dayStatus === "Present"
                    ? "bg-success text-white border-success"
                    : "bg-slate-bg border-line text-ink-soft"
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setDayStatus("Absent")}
                className={`py-2 rounded-lg font-semibold border transition-all ${
                  dayStatus === "Absent"
                    ? "bg-danger text-white border-danger"
                    : "bg-slate-bg border-line text-ink-soft"
                }`}
              >
                Absent
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-ink block mb-1">Regular Overtime Hours (OT)</label>
            <input
              type="number"
              min="0"
              max="16"
              value={otHours}
              onChange={(e) => setOtHours(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink font-semibold focus:outline-none focus:border-amber"
            />
          </div>

          {/* Holiday OT Field (PRD §6.8: 2x rate multiplier) */}
          <div className="p-3 bg-amber-soft border border-amber/40 rounded-xl space-y-1">
            <label className="font-bold text-amber block">
              ⭐ Holiday OT Hours (Calculated at 2x Rate Multiplier)
            </label>
            <input
              type="number"
              min="0"
              max="16"
              value={holidayOtHours}
              onChange={(e) => setHolidayOtHours(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-panel-bg border border-amber/40 rounded-lg text-ink font-bold focus:outline-none focus:border-amber"
            />
            <p className="text-[10px] text-ink-soft">
              Each Holiday OT hour earns double the standard hourly rate.
            </p>
          </div>

          <div>
            <label className="font-semibold text-ink block mb-1">Advance Cash Issued (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-bg/50 border border-line rounded-lg text-ink font-semibold focus:outline-none focus:border-amber tabular-nums"
            />
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingDayDate(null)}
              className="px-4 py-2 border border-line rounded-lg bg-panel-bg text-ink font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingDay}
              className="px-4 py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 disabled:opacity-50 shadow-xs"
            >
              {savingDay ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </form>
      </SidePanel>

      {/* ── Salary Slip View Modal ── */}
      <SidePanel
        isOpen={Boolean(viewSlipPayroll)}
        onClose={() => setViewSlipPayroll(null)}
        title={`Salary Slip: ${viewSlipPayroll?.employeeName}`}
        subtitle={`Period: ${viewSlipPayroll?.month}`}
        width="lg"
        footer={
          <button
            onClick={() => viewSlipPayroll && handleDownloadSalarySlip(viewSlipPayroll)}
            disabled={downloadingSlip}
            className="px-4 py-2 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Salary Slip PDF
          </button>
        }
      >
        {viewSlipPayroll && (
          <SalarySlipDocument
            payroll={viewSlipPayroll}
            employee={employees.find((e) => e.id === viewSlipPayroll.employeeId)}
            settings={settings}
          />
        )}
      </SidePanel>
    </div>
  );
}
