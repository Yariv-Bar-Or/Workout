"use client";

import { useState, useEffect, useRef } from "react";
import { useSupabaseDB as useLocalDB } from '../hooks/useSupabaseDB';
import { supabase } from '../lib/supabase';
import MuscleAIModal from './MuscleAIModal';
import LoadingSpinner from './LoadingSpinner';
import ExportButton from './ExportButton';
import StatsDashboard from './StatsDashboard';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useVoiceLogger } from '../hooks/useVoiceLogger';
import { useRestTimer } from '../hooks/useRestTimer';
import VoiceButton from './VoiceButton';
import VoiceConfirmCard from './VoiceConfirmCard';
import RestTimerModal from './RestTimerModal';
import RestTimerBar from './RestTimerBar';
import ShareButton from './ShareButton';
import SessionTimerPrompt from './SessionTimerPrompt';
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
            <ComposedChart data={trendLine} margin={MARGIN}>
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
                <div style={{ color: "#888", fontSize: 12, marginBottom: 2 }}>{selectedDot.label}</div>
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
                cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
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
  const [showSets, setShowSets] = useState(false);
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
        fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 28,
      }}>
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> חזרה
      </button>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <CategoryBadge cat={exercise.category} />
        </div>
        <h2 style={{ color: "#f0ede8", fontSize: 28, fontWeight: 800, margin: 0 }}>{exercise.name}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { label: "סט אחרון", value: last ? `${last.weight} ק״ג` : "—", sub: last ? (last.reps != null ? `${last.reps} חזרות · ${fmt(last.date)}` : fmt(last.date)) : "" },
          { label: "שיא אישי", value: best ? `${best} ק״ג` : "—", sub: "" },
          { label: "סה״כ סטים", value: exercise.sessions.length, sub: "" },
          { label: "החודש", value: exercise.sessions.filter(s => s.date > Date.now() - 30 * 86400000).length + " סטים", sub: "" },
        ].map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14,
            padding: "16px 18px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>{c.label}</div>
            <div style={{ color: "#f0ede8", fontSize: 24, fontWeight: 800 }}>{c.value}</div>
            {c.sub && <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255, 107, 53, 0.06)", border: "1px solid rgba(255,107,53,0.2)",
        borderRadius: 18, padding: 24, marginBottom: 28,
      }}>
        <div style={{ color: "#ff6b35", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
          תיעוד סט
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 54px", gap: 10, marginBottom: 10 }}>
          <input
            ref={inputRef}
            type="number" inputMode="decimal" placeholder="0.0"
            value={weight} onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              width: "100%", height: 54, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,107,53,0.3)", borderRadius: 14,
              color: "#f0ede8", fontSize: 22, fontWeight: 700, textAlign: "center",
              outline: "none", padding: "0 12px", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#777", fontSize: 14, fontWeight: 600 }}>ק״ג</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 54px", gap: 10, marginBottom: 12 }}>
          <input
            type="number" inputMode="numeric" placeholder="חזרות"
            value={reps} onChange={e => setReps(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              width: "100%", height: 54, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,107,53,0.15)", borderRadius: 14,
              color: "#f0ede8", fontSize: 22, fontWeight: 700, textAlign: "center",
              outline: "none", padding: "0 8px", boxSizing: "border-box",
            }}
          />
          <button onClick={handleSave} style={{
            width: 54, height: 54, borderRadius: 14, border: "none",
            background: saved ? "#22c55e" : "#ff6b35",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            {saved ? <Check size={22} /> : <Zap size={22} />}
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            width: "100%", height: 46, background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,107,53,0.15)", borderRadius: 12,
            color: "#f0ede8", fontSize: 15, textAlign: "center",
            outline: "none", padding: "0 12px", boxSizing: "border-box",
          }}
        />
      </div>

      {exercise.sessions.length > 0 && (
        <div style={{ marginBottom: 0 }}>
          <button onClick={() => setShowSets(v => !v)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "14px 18px", cursor: "pointer", color: "#f0ede8",
            fontSize: 14, fontWeight: 600, marginBottom: showSets ? 10 : 0,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              סטים מתועדים
              <span style={{ color: "#555", fontSize: 12, fontWeight: 500 }}>({exercise.sessions.length})</span>
            </span>
            {showSets ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
          </button>
          {showSets && (
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div>
                      <span style={{ color: "#ff6b35", fontWeight: 700 }}>{session.weight} ק״ג</span>
                      {session.reps != null && <span style={{ color: "#aaa", fontSize: 13 }}> × {session.reps}</span>}
                    </div>
                    <div style={{ color: "#777", fontSize: 12 }}>{fmt(session.date)}</div>
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
        </div>
      )}

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

      <button onClick={() => setShowChart(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "14px 18px", cursor: "pointer", color: "#f0ede8",
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

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Beep failed:", e);
  }
}

export default function WorkoutTracker({ user }) {
  const { exercises, loading, addExercise, updateExerciseWeight, deleteSet, editSet } = useLocalDB(user);
  const [view, setView] = useState("dashboard");
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [aiModalCat, setAiModalCat] = useState(null);
  useOfflineSync(user);
  const voiceLogger = useVoiceLogger(exercises, updateExerciseWeight);
  const { secondsLeft, totalSeconds, isRunning, timerComplete, startTimer, skipTimer, dismissComplete } = useRestTimer();
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showTimerPrompt, setShowTimerPrompt] = useState(false);

  // Show session timer prompt on fresh app open (not app-switch)
  useEffect(() => {
    if (!sessionStorage.getItem("session_started") && !localStorage.getItem("restTimerDuration")) {
      setShowTimerPrompt(true);
    }
    sessionStorage.setItem("session_started", "1");
  }, []);

  // Repeating beep while the completion modal is open
  useEffect(() => {
    if (!timerComplete) return;
    playBeep();
    const id = setInterval(playBeep, 2000);
    return () => clearInterval(id);
  }, [timerComplete]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner />
    </div>
  );

  const catExercises = exercises
    .filter(e => e.category === selectedCat)
    .sort((a, b) => b.updated_at - a.updated_at);

  function handleSaveWeight(exId, w, r, ts) {
    updateExerciseWeight(exId, w, r, ts);
    const live = exercises.find(e => e.id === exId);
    if (live) {
      setSelectedExercise({
        ...live,
        sessions: [...live.sessions, { weight: w, reps: r || null, date: ts }]
      });
    }
    const dur = parseInt(localStorage.getItem("restTimerDuration") || "0", 10);
    if (dur > 0) startTimer(dur);
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
    if (!name || !selectedCat) return;
    addExercise(selectedCat, name);
    setNewExerciseName(""); setAddingExercise(false);
  }

  const BG = {
    background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
    minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#f0ede8", overflowX: "hidden",
  };

  const voiceOverlay = (
    <>
      <VoiceButton
        isListening={voiceLogger.isListening}
        isSupported={voiceLogger.isSupported}
        isParsing={voiceLogger.isParsing}
        liftUp={isRunning}
        onPress={voiceLogger.isListening ? voiceLogger.stopListening : voiceLogger.startListening}
      />
      {voiceLogger.pendingConfirm && (
        <VoiceConfirmCard
          parsed={voiceLogger.pendingConfirm}
          onConfirm={voiceLogger.confirmLog}
          onCancel={voiceLogger.cancelConfirm}
        />
      )}
      {voiceLogger.parseError && !voiceLogger.pendingConfirm && (
        <div style={{
          position: "fixed",
          bottom: "8rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#2a1515",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12,
          padding: "12px 20px",
          color: "#f87171",
          fontSize: 14,
          zIndex: 1001,
          direction: "rtl",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}>
          {voiceLogger.parseError}
        </div>
      )}
      {isRunning && (
        <RestTimerBar
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          onSkip={skipTimer}
        />
      )}
      {timerComplete && (
        <div
          onClick={dismissComplete}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,107,53,0.4)",
            borderRadius: 20,
            padding: "32px 40px",
            textAlign: "center",
            direction: "rtl",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏱</div>
            <div style={{ color: "#f0ede8", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              סיום מנוחה!
            </div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
              חזור לאימון
            </div>
            <button
              onClick={dismissComplete}
              style={{
                background: "#ff6b35", color: "#fff",
                border: "none", borderRadius: 12,
                padding: "12px 32px", fontSize: 16, fontWeight: 700,
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
              }}
            >
              אישור
            </button>
          </div>
        </div>
      )}
      {showTimerModal && (
        <RestTimerModal onClose={() => setShowTimerModal(false)} />
      )}
      {showTimerPrompt && (
        <SessionTimerPrompt
          onConfirm={() => { setShowTimerPrompt(false); setShowTimerModal(true); }}
          onDismiss={() => setShowTimerPrompt(false)}
        />
      )}
    </>
  );

  if (view === "stats") {
    return <StatsDashboard user={user} onBack={() => setView("dashboard")} />;
  }

  if (view === "exercise" && selectedExercise) {
    const live = exercises.find(e => e.id === selectedExercise.id) || selectedExercise;
    return (
      <>
        <div style={{ ...BG, padding: "52px 20px 100px" }}>
          <ExerciseDetail
            exercise={live}
            onSave={handleSaveWeight}
            onDeleteSet={handleDeleteSet}
            onEditSet={handleEditSet}
            onBack={() => { setView("category"); setSelectedExercise(null); }}
          />
        </div>
        {voiceOverlay}
      </>
    );
  }

  if (view === "category" && selectedCat) {
    const catInfo = CATS.find(c => c.key === selectedCat);
    return (
      <>
      <div style={{ ...BG, padding: "52px 20px 100px" }}>
        <button onClick={() => setView("dashboard")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: catInfo.color,
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
        }}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> ראשי
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
      {voiceOverlay}
      </>
    );
  }

  return (
    <div style={{ ...BG, padding: "52px 20px 100px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dumbbell size={24} color="#ff6b35" />
            <span style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>LIFT LOG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("stats")} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, color: "#aaa", fontSize: 12, fontWeight: 600,
              padding: "6px 12px", cursor: "pointer",
            }}>
              📊 סטטיסטיקות
            </button>
            <ExportButton user={user} />
            <ShareButton exercises={exercises} />
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, color: "#555", fontSize: 12, fontWeight: 600,
                padding: "6px 12px", cursor: "pointer",
              }}
            >
              יציאה
            </button>
          </div>
        </div>
        <h1 style={{ color: "#f0ede8", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
          ברוך הבא, {user?.user_metadata?.name}! 💪
        </h1>
        <div style={{ color: "#555", fontSize: 14, marginTop: 6 }}>בהצלחה באימון!</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CATS.map(cat => {
          const exs = exercises.filter(e => e.category === cat.key);
          const withData = exs.filter(e => e.sessions.length > 0);
          return (
            <div key={cat.key} style={{
              background: `${cat.color}15`,
              border: `1px solid ${cat.color}30`,
              borderRadius: 20, overflow: "hidden",
            }}>
              <div onClick={() => { setSelectedCat(cat.key); setView("category"); }}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "20px 20px",
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
              </div>
              <button onClick={() => setAiModalCat(cat.key)} style={{
                width: "100%", padding: "10px 20px",
                background: `${cat.color}0d`,
                border: "none", borderTop: `1px solid ${cat.color}25`,
                color: cat.color, fontSize: 13, fontWeight: 700,
                cursor: "pointer", textAlign: "center",
                WebkitTapHighlightColor: "transparent",
              }}>
                💡 תרגילים וטיפים
              </button>
            </div>
          );
        })}
      </div>

      {aiModalCat && (
        <MuscleAIModal
          muscleGroup={CATS.find(c => c.key === aiModalCat)?.label}
          onClose={() => setAiModalCat(null)}
        />
      )}
      {voiceOverlay}
    </div>
  );
}
