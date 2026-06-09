"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Dumbbell } from "lucide-react";

const BG = {
  background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
  minHeight: "100vh",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#f0ede8",
  direction: "rtl",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 20px",
};

const card = {
  width: "100%",
  maxWidth: 380,
};

const inputStyle = {
  width: "100%",
  height: 52,
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,107,53,0.3)",
  borderRadius: 12,
  color: "#f0ede8",
  fontSize: 16,
  padding: "0 16px",
  outline: "none",
  boxSizing: "border-box",
  textAlign: "right",
  marginBottom: 10,
};

const btnPrimary = (disabled) => ({
  width: "100%",
  height: 52,
  borderRadius: 12,
  border: "none",
  background: disabled ? "#7a3a1e" : "#ff6b35",
  color: "#fff",
  fontSize: 17,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  marginTop: 4,
  opacity: disabled ? 0.7 : 1,
});

function hebrewError(err, mode) {
  const msg = err?.message || "";
  if (msg.includes("Invalid login credentials")) {
    return mode === "login" ? "סיסמה שגויה, נסה שוב" : "המשתמש לא נמצא, נסה להירשם";
  }
  if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("User already")) {
    return "האימייל כבר קיים, נסה להתחבר";
  }
  if (msg.includes("user not found") || msg.includes("No user")) {
    return "המשתמש לא נמצא, נסה להירשם";
  }
  return "אירעה שגיאה, נסה שוב";
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup
  const [step, setStep] = useState("auth");  // auth | name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAuth() {
    setError("");
    if (!email.trim() || !password) return;

    setLoading(true);

    if (mode === "login") {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (err) { console.error('signInWithPassword error:', err); setError(hebrewError(err, "login")); return; }
      const hasName = data?.user?.user_metadata?.name;
      if (!hasName) setStep("name");

    } else {
      const { error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpErr) { setLoading(false); setError(hebrewError(signUpErr, "signup")); return; }
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (signInErr) { setError(hebrewError(signInErr, "login")); return; }
      const hasName = data?.user?.user_metadata?.name;
      if (!hasName) setStep("name");
    }
  }

  async function handleSaveName() {
    setError("");
    if (!name.trim()) { setError("נא להזין שם"); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    setLoading(false);
    if (err) setError("שגיאה בשמירת השם. נסה שוב.");
    // parent re-renders via useAuth on user update
  }

  if (step === "name") {
    return (
      <div style={BG}>
        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Dumbbell size={36} color="#ff6b35" style={{ marginBottom: 12 }} />
            <div style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 6 }}>
              LIFT LOG
            </div>
            <h1 style={{ color: "#f0ede8", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
              ברוך הבא!
            </h1>
            <p style={{ color: "#666", fontSize: 14, marginTop: 8, marginBottom: 0 }}>איך לקרוא לך?</p>
          </div>
          <input
            style={inputStyle}
            type="text"
            placeholder="השם שלך"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && handleSaveName()}
            autoFocus
          />
          {error && <div style={{ color: "#e05555", fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button
            style={btnPrimary(loading || !name.trim())}
            disabled={loading || !name.trim()}
            onClick={handleSaveName}
          >
            {loading ? "שומר..." : "בואו נתחיל"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={BG}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Dumbbell size={36} color="#ff6b35" style={{ marginBottom: 12 }} />
          <div style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 6 }}>
            LIFT LOG
          </div>
          <h1 style={{ color: "#f0ede8", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
            {mode === "login" ? "ברוך הבא" : "יצירת חשבון"}
          </h1>
        </div>

        <input
          style={inputStyle}
          type="email"
          inputMode="email"
          placeholder="אימייל"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && !loading && handleAuth()}
          autoFocus
        />
        <input
          style={inputStyle}
          type="password"
          placeholder={mode === "login" ? "סיסמה" : "סיסמה (לפחות 6 תווים)"}
          value={password}
          onChange={e => { setPassword(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && !loading && handleAuth()}
        />

        {error && <div style={{ color: "#e05555", fontSize: 13, marginBottom: 8 }}>{error}</div>}

        <button
          style={btnPrimary(loading || !email.trim() || !password)}
          disabled={loading || !email.trim() || !password}
          onClick={handleAuth}
        >
          {loading ? "..." : mode === "login" ? "כניסה" : "הרשמה"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer" }}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          >
            {mode === "login" ? "אין לך חשבון? הירשם" : "יש לך חשבון? התחבר"}
          </button>
        </div>
      </div>
    </div>
  );
}
