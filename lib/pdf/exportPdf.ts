import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Captures the specified HTML element (the live invoice paper preview)
 * and generates a downloadable PDF matching the preview layout exactly.
 */
export async function downloadInvoicePdf(
  elementId: string,
  filename: string = "Invoice.pdf"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found for PDF export.`);
  }

  // Temporary scale adjustment for crisp high-DPI rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#fffdf8", // PRD §5 --paper background
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
