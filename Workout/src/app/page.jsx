import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  ChevronLeft, Plus, Dumbbell, TrendingUp, X, Check,
  ChevronDown, ChevronUp, User, Zap, BarChart2, Calendar,
  Pencil, Trash2, Clock, Wifi, WifiOff
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ─ Uncomment and fill in your project URL + anon key to go live.
// ─ All mutation helpers below map 1:1 to these calls.
// ════════════════════════════════════════════════════════════════════════════
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// ─── Hebrew UI strings ───────────────────────────────────────────────────────
const HE = {
  appName: "יומן ברזל",
  whoIsLifting: "מי מרים\nהיום?",
  mostActive: "הכי פעיל",
  addProfile: "הוסף פרופיל",
  profilesLeft: (n) => `(נותרו ${n})`,
  yourName: "השם שלך",
  selectWorkout: "בחר אימון",
  allProfiles: "כל הפרופילים",
  noProfiles: "הוסף פרופיל ראשון",
  exercises: "תרגילים",
  logged: "מתועדים",
  addExercise: "הוסף תרגיל",
  exerciseName: "שם תרגיל",
  exPlaceholder: "לדוג׳ כבל מכווץ",
  logWeight: "תיעוד משקל",
  weight: "משקל",
  reps: "חזרות",
  kg: "ק״ג",
  save: "שמור",
  lastLift: "הרמה אחרונה",
  personalBest: "שיא אישי",
  totalSessions: "סה״כ אימונים",
  thisMonth: "החודש",
  progressChart: "גרף התקדמות",
  noData: "תעד אימונים לצפייה בגרף",
  today: "היום",
  changeDate: "שנה תאריך",
  recentSets: "סטים אחרונים",
  editSet: "ערוך סט",
  deleteSet: "מחק",
  confirmDelete: "בטוח?",
  peakSet: "שיא יומי",
  sessions: "פגישות",
  activeAgo: (s) => `פעיל ${s}`,
  justNow: "עכשיו",
  minsAgo: (m) => `לפני ${m} דק׳`,
  hoursAgo: (h) => `לפני ${h} ש׳`,
  daysAgo: (d) => `לפני ${d} ימים`,
  prev: (w, r, d) => `קודם: ${w} ק״ג × ${r} · ${d}`,
  supabaseNote: "הנתונים נשמרים מקומית. חברו Supabase לסנכרון בזמן אמת.",
  cats: {
    push: { label: "דחיפה", icon: "💪", desc: "חזה · כתפיים · טריצפס" },
    pull: { label: "משיכה", icon: "🔄", desc: "גב · ביצפס · אחורי כתף" },
    legs: { label: "רגליים", icon: "🦵", desc: "קוואד · המסטרינג · ישבן" },
  },
};

