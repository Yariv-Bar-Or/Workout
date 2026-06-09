"use client";

import { usePWA } from "@/hooks/usePWA";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled || !isInstallable) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: 16, right: 16, zIndex: 999,
      background: "#1a1a1a", border: "1px solid #333",
      borderRadius: 16, padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 12,
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl",
    }}>
      <span style={{ fontSize: 28 }}>🏋️</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 15 }}>התקן את LiftLog</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>גישה מהירה מהמסך הראשי</div>
      </div>
      <button
        onClick={promptInstall}
        style={{
          background: "#2563eb", border: "none", borderRadius: 10,
          color: "#fff", fontSize: 14, fontWeight: 700,
          padding: "8px 16px", cursor: "pointer", flexShrink: 0,
        }}
      >
        התקן
      </button>
    </div>
  );
}

export function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: "#b91c1c", color: "#fff",
      textAlign: "center", padding: "10px 16px",
      fontSize: 14, fontWeight: 600,
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl",
    }}>
      ⚠️ אין חיבור לאינטרנט — מציג נתונים שמורים
    </div>
  );
}
