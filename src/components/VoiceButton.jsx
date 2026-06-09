"use client";
import { Mic, MicOff } from "lucide-react";

export default function VoiceButton({ isListening, isSupported, isParsing, liftUp, onPress }) {
  if (!isSupported) return null;

  return (
    <>
      <style>{`
        @keyframes voicePulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes voiceSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <button
        onClick={onPress}
        title={isListening ? "עצור האזנה" : "תיעוד קולי"}
        style={{
          position: "fixed",
          bottom: liftUp ? "calc(5rem + 72px)" : "5rem",
          right: "1rem",
          zIndex: 1000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: isListening ? "#ef4444" : "#ff6b35",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          animation: isListening ? "voicePulse 1.2s ease-in-out infinite" : "none",
          transition: "background 0.2s",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {isParsing ? (
          <div style={{
            width: 20,
            height: 20,
            border: "2.5px solid rgba(255,255,255,0.3)",
            borderTop: "2.5px solid #fff",
            borderRadius: "50%",
            animation: "voiceSpin 0.8s linear infinite",
          }} />
        ) : (
          isListening ? <MicOff size={22} /> : <Mic size={22} />
        )}
      </button>
    </>
  );
}
