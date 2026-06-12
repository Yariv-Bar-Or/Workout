"use client";

const DURATIONS = [60, 120, 180, 240];

async function subscribeToPush() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });
}

export default function RestTimerModal({ onClose }) {
  function handleSelect(seconds) {
    localStorage.setItem("restTimerDuration", String(seconds));
    sessionStorage.setItem("restTimerModalShown", "1");
    subscribeToPush();
    onClose();
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.78)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      direction: "rtl",
    }}>
      <div style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,107,53,0.22)",
        borderRadius: 20,
        padding: "28px 24px",
        width: "100%",
        maxWidth: 360,
      }}>
        <h2 style={{
          color: "#f0ede8",
          fontSize: 20,
          fontWeight: 800,
          margin: "0 0 6px",
        }}>
          כמה זמן מנוחה בין סטים?
        </h2>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 22px" }}>
          הטיימר יתחיל אוטומטית אחרי כל סט
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => handleSelect(d)}
              style={{
                height: 60,
                borderRadius: 12,
                border: "1px solid rgba(255,107,53,0.3)",
                background: "rgba(255,107,53,0.08)",
                color: "#ff6b35",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800 }}>{d}</span>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>שנ׳</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleSelect(0)}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "#555",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ללא טיימר
        </button>
      </div>
    </div>
  );
}
