"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  ChevronLeft, Plus, Dumbbell, TrendingUp, X, Check,
  ChevronDown, ChevronUp, User, Zap, BarChart2, Calendar,
  Pencil, Trash2, Clock, AlertTriangle
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE — uncomment to activate real backend
// ════════════════════════════════════════════════════════════════════════════
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

const HE = {
  appName: "יומן ברזל",
  whoIsLifting: "מי מרים היום?",
  mostActive: "הכי פעיל",
  addProfile: "הוסף פרופיל",
  yourName: "השם שלך",
  namePlaceholder: "לדוג׳ יוסי כהן",
  selectWorkout: "בחר אימון",
  allProfiles: "כל הפרופילים",
  back: "חזרה",
  noProfiles: "הוסף פרופיל ראשון להתחיל",
  maxProfiles: "הגעת למגבלת 3 משתמשים. יש למחוק פרופיל כדי להוסיף חדש.",
  exercises: "תרגילים",
  logged: "מתועדים",
  addExercise: "הוסף תרגיל",
  exerciseName: "שם תרגיל",
  exPlaceholder: "לדוג׳ לחיצת חזה",
  logSet: "תיעוד סט",
  weight: "משקל",
  reps: "חזרות",
  kg: "ק״ג",
  today: "היום",
  changeDate: "שנה תאריך",
  setCounter: (n) => `סט #${n}`,
  alreadyLogged: "סטים שתועדו היום",
  recentSets: "היסטוריה",
  lastLift: "הרמה אחרונה",
  personalBest: "שיא אישי",
  totalSessions: "סה״כ סטים",
  thisMonth: "החודש",
  progressChart: "גרף מגמה",
  noData: "תעד סטים לצפייה בגרף",
  editSet: "עריכת סט",
  deleteSet: "מחיקת סט",
  editExercise: "עריכת שם תרגיל",
  deleteExercise: "מחיקת תרגיל",
  deleteProfile: "מחיקת פרופיל",
  confirmTitle: "האם אתה בטוח?",
  confirmDelete: (name) => `למחוק את "${name}"?`,
  confirmDeleteProfile: (name) => `למחוק את הפרופיל של ${name} וכל הנתונים שלו?`,
  confirmYes: "כן, מחק",
  confirmNo: "ביטול",
  noSessions: "אין נתונים עדיין",
  prev: (w, r, d) => `קודם: ${w} ק״ג × ${r} · ${d}`,
  timerPrompt: "רוצה טיימר בין סטים?",
  timerYes: "כן, הפעל טיימר",
  timerNo: "לא תודה",
  timerSeconds: "שניות",
  cats: {
    chest:     { label: "חזה",     icon: "💪", desc: "לחיצה · פרפר · קרוסאובר" },
    back:      { label: "גב",      icon: "🔄", desc: "חתירה · מתח · לט פולדאון" },
    biceps:    { label: "יד קדמית",   icon: "💪", desc: "כפיפות · פריצר · האמר" },
    triceps:   { label: "יד אחורית",  icon: "🦾", desc: "פושדאון · פרנץ׳ · דיפס" },
    shoulders: { label: "כתפיים",  icon: "🏋️", desc: "לחיצה · פרפר · שרגים" },
    legs:      { label: "רגליים",  icon: "🦵", desc: "סקוואט · דדליפט · לג פרס" },
  },
  fmtRel: {
    now: "עכשיו",
    textTimer: "מנוחה זורמת",
    mins: (m) => `לפני ${m} דק׳`,
    hours: (h) => `לפני ${h} ש׳`,
    days: (d) => `לפני ${d} ימים`,
  },
};

const C = {
  chest: "#ff6b35", back: "#4ecdc4", biceps: "#f7dc6f",
  triceps: "#a78bfa", shoulders: "#82e0aa", legs: "#85c1e9",
  push: "#ff6b35", // alias kept for any internal references
  bg: "#0f0f0f", surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", text: "#f0ede8", muted: "#666",
  danger: "#e74c3c", success: "#22c55e", info: "#3498db",
  profileColors: ["#ff6b35","#4ecdc4","#a78bfa","#f7dc6f","#82e0aa"],
};

