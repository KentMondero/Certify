# Certify

A multiple certificate generator that lets you upload a certificate template, add a list of names from a CSV or Excel file, edit the name on the template, and export it as PDF.

---

## Features

- **Drag-and-drop template upload** — supports PNG and JPG certificate templates at any resolution
- **CSV and Excel support** — load student names from `.csv`, `.xlsx`, or `.xls` files; the app automatically detects the `Name` column
- **Interactive name positioning** — drag and resize a bounding box directly over the template preview to place names exactly where you want them
- **Font customization** — choose from Helvetica, Times Roman, or Courier (regular and bold variants), adjust font size with a slider, and pick any font color
- **Custom font support** — upload your own `.ttf` or `.otf` font file to override the built-in fonts
- **Page layout control** — supports A4, Letter, and custom page sizes in landscape or portrait orientation
- **Multiple copies per student** — generate 1–10 copies per name in a single PDF
- **Dynamic text centering** — names are always centered within the bounding box regardless of length
- **Long name overflow protection** — font size automatically scales down for names that would otherwise overflow the box
- **High-resolution output** — the original PNG is embedded without compression so the PDF prints crisply at 300 DPI
- **Progress tracking** — a live progress bar shows how many pages have been compiled while the PDF is generating
- **100% client-side** — no server, no database, no file uploads to any external service; everything runs in your browser

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| UI | React, Tailwind CSS, Lucide React |
| PDF generation | pdf-lib |
| CSV parsing | PapaParse |
| Excel parsing | xlsx (SheetJS) |

---

## How to Use

1. **Upload a template** — drag and drop a PNG or JPG certificate image into the Template upload zone. A thumbnail preview will appear.
2. **Load names** — drag and drop a CSV or Excel file that has a column named `Name`. The app will show the first 3 names and the total count.
3. **Position the name** — in the right-side editor, drag the purple bounding box to the spot on the template where names should print. Drag the corner handles to resize the box.
4. **Configure font** — choose a font family, adjust the size slider, and pick a color using the color picker or by typing a hex code. Optionally upload a custom `.ttf` or `.otf` font.
5. **Set page layout** — choose page size (A4, Letter, or custom dimensions), orientation (landscape or portrait), and number of copies per student.
6. **Generate** — click **Generate & Download Print-Ready PDF**. A progress bar tracks compilation. The PDF downloads automatically when done.

### CSV / Excel format

Your file must have a header row with a column that includes the word `Name` (case-insensitive). Extra columns are ignored.

**Example CSV:**
```
Name,Course,Year
Juan dela Cruz,Computer Science,4
Maria Santos,Nursing,3
```

**Example Excel:** Same structure, just saved as `.xlsx` or `.xls`.

