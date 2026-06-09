"use client";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimerBar({ secondsLeft, totalSeconds, onSkip }) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 900,
      height: 72,
      background: "rgba(13,13,13,0.97)",
      borderTop: "1px solid rgba(255,107,53,0.2)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      direction: "rtl",
    }}>
      {/* Label */}
      <div>
        <div style={{ color: "#666", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
          מנוחה
        </div>
        <div style={{ color: "#f0ede8", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
          חזור לאימון עוד...
        </div>
      </div>

      {/* Circular countdown */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <svg
          width="56"
          height="56"
          viewBox="0 0 64 64"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="32" cy="32" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          <circle
            cx="32" cy="32" r={RADIUS}
            fill="none"
            stroke="#ff6b35"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff6b35",
          fontSize: secondsLeft >= 100 ? 14 : 18,
          fontWeight: 800,
          lineHeight: 1,
        }}>
          {secondsLeft}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          color: "#777",
          fontSize: 13,
          fontWeight: 700,
          padding: "8px 16px",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        דלג
      </button>
    </div>
  );
}
