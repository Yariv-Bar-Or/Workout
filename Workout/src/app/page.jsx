"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Dumbbell, X, Check, Clock, TrendingUp, Trash2, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";

// --- Configuration ---
const CATS = [
  { key: "chest", label: "Chest", color: "#3498db" },
  { key: "back", label: "Back", color: "#e67e22" },
  { key: "biceps", label: "Biceps", color: "#9b59b6" },
  { key: "triceps", label: "Triceps", color: "#f1c40f" },
  { key: "shoulders", label: "Shoulders", color: "#e74c3c" },
  { key: "legs", label: "Legs", color: "#2ecc71" },
];

const C = { bg: "#0f0f0f", text: "#f0ede8", surface: "rgba(255,255,255,0.04)" };

// --- Analytics Component with New Graph Logic ---
function AnalyticsView({ sessions }) {
  const data = sessions.reduce((acc, s) => {
    const d = new Date(s.date).toLocaleDateString("he-IL");
    if (!acc[d]) acc[d] = { date: d, maxWeight: 0, sets: [] };
    acc[d].sets.push(s);
    acc[d].maxWeight = Math.max(acc[d].maxWeight, s.weight);
    return acc;
  }, {});

  const chartData = Object.values(data).sort((a, b) => new Date(a.date) - new Date(b.date));
  const scatterPoints = sessions.map(s => ({ date: new Date(s.date).toLocaleDateString("he-IL"), weight: s.weight }));

  return (
    <div style={{ background: C.surface, padding: 16, borderRadius: 16, marginTop: 16 }}>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#666" fontSize={10} />
          <YAxis stroke="#666" fontSize={10} />
          <Tooltip contentStyle={{ background: "#000", border: "1px solid #444" }} />
          <Line type="monotone" dataKey="maxWeight" stroke="#ff6b35" strokeWidth={3} dot={false} connectNulls />
          <Scatter data={scatterPoints} dataKey="weight" fill="#ffffff" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Main App Logic ---
export default function IronLog() {
  const [profile, setProfile] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [activeTab, setActiveTab] = useState('workout');

  // Load from LocalStorage
  useEffect(() => {
    setProfile(JSON.parse(localStorage.getItem("profile")));
    setExercises(JSON.parse(localStorage.getItem("exercises") || "[]"));
  }, []);

  const save = (p, e) => {
    localStorage.setItem("profile", JSON.stringify(p));
    localStorage.setItem("exercises", JSON.stringify(e));
  };

  const addExercise = (category, name) => {
    const newEx = { id: Date.now(), category, name, sessions: [] };
    const updated = [...exercises, newEx];
    setExercises(updated);
    save(profile, updated);
  };

  const addSession = (exId, weight, reps) => {
    const updated = exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sessions: [...ex.sessions, { weight, reps, date: Date.now() }] };
    });
    setExercises(updated);
    save(profile, updated);
  };

  if (!profile) {
    return (
      <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
        <button onClick={() => { const name = prompt("Name?"); setProfile({ name }); localStorage.setItem("profile", JSON.stringify({ name })); }} 
          style={{ padding: "20px 40px", borderRadius: 20, border: "2px dashed #444", background: "transparent", color: "#888", cursor: "pointer" }}>
          <Plus size={32} /> Add Profile
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: 20 }}>
      <h1>Welcome, {profile.name}</h1>
      
      {/* Category Selection */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {CATS.map(cat => (
          <button key={cat.key} onClick={() => addExercise(cat.key, "New Exercise")} 
            style={{ padding: 15, borderRadius: 12, border: `1px solid ${cat.color}`, background: "transparent", color: cat.color }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercises & Charts */}
      {exercises.map(ex => (
        <div key={ex.id} style={{ background: C.surface, padding: 15, borderRadius: 12, marginBottom: 15 }}>
          <h3>{ex.name}</h3>
          <button onClick={() => addSession(ex.id, 50, 10)}>Log 50kg x 10</button>
          <AnalyticsView sessions={ex.sessions} />
        </div>
      ))}
    </div>
  );
}