"use client";

export default function SessionTimerPrompt({ onConfirm, onDismiss, savedDuration = 0 }) {
  const hasExisting = savedDuration > 0;

  return (
    <>
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          bottom: 72,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1002,
        }}
      />

      <div style={{
        position: "fixed",
        bottom: 72,
        left: 0,
        right: 0,
        background: "#1c1c1c",
        borderTop: "1px solid rgba(255,107,53,0.35)",
        borderRadius: "20px 20px 0 0",
        padding: 20,
        zIndex: 1003,
        direction: "rtl",
      }}>
        <div style={{ color: "#f0ede8", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          {hasExisting ? "⏱ טיימר מנוחה פעיל" : "אימון חדש 💪"}
        </div>
        <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
          {hasExisting
            ? `טיימר של ${savedDuration} שנ׳ מוגדר — לכבות להיום?`
            : "רוצה להפעיל טיימר מנוחה לאימון היום?"}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: 46, borderRadius: 12, border: "none",
              background: "#22c55e", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {hasExisting ? "השאר פעיל" : "כן"}
          </button>
          <button
            onClick={onDismiss}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#888",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {hasExisting ? "כבה להיום" : "לא תודה"}
          </button>
        </div>
      </div>
    </>
  );
}
