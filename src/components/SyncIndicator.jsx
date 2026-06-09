"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function SyncIndicator() {
  const { pendingCount, isSyncing } = useOfflineSync(null);

  if (isSyncing) {
    return (
      <div style={{
        position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 1001, background: "#1a1a1a", border: "1px solid #333",
        borderRadius: 20, padding: "6px 14px",
        color: "#4ade80", fontSize: 12, fontWeight: 700,
        fontFamily: "system-ui, -apple-system, sans-serif",
        direction: "rtl", whiteSpace: "nowrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>
        ✅ מסנכרן...
      </div>
    );
  }

  if (pendingCount === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
      zIndex: 1001, background: "#1a1a1a", border: "1px solid #f59e0b",
      borderRadius: 20, padding: "6px 14px",
      color: "#f59e0b", fontSize: 12, fontWeight: 700,
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl", whiteSpace: "nowrap",
      boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    }}>
      🔄 {pendingCount} פעולות ממתינות לסנכרון
    </div>
  );
}
