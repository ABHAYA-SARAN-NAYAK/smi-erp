import { DataLayer } from "./interface";
import { MockDataAdapter } from "./mockAdapter";
import { SheetsDataAdapter } from "./sheetsAdapter";

// Environment variable determines active adapter (default: "mock")
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";

export const dataLayer: DataLayer =
  DATA_SOURCE === "sheets" ? new SheetsDataAdapter() : new MockDataAdapter();

export * from "./types";
export * from "./interface";
export { MockDataAdapter } from "./mockAdapter";
export { SheetsDataAdapter } from "./sheetsAdapter";
