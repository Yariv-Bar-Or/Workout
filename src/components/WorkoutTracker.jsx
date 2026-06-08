"use client";

import { useState, useRef } from "react";
import { useSupabaseDB as useLocalDB } from '../hooks/useSupabaseDB';
import { ComposedChart, Line, Customized, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChevronLeft, Plus, Dumbbell, TrendingUp, X, Check,
  ChevronDown, ChevronUp, Zap, BarChart2, Trash2, Pencil
} from "lucide-react";



function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("he-IL", { month: "short", day: "numeric" });
}

function fmtRelative(ts) {
  if (!ts) return "אף פעם";
  const diff = Date.now() - ts;
  if (diff < 60000) return "ממש עכשיו";
  if (diff < 3600000) return `לפני ${Math.floor(diff / 60000)} דק׳`;
  if (diff < 86400000) return `לפני ${Math.floor(diff / 3600000)} שעות`;
  return `לפני ${Math.floor(diff / 86400000)} ימים`;
}

const TIMEFRAMES = [
  { key: "1m", label: "חודש" },
  { key: "3m", label: "3 חודשים" },
  { key: "6m", label: "חצי שנה" },
  { key: "1y", label: "שנה" },
  { key: "All", label: "הכל" },
];

function filterByTimeframe(sessions, tf) {
  if (tf === "All") return sessions;
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[tf];
  const cutoff = Date.now() - months * 30 * 86400000;
  return sessions.filter(s => s.date >= cutoff);
}

const CATS = [
  { key: "chest",     label: "חזה",       desc: "לחיצות · פרפר · כבלים",        color: "#ff6b35" },
  { key: "back",      label: "גב",        desc: "מתח · חתירה · פולי",            color: "#4ecdc4" },
  { key: "shoulders", label: "כתפיים",    desc: "לחיצה · הרמות צד · פייס פולס", color: "#a78bfa" },
  { key: "biceps",    label: "יד קדמית",  desc: "כפיפות · פטיש · כבל",           color: "#f7dc6f" },
  { key: "triceps",   label: "יד אחורית", desc: "פושדאון · ג׳פרי · מקבילים",    color: "#82e0aa" },
  { key: "legs",      label: "רגליים",    desc: "סקוואט · לאנג׳ · לג קרל",      color: "#85c1e9" },
];

