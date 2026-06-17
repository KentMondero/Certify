"use client";
import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
  FileImage, FileText, Type, Settings2, Download,
  Loader2, ChevronDown, Users, Layers, RefreshCw,
} from "lucide-react";
import DropZone from "./components/DropZone";
import TemplateEditor from "./components/TemplateEditor";
import { generateCertificatePDF } from "./utils/pdfGenerator";
import {
  NameBox, FontSettings, PageSettings, PageSize, Orientation,
} from "./types";

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--accent2)" }}>{icon}</span>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{children}</span>;
}

function StyledSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm appearance-none pr-8 outline-none"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--muted)" }} />
    </div>
  );
}

function StyledInput({ type = "text", value, onChange, min, max }: {
  type?: string; value: string | number; onChange: (v: string) => void;
  min?: number; max?: number;
}) {
  return (
    <input type={type} value={value} min={min} max={max}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg px-3 py-2 text-sm w-full outline-none"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
  );
}

export default function Home() {
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [templateBytes, setTemplateBytes] = useState<ArrayBuffer | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [csvName, setCsvName] = useState("");
  const [nameBox, setNameBox] = useState<NameBox>({ x: 25, y: 45, width: 50, height: 12 });
  const [fontSettings, setFontSettings] = useState<FontSettings>({ family: "Helvetica", size: 36, color: "#ffffff" });
  const [customFontFile, setCustomFontFile] = useState<File | null>(null);
  const customFontBytesRef = useRef<ArrayBuffer | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSettings>({ size: "A4", orientation: "landscape", copies: 1 });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [genStatus, setGenStatus] = useState<"idle"|"generating"|"done"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTemplate = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      setTemplateBytes(buf);
      setTemplateUrl(URL.createObjectURL(file));
      setTemplateName(file.name);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleCsv = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const key = Object.keys(results.data[0] || {}).find(k => k.toLowerCase().includes("name"));
        if (!key) { alert("No 'Name' column found."); return; }
        const parsed = results.data.map(r => r[key]).filter(Boolean);
        setNames(parsed); setCsvName(file.name);
      },
    });
  }, []);

  const handleCustomFont = useCallback((file: File) => {
    setCustomFontFile(file);
    const reader = new FileReader();
    reader.onload = (e) => { customFontBytesRef.current = e.target?.result as ArrayBuffer; };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleGenerate = async () => {
    if (!templateBytes) { alert("Upload a template image."); return; }
    if (!names.length) { alert("Upload a CSV with names."); return; }
    setGenStatus("generating");
    setProgress({ current: 0, total: names.length * pageSettings.copies });
    try {
      const pdfBytes = await generateCertificatePDF(
        templateBytes, names, nameBox, fontSettings, pageSettings,
        customFontBytesRef.current,
        (cur, tot) => setProgress({ current: cur, total: tot }),
      );
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "certificates.pdf"; a.click();
      URL.revokeObjectURL(url);
      setGenStatus("done");
    } catch (err) { setErrorMsg(String(err)); setGenStatus("error"); }
  };

  const isReady = !!templateBytes && names.length > 0;
  const progressPct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))" }}>
            <Layers size={16} color="#fff" />
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>Certify</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Upload template · add names · position · export PDF</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full"
          style={{ background: "var(--surface2)", color: "var(--accent2)", border: "1px solid var(--border)" }}>
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6" style={{ minHeight: "calc(100vh - 65px)" }}>

        {/* Left Column */}
        <div className="flex flex-col gap-4 w-full lg:w-80 xl:w-96 shrink-0">

          <SectionCard title="Certificate Template" icon={<FileImage size={14} />}>
            <DropZone accept="image/png,image/jpeg" label="Drop PNG template here"
              sublabel="PNG, JPG · high-res recommended" onFile={handleTemplate} fileName={templateName} />
            {templateUrl && (
              <div className="flex flex-col gap-2">
                <img src={templateUrl} alt="thumb" className="w-full rounded-lg object-cover"
                  style={{ maxHeight: 80, border: "1px solid var(--border)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate" style={{ color: "var(--muted)" }}>{templateName}</span>
                  <button
                    onClick={() => { setTemplateUrl(null); setTemplateBytes(null); setTemplateName(""); }}
                    className="text-xs shrink-0 ml-2"
                    style={{ color: "var(--muted)" }}
                  >
                    clear
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Student Names" icon={<FileText size={14} />}>
            <DropZone accept=".csv,text/csv" label="Drop CSV file here"
              sublabel={'Must have a "Name" column header'} onFile={handleCsv} fileName={csvName} />
            {names.length > 0 && (
              <div className="rounded-lg p-3 flex flex-col gap-2"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} style={{ color: "var(--success)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                      {names.length} names loaded
                    </span>
                  </div>
                  <button onClick={() => { setNames([]); setCsvName(""); }} className="text-xs" style={{ color: "var(--muted)" }}>clear</button>
                </div>
                {names.slice(0, 3).map((n, i) => (
                  <span key={i} className="text-xs truncate px-2 py-1 rounded"
                    style={{ background: "var(--surface)", color: "var(--text)" }}>{i+1}. {n}</span>
                ))}
                {names.length > 3 && <span className="text-xs pl-2" style={{ color: "var(--muted)" }}>+{names.length-3} more…</span>}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Font Settings" icon={<Type size={14} />}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label>Font Family</Label>
                <StyledSelect value={fontSettings.family} onChange={v => setFontSettings(p => ({ ...p, family: v as FontSettings["family"] }))}>
                  <option value="Helvetica">Helvetica (sans-serif)</option>
                  <option value="Helvetica-Bold">Helvetica Bold</option>
                  <option value="Times-Roman">Times Roman (serif)</option>
                  <option value="Times-Bold">Times Roman Bold</option>
                  <option value="Courier">Courier (mono)</option>
                  <option value="Courier-Bold">Courier Bold</option>
                </StyledSelect>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Font Size</Label>
                  <span className="text-xs font-mono" style={{ color: "var(--accent2)" }}>{fontSettings.size}pt</span>
                </div>
                <input type="range" min={8} max={120} step={1} value={fontSettings.size}
                  onChange={e => setFontSettings(p => ({ ...p, size: parseInt(e.target.value) }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Font Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={fontSettings.color}
                    onChange={e => setFontSettings(p => ({ ...p, color: e.target.value }))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)" }} />
                  <StyledInput value={fontSettings.color}
                    onChange={v => { if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setFontSettings(p => ({ ...p, color: v })); }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Custom Font (.ttf/.otf) — optional</Label>
                <DropZone accept=".ttf,.otf" label="Drop font file here" sublabel="Overrides font family above"
                  onFile={handleCustomFont} fileName={customFontFile?.name} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Page Layout" icon={<Settings2 size={14} />}>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label>Page Size</Label>
                  <StyledSelect value={pageSettings.size} onChange={v => setPageSettings(p => ({ ...p, size: v as PageSize }))}>
                    <option value="A4">A4 (210×297mm)</option>
                    <option value="Letter">Letter (8.5×11in)</option>
                    <option value="Custom">Custom</option>
                  </StyledSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Orientation</Label>
                  <StyledSelect value={pageSettings.orientation} onChange={v => setPageSettings(p => ({ ...p, orientation: v as Orientation }))}>
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </StyledSelect>
                </div>
              </div>
              {pageSettings.size === "Custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label>Width (mm)</Label>
                    <StyledInput type="number" value={pageSettings.customWidth ?? 297}
                      onChange={v => setPageSettings(p => ({ ...p, customWidth: parseFloat(v) }))} min={50} max={1200} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Height (mm)</Label>
                    <StyledInput type="number" value={pageSettings.customHeight ?? 210}
                      onChange={v => setPageSettings(p => ({ ...p, customHeight: parseFloat(v) }))} min={50} max={1200} />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Copies per student</Label>
                  <span className="text-xs font-mono" style={{ color: "var(--accent2)" }}>{pageSettings.copies}</span>
                </div>
                <StyledInput type="number" value={pageSettings.copies}
                  onChange={v => setPageSettings(p => ({ ...p, copies: Math.max(1, parseInt(v) || 1) }))} min={1} max={10} />
              </div>
              {names.length > 0 && (
                <div className="rounded-lg px-3 py-2 text-xs flex items-center justify-between"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--muted)" }}>Total pages</span>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{names.length * pageSettings.copies}</span>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="rounded-xl p-4 flex flex-col flex-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: 400 }}>
            {templateUrl ? (
              <TemplateEditor templateUrl={templateUrl} nameBox={nameBox} onNameBoxChange={setNameBox}
                fontSettings={fontSettings} previewName={names[0] ?? "Student Name"} />
            ) : (
              <div className="flex-1 rounded-xl flex flex-col items-center justify-center gap-3"
                style={{ background: "var(--surface2)", border: "2px dashed var(--border)" }}>
                <FileImage size={40} style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>Upload a template to start positioning the name</p>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {genStatus === "generating" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--muted)" }}>Processing certificate {progress.current} of {progress.total}…</span>
                  <span className="font-semibold" style={{ color: "var(--accent2)" }}>{progressPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent2))" }} />
                </div>
              </div>
            )}
            {genStatus === "done" && (
              <div className="text-xs text-center py-1" style={{ color: "var(--success)" }}>
                ✓ PDF downloaded — {progress.total} certificate{progress.total !== 1 ? "s" : ""} generated
              </div>
            )}
            {genStatus === "error" && (
              <div className="text-xs rounded-lg px-3 py-2"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                Error: {errorMsg}
              </div>
            )}
            <button
              onClick={genStatus === "done" ? () => setGenStatus("idle") : handleGenerate}
              disabled={genStatus === "generating" || !isReady}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: !isReady || genStatus === "generating" ? "var(--surface2)"
                  : genStatus === "done" ? "rgba(52,211,153,0.15)"
                  : "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: !isReady ? "var(--muted)" : genStatus === "done" ? "var(--success)" : "#fff",
                border: genStatus === "done" ? "1px solid var(--success)" : "none",
                cursor: !isReady || genStatus === "generating" ? "not-allowed" : "pointer",
                opacity: genStatus === "generating" ? 0.7 : 1,
              }}
            >
              {genStatus === "generating" ? <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
                : genStatus === "done" ? <><RefreshCw size={16} /> Generate Another</>
                : <><Download size={16} /> Generate &amp; Download Print-Ready PDF</>}
            </button>
            {!isReady && (
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                {!templateBytes && !names.length ? "Upload a template and CSV to get started"
                  : !templateBytes ? "Upload a certificate template to continue"
                  : "Upload a CSV with student names to continue"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
