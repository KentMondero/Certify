import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import { NameBox, FontSettings, PageSettings, MM_TO_PT, PAGE_SIZES } from "../types";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

function getFontName(family: string): StandardFonts {
  switch (family) {
    case "Helvetica-Bold": return StandardFonts.HelveticaBold;
    case "Times-Roman": return StandardFonts.TimesRoman;
    case "Times-Bold": return StandardFonts.TimesRomanBold;
    case "Courier": return StandardFonts.Courier;
    case "Courier-Bold": return StandardFonts.CourierBold;
    default: return StandardFonts.Helvetica;
  }
}

/** Fit font size so text width <= maxWidth, starting from fontSize */
function fitFontSize(font: PDFFont, text: string, fontSize: number, maxWidth: number): number {
  let size = fontSize;
  while (size > 6) {
    const w = font.widthOfTextAtSize(text, size);
    if (w <= maxWidth) break;
    size -= 1;
  }
  return size;
}

export async function generateCertificatePDF(
  templateBytes: ArrayBuffer,
  names: string[],
  nameBox: NameBox,
  fontSettings: FontSettings,
  pageSettings: PageSettings,
  customFontBytes: ArrayBuffer | null,
  onProgress: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed template image
  const templateImage = await pdfDoc.embedPng(templateBytes);
  const { width: imgW, height: imgH } = templateImage;

  // Resolve page dimensions in points
  const sizeDef = PAGE_SIZES[pageSettings.size];
  let pageWmm = sizeDef.w;
  let pageHmm = sizeDef.h;
  if (pageSettings.size === "Custom") {
    pageWmm = pageSettings.customWidth ?? 210;
    pageHmm = pageSettings.customHeight ?? 297;
  }

  let pageWpt = pageWmm * MM_TO_PT;
  let pageHpt = pageHmm * MM_TO_PT;
  if (pageSettings.orientation === "landscape") {
    [pageWpt, pageHpt] = [Math.max(pageWpt, pageHpt), Math.min(pageWpt, pageHpt)];
  } else {
    [pageWpt, pageHpt] = [Math.min(pageWpt, pageHpt), Math.max(pageWpt, pageHpt)];
  }

  // Embed font
  let font: PDFFont;
  if (customFontBytes) {
    font = await pdfDoc.embedFont(customFontBytes);
  } else {
    font = await pdfDoc.embedFont(getFontName(fontSettings.family));
  }

  const color = hexToRgb(fontSettings.color);

  // The name box is expressed as % of the preview image area.
  // We need to map to PDF points.
  // The template image is drawn to fill the page (cover), preserving aspect ratio.
  const imgAspect = imgW / imgH;
  const pageAspect = pageWpt / pageHpt;

  let drawW: number, drawH: number, offsetX: number, offsetY: number;
  if (imgAspect > pageAspect) {
    // Image wider than page — fit to page width
    drawW = pageWpt;
    drawH = pageWpt / imgAspect;
    offsetX = 0;
    offsetY = (pageHpt - drawH) / 2;
  } else {
    // Image taller — fit to page height
    drawH = pageHpt;
    drawW = pageHpt * imgAspect;
    offsetX = (pageWpt - drawW) / 2;
    offsetY = 0;
  }

  // Name box in PDF points (nameBox is % of drawn image area)
  const boxXpt = offsetX + (nameBox.x / 100) * drawW;
  const boxYpt = offsetY + (nameBox.y / 100) * drawH;
  const boxWpt = (nameBox.width / 100) * drawW;
  const boxHpt = (nameBox.height / 100) * drawH;

  const total = names.length * pageSettings.copies;
  let processed = 0;

  for (const name of names) {
    for (let copy = 0; copy < pageSettings.copies; copy++) {
      const page = pdfDoc.addPage([pageWpt, pageHpt]);

      // Draw template (full page, letterbox if needed)
      page.drawImage(templateImage, {
        x: offsetX,
        y: offsetY,
        width: drawW,
        height: drawH,
      });

      // Calculate text dimensions
      const maxTextWidth = boxWpt * 0.95;
      const fittedSize = fitFontSize(font, name, fontSettings.size, maxTextWidth);
      const textWidth = font.widthOfTextAtSize(name, fittedSize);
      const textHeight = font.heightAtSize(fittedSize);

      // Center text in box
      // PDF y=0 is bottom; nameBox.y is from top → convert
      const textX = boxXpt + (boxWpt - textWidth) / 2;
      const boxBottomPt = pageHpt - boxYpt - boxHpt;
      const textY = boxBottomPt + (boxHpt - textHeight) / 2;

      page.drawText(name, {
        x: textX,
        y: textY,
        size: fittedSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });

      processed++;
      onProgress(processed, total);

      // Yield to browser to allow UI updates every 5 pages
      if (processed % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }

  return pdfDoc.save();
}
