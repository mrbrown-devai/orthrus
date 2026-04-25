"use client";

import { useState, useEffect, useRef } from "react";

interface InfoTooltipProps {
  title?: string;
  children: React.ReactNode;     // the explanation content
  size?: number;                  // icon size, default 14
  color?: string;                 // icon color, default cyan
}

/**
 * A small (i) info icon that opens a popover with an explanation.
 * Closes when clicking outside.
 */
export function InfoTooltip({ title, children, size = 14, color = "#00F5FF" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={title ? `Info: ${title}` : "More info"}
        style={{
          width: size + 4, height: size + 4, borderRadius: "50%",
          background: open ? color : "rgba(255,255,255,0.04)",
          border: `1px solid ${color}40`,
          color: open ? "#000" : color,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: size - 2,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          marginLeft: 6,
          lineHeight: 1,
          transition: "all 0.15s",
        }}
      >
        i
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: size + 12,
          left: -10,
          minWidth: 280,
          maxWidth: 360,
          padding: 14,
          background: "#0a0a14",
          border: `1px solid ${color}50`,
          borderRadius: 10,
          boxShadow: `0 0 30px ${color}20, 0 12px 40px rgba(0,0,0,0.6)`,
          zIndex: 1000,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.7,
        }}>
          {title && (
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: color,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: `1px solid ${color}20`,
            }}>{title}</div>
          )}
          <div>{children}</div>
        </div>
      )}
    </span>
  );
}
