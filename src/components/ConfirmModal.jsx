"use client";

export default function ConfirmModal({ title, body, confirmLabel, confirmColor, onConfirm, onCancel }) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 3000,
        }}
      />
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1c1c1c",
        border: "1px solid rgba(255,107,53,0.35)",
        borderRadius: 16,
        padding: "24px 20px",
        width: "calc(100% - 48px)",
        maxWidth: 360,
        zIndex: 3001,
        direction: "rtl",
      }}>
        <div style={{ color: "#f0ede8", fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
          {title}
        </div>
        {body && (
          <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
            {body}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: 46, borderRadius: 12, border: "none",
              background: confirmColor, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#888",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </>
  );
}
