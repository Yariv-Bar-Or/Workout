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
  fontSize: 18,
  padding: "0 16px",
  outline: "none",
  boxSizing: "border-box",
  textAlign: "right",
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
  marginTop: 12,
  opacity: disabled ? 0.7 : 1,
});

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("05") || digits.startsWith("5")) {
    const local = digits.startsWith("05") ? digits.slice(1) : digits;
    return "+972" + local;
  }
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  return "+" + digits;
}

export default function AuthScreen() {
  const [step, setStep] = useState("phone"); // phone | otp | name
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    setError("");
    const formatted = formatPhone(phone.trim());
    if (formatted.length < 10) {
      setError("נא להזין מספר טלפון תקין");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (err) {
      setError("שגיאה בשליחת הקוד. נסה שוב.");
      return;
    }
    setPhone(formatted);
    setStep("otp");
  }

  async function handleVerifyOtp() {
    setError("");
    if (otp.length !== 6) {
      setError("הקוד חייב להיות 6 ספרות");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (err) {
      setError("הקוד שגוי או שפג תוקפו. נסה שוב.");
      return;
    }
    const hasName = data?.user?.user_metadata?.name;
    if (!hasName) {
      setStep("name");
    }
    // if hasName, parent will re-render via useAuth — nothing needed here
  }

  async function handleSaveName() {
    setError("");
    if (!name.trim()) {
      setError("נא להזין שם");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({
      data: { name: name.trim() },
    });
    setLoading(false);
    if (err) {
      setError("שגיאה בשמירת השם. נסה שוב.");
    }
    // parent re-renders via useAuth on user update
  }

  return (
    <div style={BG}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Dumbbell size={36} color="#ff6b35" style={{ marginBottom: 12 }} />
          <div style={{ color: "#ff6b35", fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 6 }}>
            IRON LOG
          </div>
          <h1 style={{ color: "#f0ede8", fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
            {step === "phone" && "כניסה"}
            {step === "otp"   && "אימות"}
            {step === "name"  && "ברוך הבא!"}
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            {step === "phone" && "הזן את מספר הטלפון שלך"}
            {step === "otp"   && `נשלח קוד לאימות למספר ${phone}`}
            {step === "name"  && "איך לקרוא לך?"}
          </p>
        </div>

        {step === "phone" && (
          <div>
            <input
              style={{ ...inputStyle, letterSpacing: 1 }}
              type="tel"
              inputMode="tel"
              placeholder="05X-XXXXXXX"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && handleSendOtp()}
              autoFocus
            />
            {error && <div style={{ color: "#e05555", fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button
              style={btnPrimary(loading || !phone.trim())}
              disabled={loading || !phone.trim()}
              onClick={handleSendOtp}
            >
              {loading ? "שולח..." : "שלח קוד"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div>
            <input
              style={{ ...inputStyle, letterSpacing: 6, textAlign: "center" }}
              type="number"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.slice(0, 6)); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && handleVerifyOtp()}
              autoFocus
            />
            {error && <div style={{ color: "#e05555", fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button
              style={btnPrimary(loading || otp.length !== 6)}
              disabled={loading || otp.length !== 6}
              onClick={handleVerifyOtp}
            >
              {loading ? "מאמת..." : "אימות"}
            </button>
            <button
              style={{
                width: "100%", height: 44, borderRadius: 12, border: "none",
                background: "transparent", color: "#666", fontSize: 14,
                cursor: "pointer", marginTop: 8,
              }}
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
            >
              חזרה לשינוי מספר
            </button>
          </div>
        )}

        {step === "name" && (
          <div>
            <input
              style={inputStyle}
              type="text"
              placeholder="השם שלך"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && handleSaveName()}
              autoFocus
            />
            {error && <div style={{ color: "#e05555", fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button
              style={btnPrimary(loading || !name.trim())}
              disabled={loading || !name.trim()}
              onClick={handleSaveName}
            >
              {loading ? "שומר..." : "בואו נתחיל"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