// ─── Seed data ───────────────────────────────────────────────────────────────
const SEED_EXERCISES = {
  push: ["לחיצת חזה", "לחיצת כתפיים", "לחיצה משופעת", "טריצפס מקבילות"],
  pull: ["מתח", "חתירה", "לט פולדאון", "פייס פולס"],
  legs: ["סקוואט", "דדליפט", "לג פרס", "לאנג׳"],
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seedExercises(profileId) {
  const now = Date.now();
  return Object.entries(SEED_EXERCISES).flatMap(([cat, names]) =>
    names.map((name, i) => ({
      id: genId(), profile_id: profileId, category: cat, name,
      sessions: [], updated_at: now - (names.length - i) * 60000,
    }))
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LOCAL DB HOOK  (swap internals with supabase.from() calls)
// ════════════════════════════════════════════════════════════════════════════
function useDB() {
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("il_profiles") || "[]"); } catch { return []; }
  });
  const [exercises, setExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem("il_exercises") || "[]"); } catch { return []; }
  });
  const [online] = useState(true); // toggle to false when supabase is wired

  const persist = useCallback((p, e) => {
    try {
      localStorage.setItem("il_profiles", JSON.stringify(p));
      localStorage.setItem("il_exercises", JSON.stringify(e));
    } catch {}
  }, []);

  // ── profiles ──────────────────────────────────────────────────────────────
  const addProfile = useCallback((name) => {
    if (profiles.length >= 10) return null;
    // supabase: const { data } = await supabase.from("profiles").insert({ name }).select().single();
    // then seed exercises for data.id
    const profile = { id: genId(), name, updated_at: Date.now() };
    const exs = seedExercises(profile.id);
    const np = [...profiles, profile];
    const ne = [...exercises, ...exs];
    setProfiles(np); setExercises(ne); persist(np, ne);
    return profile;
  }, [profiles, exercises, persist]);

  const bumpProfile = useCallback((profileId, timestamp) => {
    const np = profiles.map(p => p.id === profileId ? { ...p, updated_at: timestamp } : p);
    setProfiles(np); persist(np, exercises);
  }, [profiles, exercises, persist]);

  // ── exercises ─────────────────────────────────────────────────────────────
  const addExercise = useCallback((profileId, category, name) => {
    // supabase: await supabase.from("exercises").insert({ profile_id: profileId, category, name })
    const ex = { id: genId(), profile_id: profileId, category, name, sessions: [], updated_at: Date.now() };
    const ne = [...exercises, ex];
    setExercises(ne); persist(profiles, ne);
  }, [exercises, profiles, persist]);

  // ── sessions ─────────────────────────────────────────────────────────────
  const addSession = useCallback((exerciseId, { weight, reps, date }) => {
    const now = date || Date.now();
    let profileId = null;
    const session = { id: genId(), weight, reps, date: now };
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      const sorted = [...e.sessions, session].sort((a, b) => a.date - b.date);
      return { ...e, sessions: sorted, updated_at: now };
    });
    const np = profiles.map(p => p.id === profileId ? { ...p, updated_at: now } : p);
    // supabase: await supabase.from("sessions").insert({ exercise_id: exerciseId, weight, reps, logged_at: new Date(now) })
    // supabase: await supabase.from("exercises").update({ updated_at: new Date(now) }).eq("id", exerciseId)
    // supabase: await supabase.from("profiles").update({ updated_at: new Date(now) }).eq("id", profileId)
    setExercises(ne); setProfiles(np); persist(np, ne);
    return session;
  }, [exercises, profiles, persist]);

  const updateSession = useCallback((exerciseId, sessionId, { weight, reps }) => {
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      return { ...e, sessions: e.sessions.map(s => s.id === sessionId ? { ...s, weight, reps } : s) };
    });
    // supabase: await supabase.from("sessions").update({ weight, reps }).eq("id", sessionId)
    setExercises(ne); persist(profiles, ne);
  }, [exercises, profiles, persist]);

  const deleteSession = useCallback((exerciseId, sessionId) => {
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      return { ...e, sessions: e.sessions.filter(s => s.id !== sessionId) };
    });
    // supabase: await supabase.from("sessions").delete().eq("id", sessionId)
    setExercises(ne); persist(profiles, ne);
  }, [exercises, profiles, persist]);

  // ── real-time subscriptions (Supabase) ───────────────────────────────────
  // useEffect(() => {
  //   const ch = supabase.channel("db-changes")
  //     .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, payload => {
  //       // merge incoming session into local state
  //     })
  //     .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, payload => {
  //       setProfiles(ps => ps.map(p => p.id === payload.new.id ? { ...p, updated_at: new Date(payload.new.updated_at).getTime() } : p));
  //     })
  //     .subscribe();
  //   return () => supabase.removeChannel(ch);
  // }, []);

  return { profiles, exercises, addProfile, addExercise, addSession, updateSession, deleteSession, online };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("he-IL", { month: "short", day: "numeric" });
}
function fmtDateInput(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtRelative(ts) {
  if (!ts) return HE.justNow;
  const diff = Date.now() - ts;
  if (diff < 60000) return HE.justNow;
  if (diff < 3600000) return HE.minsAgo(Math.floor(diff / 60000));
  if (diff < 86400000) return HE.hoursAgo(Math.floor(diff / 3600000));
  return HE.daysAgo(Math.floor(diff / 86400000));
}

// Peak-weight chart logic: one point per day = highest weight that day
function buildChartData(sessions, timeframe) {
  let filtered = [...sessions].sort((a, b) => a.date - b.date);
  if (timeframe !== "All") {
    const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[timeframe];
    const cutoff = Date.now() - months * 30 * 86400000;
    filtered = filtered.filter(s => s.date >= cutoff);
  }
  // Group by calendar day → keep peak weight
  const dayMap = {};
  filtered.forEach(s => {
    const day = fmtDateInput(s.date);
    if (!dayMap[day] || s.weight > dayMap[day].weight) {
      dayMap[day] = { date: s.date, weight: s.weight, reps: s.reps, label: fmtDate(s.date) };
    }
  });
  const days = Object.values(dayMap).sort((a, b) => a.date - b.date);
  // Inject nulls for gaps > 7 days
  const GAP = 7 * 86400000;
  const pts = [];
  for (let i = 0; i < days.length; i++) {
    if (i > 0 && days[i].date - days[i - 1].date > GAP) {
      pts.push({ label: "", weight: null, reps: null });
    }
    pts.push(days[i]);
  }
  return pts;
}

const TIMEFRAMES = ["1m", "3m", "6m", "1y", "All"];
const CATS = [
  { key: "push", color: "#ff6b35" },
  { key: "pull", color: "#4ecdc4" },
  { key: "legs", color: "#a78bfa" },
];
const CAT_COLORS = { push: "#ff6b35", pull: "#4ecdc4", legs: "#a78bfa" };

// ─── Custom Tooltip for chart ─────────────────────────────────────────────────
function PeakTooltip({ active, payload }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
      padding: "8px 12px", fontSize: 12, lineHeight: 1.6,
    }}>
      <div style={{ color: "#888", marginBottom: 2 }}>{d.label}</div>
      <div style={{ color: "#ff6b35", fontWeight: 800, fontSize: 15 }}>{d.weight} {HE.kg}</div>
      {d.reps > 0 && <div style={{ color: "#666" }}>× {d.reps} {HE.reps}</div>}
      <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>{HE.peakSet}</div>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function Chart({ sessions }) {
  const [tf, setTf] = useState("All");
  const pts = buildChartData(sessions, tf);
  const hasData = pts.filter(p => p.weight != null).length >= 2;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => setTf(t)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
            background: tf === t ? "#ff6b35" : "rgba(255,255,255,0.06)",
            color: tf === t ? "#fff" : "#666", fontWeight: 700, fontSize: 12,
            cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
      {!hasData ? (
        <div style={{
          height: 140, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", color: "#444", gap: 8,
        }}>
          <BarChart2 size={28} color="#333" />
          <span style={{ fontSize: 13 }}>{HE.noData}</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={pts} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#444", fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#444", fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<PeakTooltip />} />
            <Line
              type="monotone" dataKey="weight" stroke="#ff6b35" strokeWidth={2.5}
              dot={{ fill: "#ff6b35", r: 4, strokeWidth: 0 }}
              connectNulls={false}
              activeDot={{ r: 7, fill: "#ff6b35", stroke: "#0f0f0f", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Recent Sets list with edit/delete ───────────────────────────────────────
function RecentSets({ exercise, onUpdate, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [editW, setEditW] = useState("");
  const [editR, setEditR] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const recent = [...exercise.sessions].sort((a, b) => b.date - a.date).slice(0, 10);

  function startEdit(s) {
    setEditId(s.id); setEditW(String(s.weight)); setEditR(String(s.reps || ""));
  }
  function saveEdit(s) {
    const w = parseFloat(editW), r = parseInt(editR) || 0;
    if (w > 0) onUpdate(s.id, { weight: w, reps: r });
    setEditId(null);
  }

  if (recent.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        {HE.recentSets}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recent.map(s => (
          <div key={s.id} style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px",
          }}>
            {editId === s.id ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" inputMode="decimal" value={editW} onChange={e => setEditW(e.target.value)}
                  style={inputStyle} placeholder={HE.weight} />
                <span style={{ color: "#555", fontSize: 12 }}>{HE.kg}</span>
                <input type="number" inputMode="numeric" value={editR} onChange={e => setEditR(e.target.value)}
                  style={inputStyle} placeholder={HE.reps} />
                <button onClick={() => saveEdit(s)} style={iconBtn("#22c55e")}><Check size={16} /></button>
                <button onClick={() => setEditId(null)} style={iconBtn("#444")}><X size={16} /></button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: "#ff6b35", fontWeight: 800, fontSize: 16 }}>{s.weight} {HE.kg}</span>
                  {s.reps > 0 && <span style={{ color: "#666", fontSize: 14, marginLeft: 6 }}>× {s.reps}</span>}
                  <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>{fmtDate(s.date)}</div>
                </div>
                {confirmDel === s.id ? (
                  <>
                    <span style={{ color: "#888", fontSize: 12 }}>{HE.confirmDelete}</span>
                    <button onClick={() => { onDelete(s.id); setConfirmDel(null); }} style={iconBtn("#e74c3c")}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => setConfirmDel(null)} style={iconBtn("#444")}><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(s)} style={iconBtn("#555")}><Pencil size={15} /></button>
                    <button onClick={() => setConfirmDel(s.id)} style={iconBtn("#555")}><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared tiny styles ───────────────────────────────────────────────────────
const inputStyle = {
  width: 64, height: 44, background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
  color: "#f0ede8", fontSize: 15, fontWeight: 700, textAlign: "center",
  outline: "none", padding: 0,
};
function iconBtn(bg) {
  return {
    width: 36, height: 36, borderRadius: 8, border: "none",
    background: bg + "33", color: bg, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };
}

// ─── Exercise detail screen ───────────────────────────────────────────────────
function ExerciseDetail({ exercise, onSave, onUpdate, onDelete, onBack }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [logDate, setLogDate] = useState(fmtDateInput(Date.now()));
  const [showChart, setShowChart] = useState(false);
  const [showSets, setShowSets] = useState(false);
  const weightRef = useRef();

  const sessions = exercise.sessions || [];
  const sorted = [...sessions].sort((a, b) => b.date - a.date);
  const last = sorted[0];
  const best = sessions.reduce((m, s) => Math.max(m, s.weight), 0);
  const bestReps = sessions.find(s => s.weight === best)?.reps || 0;
  const thisMonth = sessions.filter(s => s.date > Date.now() - 30 * 86400000).length;

  useEffect(() => { weightRef.current?.focus(); }, []);

  function handleSave() {
    const w = parseFloat(weight);
    const r = parseInt(reps) || 0;
    if (!w || w <= 0) return;
    const dateTs = new Date(logDate + "T12:00:00").getTime();
    onSave({ weight: w, reps: r, date: dateTs });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setWeight(""); setReps("");
  }

  const statCards = [
    { label: HE.lastLift, value: last ? `${last.weight} ${HE.kg}` : "—", sub: last ? `× ${last.reps || "—"} · ${fmtDate(last.date)}` : "" },
    { label: HE.personalBest, value: best ? `${best} ${HE.kg}` : "—", sub: bestReps ? `× ${bestReps}` : "" },
    { label: HE.totalSessions, value: sessions.length, sub: "" },
    { label: HE.thisMonth, value: `${thisMonth}`, sub: "" },
  ];

  return (
    <div dir="rtl">
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", color: "#ff6b35",
        fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
      }}>
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {HE.allProfiles}
      </button>

      <div style={{ marginBottom: 20 }}>
        <span style={{
          background: CAT_COLORS[exercise.category], color: "#fff",
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          padding: "2px 8px", borderRadius: 4, marginBottom: 8, display: "inline-block",
        }}>{HE.cats[exercise.category]?.label}</span>
        <h2 style={{ color: "#f0ede8", fontSize: 26, fontWeight: 800, margin: 0 }}>{exercise.name}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {statCards.map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 12,
            padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ color: "#555", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: "#f0ede8", fontSize: 19, fontWeight: 800 }}>{c.value}</div>
            {c.sub && <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Log panel ─────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)",
        borderRadius: 18, padding: 18, marginBottom: 16,
      }}>
        <div style={{ color: "#ff6b35", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          {HE.logWeight}
        </div>

        {/* Weight + Reps row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{HE.weight} ({HE.kg})</label>
            <input
              ref={weightRef}
              type="number" inputMode="decimal" placeholder="0.0"
              value={weight} onChange={e => setWeight(e.target.value)}
              onKeyDown={e => e.key === "Enter" && weightRef.current?.blur()}
              style={{
                width: "100%", height: 58, background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,107,53,0.3)", borderRadius: 14,
                color: "#f0ede8", fontSize: 26, fontWeight: 800, textAlign: "center",
                outline: "none", padding: 0, boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 80 }}>
            <label style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{HE.reps}</label>
            <input
              type="number" inputMode="numeric" placeholder="0"
              value={reps} onChange={e => setReps(e.target.value)}
              style={{
                width: "100%", height: 58, background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14,
                color: "#f0ede8", fontSize: 26, fontWeight: 800, textAlign: "center",
                outline: "none", padding: 0, boxSizing: "border-box",
              }}
            />
          </div>
          <button onClick={handleSave} style={{
            width: 58, height: 58, borderRadius: 14, border: "none",
            background: saved ? "#22c55e" : "#ff6b35", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.2s", flexShrink: 0, alignSelf: "flex-end",
          }}>
            {saved ? <Check size={24} /> : <Zap size={24} />}
          </button>
        </div>

        {/* Date row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowDatePicker(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: showDatePicker ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
            padding: "8px 14px", color: showDatePicker ? "#ff6b35" : "#777",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Calendar size={14} />
            {logDate === fmtDateInput(Date.now()) ? HE.today : logDate}
          </button>
          {showDatePicker && (
            <input
              type="date" value={logDate}
              max={fmtDateInput(Date.now())}
              onChange={e => { setLogDate(e.target.value); }}
              style={{
                flex: 1, height: 40, background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10,
                color: "#f0ede8", fontSize: 14, padding: "0 10px", outline: "none",
              }}
            />
          )}
        </div>

        {last && (
          <div style={{ color: "#555", fontSize: 12, marginTop: 12, textAlign: "center" }}>
            {HE.prev(last.weight, last.reps || "—", fmtDate(last.date))}
          </div>
        )}
      </div>

      {/* ── Recent sets ──────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <>
          <button onClick={() => setShowSets(v => !v)} style={accordionBtn}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color="#ff6b35" /> {HE.recentSets} ({sessions.length})
            </span>
            {showSets ? <ChevronUp size={15} color="#555" /> : <ChevronDown size={15} color="#555" />}
          </button>
          {showSets && (
            <RecentSets
              exercise={exercise}
              onUpdate={(sid, data) => onUpdate(exercise.id, sid, data)}
              onDelete={(sid) => onDelete(exercise.id, sid)}
            />
          )}
        </>
      )}

      {/* ── Chart ────────────────────────────────────────────────────── */}
      <button onClick={() => setShowChart(v => !v)} style={{ ...accordionBtn, marginTop: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={15} color="#ff6b35" /> {HE.progressChart}
        </span>
        {showChart ? <ChevronUp size={15} color="#555" /> : <ChevronDown size={15} color="#555" />}
      </button>
      {showChart && <Chart sessions={sessions} />}
    </div>
  );
}

const accordionBtn = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: "13px 16px", cursor: "pointer", color: "#f0ede8",
  fontSize: 14, fontWeight: 600,
};

// ─── Exercise row in category list ───────────────────────────────────────────
function ExerciseRow({ exercise, onClick }) {
  const sorted = [...exercise.sessions].sort((a, b) => b.date - a.date);
  const last = sorted[0];
  return (
    <button onClick={onClick} dir="rtl" style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "15px 16px",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, cursor: "pointer", textAlign: "right",
      WebkitTapHighlightColor: "transparent",
    }}
      onTouchStart={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onTouchEnd={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
    >
      <Dumbbell size={20} color="#444" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#f0ede8", fontWeight: 600, fontSize: 16 }}>{exercise.name}</div>
        {last
          ? <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>
              {HE.lastLift}: <span style={{ color: "#ff6b35", fontWeight: 700 }}>{last.weight} {HE.kg}</span>
              {last.reps > 0 && <span style={{ color: "#666" }}> × {last.reps}</span>}
              <span style={{ color: "#444", marginRight: 6 }}> · {fmtDate(last.date)}</span>
            </div>
          : <div style={{ color: "#444", fontSize: 13, marginTop: 2 }}>אין נתונים</div>
        }
      </div>
      <ChevronLeft size={16} color="#333" style={{ transform: "rotate(180deg)" }} />
    </button>
  );
}

// ─── Profile card ─────────────────────────────────────────────────────────────
function ProfileCard({ profile, onClick, rank }) {
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#ff6b35","#4ecdc4","#a78bfa","#f7dc6f","#82e0aa","#85c1e9","#f1948a","#bb8fce","#f0b27a","#76d7c4"];
  const color = colors[rank % colors.length];
  return (
    <button onClick={onClick} dir="rtl" style={{
      display: "flex", alignItems: "center", gap: 14,
      width: "100%", padding: "14px 16px",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, cursor: "pointer", textAlign: "right",
      WebkitTapHighlightColor: "transparent",
    }}
      onTouchStart={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
      onTouchEnd={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: color + "20", border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 16, color, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{profile.name}</div>
        <div style={{ color: "#666", fontSize: 13 }}>{HE.activeAgo(fmtRelative(profile.updated_at))}</div>
      </div>
      {rank === 0 && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "#ff6b35", letterSpacing: 1 }}>{HE.mostActive}</span>
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function WorkoutTracker() {
  const db = useDB();
  const [view, setView] = useState("profiles");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  const sortedProfiles = [...db.profiles].sort((a, b) => b.updated_at - a.updated_at);
  const catExercises = db.exercises
    .filter(e => e.profile_id === selectedProfile?.id && e.category === selectedCat)
    .sort((a, b) => b.updated_at - a.updated_at);
  const selectedExercise = db.exercises.find(e => e.id === selectedExerciseId) || null;

  function handleAddProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    db.addProfile(name);
    setNewProfileName(""); setAddingProfile(false);
  }
  function handleAddExercise() {
    const name = newExerciseName.trim();
    if (!name) return;
    db.addExercise(selectedProfile.id, selectedCat, name);
    setNewExerciseName(""); setAddingExercise(false);
  }
  function handleSaveSession(data) {
    db.addSession(selectedExerciseId, data);
  }

  const BG = {
    background: "#0f0f0f",
    minHeight: "100vh",
    fontFamily: "'Rubik', 'Arial Hebrew', -apple-system, sans-serif",
    color: "#f0ede8",
  };
  const page = { ...BG, padding: "44px 18px 40px" };
  const catInfo = CATS.find(c => c.key === selectedCat) || {};
  const catHe = HE.cats[selectedCat] || {};

  // ── Exercise detail ────────────────────────────────────────────────────────
  if (view === "exercise" && selectedExercise) {
    return (
      <div style={page}>
        <ExerciseDetail
          exercise={selectedExercise}
          onSave={handleSaveSession}
          onUpdate={db.updateSession}
          onDelete={db.deleteSession}
          onBack={() => { setView("category"); }}
        />
      </div>
    );
  }

  // ── Category view ──────────────────────────────────────────────────────────
  if (view === "category" && selectedCat) {
    return (
      <div style={page} dir="rtl">
        <button onClick={() => { setView("dashboard"); setAddingExercise(false); }} style={backBtn(catInfo.color)}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {selectedProfile?.name}
        </button>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>{catHe.icon}</div>
          <h1 style={{ color: catInfo.color, fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: -1 }}>{catHe.label}</h1>
          <div style={{ color: "#444", fontSize: 14, marginTop: 4 }}>{catHe.desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {catExercises.map(ex => (
            <ExerciseRow key={ex.id} exercise={ex} onClick={() => { setSelectedExerciseId(ex.id); setView("exercise"); }} />
          ))}
        </div>
        {addingExercise ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 16 }}>
            <div style={{ color: "#666", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{HE.exerciseName}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input autoFocus value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddExercise()}
                placeholder={HE.exPlaceholder}
                style={{ flex: 1, height: 48, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#f0ede8", fontSize: 15, padding: "0 12px", outline: "none" }} />
              <button onClick={handleAddExercise} style={{ width: 48, height: 48, borderRadius: 10, border: "none", background: catInfo.color, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={20} /></button>
              <button onClick={() => { setAddingExercise(false); setNewExerciseName(""); }} style={{ width: 48, height: 48, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingExercise(true)} style={{
            width: "100%", height: 54, borderRadius: 14,
            border: `1.5px dashed ${catInfo.color}44`, background: `${catInfo.color}08`,
            color: catInfo.color, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <Plus size={18} /> {HE.addExercise}
          </button>
        )}
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (view === "dashboard" && selectedProfile) {
    return (
      <div style={page} dir="rtl">
        <button onClick={() => setView("profiles")} style={backBtn("#ff6b35")}>
          <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} /> {HE.allProfiles}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "#ff6b3520", border: "2px solid #ff6b35",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15, color: "#ff6b35",
          }}>
            {selectedProfile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: "#f0ede8", fontSize: 21, fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h1>
            <div style={{ color: "#555", fontSize: 13 }}>{HE.selectWorkout}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CATS.map(cat => {
            const exs = db.exercises.filter(e => e.profile_id === selectedProfile.id && e.category === cat.key);
            const lastTs = exs.reduce((m, e) => Math.max(m, e.updated_at), 0);
            const withData = exs.filter(e => e.sessions.length > 0).length;
            const ch = HE.cats[cat.key];
            return (
              <button key={cat.key} onClick={() => { setSelectedCat(cat.key); setView("category"); }}
                style={{
                  display: "flex", alignItems: "center",
                  background: `${cat.color}12`,
                  border: `1px solid ${cat.color}2a`,
                  borderRadius: 20, padding: "20px 18px",
                  cursor: "pointer", textAlign: "right",
                  WebkitTapHighlightColor: "transparent", transition: "transform 0.1s",
                }}
                onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
                onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{ch.icon}</div>
                  <div style={{ color: cat.color, fontSize: 27, fontWeight: 900, letterSpacing: -1 }}>{ch.label}</div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>{ch.desc}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, color: "#444", fontSize: 12 }}>
                    <span><span style={{ color: cat.color, fontWeight: 700 }}>{exs.length}</span> {HE.exercises}</span>
                    <span><span style={{ color: cat.color, fontWeight: 700 }}>{withData}</span> {HE.logged}</span>
                    {lastTs > 0 && <span>{fmtRelative(lastTs)}</span>}
                  </div>
                </div>
                <ChevronLeft size={22} color={cat.color} style={{ opacity: 0.5 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Profiles landing ───────────────────────────────────────────────────────
  return (
    <div style={page} dir="rtl">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Dumbbell size={22} color="#ff6b35" />
            <span style={{ color: "#ff6b35", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{HE.appName}</span>
          </div>
          <h1 style={{ color: "#f0ede8", fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1.5, whiteSpace: "pre-line" }}>
            {HE.whoIsLifting}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: db.online ? "#22c55e" : "#e74c3c", fontSize: 12 }}>
          {db.online ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{db.online ? "מקומי" : "offline"}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {sortedProfiles.map((p, i) => (
          <ProfileCard key={p.id} profile={p} rank={i} onClick={() => { setSelectedProfile(p); setView("dashboard"); }} />
        ))}
      </div>

      {db.profiles.length < 10 && (
        addingProfile ? (
          <div style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 16, padding: 16 }}>
            <div style={{ color: "#666", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{HE.yourName}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input autoFocus value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddProfile()}
                placeholder="לדוג׳ יוסי כהן"
                style={{ flex: 1, height: 50, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10, color: "#f0ede8", fontSize: 16, padding: "0 14px", outline: "none" }} />
              <button onClick={handleAddProfile} style={{ width: 50, height: 50, borderRadius: 10, border: "none", background: "#ff6b35", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={20} /></button>
              <button onClick={() => { setAddingProfile(false); setNewProfileName(""); }} style={{ width: 50, height: 50, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingProfile(true)} style={{
            width: "100%", height: 56, borderRadius: 16,
            border: "1.5px dashed rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.04)",
            color: "#ff6b35", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <Plus size={20} /> {HE.addProfile} {db.profiles.length > 0 && HE.profilesLeft(10 - db.profiles.length)}
          </button>
        )
      )}

      {db.profiles.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 48, color: "#333" }}>
          <User size={36} color="#2a2a2a" style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ color: "#444", fontSize: 14 }}>{HE.noProfiles}</div>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Supabase</div>
        <div style={{ color: "#444", fontSize: 12, lineHeight: 1.7 }}>{HE.supabaseNote}</div>
      </div>
    </div>
  );
}

function backBtn(color) {
  return {
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", color,
    fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
  };
}
