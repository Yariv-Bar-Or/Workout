"use client";

import { useState } from "react";

export default function MuscleAIModal({ muscleGroup, onClose }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchExercise() {
    setError("");
    setResult("");
    setLoading(true);
    try {
      const res = await fetch("/api/muscle-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muscleGroup, type: "exercises" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data.result); }
    } catch {
      setError("שגיאת רשת, נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px 24px 0 0",
          padding: "28px 24px 40px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f0ede8",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f0ede8" }}>
            💡 {muscleGroup}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)", border: "none",
              borderRadius: 8, width: 36, height: 36,
              color: "#888", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Fetch button */}
        <button
          onClick={fetchExercise}
          disabled={loading}
          style={{
            width: "100%", height: 50, borderRadius: 12, border: "none",
            background: loading ? "#7a3a1e" : "#ff6b35",
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: 20,
          }}
        >
          {loading ? "טוען..." : "קבל תרגיל"}
        </button>

        {/* Error */}
        {error && (
          <div style={{ color: "#e05555", fontSize: 14, marginBottom: 12 }}>{error}</div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "16px 18px",
            color: "#e8e4df", fontSize: 15, lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
