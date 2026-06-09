"use client";

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#f0ede8", direction: "rtl", textAlign: "center", padding: "0 24px",
    }}>
      <span style={{ fontSize: 64, marginBottom: 24 }}>📶</span>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>אין חיבור לאינטרנט</h1>
      <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6, margin: "0 0 32px" }}>
        לא ניתן להתחבר לשרת כרגע.<br />בדוק את החיבור שלך ונסה שוב.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#ff6b35", border: "none", borderRadius: 12,
          color: "#fff", fontSize: 16, fontWeight: 700,
          padding: "14px 32px", cursor: "pointer",
        }}
      >
        נסה שוב
      </button>
    </div>
  );
}
