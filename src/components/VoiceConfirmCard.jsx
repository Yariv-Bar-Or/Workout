"use client";
import { Check, X } from "lucide-react";

export default function VoiceConfirmCard({ parsed, onConfirm, onCancel }) {
  const canConfirm = !!parsed.exerciseId && parsed.weight > 0;

  return (
    <div style={{
      position: "fixed",
      bottom: "8rem",
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 2rem)",
      maxWidth: 400,
      background: "#1c1c1c",
      border: "1px solid rgba(255,107,53,0.35)",
      borderRadius: 16,
      padding: 20,
      zIndex: 1001,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      direction: "rtl",
    }}>
      <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        אישור סט
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#f0ede8", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
          {parsed.displayName}
        </div>
        <div style={{ color: "#ff6b35", fontSize: 26, fontWeight: 800 }}>
          {parsed.weight} ק״ג
          {parsed.reps != null && (
            <span style={{ color: "#aaa", fontSize: 17, fontWeight: 400 }}> × {parsed.reps}</span>
          )}
        </div>
        {!canConfirm && (
          <div style={{ color: "#f59e0b", fontSize: 12, marginTop: 6 }}>
            ⚠️ לא נמצא תרגיל תואם — לא ניתן לשמור
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onConfirm(parsed.exerciseId, parsed.weight, parsed.reps)}
          disabled={!canConfirm}
          style={{
            flex: 1, height: 46, borderRadius: 12, border: "none",
            background: canConfirm ? "#22c55e" : "#2a2a2a",
            color: canConfirm ? "#fff" : "#555",
            fontSize: 15, fontWeight: 700,
            cursor: canConfirm ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Check size={18} /> שמור
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1, height: 46, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "#888",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <X size={18} /> ביטול
        </button>
      </div>
    </div>
  );
}
