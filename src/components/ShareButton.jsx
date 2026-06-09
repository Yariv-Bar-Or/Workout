"use client";
import { useShareCard } from "../hooks/useShareCard";

export default function ShareButton({ exercises }) {
  const { generateCard, isGenerating, hasWorkoutToday } = useShareCard(exercises);

  if (!hasWorkoutToday) return null;

  return (
    <button
      onClick={generateCard}
      disabled={isGenerating}
      dir="rtl"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        marginTop: 20,
        padding: "14px 20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        color: isGenerating ? "#555" : "#f0ede8",
        fontSize: 16,
        fontWeight: 700,
        cursor: isGenerating ? "not-allowed" : "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.15s",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {isGenerating ? "מייצר..." : "📤 שתף אימון"}
    </button>
  );
}