function Chart({ sessions }) {
  const [tf, setTf] = useState("All");
  const [selectedDot, setSelectedDot] = useState(null);
  const filtered = filterByTimeframe(sessions, tf);

  const dayStart = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const allDots = filtered.map(s => ({
    x: dayStart(s.date),
    y: s.weight,
    reps: s.reps ?? null,
    label: fmt(s.date),
  }));

  const dayMap = new Map();
  filtered.forEach(s => {
    const dk = dayStart(s.date);
    const prev = dayMap.get(dk);
    if (!prev || s.weight > prev.y) {
      dayMap.set(dk, { x: dk, y: s.weight });
    }
  });
  const trendLine = Array.from(dayMap.values()).sort((a, b) => a.x - b.x);

  const hasData = trendLine.length >= 1;

  const allWeights = allDots.map(d => d.y);
  const yMin = allWeights.length ? Math.min(...allWeights) : 0;
  const yMax = allWeights.length ? Math.max(...allWeights) : 100;
  const yPad = Math.max((yMax - yMin) * 0.2, 5);
  const yDomain = [yMin - yPad, yMax + yPad];

  const allX = trendLine.map(d => d.x);
  const xMin = allX.length ? Math.min(...allX) : 0;
  const xMax = allX.length ? Math.max(...allX) : 1;
  const xDomain = xMin === xMax
    ? [xMin - 86400000, xMax + 86400000]
    : [xMin, xMax];
  const xTicks = trendLine.map(d => d.x);

  const MARGIN = { top: 10, right: 10, left: -20, bottom: 0 };

  const DotsLayer = (props) => {
    const { xAxisMap, yAxisMap } = props;
    if (!xAxisMap || !yAxisMap) return null;
    const xAxis = Object.values(xAxisMap)[0];
    const yAxis = Object.values(yAxisMap)[0];
    if (!xAxis?.scale || !yAxis?.scale) return null;

    return (
      <g>
        {allDots.map((dot, i) => {
          const cx = xAxis.scale(dot.x);
          const cy = yAxis.scale(dot.y);
          if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) return null;
          const isSelected = selectedDot &&
            selectedDot.x === dot.x &&
            selectedDot.y === dot.y;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isSelected ? 7 : 5}
              fill={isSelected ? "#fff" : "#ff6b35"}
              stroke="#ff6b35"
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedDot(isSelected ? null : dot)}
            />
          );
        })}
      </g>
    );
  };

  return (
    <div style={{ marginTop: 12 }} dir="ltr">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }} dir="rtl">
        {TIMEFRAMES.map(t => (
          <button key={t.key} onClick={() => { setTf(t.key); setSelectedDot(null); }} style={{
            flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
            background: tf === t.key ? "#ff6b35" : "rgba(255,255,255,0.06)",
            color: tf === t.key ? "#fff" : "#777", fontWeight: 700, fontSize: 12,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {!hasData ? (
        <div style={{
          height: 160, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#444", fontSize: 14,
        }} dir="rtl">
          <div style={{ textAlign: "center" }}>
            <BarChart2 size={32} color="#333" style={{ marginBottom: 8 }} />
            <div>רשום אימונים כדי לראות את גרף ההתקדמות שלך</div>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart
              data={trendLine}
              margin={MARGIN}
            >
              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={xDomain}
                ticks={xTicks}
                tickFormatter={(v) => fmt(v)}
                tick={{ fill: "#555", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "#555", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Line
                dataKey="y"
                stroke="#ff6b35"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                type="monotone"
                isAnimationActive={false}
              />
              <Customized component={DotsLayer} />
            </ComposedChart>
          </ResponsiveContainer>

          {selectedDot && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.06)", borderRadius: 10,
              padding: "10px 14px", marginTop: 10, direction: "rtl",
            }}>
              <div>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 2 }}>
                  {selectedDot.label}
                </div>
                <div style={{ color: "#ff6b35", fontWeight: 700, fontSize: 16 }}>
                  {selectedDot.y} ק״ג
                  {selectedDot.reps != null && (
                    <span style={{ color: "#aaa", fontWeight: 400, fontSize: 14 }}>
                      {" "}× {selectedDot.reps} חזרות
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedDot(null)} style={{
                background: "none", border: "none", color: "#555",
                cursor: "pointer", padding: 4,
                display: "flex", alignItems: "center",
              }}>
                <X size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryBadge({ cat }) {
  const cfg = {
    chest:     { bg: "#ff6b35", label: "חזה" },
    back:      { bg: "#4ecdc4", label: "גב" },
    shoulders: { bg: "#a78bfa", label: "כתפיים" },
    biceps:    { bg: "#f7dc6f", label: "יד קדמית" },
    triceps:   { bg: "#82e0aa", label: "יד אחורית" },
    legs:      { bg: "#85c1e9", label: "רגליים" },
  }[cat] || { bg: "#888", label: cat };
  return (
    <span style={{
      background: cfg.bg, color: "#fff", fontSize: 11, fontWeight: 800,
      padding: "2px 8px", borderRadius: 4,
    }}>{cfg.label}</span>
  );
}

function ProfileCard({ profile, onClick, onDelete, rank }) {
  const initials = profile.name.slice(0, 2);
  const colors = ["#ff6b35", "#4ecdc4", "#a78bfa"];
  const color = colors[rank % colors.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 14,
        flex: 1, padding: "14px 16px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, cursor: "pointer", textAlign: "right",
        WebkitTapHighlightColor: "transparent",
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%",
          background: color + "22", border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, color, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{profile.name}</div>
          <div style={{ color: "#888", fontSize: 13 }}>פעיל/ה {fmtRelative(profile.updated_at)}</div>
        </div>
        {rank === 0 && (
          <span style={{ fontSize: 11, fontWeight: 800, color: "#ff6b35", opacity: 0.8 }}>הכי פעיל/ה</span>
        )}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,80,80,0.25)",
          background: "rgba(255,80,80,0.08)", color: "#e05555",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function ExerciseRow({ exercise, onClick }) {
  const last = exercise.sessions[exercise.sessions.length - 1];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "14px 16px",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, cursor: "pointer", textAlign: "right",
      WebkitTapHighlightColor: "transparent",
    }}>
      <Dumbbell size={20} color="#555" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#f0ede8", fontWeight: 600, fontSize: 16 }}>{exercise.name}</div>
        {last && (
          <div style={{ color: "#777", fontSize: 13, marginTop: 2 }}>
            אחרון: <span style={{ color: "#ff6b35", fontWeight: 700 }}>{last.weight} ק״ג</span>
            {last.reps != null && <span style={{ color: "#888", fontWeight: 600 }}> × {last.reps}</span>}
            <span style={{ marginRight: 6 }}>· {fmt(last.date)}</span>
          </div>
        )}
        {!last && <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>אין מידע עדיין</div>}
      </div>
      <ChevronLeft size={16} color="#444" />
    </button>
  );
}

function ExerciseDetail({ exercise, onSave, onDeleteSet, onEditSet, onBack }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editDate, setEditDate] = useState("");
  const inputRef = useRef();
  const last = exercise.sessions[exercise.sessions.length - 1];
  const best = exercise.sessions.reduce((m, s) => Math.max(m, s.weight), 0);

  function handleSave() {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    const r = reps !== "" ? parseInt(reps, 10) : null;
    const ts = new Date(date).setHours(12, 0, 0, 0);
    onSave(exercise.id, w, r, ts);
    setSaved(true);
    setWeight("");
    setReps("");
    setTimeout(() => setSaved(false), 1500);
  }

  const reversedSessions = [...exercise.sessions]
    .map((s, i) => ({ ...s, originalIndex: i }))
    .reverse();

  return (
    <div>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", color: "#ff6b35",
        fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
      }}>
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> חזרה
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <CategoryBadge cat={exercise.category} />
        </div>
        <h2 style={{ color: "#f0ede8", fontSize: 26, fontWeight: 800, margin: 0 }}>{exercise.name}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "סט אחרון", value: last ? `${last.weight} ק״ג` : "—", sub: last ? (last.reps != null ? `${last.reps} חזרות · ${fmt(last.date)}` : fmt(last.date)) : "" },
          { label: "שיא אישי", value: best ? `${best} ק״ג` : "—", sub: "" },
          { label: "סה״כ סטים", value: exercise.sessions.length, sub: "" },
          { label: "החודש", value: exercise.sessions.filter(s => s.date > Date.now() - 30 * 86400000).length + " סטים", sub: "" },
        ].map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 12,
            padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ color: "#666", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: "#f0ede8", fontSize: 20, fontWeight: 800 }}>{c.value}</div>
            {c.sub && <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255, 107, 53, 0.06)", border: "1px solid rgba(255,107,53,0.2)",
        borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <div style={{ color: "#ff6b35", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          תיעוד סט
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <input
            ref={inputRef}
            type="number" inputMode="decimal" placeholder="0.0"
            value={weight} onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              flex: 2, height: 52, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,107,53,0.3)", borderRadius: 12,
              color: "#f0ede8", fontSize: 22, fontWeight: 700, textAlign: "center",
              outline: "none", padding: "0 12px",
            }}
          />
          <span style={{ color: "#777", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>ק״ג</span>
          <input
            type="number" inputMode="numeric" placeholder="חזרות"
            value={reps} onChange={e => setReps(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              flex: 1, height: 52, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,107,53,0.15)", borderRadius: 12,
              color: "#f0ede8", fontSize: 18, fontWeight: 700, textAlign: "center",
              outline: "none", padding: "0 8px",
            }}
          />
          <button onClick={handleSave} style={{
            width: 52, height: 52, borderRadius: 12, border: "none",
            background: saved ? "#22c55e" : "#ff6b35",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            {saved ? <Check size={22} /> : <Zap size={22} />}
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            width: "100%", height: 44, background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,107,53,0.15)", borderRadius: 12,
            color: "#f0ede8", fontSize: 15, textAlign: "center",
            outline: "none", padding: "0 12px", boxSizing: "border-box",
          }}
        />
      </div>

      {exercise.sessions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>סטים מתועדים</div>
          {reversedSessions.map(({ originalIndex, ...session }) => (
            <div key={originalIndex} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 10,
              padding: "10px 14px", marginBottom: 8, direction: "rtl",
            }}>
              {editingIndex === originalIndex ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)}
                    placeholder="משקל" style={{ width: 70, height: 36, background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,107,53,0.3)", borderRadius: 8, color: "#f0ede8",
                    fontSize: 15, textAlign: "center", outline: "none" }} />
                  <span style={{ color: "#777", fontSize: 13 }}>ק״ג</span>
                  <input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                    placeholder="חזרות" style={{ width: 70, height: 36, background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,107,53,0.15)", borderRadius: 8, color: "#f0ede8",
                    fontSize: 15, textAlign: "center", outline: "none" }} />
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ flex: 1, minWidth: 120, height: 36, background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,107,53,0.15)", borderRadius: 8, color: "#f0ede8",
                    fontSize: 13, outline: "none", padding: "0 8px" }} />
                  <button onClick={() => {
                    const w = parseFloat(editWeight);
                    const r = editReps !== "" ? parseInt(editReps, 10) : null;
                    const ts = new Date(editDate).setHours(12, 0, 0, 0);
                    if (w > 0) { onEditSet(exercise.id, originalIndex, w, r, ts); setEditingIndex(null); }
                  }} style={{ width: 36, height: 36, borderRadius: 8, border: "none",
                    background: "#22c55e", color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingIndex(null)} style={{ width: 36, height: 36,
                    borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "#666", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ color: "#ff6b35", fontWeight: 700 }}>{session.weight} ק״ג</span>
                    {session.reps != null && <span style={{ color: "#aaa", fontSize: 13 }}> × {session.reps}</span>}
                    <span style={{ color: "#555", fontSize: 12, marginRight: 8 }}>{fmt(session.date)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      setEditingIndex(originalIndex);
                      setEditWeight(session.weight.toString());
                      setEditReps(session.reps != null ? session.reps.toString() : "");
                      const d = new Date(session.date);
                      setEditDate(d.toISOString().split("T")[0]);
                    }} style={{ width: 32, height: 32, borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                      color: "#888", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDeleteSet(exercise.id, originalIndex)}
                      style={{ width: 32, height: 32, borderRadius: 8,
                      border: "1px solid rgba(255,80,80,0.2)", background: "rgba(255,80,80,0.06)",
                      color: "#e05555", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowChart(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "12px 16px", cursor: "pointer", color: "#f0ede8",
        fontSize: 14, fontWeight: 600,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={16} color="#ff6b35" /> גרף התקדמות
        </span>
        {showChart ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
      </button>

      {showChart && <Chart sessions={exercise.sessions} />}
    </div>
  );
}

export default function WorkoutTracker() {
  const { profiles, exercises, loading, addProfile, deleteProfile, updateExerciseWeight, addExercise, deleteSet, editSet } = useLocalDB();
  const [view, setView] = useState("profiles");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  if (loading) return <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b35", fontSize: 18 }}>טוען...</div>;

  const sortedProfiles = [...profiles].sort((a, b) => b.updated_at - a.updated_at);

  const catExercises = exercises
    .filter(e => e.profile_id === selectedProfile?.id && e.category === selectedCat)
    .sort((a, b) => b.updated_at - a.updated_at);

  function handleSelectProfile(p) {
    setSelectedProfile(p); setView("dashboard");
  }

  function handleDeleteProfile(profileId) {
    if (!window.confirm("למחוק את הפרופיל וכל הנתונים שלו?")) return;
    deleteProfile(profileId);
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(null);
      setView("profiles");
    }
  }

  function handleAddProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    const result = addProfile(name);
    if (result) { setNewProfileName(""); setAddingProfile(false); }
  }

  function handleSaveWeight(exId, w, r, ts) {
    updateExerciseWeight(exId, w, r, ts);
    const live = exercises.find(e => e.id === exId);
    if (live) {
      setSelectedExercise({
        ...live,
        sessions: [...live.sessions, { weight: w, reps: r || null, date: ts }]
      });
    }
  }

  function handleDeleteSet(exId, sessionIndex) {
    deleteSet(exId, sessionIndex);
    const live = exercises.find(e => e.id === exId);
    if (live) {
      setSelectedExercise({
        ...live,
        sessions: live.sessions.filter((_, i) => i !== sessionIndex)
      });
    }
  }

  function handleEditSet(exId, sessionIndex, w, r, ts) {
    editSet(exId, sessionIndex, w, r, ts);
    const live = exercises.find(e => e.id === exId);
    if (live) {
      setSelectedExercise({
        ...live,
        sessions: live.sessions.map((s, i) =>
          i === sessionIndex ? { ...s, weight: w, reps: r || null, date: ts } : s
        )
      });
    }
  }

  function handleAddExercise() {
    const name = newExerciseName.trim();
    if (!name || !selectedProfile || !selectedCat) return;
    addExercise(selectedProfile.id, selectedCat, name);
    setNewExerciseName(""); setAddingExercise(false);
  }

  const BG = {
    background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
    minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#f0ede8",
  };

  if (view === "exercise" && selectedExercise) {
    const live = exercises.find(e => e.id === selectedExercise.id) || selectedExercise;
    return (
      <div style={{ ...BG, padding: "52px 20px 32px" }}>
        <ExerciseDetail
          exercise={live}
          onSave={handleSaveWeight}
          onDeleteSet={handleDeleteSet}
          onEditSet={handleEditSet}
          onBack={() => { setView("category"); setSelectedExercise(null); }}
        />
      </div>
    );
  }

  if (view === "category" && selectedCat) {
    const catInfo = CATS.find(c => c.key === selectedCat);
    return (
      <div style={{ ...BG, padding: "52px 20px 32px" }}>
        <button onClick={() => setView("dashboard")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: catInfo.color,
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
        }}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {selectedProfile?.name}
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: catInfo.color, fontSize: 32, fontWeight: 900, margin: 0 }}>{catInfo.label}</h1>
          <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>{catInfo.desc}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {catExercises.map(ex => (
            <ExerciseRow key={ex.id} exercise={ex} onClick={() => { setSelectedExercise(ex); setView("exercise"); }} />
          ))}
        </div>

        {addingExercise ? (
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: 16,
          }}>
            <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>שם התרגיל</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddExercise()}
                placeholder="לדוגמה: פרפר כבלים"
                style={{
                  flex: 1, height: 44, background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                  color: "#f0ede8", fontSize: 15, padding: "0 12px", outline: "none",
                  textAlign: "right"
                }}
              />
              <button onClick={handleAddExercise} style={{
                width: 44, height: 44, borderRadius: 10, border: "none",
                background: catInfo.color, color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Check size={18} /></button>
              <button onClick={() => { setAddingExercise(false); setNewExerciseName(""); }} style={{
                width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#666", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={18} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingExercise(true)} style={{
            width: "100%", height: 52, borderRadius: 14,
            border: `1.5px dashed ${catInfo.color}44`,
            background: `${catInfo.color}08`,
            color: catInfo.color, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer",
          }}>
            <Plus size={18} /> הוספת תרגיל
          </button>
        )}
      </div>
    );
  }

  if (view === "dashboard" && selectedProfile) {
    return (
      <div style={{ ...BG, padding: "52px 20px 32px" }}>
        <button onClick={() => setView("profiles")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: "#ff6b35",
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
        }}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> כל הפרופילים
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#ff6b3522", border: "2px solid #ff6b35",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 14, color: "#ff6b35",
            }}>
              {selectedProfile.name.slice(0, 2)}
            </div>
            <div>
              <h1 style={{ color: "#f0ede8", fontSize: 22, fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h1>
              <div style={{ color: "#555", fontSize: 13 }}>בחר סוג אימון</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CATS.map(cat => {
            const exs = exercises.filter(e => e.profile_id === selectedProfile.id && e.category === cat.key);
            const withData = exs.filter(e => e.sessions.length > 0);
            return (
              <button key={cat.key} onClick={() => { setSelectedCat(cat.key); setView("category"); }}
                style={{
                  display: "flex", alignItems: "center",
                  background: `${cat.color}15`,
                  border: `1px solid ${cat.color}30`,
                  borderRadius: 20, padding: "20px 20px",
                  cursor: "pointer", textAlign: "right",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: cat.color, fontSize: 28, fontWeight: 900 }}>{cat.label}</div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{cat.desc}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{exs.length}</span> תרגילים
                    </span>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{withData.length}</span> רשומים
                    </span>
                  </div>
                </div>
                <ChevronLeft size={22} color={cat.color} style={{ transform: "rotate(180deg)", opacity: 0.6 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...BG, padding: "52px 20px 32px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Dumbbell size={24} color="#ff6b35" />
          <span style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>IRON LOG</span>
        </div>
        <h1 style={{ color: "#f0ede8", fontSize: 34, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
          מי מתאמן<br />היום?
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {sortedProfiles.map((p, i) => (
          <ProfileCard
            key={p.id}
            profile={p}
            rank={i}
            onClick={() => handleSelectProfile(p)}
            onDelete={() => handleDeleteProfile(p.id)}
          />
        ))}
      </div>

      {profiles.length < 3 && (
        addingProfile ? (
          <div style={{
            background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>שם הפרופיל</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddProfile()}
                placeholder="לדוגמה: אלכס"
                style={{
                  flex: 1, height: 48, background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10,
                  color: "#f0ede8", fontSize: 16, padding: "0 14px", outline: "none",
                  textAlign: "right"
                }}
              />
              <button onClick={handleAddProfile} style={{
                width: 48, height: 48, borderRadius: 10, border: "none",
                background: "#ff6b35", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Check size={20} /></button>
              <button onClick={() => { setAddingProfile(false); setNewProfileName(""); }} style={{
                width: 48, height: 48, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#666", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={20} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingProfile(true)} style={{
            width: "100%", height: 56, borderRadius: 16,
            border: "1.5px dashed rgba(255,107,53,0.3)",
            background: "rgba(255,107,53,0.04)",
            color: "#ff6b35", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer",
          }}>
            <Plus size={20} /> הוספת פרופיל {profiles.length > 0 && `(${3 - profiles.length} נשארו)`}
          </button>
        )
      )}

      {profiles.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 40, color: "#444" }}>
          <Dumbbell size={40} color="#333" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15 }}>הוסף פרופיל כדי להתחיל</div>
        </div>
      )}
    </div>
  );
}
