"use client";

import { useState, useEffect } from "react";
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

// Shown on iOS Safari when the app is not installed as a PWA.
// iOS never fires beforeinstallprompt, so InstallPrompt never appears there —
// these two components are mutually exclusive by platform.
export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone =
      navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("ios-install-dismissed") === "1";
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    sessionStorage.setItem("ios-install-dismissed", "1");
    setShow(false);
  }

  return (
    <div style={{
      position: "fixed", bottom: "1rem", left: "1rem", zIndex: 999,
      maxWidth: 248,
      background: "#1a1a1a", border: "1px solid #333",
      borderRadius: 16, padding: "12px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 13 }}>הפעל התראות טיימר</div>
        </div>
        <button
          onClick={dismiss}
          aria-label="סגור"
          style={{
            background: "none", border: "none", color: "#666",
            fontSize: 18, lineHeight: 1, cursor: "pointer", padding: "0 0 0 6px",
          }}
        >×</button>
      </div>
      <div style={{ color: "#999", fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
        להתראות על סיום זמן המנוחה, הוסף את LiftLog למסך הבית.
      </div>
      <div style={{
        color: "#ccc", fontSize: 12, background: "#252525",
        borderRadius: 8, padding: "8px 10px", lineHeight: 1.7,
      }}>
        <span>לחץ על </span>
        <span style={{ fontSize: 15 }}>⬆</span>
        <span> בסרגל Safari</span>
        <br />
        <span>← גלול ← </span>
        <strong style={{ color: "#f0ede8" }}>"הוסף למסך הבית"</strong>
      </div>
    </div>
  );
}