const CATS = [
  { key: "chest",     color: C.chest },
  { key: "back",      color: C.back },
  { key: "biceps",    color: C.biceps },
  { key: "triceps",   color: C.triceps },
  { key: "shoulders", color: C.shoulders },
  { key: "legs",      color: C.legs },
];

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("he-IL", { month: "short", day: "numeric" });
}
function fmtDateInput(ts) {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtRelative(ts) {
  if (!ts) return HE.fmtRel.now;
  const d = Date.now() - ts;
  if (d < 60000) return HE.fmtRel.now;
  if (d < 3600000) return HE.fmtRel.mins(Math.floor(d/60000));
  if (d < 86400000) return HE.fmtRel.hours(Math.floor(d/3600000));
  return HE.fmtRel.days(Math.floor(d/86400000));
}
function sameDay(ts1, ts2) {
  return fmtDateInput(ts1) === fmtDateInput(ts2);
}

// ════════════════════════════════════════════════════════════════════════════
// LOCAL DB HOOK
// ════════════════════════════════════════════════════════════════════════════
function useDB() {
  const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };
  const [profiles, setProfiles] = useState(() => load("il3_profiles", []));
  const [exercises, setExercises] = useState(() => load("il3_exercises", []));

  const save = useCallback((p, e) => {
    try {
      localStorage.setItem("il3_profiles", JSON.stringify(p));
      localStorage.setItem("il3_exercises", JSON.stringify(e));
    } catch {}
  }, []);

  const addProfile = useCallback((name) => {
    if (profiles.length >= 3) return null;
    const p = { id: genId(), name, updated_at: Date.now() };
    const np = [...profiles, p];
    setProfiles(np); save(np, exercises);
    return p;
  }, [profiles, exercises, save]);

  const deleteProfile = useCallback((id) => {
    const np = profiles.filter(p => p.id !== id);
    const ne = exercises.filter(e => e.profile_id !== id);
    setProfiles(np); setExercises(ne); save(np, ne);
  }, [profiles, exercises, save]);

  const bumpProfile = useCallback((profileId, ts) => {
    const np = profiles.map(p => p.id === profileId ? { ...p, updated_at: ts } : p);
    setProfiles(np); save(np, exercises);
  }, [profiles, exercises, save]);

  const addExercise = useCallback((profileId, category, name) => {
    const ex = { id: genId(), profile_id: profileId, category, name, sessions: [], updated_at: Date.now() };
    const ne = [...exercises, ex];
    setExercises(ne); save(profiles, ne);
  }, [exercises, profiles, save]);

  const renameExercise = useCallback((id, name) => {
    const ne = exercises.map(e => e.id === id ? { ...e, name } : e);
    setExercises(ne); save(profiles, ne);
  }, [exercises, profiles, save]);

  const deleteExercise = useCallback((id) => {
    const ne = exercises.filter(e => e.id !== id);
    setExercises(ne); save(profiles, ne);
  }, [exercises, profiles, save]);

  const addSession = useCallback((exerciseId, { weight, reps, date }) => {
    const ts = date || Date.now();
    const session = { id: genId(), weight, reps, date: ts };
    let profileId = null;
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      const sorted = [...e.sessions, session].sort((a, b) => a.date - b.date);
      return { ...e, sessions: sorted, updated_at: Date.now() };
    });
    const np = profiles.map(p => p.id === profileId ? { ...p, updated_at: Date.now() } : p);
    setExercises(ne); setProfiles(np); save(np, ne);
    return session;
  }, [exercises, profiles, save]);

  const updateSession = useCallback((exerciseId, sessionId, data) => {
    const ne = exercises.map(e => e.id !== exerciseId ? e : {
      ...e, sessions: e.sessions.map(s => s.id === sessionId ? { ...s, ...data } : s).sort((a, b) => a.date - b.date)
    });
    setExercises(ne); save(profiles, ne);
  }, [exercises, profiles, save]);

  const deleteSession = useCallback((exerciseId, sessionId) => {
    const ne = exercises.map(e => e.id !== exerciseId ? e : {
      ...e, sessions: e.sessions.filter(s => s.id !== sessionId)
    });
    setExercises(ne); save(profiles, ne);
  }, [exercises, profiles, save]);

  return {
    profiles, exercises,
    addProfile, deleteProfile, bumpProfile,
    addExercise, renameExercise, deleteExercise,
    addSession, updateSession, deleteSession,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ════════════════════════════════════════════════════════════════════════════
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, padding: 24,
    }}>
      <div style={{
        background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: 28, width: "100%", maxWidth: 340,
        textAlign: "center",
      }} dir="rtl">
        <AlertTriangle size={36} color={C.danger} style={{ margin: "0 auto 14px", display: "block" }} />
        <div style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{HE.confirmTitle}</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 48, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent", color: C.muted, fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>{HE.confirmNo}</button>
          <button onClick={onConfirm} style={{
            flex: 1, height: 48, borderRadius: 12, border: "none",
            background: C.danger, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>{HE.confirmYes}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TIMER MODAL & COMPONENT (unchanged from v3)
// ════════════════════════════════════════════════════════════════════════════
function TimerSetupModal({ onSelect }) {
  const options = [60, 90, 120, 180];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24
    }}>
      <div style={{
        background: "#161616", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, textAlign: "center"
      }} dir="rtl">
        <Clock size={40} color={C.push} style={{ margin: "0 auto 16px", display: "block" }} />
        <h3 style={{ color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{HE.timerPrompt}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
          {options.map(s => (
            <button key={s} onClick={() => onSelect(s)} style={{
              height: 50, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, color: C.text, fontSize: 15, fontWeight: 700, cursor: "pointer"
            }}>
              {s} {HE.timerSeconds}
            </button>
          ))}
        </div>
        <button onClick={() => onSelect(null)} style={{
          width: "100%", height: 48, marginTop: 14, background: "transparent",
          border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, color: C.muted,
          fontSize: 14, fontWeight: 600, cursor: "pointer"
        }}>{HE.timerNo}</button>
      </div>
    </div>
  );
}

function ActiveWorkoutTimer({ duration, triggerReset, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (triggerReset > 0 && duration) {
      setTimeLeft(duration);
    }
  }, [triggerReset, duration]);

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, onComplete]);

  if (timeLeft <= 0) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = (timeLeft / duration) * 100;

  return (
    <div style={{
      background: "#161616", border: `1px solid ${C.push}44`, borderRadius: 16,
      padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center",
      justifyContent: "space-between", position: "relative", overflow: "hidden"
    }} dir="rtl">
      <div style={{ position: "absolute", bottom: 0, right: 0, height: 3, background: C.push, width: `${progress}%`, transition: "width 1s linear" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Clock size={18} color={C.push} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>זמן מנוחה..</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.push, fontFamily: "monospace" }}>
        {mins}:{secs.toString().padStart(2, "0")}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHART — scatter all sets + line only through daily peak
// ════════════════════════════════════════════════════════════════════════════
const TIMEFRAMES = ["1m", "3m", "6m", "1y", "כל"];

function buildChartData(sessions, tf) {
  let filtered = [...sessions].sort((a, b) => a.date - b.date);
  if (tf !== "כל") {
    const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[tf];
    const cutoff = Date.now() - months * 30 * 86400000;
    filtered = filtered.filter(s => s.date >= cutoff);
  }

  // Group by calendar day
  const byDay = {};
  filtered.forEach(s => {
    const dayKey = fmtDateInput(s.date);
    if (!byDay[dayKey]) byDay[dayKey] = { dayKey, date: s.date, sets: [] };
    byDay[dayKey].sets.push(s);
  });

  const sortedDays = Object.values(byDay).sort((a, b) => a.date - b.date);
  const GAP = 7 * 86400000;

  // Build two parallel arrays:
  // peakData: one entry per day for the Line (no zigzag possible)
  // allData:  every set for the Scatter (same label = same X position)
  const peakData = [];
  const allData = [];

  sortedDays.forEach((d, i) => {
    if (i > 0 && d.date - sortedDays[i-1].date > GAP) {
      peakData.push({ label: null, peakWeight: null }); // gap breaks line
    }
    const peakSet = d.sets.reduce((max, s) => s.weight > max.weight ? s : max, d.sets[0]);
    const label = fmtDate(d.date);
    peakData.push({ label, peakWeight: peakSet.weight });
    d.sets.forEach(s => {
      allData.push({ label, dotWeight: s.weight, reps: s.reps, isPeak: s.id === peakSet.id });
    });
  });

  // Merge into one flat array for ComposedChart.
  // Each peak row carries its dot too. Non-peak sets are appended with same label.
  const labelOrder = peakData.filter(p => p.label).map(p => p.label);
  const flat = [];
  peakData.forEach(p => flat.push({ label: p.label, peakWeight: p.peakWeight, dotWeight: p.peakWeight }));
  allData.filter(d => !d.isPeak).forEach(d => flat.push({ label: d.label, peakWeight: null, dotWeight: d.dotWeight, reps: d.reps }));
  flat.sort((a, b) => {
    const ai = labelOrder.indexOf(a.label);
    const bi = labelOrder.indexOf(b.label);
    return ai - bi;
  });
  return flat;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.dotWeight == null) return null;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
      padding: "8px 14px", fontSize: 13, direction: "rtl",
    }}>
      <div style={{ color: "#888", marginBottom: 3 }}>{d.label}</div>
      <div style={{ color: C.push, fontWeight: 800, fontSize: 16 }}>{d.dotWeight} {HE.kg}</div>
      {d.reps > 0 && <div style={{ color: "#777" }}>× {d.reps} {HE.reps}</div>}
    </div>
  );
}

