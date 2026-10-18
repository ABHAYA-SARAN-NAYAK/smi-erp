import { describe, expect, it } from "vitest";
import { formatINR, formatInvoiceDate, paginate } from "./invoice";

describe("invoice formatters", () => {
  it("formats INR safely to two paise", () => {
    expect(formatINR(0)).toBe("₹0.00");
    expect(formatINR(0.1 + 0.2)).toBe("₹0.30");
    expect(formatINR(3483.871)).toBe("₹3,483.87");
    expect(formatINR(2363.4)).toBe("₹2,363.40");
    expect(formatINR(1234567.5)).toBe("₹12,34,567.50");
    expect(formatINR(-10.5)).toBe("-₹10.50");
    expect(formatINR(Number.POSITIVE_INFINITY)).toBe("₹0.00");
  });
  it("formats ISO dates without timezone conversion", () => expect(formatInvoiceDate("2026-10-18")).toBe("18-10-2026"));
  it("paginates rows without splitting and reserves closing space", () => {
    expect(paginate([], 100, 100, 20)).toEqual([[]]);
    expect(paginate([20, 20], 100, 100, 20)).toEqual([[0, 1]]);
    expect(paginate([60, 60], 100, 100, 20)).toEqual([[0], [1]]);
    expect(paginate([40, 40, 40], 100, 100, 80)).toEqual([[0, 1], [2]]);
  });
});
