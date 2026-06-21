"use client";
import { Check, X } from "lucide-react";

export default function VoiceConfirmCard({ parsed, onConfirm, onSkip, onCancelAll, currentIndex, totalSets }) {
  const canConfirm = !!parsed.exerciseId && parsed.weight > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancelAll}
        style={{
          position: "fixed",
          inset: 0,
          bottom: 72,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1000,
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "fixed",
        bottom: 72,
        left: 0,
        right: 0,
        background: "#1c1c1c",
        borderTop: "1px solid rgba(255,107,53,0.35)",
        borderRadius: "20px 20px 0 0",
        padding: 20,
        zIndex: 1001,
        direction: "rtl",
      }}>
        <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          אישור סט
        </div>

        {totalSets > 1 && (
          <div style={{ color: "#f97316", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            סט {currentIndex + 1} מתוך {totalSets}
          </div>
        )}

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

          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <button
              onClick={() => onConfirm(parsed.exerciseId, parsed.weight, parsed.reps)}
              disabled={!canConfirm}
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "none",
                background: canConfirm ? "#22c55e" : "#2a2a2a",
                color: canConfirm ? "#fff" : "#555",
                fontSize: 15, fontWeight: 700,
                cursor: canConfirm ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Check size={18} /> שמור
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              {totalSets > 1 && (
                <button
                  onClick={onSkip}
                  style={{
                    flex: 1, height: 46, borderRadius: 12,
                    border: "1px solid rgba(255,165,0,0.3)",
                    background: "transparent", color: "#f97316",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  דלג
                </button>
              )}
              <button
                onClick={onCancelAll}
                style={{
                  flex: 1, height: 46, borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", color: "#888",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <X size={18} /> בטל הכל
              </button>
            </div>
          </div>
      </div>
    </>
  );
}