function PeakChart({ sessions, catColor }) {
  const [tf, setTf] = useState("כל");
  const flat = buildChartData(sessions, tf);
  const color = catColor || C.push;
  const hasData = flat.filter(p => p.dotWeight != null).length >= 1;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => setTf(t)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
            background: tf === t ? color : "rgba(255,255,255,0.06)",
            color: tf === t ? "#fff" : "#555", fontWeight: 700, fontSize: 12,
            cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
      {!hasData ? (
        <div style={{ height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#333" }}>
          <BarChart2 size={28} color="#2a2a2a" />
          <span style={{ fontSize: 13, color: "#444" }}>{HE.noData}</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={170}>
          <ComposedChart data={flat} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" allowDuplicatedCategory={false}
              tick={{ fill: "#444", fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#444", fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            {/* All sets as faded dots — same label = same vertical X */}
            <Scatter dataKey="dotWeight" fill={color + "66"} r={5} />
            {/* Peak line — one point per day, never zigzags between sets */}
            <Line
              type="monotone" dataKey="peakWeight" stroke={color} strokeWidth={2.5}
              dot={{ fill: color, r: 5, strokeWidth: 0 }}
              connectNulls={false}
              activeDot={{ r: 7, stroke: C.bg, strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXERCISE DETAIL
// ════════════════════════════════════════════════════════════════════════════
function ExerciseDetail({ exercise, timerDuration, onSave, onUpdateSession, onDeleteSession, onBack }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saved, setSaved] = useState(false);
  const [logDate, setLogDate] = useState(fmtDateInput(Date.now()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [timerTrigger, setTimerTrigger] = useState(0);
  const weightRef = useRef();

  const sessions = exercise.sessions || [];
  const sorted = [...sessions].sort((a, b) => b.date - a.date);
  const last = sorted[0];

  const bestSession = sessions.reduce((best, current) => {
    return (!best || current.weight > best.weight) ? current : best;
  }, null);

  const selectedDayStart = new Date(logDate + "T12:00:00").getTime();
  const setsToday = sessions.filter(s => sameDay(s.date, selectedDayStart)).sort((a,b) => a.date - b.date);
  const nextSetNum = setsToday.length + 1;

  const catColor = C[exercise.category] || C.push;

  useEffect(() => { weightRef.current?.focus(); }, []);

  function handleSave() {
    const w = parseFloat(weight);
    const r = parseInt(reps) || 0;
    if (!w || w <= 0 || r <= 0) return;
    onSave({ weight: w, reps: r, date: selectedDayStart });
    setSaved(true);
    setTimerTrigger(prev => prev + 1);
    setTimeout(() => setSaved(false), 1400);
    setWeight(""); setReps("");
  }

  return (
    <div dir="rtl">
      <ActiveWorkoutTimer duration={timerDuration} triggerReset={timerTrigger} />

      <button onClick={onBack} style={styles.backBtn(catColor)}>
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {HE.back}
      </button>

      <div style={{ marginBottom: 20 }}>
        <span style={styles.catBadge(catColor)}>{HE.cats[exercise.category]?.label}</span>
        <h2 style={{ color: C.text, fontSize: 24, fontWeight: 900, margin: "8px 0 0" }}>{exercise.name}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { label: HE.lastLift, value: last ? `${last.weight} ${HE.kg}` : "—", sub: last ? `× ${last.reps} · ${fmtDate(last.date)}` : "" },
          { label: HE.personalBest, value: bestSession ? `${bestSession.weight} ${HE.kg}` : "—", sub: bestSession ? `× ${bestSession.reps} · ${fmtDate(bestSession.date)}` : "" },
          { label: HE.totalSessions, value: sessions.length, sub: "" },
          { label: HE.thisMonth, value: sessions.filter(s => s.date > Date.now() - 30*86400000).length, sub: "" },
        ].map(c => (
          <div key={c.label} style={styles.statCard}>
            <div style={{ color: "#555", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: C.text, fontSize: 18, fontWeight: 800 }}>{c.value}</div>
            {c.sub && <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 18, padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: catColor, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            {HE.logSet}
          </span>
          <span style={{ background: catColor + "22", color: catColor, fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
            {HE.setCounter(nextSetNum)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: "#555", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>{HE.weight} ({HE.kg})</label>
            <input ref={weightRef} type="number" inputMode="decimal"
              placeholder={setsToday.length > 0 ? String(setsToday[setsToday.length-1].weight) : "0.0"}
              value={weight} onChange={e => setWeight(e.target.value)}
              style={styles.bigInput("rgba(255,107,53,0.3)")} />
          </div>
          <div style={{ width: 90 }}>
            <label style={{ color: "#555", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>{HE.reps}</label>
            <input type="number" inputMode="numeric"
              placeholder={setsToday.length > 0 ? String(setsToday[setsToday.length-1].reps) : "0"}
              value={reps} onChange={e => setReps(e.target.value)}
              style={styles.bigInput("rgba(255,255,255,0.12)")} />
          </div>
          <button onClick={handleSave} style={{
            width: 58, height: 58, borderRadius: 14, border: "none",
            background: saved ? C.success : catColor, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
          }}>
            {saved ? <Check size={24} /> : <Zap size={24} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowDatePicker(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: showDatePicker ? catColor + "22" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
            padding: "8px 14px", color: showDatePicker ? catColor : "#666",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Calendar size={14} />
            {logDate === fmtDateInput(Date.now()) ? HE.today : logDate}
          </button>
          {showDatePicker && (
            <input type="date" value={logDate} max={fmtDateInput(Date.now())}
              onChange={e => { setLogDate(e.target.value); setShowDatePicker(false); }}
              style={{ flex: 1, height: 40, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10, color: C.text, fontSize: 14, padding: "0 10px", outline: "none" }} />
          )}
        </div>

        {setsToday.length > 0 && (
          <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{HE.alreadyLogged}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {setsToday.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: 13 }}>
                  <span style={{ color: catColor, fontWeight: 700, fontSize: 11 }}>סט #{i+1}</span>
                  <span>{s.weight} {HE.kg} × {s.reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <>
          <button onClick={() => setShowHistory(v => !v)} style={styles.accordion}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color={catColor} /> {HE.recentSets} ({sessions.length})
            </span>
            {showHistory ? <ChevronUp size={15} color="#444" /> : <ChevronDown size={15} color="#444" />}
          </button>
          {showHistory && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {sorted.slice(0, 15).map(s => (
                <div key={s.id} style={styles.setRow}>
                  {editingSet?.id === s.id ? (
                    <EditSetInline set={editingSet}
                      onChange={setEditingSet}
                      onSave={() => {
                        onUpdateSession(s.id, {
                          weight: editingSet.weight,
                          reps: editingSet.reps,
                          date: new Date(editingSet.dateString + "T12:00:00").getTime()
                        });
                        setEditingSet(null);
                      }}
                      onCancel={() => setEditingSet(null)} />
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: catColor, fontWeight: 800, fontSize: 16 }}>{s.weight} {HE.kg}</span>
                        <span style={{ color: "#666", fontSize: 14, marginRight: 8 }}> × {s.reps}</span>
                        <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>{fmtDate(s.date)}</div>
                      </div>
                      <button onClick={() => setEditingSet({ ...s, dateString: fmtDateInput(s.date) })} style={styles.iconBtn("#555")}><Pencil size={15} /></button>
                      <button onClick={() => setConfirmDel(s)} style={styles.iconBtn("#555")}><Trash2 size={15} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button onClick={() => setShowChart(v => !v)} style={{ ...styles.accordion, marginTop: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={15} color={catColor} /> {HE.progressChart}
        </span>
        {showChart ? <ChevronUp size={15} color="#444" /> : <ChevronDown size={15} color="#444" />}
      </button>
      {showChart && <PeakChart sessions={sessions} catColor={catColor} />}

      {confirmDel && (
        <ConfirmModal
          message={HE.confirmDelete(`${confirmDel.weight} ${HE.kg} × ${confirmDel.reps}`)}
          onConfirm={() => { onDeleteSession(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function EditSetInline({ set, onChange, onSave, onCancel }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", flexWrap: "wrap" }}>
      <input type="number" inputMode="decimal" value={set.weight}
        onChange={e => onChange(s => ({ ...s, weight: parseFloat(e.target.value) || s.weight }))}
        style={{ width: 62, height: 40, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: C.text, fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} />
      <span style={{ color: "#444", fontSize: 11 }}>{HE.kg}</span>
      <input type="number" inputMode="numeric" value={set.reps}
        onChange={e => onChange(s => ({ ...s, reps: parseInt(e.target.value) || s.reps }))}
        style={{ width: 50, height: 40, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: C.text, fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} />
      <input type="date" value={set.dateString} max={fmtDateInput(Date.now())}
        onChange={e => onChange(s => ({ ...s, dateString: e.target.value }))}
        style={{ flex: 1, minWidth: 90, height: 40, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: C.text, fontSize: 12, padding: "0 4px", outline: "none" }} />
      <button onClick={onSave} style={styles.iconBtn(C.success)}><Check size={14} /></button>
      <button onClick={onCancel} style={styles.iconBtn("#444")}><X size={14} /></button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXERCISE ROW
// ════════════════════════════════════════════════════════════════════════════
function ExerciseRow({ exercise, onClick, onDelete, onRename }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(exercise.name);
  const sorted = [...exercise.sessions].sort((a, b) => b.date - a.date);
  const last = sorted[0];
  const catColor = C[exercise.category] || C.push;

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: "hidden",
      }}>
        {renaming ? (
          <div style={{ flex: 1, display: "flex", gap: 8, padding: "10px 12px", alignItems: "center" }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              style={{ flex: 1, height: 40, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: C.text, fontSize: 15, padding: "0 10px", outline: "none" }} />
            <button onClick={() => { onRename(newName); setRenaming(false); }} style={styles.iconBtn(C.success)}><Check size={16} /></button>
            <button onClick={() => setRenaming(false)} style={styles.iconBtn("#444")}><X size={16} /></button>
          </div>
        ) : (
          <button onClick={onClick} style={{
            flex: 1, display: "flex", alignItems: "center", gap: 12,
            padding: "14px 14px", background: "transparent", border: "none",
            cursor: "pointer", textAlign: "right",
          }}>
            <Dumbbell size={18} color="#333" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{exercise.name}</div>
              {last
                ? <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                    {HE.lastLift}: <span style={{ color: catColor, fontWeight: 700 }}>{last.weight} {HE.kg}</span>
                    {last.reps > 0 && <span style={{ color: "#555" }}> × {last.reps}</span>}
                    <span style={{ color: "#444", marginRight: 6 }}> · {fmtDate(last.date)}</span>
                  </div>
                : <div style={{ color: "#333", fontSize: 12, marginTop: 2 }}>{HE.noSessions}</div>
              }
            </div>
          </button>
        )}
        {!renaming && (
          <div style={{ display: "flex", gap: 4, paddingLeft: 10 }}>
            <button onClick={() => setRenaming(true)} style={styles.iconBtn("#444")}><Pencil size={14} /></button>
            <button onClick={() => setConfirmDel(true)} style={styles.iconBtn("#444")}><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      {confirmDel && (
        <ConfirmModal
          message={HE.confirmDelete(exercise.name)}
          onConfirm={() => { onDelete(); setConfirmDel(false); }}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE CARD
// ════════════════════════════════════════════════════════════════════════════
function ProfileCard({ profile, rank, onClick, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = C.profileColors[rank % C.profileColors.length];
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
      }}>
        <button onClick={onClick} style={{
          flex: 1, display: "flex", alignItems: "center", gap: 14,
          padding: "14px 16px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "right",
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: color + "20", border: `2px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, color, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{profile.name}</div>
            <div style={{ color: "#555", fontSize: 13 }}>פעיל {fmtRelative(profile.updated_at)}</div>
          </div>
          {rank === 0 && <span style={{ color: C.push, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{HE.mostActive}</span>}
        </button>
        <button onClick={() => setConfirmDel(true)} style={{ ...styles.iconBtn("#444"), marginLeft: 10 }}><Trash2 size={16} /></button>
      </div>
      {confirmDel && (
        <ConfirmModal
          message={HE.confirmDeleteProfile(profile.name)}
          onConfirm={() => { onDelete(); setConfirmDel(false); }}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════
const styles = {
  backBtn: (color) => ({
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", color,
    fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
  }),
  catBadge: (color) => ({
    background: color, color: "#fff", fontSize: 10, fontWeight: 800,
    letterSpacing: 1.5, padding: "3px 10px", borderRadius: 5, display: "inline-block",
  }),
  statCard: {
    background: C.surface, borderRadius: 12,
    padding: "12px 14px", border: `1px solid ${C.border}`,
  },
  bigInput: (borderColor) => ({
    width: "100%", height: 58, background: "rgba(0,0,0,0.35)",
    border: `1px solid ${borderColor}`, borderRadius: 14,
    color: C.text, fontSize: 26, fontWeight: 800, textAlign: "center",
    outline: "none", padding: 0, boxSizing: "border-box",
  }),
  accordion: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "13px 16px", cursor: "pointer", color: C.text,
    fontSize: 14, fontWeight: 600,
  },
  setRow: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "10px 14px", width: "100%", boxSizing: "border-box"
  },
  iconBtn: (color) => ({
    width: 36, height: 36, borderRadius: 8, border: "none",
    background: color + "25", color, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }),
  addInput: {
    flex: 1, height: 48, background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
    color: C.text, fontSize: 15, padding: "0 12px", outline: "none",
  },
};

const PAGE = {
  background: C.bg, minHeight: "100vh",
  fontFamily: "'Rubik','Arial Hebrew',-apple-system,sans-serif",
  color: C.text, padding: "44px 18px 48px",
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function WorkoutTracker() {
  const db = useDB();
  const [view, setView] = useState("profiles");
  const [profileId, setProfileId] = useState(null);
  const [cat, setCat] = useState(null);
  const [exerciseId, setExerciseId] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [userTimerDuration, setUserTimerDuration] = useState(null);
  const [showTimerPrompt, setShowTimerPrompt] = useState(false);

  const sortedProfiles = [...db.profiles].sort((a, b) => b.updated_at - a.updated_at);
  const selectedProfile = db.profiles.find(p => p.id === profileId);
  const catExercises = db.exercises
    .filter(e => e.profile_id === profileId && e.category === cat)
    .sort((a, b) => b.updated_at - a.updated_at);
  const selectedExercise = db.exercises.find(e => e.id === exerciseId);
  const catColor = C[cat] || C.push;
  const catHe = HE.cats[cat] || {};

  // ── Exercise detail ──────────────────────────────────────────────────────
  if (view === "exercise" && selectedExercise) {
    return (
      <div style={PAGE}>
        <ExerciseDetail
          exercise={selectedExercise}
          timerDuration={userTimerDuration}
          onSave={(data) => db.addSession(exerciseId, data)}
          onUpdateSession={(sid, data) => db.updateSession(exerciseId, sid, data)}
          onDeleteSession={(sid) => db.deleteSession(exerciseId, sid)}
          onBack={() => setView("category")}
        />
      </div>
    );
  }

  // ── Category ─────────────────────────────────────────────────────────────
  if (view === "category" && cat) {
    return (
      <div style={PAGE} dir="rtl">
        <button onClick={() => { setView("dashboard"); setAddingExercise(false); }} style={styles.backBtn(catColor)}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {selectedProfile?.name}
        </button>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 34, marginBottom: 4 }}>{catHe.icon}</div>
          <h1 style={{ color: catColor, fontSize: 28, fontWeight: 900, margin: 0 }}>{catHe.label}</h1>
          <div style={{ color: "#444", fontSize: 13, marginTop: 3 }}>{catHe.desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {catExercises.map(ex => (
            <ExerciseRow key={ex.id} exercise={ex}
              onClick={() => { setExerciseId(ex.id); setView("exercise"); }}
              onDelete={() => db.deleteExercise(ex.id)}
              onRename={(name) => db.renameExercise(ex.id, name)}
            />
          ))}
        </div>
        {addingExercise ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{HE.exerciseName}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input autoFocus value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (() => { if (newExerciseName.trim()) { db.addExercise(profileId, cat, newExerciseName.trim()); setNewExerciseName(""); setAddingExercise(false); } })()}
                placeholder={HE.exPlaceholder} style={styles.addInput} />
              <button onClick={() => { if (newExerciseName.trim()) { db.addExercise(profileId, cat, newExerciseName.trim()); setNewExerciseName(""); setAddingExercise(false); } }}
                style={{ width: 48, height: 48, borderRadius: 10, border: "none", background: catColor, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={20} />
              </button>
              <button onClick={() => { setAddingExercise(false); setNewExerciseName(""); }}
                style={{ width: 48, height: 48, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingExercise(true)} style={{
            width: "100%", height: 54, borderRadius: 14,
            border: `1.5px dashed ${catColor}44`, background: `${catColor}08`,
            color: catColor, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <Plus size={18} /> {HE.addExercise}
          </button>
        )}
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  if (view === "dashboard" && selectedProfile) {
    return (
      <div style={PAGE} dir="rtl">
        <button onClick={() => { setView("profiles"); setUserTimerDuration(null); }} style={styles.backBtn(C.push)}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {HE.allProfiles}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "#ff6b3520", border: "2px solid #ff6b35",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: C.push,
          }}>
            {selectedProfile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h1>
            <div style={{ color: "#444", fontSize: 13 }}>
              {HE.selectWorkout} {userTimerDuration ? `· ⏱️ ${userTimerDuration}ס׳` : "· ⏱️ ללא טיימר"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CATS.map(c => {
            const exs = db.exercises.filter(e => e.profile_id === profileId && e.category === c.key);
            const lastTs = exs.reduce((m, e) => Math.max(m, e.updated_at), 0);
            const ch = HE.cats[c.key];
            return (
              <button key={c.key} onClick={() => { setCat(c.key); setView("category"); }}
                style={{
                  display: "flex", alignItems: "center",
                  background: `${c.color}12`, border: `1px solid ${c.color}25`,
                  borderRadius: 20, padding: "20px 18px",
                  cursor: "pointer", textAlign: "right",
                  WebkitTapHighlightColor: "transparent", transition: "transform 0.1s",
                }}
                onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
                onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, marginBottom: 4 }}>{ch.icon}</div>
                  <div style={{ color: c.color, fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>{ch.label}</div>
                  <div style={{ color: "#444", fontSize: 13, marginTop: 3 }}>{ch.desc}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, color: "#444", fontSize: 12 }}>
                    <span><span style={{ color: c.color, fontWeight: 700 }}>{exs.length}</span> {HE.exercises}</span>
                    <span><span style={{ color: c.color, fontWeight: 700 }}>{exs.filter(e => e.sessions.length > 0).length}</span> {HE.logged}</span>
                    {lastTs > 0 && <span>{fmtRelative(lastTs)}</span>}
                  </div>
                </div>
                <ChevronLeft size={20} color={c.color} style={{ opacity: 0.5 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Profiles landing ──────────────────────────────────────────────────────
  return (
    <div style={PAGE} dir="rtl">
      {showTimerPrompt && (
        <TimerSetupModal onSelect={(seconds) => {
          setUserTimerDuration(seconds);
          setShowTimerPrompt(false);
          setView("dashboard");
        }} />
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Dumbbell size={22} color={C.push} />
          <span style={{ color: C.push, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{HE.appName}</span>
        </div>
        <h1 style={{ color: C.text, fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: -1 }}>{HE.whoIsLifting}</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {sortedProfiles.map((p, i) => (
          <ProfileCard key={p.id} profile={p} rank={i}
            onClick={() => {
              setProfileId(p.id);
              setShowTimerPrompt(true);
            }}
            onDelete={() => db.deleteProfile(p.id)}
          />
        ))}
      </div>

      {db.profiles.length >= 3 ? (
        <div style={{
          background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)",
          borderRadius: 12, padding: "12px 16px", color: "#e74c3c", fontSize: 13, lineHeight: 1.6,
        }}>{HE.maxProfiles}</div>
      ) : addingProfile ? (
        <div style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 16, padding: 16 }}>
          <div style={{ color: "#555", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{HE.yourName}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input autoFocus value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (() => { if (newProfileName.trim()) { db.addProfile(newProfileName.trim()); setNewProfileName(""); setAddingProfile(false); } })()}
              placeholder={HE.namePlaceholder}
              style={{ ...styles.addInput, height: 50 }} />
            <button onClick={() => { if (newProfileName.trim()) { db.addProfile(newProfileName.trim()); setNewProfileName(""); setAddingProfile(false); } }}
              style={{ width: 50, height: 50, borderRadius: 10, border: "none", background: C.push, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={20} />
            </button>
            <button onClick={() => { setAddingProfile(false); setNewProfileName(""); }}
              style={{ width: 50, height: 50, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingProfile(true)} style={{
          width: "100%", height: 56, borderRadius: 16,
          border: "1.5px dashed rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.04)",
          color: C.push, fontSize: 16, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
        }}>
          <Plus size={20} /> {HE.addProfile} ({3 - db.profiles.length} נותרו)
        </button>
      )}

      {db.profiles.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 48, color: "#333" }}>
          <User size={36} color="#222" style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ color: "#444", fontSize: 14 }}>{HE.noProfiles}</div>
        </div>
      )}
    </div>
  );
}
