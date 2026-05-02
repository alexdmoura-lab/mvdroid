// ════════════════════════════════════════════════════════════════
// EmptyState — placeholder estilo Apple Health pra listas vazias.
// SVG circular com gradiente do accent color e o emoji passado.
// Standalone (sem deps externas além de React).
// Refactor v296 Camada 3: extraído do App.jsx.
// ════════════════════════════════════════════════════════════════
import React from "react";

export const EmptyState = ({ icon, title, hint, accent = "#007aff", dark: isDark }) => {
  const grad = `url(#emptyGrad-${accent.replace("#", "")})`;
  return (
    <div
      style={{
        padding: "28px 20px",
        textAlign: "center",
        background: isDark
          ? "linear-gradient(180deg,rgba(255,255,255,0.02) 0%,transparent 100%)"
          : "linear-gradient(180deg,rgba(0,0,0,0.015) 0%,transparent 100%)",
        borderRadius: 14,
        marginBottom: 10,
        border: `1.5px dashed ${accent}33`,
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        style={{ marginBottom: 10, filter: `drop-shadow(0 2px 6px ${accent}30)` }}
      >
        <defs>
          <linearGradient id={`emptyGrad-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={grad} stroke={accent + "55"} strokeWidth="1.2" />
        <text x="32" y="42" textAnchor="middle" fontSize="28">{icon}</text>
      </svg>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: isDark ? "#fff" : "#000",
          letterSpacing: -0.3,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: isDark ? "#999" : "#666", lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
};
