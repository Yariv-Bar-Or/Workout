"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  ChevronLeft, Plus, Dumbbell, TrendingUp, X, Check,
  ChevronDown, ChevronUp, User, Zap, BarChart2, Calendar, Trash2
} from "lucide-react";

const SEED_EXERCISES = {
  push: ["לחיצת חזה", "לחיצת כתפיים", "לחיצת חזה בשיפוע", "מקבילים"],
  pull: ["מתח", "חתירה", "פולי עליון", "פייס פולס"],
  legs: ["סקוואט", "דדליפט", "לחיצת רגליים", "לאנג'ים"],
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seedExercises(profileId) {
  const now = Date.now();
  const exercises = [];
  Object.entries(SEED_EXERCISES).forEach(([cat, names]) => {
    names.forEach((name, i) => {
      exercises.push({
        id: genId(),
        profile_id: profileId,
        category: cat,
        name,
        sessions: [],
        updated_at: now - (names.length - i) * 60000,
      });
    });
  });
  return exercises;
}

function useLocalDB() {
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wt_profiles") || "[]"); } catch { return []; }
  });
  const [exercises, setExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wt_exercises") || "[]"); } catch { return []; }
  });

  const persist = useCallback((p, e) => {
    try {
      localStorage.setItem("wt_profiles", JSON.stringify(p));
      localStorage.setItem("wt_exercises", JSON.stringify(e));
    } catch {}
  }, []);

  const addProfile = useCallback((name) => {
    if (profiles.length >= 10) return null;
    const profile = { id: genId(), name, updated_at: Date.now() };
    const exs = seedExercises(profile.id);
    const np = [...profiles, profile];
    const ne = [...exercises, ...exs];
    setProfiles(np); setExercises(ne);
    persist(np, ne);
    return profile;
  }, [profiles, exercises, persist]);

  // CHANGE 4: deleteProfile
  const deleteProfile = useCallback((profileId) => {
    const np = profiles.filter(p => p.id !== profileId);
    const ne = exercises.filter(e => e.profile_id !== profileId);
    setProfiles(np); setExercises(ne);
    persist(np, ne);
  }, [profiles, exercises, persist]);

  // CHANGE 1: accept reps param
  const updateExerciseWeight = useCallback((exerciseId, weight, reps) => {
    const now = Date.now();
    let profileId = null;
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      return { ...e, sessions: [...e.sessions, { weight, reps: reps || null, date: now }], updated_at: now };
    });
    const np = profiles.map(p =>
      p.id === profileId ? { ...p, updated_at: now } : p
    );
    setProfiles(np); setExercises(ne);
    persist(np, ne);
  }, [exercises, profiles, persist]);

  const addExercise = useCallback((profileId, category, name) => {
    const ex = { id: genId(), profile_id: profileId, category, name, sessions: [], updated_at: Date.now() };
    const ne = [...exercises, ex];
    setExercises(ne);
    persist(profiles, ne);
    return ex;
  }, [exercises, profiles, persist]);

  return { profiles, exercises, addProfile, deleteProfile, updateExerciseWeight, addExercise };
}

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
  { key: "All", label: "הכל" }
];

function filterByTimeframe(sessions, tf) {
  if (tf === "All") return sessions;
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[tf];
  const cutoff = Date.now() - months * 30 * 86400000;
  return sessions.filter(s => s.date >= cutoff);
}

