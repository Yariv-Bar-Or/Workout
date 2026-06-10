"use client";
import { useShareCard } from "../hooks/useShareCard";

export default function ShareButton({ exercises }) {
  const { generateCard, isGenerating, hasWorkoutToday } = useShareCard(exercises);

  console.log("[ShareButton] hasWorkoutToday:", hasWorkoutToday, "| exercises count:", exercises?.length);

  if (!hasWorkoutToday) return null;

  return (
    <button
      onClick={generateCard}
      disabled={isGenerating}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        color: isGenerating ? "#555" : "#ccc",
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 12px",
        cursor: isGenerating ? "not-allowed" : "pointer",
        opacity: isGenerating ? 0.6 : 1,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {isGenerating ? "מייצר..." : "📤 שתף אימון"}
    </button>
  );
}
