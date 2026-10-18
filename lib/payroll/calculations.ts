import type { AttendanceEntry, Employee, Holiday, PayrollRow, Settings } from "@/lib/data-layer/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function monthKey(date: string): string {
  const [year, month] = date.split("-").map(Number);
  return Number.isFinite(year) && Number.isFinite(month) ? `${MONTHS[month - 1]}-${year}` : "Unknown";
}

export function monthParts(month: string): { year: number; monthIndex: number; days: number } {
  const [name, yearText] = month.split("-");
  const monthIndex = MONTHS.indexOf(name as (typeof MONTHS)[number]);
  const year = Number(yearText);
  return { year, monthIndex, days: new Date(year, monthIndex + 1, 0).getDate() };
}

function inEmployment(employee: Employee, date: string): boolean {
  return (!employee.joiningDate || date >= employee.joiningDate) && (!employee.lastWorkingDate || date <= employee.lastWorkingDate);
}

export function computeEmployeeMonth(employee: Employee, month: string, attendance: AttendanceEntry[], settings: Settings, holidays: Holiday[] = []): PayrollRow {
  const { year, monthIndex, days } = monthParts(month);
  const shiftHours = employee.shiftHours ?? 8;
  const entries = attendance.filter((entry) => entry.employeeId === employee.id && monthKey(entry.date) === month);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  let present = 0;
  let paidOffDays = 0;
  let otHours = 0;
  let holidayOtHours = 0;
  let advances = 0;
  for (let day = 1; day <= days; day += 1) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!inEmployment(employee, date)) continue;
    const entry = byDate.get(date);
    if (entry?.status === "Present") present += 1;
    const weekday = new Date(year, monthIndex, day).toLocaleDateString("en-US", { weekday: "long" }) as Employee["weeklyOff"];
    const isOffOrHoliday = weekday === employee.weeklyOff || holidays.some((holiday) => holiday.date === date);
    if (employee.salaryType === "Monthly" && settings.payMonthlyOffsAndHolidays && isOffOrHoliday && entry?.status !== "Absent") paidOffDays += 1;
    otHours += entry?.otHours || 0;
    holidayOtHours += entry?.holidayOtHours || 0;
    advances += entry?.advance || 0;
  }
  const paidHours = employee.salaryType === "Monthly" ? (present + paidOffDays) * shiftHours : present * shiftHours;
  const hourlyRate = employee.salaryType === "Monthly" ? employee.rate / (days * shiftHours) : employee.salaryType === "Daily" ? employee.rate / shiftHours : employee.rate;
  const baseSalary = employee.salaryType === "Monthly" ? paidHours * hourlyRate : employee.salaryType === "Daily" ? present * employee.rate : paidHours * employee.rate;
  const otPay = otHours * hourlyRate;
  const holidayOtPay = holidayOtHours * hourlyRate * (settings.holidayOtMultiplier || 2);
  const totalSalary = baseSalary + otPay + holidayOtPay;
  return {
    employeeId: employee.id, employeeName: employee.name, designation: employee.designation, month,
    totalDaysPresent: present, totalHours: paidHours + otHours + holidayOtHours, otHours, holidayOtHours,
    paidOffDays, hourlyRate, baseSalary, otPay, holidayOtPay, totalSalary, totalAdvances: advances,
    netPayable: totalSalary - advances,
  };
}
