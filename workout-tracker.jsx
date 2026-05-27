import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  ChevronLeft, Plus, Dumbbell, TrendingUp, X, Check,
  ChevronDown, ChevronUp, User, Zap, BarChart2, Calendar
} from "lucide-react";

// ─── Supabase client (swap in real keys to activate) ────────────────────────
// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Seed data ───────────────────────────────────────────────────────────────
const SEED_EXERCISES = {
  push: ["Bench Press", "Overhead Press", "Incline Press", "Tricep Dips"],
  pull: ["Pull-ups", "Rows", "Lat Pulldown", "Face Pulls"],
  legs: ["Squats", "Deadlifts", "Leg Press", "Lunges"],
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

// ─── Local "DB" (replace calls with supabase.from(...) for production) ───────
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

  const updateExerciseWeight = useCallback((exerciseId, weight) => {
    const now = Date.now();
    let profileId = null;
    const ne = exercises.map(e => {
      if (e.id !== exerciseId) return e;
      profileId = e.profile_id;
      return { ...e, sessions: [...e.sessions, { weight, date: now }], updated_at: now };
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

  return { profiles, exercises, addProfile, updateExerciseWeight, addExercise };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRelative(ts) {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const TIMEFRAMES = ["1m", "3m", "6m", "1y", "All"];
function filterByTimeframe(sessions, tf) {
  if (tf === "All") return sessions;
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[tf];
  const cutoff = Date.now() - months * 30 * 86400000;
  return sessions.filter(s => s.date >= cutoff);
}

function injectGaps(sessions) {
  const GAP = 7 * 86400000;
  const pts = [];
  for (let i = 0; i < sessions.length; i++) {
    if (i > 0 && sessions[i].date - sessions[i - 1].date > GAP) {
      pts.push({ date: sessions[i - 1].date + 1, weight: null, gap: true });
    }
    pts.push({ date: sessions[i].date, weight: sessions[i].weight, label: fmt(sessions[i].date) });
  }
  return pts;
}

// ─── Components ──────────────────────────────────────────────────────────────

function CategoryBadge({ cat }) {
  const cfg = {
    push: { bg: "#ff6b35", label: "PUSH" },
    pull: { bg: "#4ecdc4", label: "PULL" },
    legs: { bg: "#a78bfa", label: "LEGS" },
  }[cat] || { bg: "#888", label: cat };
  return (
    <span style={{
      background: cfg.bg, color: "#fff", fontSize: 10, fontWeight: 800,
      letterSpacing: 1.5, padding: "2px 8px", borderRadius: 4,
    }}>{cfg.label}</span>
  );
}

function ProfileCard({ profile, onClick, rank }) {
  const initials = profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#ff6b35", "#4ecdc4", "#a78bfa", "#f7dc6f", "#82e0aa", "#85c1e9", "#f1948a", "#bb8fce", "#f0b27a", "#76d7c4"];
  const color = colors[rank % colors.length];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14,
      width: "100%", padding: "14px 16px",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, cursor: "pointer", textAlign: "left",
      transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
    }}
      onTouchStart={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
      onTouchEnd={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      <div style={{
        width: 46, height: 46, borderRadius: "50%",
        background: color + "22", border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 16, color, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#f0ede8", fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{profile.name}</div>
        <div style={{ color: "#888", fontSize: 13 }}>Active {fmtRelative(profile.updated_at)}</div>
      </div>
      {rank === 0 && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "#ff6b35", letterSpacing: 1, opacity: 0.8 }}>MOST ACTIVE</span>
      )}
    </button>
  );
}

function ExerciseRow({ exercise, onClick }) {
  const last = exercise.sessions[exercise.sessions.length - 1];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "14px 16px",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, cursor: "pointer", textAlign: "left",
      transition: "background 0.12s", WebkitTapHighlightColor: "transparent",
    }}
      onTouchStart={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      onTouchEnd={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
    >
      <Dumbbell size={20} color="#555" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#f0ede8", fontWeight: 600, fontSize: 16 }}>{exercise.name}</div>
        {last && (
          <div style={{ color: "#777", fontSize: 13, marginTop: 2 }}>
            Last: <span style={{ color: "#ff6b35", fontWeight: 700 }}>{last.weight} kg</span>
            <span style={{ marginLeft: 6 }}>· {fmt(last.date)}</span>
          </div>
        )}
        {!last && <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>No data yet</div>}
      </div>
      <ChevronDown size={16} color="#444" style={{ transform: "rotate(-90deg)" }} />
    </button>
  );
}

function Chart({ sessions, name }) {
  const [tf, setTf] = useState("All");
  const filtered = filterByTimeframe(sessions, tf);
  const pts = injectGaps(filtered);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => setTf(t)} style={{
            flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
            background: tf === t ? "#ff6b35" : "rgba(255,255,255,0.06)",
            color: tf === t ? "#fff" : "#777", fontWeight: 700, fontSize: 12,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}>{t}</button>
        ))}
      </div>
      {pts.length < 2 ? (
        <div style={{
          height: 160, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#444", fontSize: 14,
        }}>
          <div style={{ textAlign: "center" }}>
            <BarChart2 size={32} color="#333" style={{ marginBottom: 8 }} />
            <div>Log workouts to see your progress</div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={pts} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#888" }}
              itemStyle={{ color: "#ff6b35" }}
            />
            <Line
              type="monotone" dataKey="weight" stroke="#ff6b35" strokeWidth={2.5}
              dot={{ fill: "#ff6b35", r: 4, strokeWidth: 0 }}
              connectNulls={false}
              activeDot={{ r: 6, fill: "#ff6b35" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ExerciseDetail({ exercise, onSave, onBack }) {
  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const inputRef = useRef();
  const last = exercise.sessions[exercise.sessions.length - 1];
  const best = exercise.sessions.reduce((m, s) => Math.max(m, s.weight), 0);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSave() {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    onSave(exercise.id, w);
    setSaved(true);
    setWeight("");
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", color: "#ff6b35",
        fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
      }}>
        <ChevronLeft size={18} /> Back
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <CategoryBadge cat={exercise.category} />
        </div>
        <h2 style={{ color: "#f0ede8", fontSize: 26, fontWeight: 800, margin: 0 }}>{exercise.name}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Last lift", value: last ? `${last.weight} kg` : "—", sub: last ? fmt(last.date) : "" },
          { label: "Personal best", value: best ? `${best} kg` : "—", sub: "" },
          { label: "Total sessions", value: exercise.sessions.length, sub: "" },
          { label: "This month", value: exercise.sessions.filter(s => s.date > Date.now() - 30 * 86400000).length + " sessions", sub: "" },
        ].map(c => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 12,
            padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ color: "#666", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
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
          Log Weight
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            type="number" inputMode="decimal" placeholder="0.0"
            value={weight} onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              flex: 1, height: 52, background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,107,53,0.3)", borderRadius: 12,
              color: "#f0ede8", fontSize: 22, fontWeight: 700, textAlign: "center",
              outline: "none", padding: "0 12px",
            }}
          />
          <span style={{ color: "#777", fontSize: 16, fontWeight: 600 }}>kg</span>
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
            Previous: {last.weight} kg on {fmt(last.date)}
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
          <TrendingUp size={16} color="#ff6b35" /> Progress Chart
        </span>
        {showChart ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
      </button>

      {showChart && <Chart sessions={exercise.sessions} name={exercise.name} />}
    </div>
  );
}

const CATS = [
  { key: "push", label: "PUSH", icon: "💪", desc: "Chest · Shoulders · Triceps", color: "#ff6b35" },
  { key: "pull", label: "PULL", icon: "🔄", desc: "Back · Biceps · Rear delts", color: "#4ecdc4" },
  { key: "legs", label: "LEGS", icon: "🦵", desc: "Quads · Hamstrings · Glutes", color: "#a78bfa" },
];

// ─── Main App ────────────────────────────────────────────────────────────────
export default function WorkoutTracker() {
  const { profiles, exercises, addProfile, updateExerciseWeight, addExercise } = useLocalDB();
  const [view, setView] = useState("profiles"); // profiles | dashboard | category | exercise
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

  function handleAddProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    addProfile(name);
    setNewProfileName(""); setAddingProfile(false);
  }

  function handleSaveWeight(exId, w) {
    // Optimistic update via local state + supabase call (in production)
    updateExerciseWeight(exId, w);
    // production: await supabase.from("exercises").update({...}).eq("id", exId)
    const updatedEx = { ...selectedExercise, sessions: [...selectedExercise.sessions, { weight: w, date: Date.now() }] };
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
    minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif",
    color: "#f0ede8",
  };

  // ── Exercise detail ──────────────────────────────────────────────────────
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

  // ── Category view ────────────────────────────────────────────────────────
  if (view === "category" && selectedCat) {
    const catInfo = CATS.find(c => c.key === selectedCat);
    return (
      <div style={{ ...BG, padding: "52px 20px 32px" }}>
        <button onClick={() => setView("dashboard")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: catInfo.color,
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
        }}>
          <ChevronLeft size={18} /> {selectedProfile?.name}
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>{catInfo.icon}</div>
          <h1 style={{ color: catInfo.color, fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>{catInfo.label}</h1>
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
            <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Exercise name</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddExercise()}
                placeholder="e.g. Cable Fly"
                style={{
                  flex: 1, height: 44, background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                  color: "#f0ede8", fontSize: 15, padding: "0 12px", outline: "none",
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
            <Plus size={18} /> Add Exercise
          </button>
        )}
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  if (view === "dashboard" && selectedProfile) {
    return (
      <div style={{ ...BG, padding: "52px 20px 32px" }}>
        <button onClick={() => setView("profiles")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: "#ff6b35",
          fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20,
        }}>
          <ChevronLeft size={18} /> All Profiles
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#ff6b3522", border: "2px solid #ff6b35",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 14, color: "#ff6b35",
            }}>
              {selectedProfile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ color: "#f0ede8", fontSize: 22, fontWeight: 800, margin: 0 }}>{selectedProfile.name}</h1>
              <div style={{ color: "#555", fontSize: 13 }}>Select a workout</div>
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
                  cursor: "pointer", textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  transition: "transform 0.1s",
                }}
                onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
                onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ color: cat.color, fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{cat.label}</div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{cat.desc}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{exs.length}</span> exercises
                    </span>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      <span style={{ color: cat.color, fontWeight: 700 }}>{withData.length}</span> logged
                    </span>
                    {lastUpdated > 0 && (
                      <span style={{ color: "#444", fontSize: 12 }}>
                        <Calendar size={10} style={{ marginRight: 3 }} />{fmtRelative(lastUpdated)}
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

  // ── Profiles (landing) ───────────────────────────────────────────────────
  return (
    <div style={{ ...BG, padding: "52px 20px 32px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
        }}>
          <Dumbbell size={24} color="#ff6b35" />
          <span style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Iron Log</span>
        </div>
        <h1 style={{ color: "#f0ede8", fontSize: 34, fontWeight: 900, margin: 0, letterSpacing: -1.5 }}>
          Who's<br />lifting?
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {sortedProfiles.map((p, i) => (
          <ProfileCard key={p.id} profile={p} rank={i} onClick={() => handleSelectProfile(p)} />
        ))}
      </div>

      {profiles.length < 10 && (
        addingProfile ? (
          <div style={{
            background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Your name</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddProfile()}
                placeholder="e.g. Alex"
                style={{
                  flex: 1, height: 48, background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10,
                  color: "#f0ede8", fontSize: 16, padding: "0 14px", outline: "none",
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
            <Plus size={20} /> Add Profile {profiles.length > 0 && `(${10 - profiles.length} left)`}
          </button>
        )
      )}

      {profiles.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 40, color: "#444" }}>
          <User size={40} color="#333" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15 }}>Add your first profile to get started</div>
        </div>
      )}

      <div style={{ marginTop: 40, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
          Supabase Setup
        </div>
        <div style={{ color: "#555", fontSize: 12, lineHeight: 1.6 }}>
          This app persists data locally via <code style={{ color: "#ff6b35", background: "rgba(255,107,53,0.1)", padding: "1px 5px", borderRadius: 4 }}>localStorage</code> and is ready for Supabase.
          Replace the local DB layer with{" "}
          <code style={{ color: "#4ecdc4", background: "rgba(78,205,196,0.1)", padding: "1px 5px", borderRadius: 4 }}>supabase.from()</code> calls —
          schema SQL in the README below.
        </div>
      </div>
    </div>
  );
}
