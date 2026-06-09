"use client";

export default function TimerCompleteModal({ onDismiss }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.92)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      direction: "rtl",
    }}>
      <div style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,107,53,0.35)",
        borderRadius: 24,
        padding: "36px 28px",
        width: "calc(100% - 48px)",
        maxWidth: 360,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⏱</div>
        <h2 style={{
          color: "#f0ede8",
          fontSize: 26,
          fontWeight: 900,
          margin: "0 0 8px",
        }}>
          סיום מנוחה!
        </h2>
        <p style={{
          color: "#888",
          fontSize: 16,
          margin: "0 0 32px",
        }}>
          מוכן להמשיך?
        </p>
        <button
          onClick={onDismiss}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 14,
            border: "none",
            background: "#22c55e",
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ✅ התחלתי סט
        </button>
      </div>
    </div>
  );
}
