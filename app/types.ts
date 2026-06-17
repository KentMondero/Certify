export interface NameBox {
  x: number; // percent of preview width (0–100)
  y: number; // percent of preview height (0–100)
  width: number; // percent of preview width
  height: number; // percent of preview height
}

export interface FontSettings {
  family: "Helvetica" | "Helvetica-Bold" | "Times-Roman" | "Times-Bold" | "Courier" | "Courier-Bold";
  size: number;
  color: string; // hex
}

export type PageSize = "A4" | "Letter" | "Custom";
export type Orientation = "landscape" | "portrait";

export interface PageSettings {
  size: PageSize;
  orientation: Orientation;
  copies: number;
  customWidth?: number;  // mm
  customHeight?: number; // mm
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: "idle" | "generating" | "done" | "error";
  message: string;
}

// PDF points per mm
export const MM_TO_PT = 72 / 25.4;

export const PAGE_SIZES: Record<PageSize, { w: number; h: number; unit: string }> = {
  A4:     { w: 210,  h: 297,  unit: "mm" },
  Letter: { w: 215.9, h: 279.4, unit: "mm" },
  Custom: { w: 210,  h: 297,  unit: "mm" },
};
