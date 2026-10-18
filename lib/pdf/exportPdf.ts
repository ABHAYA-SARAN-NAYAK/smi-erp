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
  const pageHeight = pdf.internal.pageSize.getHeight();
  const renderedHeight = (canvas.height * pdfWidth) / canvas.width;
  const pageCount = Math.max(1, Math.ceil(renderedHeight / pageHeight));
  const sourcePageHeight = Math.floor(canvas.height / pageCount);

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) pdf.addPage();
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = page === pageCount - 1
      ? canvas.height - sourcePageHeight * page
      : sourcePageHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare PDF page.");
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      page * sourcePageHeight,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height,
    );
    const pageImage = pageCanvas.toDataURL("image/png");
    const pageImageHeight = (pageCanvas.height * pdfWidth) / pageCanvas.width;
    pdf.addImage(pageImage, "PNG", 0, 0, pdfWidth, pageImageHeight);
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
