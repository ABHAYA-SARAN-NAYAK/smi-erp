export function formatInvoiceDate(value?: string): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function formatINR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const paise = Math.round(safe * 100);
  const sign = paise < 0 ? "-" : "";
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const cents = String(absolute % 100).padStart(2, "0");
  return `${sign}₹${rupees.toLocaleString("en-IN")}.${cents}`;
}

export function splitPhoneNumbers(value?: string): string[] {
  return (value || "—").split("/").map((phone) => phone.trim()).filter(Boolean);
}

export function addDateOnlyDays(value: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function paginate(rowHeights: number[], firstPageCapacity: number, otherPageCapacity: number, closingBlockHeight: number): number[][] {
  if (rowHeights.length === 0) return [[]];
  const pages: number[][] = [[]];
  let capacity = firstPageCapacity;
  let used = 0;
  rowHeights.forEach((height, index) => {
    if (used + height + (index === rowHeights.length - 1 ? closingBlockHeight : 0) > capacity && pages[pages.length - 1].length) {
      pages.push([]);
      capacity = otherPageCapacity;
      used = 0;
    }
    pages[pages.length - 1].push(index);
    used += height;
  });
  if (used + closingBlockHeight > capacity && pages[pages.length - 1].length > 1) {
    const moved = pages[pages.length - 1].splice(-2);
    pages.push(moved);
  }
  return pages;
}