function Chart({ sessions }) {
  const [tf, setTf] = useState("All");
  const filtered = filterByTimeframe(sessions, tf);

  // Normalize timestamp to midnight so all sets on same day share the same x
  const dayStart = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // All sets as scatter dots
  const allDots = filtered.map(s => ({
    x: dayStart(s.date),
    y: s.weight,
    reps: s.reps ?? null,
    label: fmt(s.date),
  }));

  // Max weight per day for the trend line
  const dayMap = new Map();
  filtered.forEach(s => {
    const dk = dayStart(s.date);
    const prev = dayMap.get(dk);
    if (!prev || s.weight > prev.y) {
      dayMap.set(dk, { x: dk, y: s.weight, reps: s.reps ?? null, label: fmt(s.date) });
    }
  });
  const trendLine = Array.from(dayMap.values()).sort((a, b) => a.x - b.x);

  const xTicks = trendLine.map(d => d.x);
  const hasData = trendLine.length >= 1;

  const weights = allDots.map(d => d.y);
  const yMin = weights.length ? Math.min(...weights) : 0;
  const yMax = weights.length ? Math.max(...weights) : 100;
  const yPad = Math.max((yMax - yMin) * 0.2, 5);

  const xMin = allDots.length ? Math.min(...allDots.map(d => d.x)) : 0;
  const xMax = allDots.length ? Math.max(...allDots.map(d => d.x)) : 1;
  const xDomain = xMin === xMax ? [xMin - 86400000, xMax + 86400000] : [xMin, xMax];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: "#1a1a1a", border: "1px solid #333", borderRadius: 8,
        padding: "8px 12px", fontSize: 12, textAlign: "right",
      }}>
        <div style={{ color: "#888", marginBottom: 4 }}>{d.label}</div>
        <div style={{ color: "#ff6b35", fontWeight: 700 }}>{d.y} ק״ג</div>
        {d.reps != null && <div style={{ color: "#aaa", marginTop: 2 }}>{d.reps} חזרות</div>}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 12 }} dir="ltr">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }} dir="rtl">
        {TIMEFRAMES.map(t => (
          <button key={t.key} onClick={() => setTf(t.key)} style={{
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
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
              dataKey="y"
              domain={[yMin - yPad, yMax + yPad]}
              tick={{ fill: "#555", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Line connects only the heaviest set per day */}
            <Line
              data={trendLine}
              dataKey="y"
              stroke="#ff6b35"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              type="monotone"
              isAnimationActive={false}
            />
            {/* Dots for every set — vertically aligned on same date */}
            <Scatter
              data={allDots}
              fill="#ff6b35"
              shape={(props) => {
                const { cx, cy } = props;
                if (!cx || !cy) return null;
                return <circle cx={cx} cy={cy} r={4} fill="#ff6b35" />;
              }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function CategoryBadge({ cat }) {
  const cfg = {
    push: { bg: "#ff6b35", label: "דחיפה (PUSH)" },
    pull: { bg: "#4ecdc4", label: "משיכה (PULL)" },
    legs: { bg: "#a78bfa", label: "רגליים (LEGS)" },
  }[cat] || { bg: "#888", label: cat };
  return (
    <span style={{
      background: cfg.bg, color: "#fff", fontSize: 11, fontWeight: 800,
      padding: "2px 8px", borderRadius: 4,
    }}>{cfg.label}</span>
  );
}

// CHANGE 4: ProfileCard gets onDelete prop
function ProfileCard({ profile, onClick, onDelete, rank }) {
  const initials = profile.name.slice(0, 2);
  const colors = ["#ff6b35", "#4ecdc4", "#a78bfa", "#f7dc6f", "#82e0aa", "#85c1e9", "#f1948a", "#bb8fce", "#f0b27a", "#76d7c4"];
  const color = colors[rank % colors.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 14,
        flex: 1, padding: "14px 16px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, cursor: "pointer", textAlign: "right",
        transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
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
        title="מחק פרופיל"
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
      transition: "background 0.12s", WebkitTapHighlightColor: "transparent",
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

// CHANGE 1: ExerciseDetail gets reps input
function ExerciseDetail({ exercise, onSave, onBack }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");       // NEW
  const [saved, setSaved] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const inputRef = useRef();
  const last = exercise.sessions[exercise.sessions.length - 1];
  const best = exercise.sessions.reduce((m, s) => Math.max(m, s.weight), 0);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSave() {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    const r = reps !== "" ? parseInt(reps, 10) : null;
    onSave(exercise.id, w, r);
    setSaved(true);
    setWeight("");
    setReps("");
    setTimeout(() => setSaved(false), 1500);
  }

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
          עדכון סט
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Weight input */}
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

          {/* CHANGE 1: Reps input */}
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
            cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
          }}>
            {saved ? <Check size={22} /> : <Zap size={22} />}
          </button>
        </div>
        {last && (
          <div style={{ color: "#666", fontSize: 12, marginTop: 10, textAlign: "center" }}>
            קודם: {last.weight} ק״ג{last.reps != null ? ` × ${last.reps}` : ""} ב-{fmt(last.date)}
          </div>
        )}
      </div>

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

      {showChart && <Chart sessions={exercise.sessions} name={exercise.name} />}
    </div>
  );
}

const CATS = [
  { key: "push", label: "דחיפה", icon: "💪", desc: "חזה · כתפיים · יד אחורית", color: "#ff6b35" },
  { key: "pull", label: "משיכה", icon: "🔄", desc: "גב · יד קדמית · כתף אחורית", color: "#4ecdc4" },
  { key: "legs", label: "רגליים", icon: "🦵", desc: "ארבע ראשי · המסטרינג · ישבן", color: "#a78bfa" },
];

export default function WorkoutTracker() {
  const { profiles, exercises, addProfile, deleteProfile, updateExerciseWeight, addExercise } = useLocalDB();
  const [view, setView] = useState("profiles");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  const sortedProfiles = [...profiles].sort((a, b) => b.updated_at - a.updated_at);

  const catExercises = exercises
    .filter(e => e.profile_id === selectedProfile?.id && e.category === selectedCat)
    .sort((a, b) => b.updated_at - a.updated_at);

  function handleSelectProfile(p) {
    setSelectedProfile(p); setView("dashboard");
  }

  // CHANGE 4: delete handler
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
    addProfile(name);
    setNewProfileName(""); setAddingProfile(false);
  }

  // CHANGE 1: pass reps through
  function handleSaveWeight(exId, w, r) {
    updateExerciseWeight(exId, w, r);
    const updatedEx = {
      ...selectedExercise,
      sessions: [...selectedExercise.sessions, { weight: w, reps: r || null, date: Date.now() }]
    };
    setSelectedExercise(updatedEx);
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
          exercise={{ ...live, ...selectedExercise, sessions: live.sessions }}
          onSave={handleSaveWeight}
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
          <div style={{ fontSize: 36, marginBottom: 4 }}>{catInfo.icon}</div>
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
            const lastUpdated = exs.reduce((m, e) => Math.max(m, e.updated_at), 0);
            const withData = exs.filter(e => e.sessions.length > 0);
            return (
              <button key={cat.key} onClick={() => { setSelectedCat(cat.key); setView("category"); }}
                style={{
                  display: "flex", alignItems: "center",
                  background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}05 100%)`,
                  border: `1px solid ${cat.color}30`,
                  borderRadius: 20, padding: "20px 20px",
                  cursor: "pointer", textAlign: "right",
                  WebkitTapHighlightColor: "transparent",
                  transition: "transform 0.1s",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ color: cat.color, fontSize: 28, fontWeight: 900 }}>{cat.label}</div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{cat.desc}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{exs.length}</span> תרגילים
                    </span>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{withData.length}</span> רשומים
                    </span>
                    {lastUpdated > 0 && (
                      <span style={{ color: "#444", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar size={10} /> {fmtRelative(lastUpdated)}
                      </span>
                    )}
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

  // PROFILES VIEW
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

      {profiles.length < 10 && (
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
            <Plus size={20} /> הוספת פרופיל {profiles.length > 0 && `(נשארו עוד ${10 - profiles.length})`}
          </button>
        )
      )}

      {profiles.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 40, color: "#444" }}>
          <User size={40} color="#333" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15 }}>יש להוסיף פרופיל ראשון כדי להתחיל</div>
        </div>
      )}

      <div style={{ marginTop: 40, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
          חיבור ל-Supabase
        </div>
        <div style={{ color: "#555", fontSize: 12, lineHeight: 1.6 }}>
          האפליקציה שומרת נתונים מקומית דרך <code dir="ltr" style={{ color: "#ff6b35", background: "rgba(255,107,53,0.1)", padding: "1px 5px", borderRadius: 4 }}>localStorage</code> ומוכנה לחיבור סנכרון לענן של Supabase.
        </div>
      </div>
    </div>
  );
}