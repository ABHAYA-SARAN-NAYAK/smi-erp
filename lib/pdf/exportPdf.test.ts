// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertUnscaled } from "./exportPdf";

describe("assertUnscaled", () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => ({
      transform: (element as HTMLElement).style.transform || "none",
      zoom: (element as HTMLElement).style.zoom || "1",
      scale: "none", rotate: "none", translate: "none",
    } as CSSStyleDeclaration));
  });
  it("passes for a plain document page", () => {
    const page = document.createElement("div");
    document.body.appendChild(page);
    expect(() => assertUnscaled(page)).not.toThrow();
  });
  it("fails when an ancestor is transformed", () => {
    const parent = document.createElement("div");
    parent.style.transform = "scale(0.8)";
    const page = document.createElement("div");
    parent.appendChild(page);
    document.body.appendChild(parent);
    expect(() => assertUnscaled(page)).toThrow(/transform/);
  });
  it("fails when an ancestor is zoomed", () => {
    const parent = document.createElement("div");
    parent.style.zoom = "0.8";
    const page = document.createElement("div");
    parent.appendChild(page);
    document.body.appendChild(parent);
    expect(() => assertUnscaled(page)).toThrow(/zoom/);
  });
  it("fails when rendered bounds differ from layout bounds", () => {
    const page = document.createElement("div");
    document.body.appendChild(page);
    Object.defineProperty(page, "offsetWidth", { configurable: true, value: 794 });
    vi.spyOn(page, "getBoundingClientRect").mockReturnValue({ width: 635, height: 1123 } as DOMRect);
    expect(() => assertUnscaled(page)).toThrow(/bounds/);
  });
});
