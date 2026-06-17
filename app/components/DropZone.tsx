"use client";
import { useRef, useState } from "react";
import { Upload, CheckCircle } from "lucide-react";

interface DropZoneProps {
  accept: string;
  label: string;
  sublabel?: string;
  onFile: (file: File) => void;
  fileName?: string;
  icon?: React.ReactNode;
}

export default function DropZone({ accept, label, sublabel, onFile, fileName, icon }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-5 text-center"
      style={{
        borderColor: dragging ? "var(--accent)" : fileName ? "var(--success)" : "var(--border)",
        background: dragging ? "rgba(108,99,255,0.06)" : "var(--surface2)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="flex flex-col items-center gap-2">
        {fileName ? (
          <>
            <CheckCircle size={22} style={{ color: "var(--success)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--success)" }}>{fileName}</span>
          </>
        ) : (
          <>
            {icon || <Upload size={22} style={{ color: "var(--muted)" }} />}
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</span>
            {sublabel && <span className="text-xs" style={{ color: "var(--muted)" }}>{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
}
