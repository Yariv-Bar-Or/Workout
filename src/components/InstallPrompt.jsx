"use client";

import { usePWA } from "@/hooks/usePWA";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled || !isInstallable) return null;

  return (
    <div style={{
      position: "fixed", bottom: "1rem", left: "1rem", zIndex: 999,
      maxWidth: 220,
      background: "#1a1a1a", border: "1px solid #333",
      borderRadius: 16, padding: "12px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>🏋️</span>
        <div>
          <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 13 }}>התקן את LiftLog</div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>גישה מהירה מהמסך הראשי</div>
        </div>
      </div>
      <button
        onClick={promptInstall}
        style={{
          width: "100%", background: "#2563eb", border: "none", borderRadius: 8,
          color: "#fff", fontSize: 13, fontWeight: 700,
          padding: "7px 0", cursor: "pointer",
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
