export function formatInvoiceDate(value?: string): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function splitPhoneNumbers(value?: string): string[] {
  return (value || "—")
    .split("/")
    .map((phone) => phone.trim())
    .filter(Boolean);
}

export function addDateOnlyDays(value: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
