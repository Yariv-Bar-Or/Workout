"use client";

import { useExport } from "@/hooks/useExport";

export default function ExportButton({ user, className }) {
  const { exportToCSV, isExporting } = useExport(user);

  return (
    <button
      onClick={exportToCSV}
      disabled={isExporting}
      className={className}
      dir="rtl"
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8, color: isExporting ? "#555" : "#ccc",
        fontSize: 12, fontWeight: 600,
        padding: "6px 12px", cursor: isExporting ? "not-allowed" : "pointer",
        opacity: isExporting ? 0.6 : 1,
      }}
    >
      <span>{isExporting ? "מייצא..." : "📥 ייצוא CSV"}</span>
    </button>
  );
}
