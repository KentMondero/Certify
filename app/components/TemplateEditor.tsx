"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Move } from "lucide-react";
import { NameBox, FontSettings } from "../types";

interface TemplateEditorProps {
  templateUrl: string;
  nameBox: NameBox;
  onNameBoxChange: (box: NameBox) => void;
  fontSettings: FontSettings;
  previewName?: string;
}

type DragMode = "move" | "resize-se" | "resize-sw" | "resize-ne" | "resize-nw" | null;

export default function TemplateEditor({ templateUrl, nameBox, onNameBoxChange, fontSettings, previewName = "Student Name" }: TemplateEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; box: NameBox } | null>(null);
  const dragMode = useRef<DragMode>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pct = (v: number, total: number) => (v / total) * 100;

  const getPos = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: pct(e.clientX - rect.left, rect.width),
      y: pct(e.clientY - rect.top, rect.height),
    };
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = mode;
    dragStart.current = { ...getPos(e), box: { ...nameBox } };
    setIsDragging(true);
  }, [getPos, nameBox]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current || !dragMode.current || !containerRef.current) return;
      const pos = getPos(e);
      const dx = pos.x - dragStart.current.x;
      const dy = pos.y - dragStart.current.y;
      const prev = dragStart.current.box;

      let box = { ...prev };

      if (dragMode.current === "move") {
        box.x = Math.max(0, Math.min(100 - prev.width, prev.x + dx));
        box.y = Math.max(0, Math.min(100 - prev.height, prev.y + dy));
      } else if (dragMode.current === "resize-se") {
        box.width = Math.max(5, Math.min(100 - prev.x, prev.width + dx));
        box.height = Math.max(3, Math.min(100 - prev.y, prev.height + dy));
      } else if (dragMode.current === "resize-sw") {
        const newW = Math.max(5, prev.width - dx);
        box.x = prev.x + prev.width - newW;
        box.width = newW;
        box.height = Math.max(3, Math.min(100 - prev.y, prev.height + dy));
      } else if (dragMode.current === "resize-ne") {
        box.width = Math.max(5, Math.min(100 - prev.x, prev.width + dx));
        const newH = Math.max(3, prev.height - dy);
        box.y = prev.y + prev.height - newH;
        box.height = newH;
      } else if (dragMode.current === "resize-nw") {
        const newW = Math.max(5, prev.width - dx);
        box.x = prev.x + prev.width - newW;
        box.width = newW;
        const newH = Math.max(3, prev.height - dy);
        box.y = prev.y + prev.height - newH;
        box.height = newH;
      }

      onNameBoxChange(box);
    };

    const onUp = () => {
      dragStart.current = null;
      dragMode.current = null;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [getPos, onNameBoxChange]);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r},${g},${b})`;
  };

  const HANDLE = 10;
  const handles: { mode: DragMode; style: React.CSSProperties; cursor: string }[] = [
    { mode: "resize-nw", style: { top: -HANDLE/2, left: -HANDLE/2 }, cursor: "nw-resize" },
    { mode: "resize-ne", style: { top: -HANDLE/2, right: -HANDLE/2 }, cursor: "ne-resize" },
    { mode: "resize-sw", style: { bottom: -HANDLE/2, left: -HANDLE/2 }, cursor: "sw-resize" },
    { mode: "resize-se", style: { bottom: -HANDLE/2, right: -HANDLE/2 }, cursor: "se-resize" },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          TEMPLATE PREVIEW — drag box to position name
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface2)", color: "var(--accent2)" }}>
          {nameBox.x.toFixed(1)}%, {nameBox.y.toFixed(1)}%
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden flex-1 min-h-0"
        style={{
          background: "#1a1a2e",
          border: "1px solid var(--border)",
          cursor: isDragging ? "grabbing" : "default",
          userSelect: "none",
        }}
      >
        {/* Template image */}
        <img
          src={templateUrl}
          alt="Certificate template"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Draggable name box */}
        <div
          onMouseDown={(e) => startDrag(e, "move")}
          style={{
            position: "absolute",
            left: `${nameBox.x}%`,
            top: `${nameBox.y}%`,
            width: `${nameBox.width}%`,
            height: `${nameBox.height}%`,
            border: "2px solid var(--accent)",
            background: "rgba(108,99,255,0.08)",
            cursor: isDragging ? "grabbing" : "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(1px)",
          }}
        >
          {/* Preview text */}
          <span
            style={{
              color: hexToRgb(fontSettings.color),
              fontFamily: fontSettings.family.startsWith("Helvetica") ? "Arial, sans-serif"
                : fontSettings.family.startsWith("Times") ? "Georgia, serif"
                : "Courier New, monospace",
              fontSize: `clamp(8px, ${nameBox.height * 0.5}vh, ${nameBox.width * 0.2}vw)`,
              fontWeight: fontSettings.family.includes("Bold") ? "700" : "400",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "95%",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {previewName}
          </span>

          {/* Move icon */}
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              opacity: 0.6,
              pointerEvents: "none",
            }}
          >
            <Move size={12} color="var(--accent2)" />
          </div>

          {/* Resize handles */}
          {handles.map(({ mode, style, cursor }) => (
            <div
              key={mode}
              onMouseDown={(e) => startDrag(e, mode)}
              style={{
                position: "absolute",
                width: HANDLE,
                height: HANDLE,
                background: "var(--accent)",
                borderRadius: 2,
                cursor,
                zIndex: 10,
                ...style,
              }}
            />
          ))}
        </div>

        {/* Crosshair guides (shown while dragging) */}
        {isDragging && (
          <>
            <div style={{
              position: "absolute",
              left: `${nameBox.x + nameBox.width / 2}%`,
              top: 0, bottom: 0, width: 1,
              background: "rgba(108,99,255,0.3)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              top: `${nameBox.y + nameBox.height / 2}%`,
              left: 0, right: 0, height: 1,
              background: "rgba(108,99,255,0.3)",
              pointerEvents: "none",
            }} />
          </>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Drag the purple box to position · Drag corners to resize
      </p>
    </div>
  );
}
