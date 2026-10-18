import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

function isIdentityTransform(value: string): boolean {
  return value === "none" || value === "matrix(1, 0, 0, 1, 0, 0)" || value === "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
}

export function assertUnscaled(pageEl: HTMLElement): void {
  let current: HTMLElement | null = pageEl;
  while (current) {
    const style = getComputedStyle(current);
    if (!isIdentityTransform(style.transform)) throw new Error(`PDF layout check failed: transform found on ${current.className || current.tagName}.`);
    if (style.zoom !== "1" && style.zoom !== "normal") throw new Error(`PDF layout check failed: zoom found on ${current.className || current.tagName}.`);
    if (style.scale !== "none" || style.rotate !== "none" || style.translate !== "none") throw new Error(`PDF layout check failed: individual transform found on ${current.className || current.tagName}.`);
    current = current.parentElement;
  }
  const rect = pageEl.getBoundingClientRect();
  if (Math.abs(rect.width - pageEl.offsetWidth) > 0.5 || Math.abs(rect.height - pageEl.offsetHeight) > 0.5) {
    throw new Error("PDF layout check failed: page bounds are scaled.");
  }
}

export async function capturePageToCanvas(pageEl: HTMLElement): Promise<HTMLCanvasElement> {
  assertUnscaled(pageEl);
  await document.fonts.ready;
  await Promise.all([
    ...[500, 600, 700].map((weight) => document.fonts.load(`${weight} 26px Fraunces`)),
    ...[400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 14px Inter`)),
  ]);
  await Promise.all(Array.from(pageEl.querySelectorAll("img")).map(async (image) => {
    if (!image.complete) await new Promise<void>((resolve) => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); });
    try { await image.decode(); } catch { /* Missing logos do not block export. */ }
  }));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  return html2canvas(pageEl, {
    scale: 2, useCORS: true, backgroundColor: "#FFFDF8", width: 794, height: 1123,
    windowWidth: 794, windowHeight: 1123, x: 0, y: 0, scrollX: 0, scrollY: 0, logging: false,
    onclone: (clonedDocument) => {
      const clonedPage = clonedDocument.querySelector<HTMLElement>(".doc-page");
      let current = clonedPage;
      while (current) { current.style.transform = "none"; current.style.zoom = "1"; current = current.parentElement as HTMLElement | null; }
    },
  });
}

export async function downloadInvoicePdf(elementId: string, filename = "Invoice.pdf"): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Document preview is unavailable.");
  const stage = element.closest<HTMLElement>(".doc-preview-stage") || element.parentElement;
  const pages = stage ? Array.from(stage.querySelectorAll<HTMLElement>(".doc-page")) : [element];
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    if (index > 0) pdf.addPage("a4", "portrait");
    const canvas = await capturePageToCanvas(pages[index]);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 595.28, 841.89, undefined, "FAST");
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
