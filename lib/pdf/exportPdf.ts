import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

async function preparePages(pages: HTMLElement[]): Promise<void> {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load("700 26px Fraunces"),
    document.fonts.load("400 14px Inter"),
    document.fonts.load("600 14px Inter"),
  ]);
  await Promise.all(pages.flatMap((page) => Array.from(page.querySelectorAll("img")).map(async (image) => {
    if (!image.complete) await new Promise<void>((resolve) => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); });
    try { await image.decode(); } catch { /* A missing logo should not block the document. */ }
  })));
}

export async function downloadInvoicePdf(elementId: string, filename = "Invoice.pdf"): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Document preview is unavailable.");
  const stage = element.closest<HTMLElement>(".doc-preview-stage") || element.parentElement;
  const pages = stage ? Array.from(stage.querySelectorAll<HTMLElement>(".doc-page")) : [element];
  await preparePages(pages);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  for (let index = 0; index < pages.length; index += 1) {
    if (index > 0) pdf.addPage("a4", "portrait");
    const page = pages[index];
    const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, backgroundColor: "#fffdf8", width: 794, height: 1123 });
    const image = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(image, "JPEG", 0, 0, 595.28, 841.89, undefined, "FAST");
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
