"use client";

import { useState } from "react";
import { useStats } from "@/hooks/useStats";
import LoadingSpinner from "./LoadingSpinner";
import { ChevronLeft } from "lucide-react";

const FILTERS = [
  { key: "today", label: "היום" },
  { key: "week",  label: "שבוע" },
  { key: "month", label: "חודש" },
  { key: "all",   label: "הכל" },
];

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

const BG = {
  background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
  minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#f0ede8", direction: "rtl",
};

export default function StatsDashboard({ user, onBack }) {
  const { currentStreak, personalRecords, totalVolume, loading } = useStats(user);
  const [volumeFilter, setVolumeFilter] = useState("week");

  if (loading) return (
    <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner />
    </div>
  );

  const hasData = personalRecords.length > 0;

  return (
    <div style={{ ...BG, padding: "52px 20px 32px" }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", color: "#ff6b35",
        fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 24,
      }}>
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> ראשי
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 24px", color: "#f0ede8" }}>סטטיסטיקות</h1>

      {!hasData ? (
        <div style={{ textAlign: "center", color: "#444", fontSize: 16, marginTop: 80 }}>
          אין נתונים עדיין
        </div>
      ) : (
        <>
          {/* Streak + PR count cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px 14px",
            }}>
              <div style={{ fontSize: 26 }}>🔥</div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginTop: 8 }}>רצף נוכחי</div>
              <div style={{ color: "#f0ede8", fontSize: 26, fontWeight: 900, marginTop: 4 }}>
                {currentStreak}
                <span style={{ fontSize: 13, color: "#666", fontWeight: 400, marginRight: 4 }}>ימים</span>
              </div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px 14px",
            }}>
              <div style={{ fontSize: 26 }}>🏆</div>
              <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginTop: 8 }}>שיאים אישיים</div>
              <div style={{ color: "#f0ede8", fontSize: 26, fontWeight: 900, marginTop: 4 }}>
                {personalRecords.length}
                <span style={{ fontSize: 13, color: "#666", fontWeight: 400, marginRight: 4 }}>תרגילים</span>
              </div>
            </div>
          </div>

          {/* Volume card */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "16px 14px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 26 }}>💪</div>
            <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginTop: 8 }}>נפח כולל</div>
            <div style={{ color: "#f0ede8", fontSize: 28, fontWeight: 900, marginTop: 4 }}>
              {totalVolume(volumeFilter).toLocaleString("he-IL")}
              <span style={{ fontSize: 14, color: "#666", fontWeight: 400, marginRight: 4 }}>ק"ג</span>
            </div>
            <div style={{
              display: "flex", gap: 6, marginTop: 14,
              background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4,
            }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setVolumeFilter(f.key)} style={{
                  flex: 1, padding: "6px 0", borderRadius: 7, border: "none",
                  background: volumeFilter === f.key ? "#2563eb" : "transparent",
                  color: volumeFilter === f.key ? "#fff" : "#666",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* PR list */}
          <div style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            שיאים אישיים
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {personalRecords.map((pr, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 15 }}>{pr.exerciseName}</div>
                  <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{pr.muscleGroup}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "#ff6b35", fontWeight: 800, fontSize: 18 }}>
                    {pr.bestWeight}
                    <span style={{ fontSize: 12, color: "#666", fontWeight: 400, marginRight: 2 }}>ק"ג</span>
                  </div>
                  {pr.bestReps != null && (
                    <div style={{ color: "#888", fontSize: 12 }}>× {pr.bestReps} חזרות</div>
                  )}
                  <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>{fmt(pr.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
