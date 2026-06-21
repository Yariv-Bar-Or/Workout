"use client";
import { Mic, MicOff } from "lucide-react";

export default function VoiceButton({ isListening, isSupported, isParsing, liftUp, onPress }) {
  if (!isSupported) return null;

  return (
    <>
      <style>{`
        @keyframes voicePulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes voiceSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        position: "fixed",
        bottom: liftUp ? 72 : 0,
        left: 0,
        right: 0,
        zIndex: 1010,
        height: 72,
        background: "rgba(10,10,10,0.96)",
        borderTop: isListening
          ? "1px solid rgba(239,68,68,0.3)"
          : "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "bottom 0.2s",
      }}>
        <button
          onClick={onPress}
          title={isListening ? "עצור האזנה" : "תיעוד קולי"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: isListening ? "rgba(239,68,68,0.12)" : "rgba(255,107,53,0.08)",
            border: isListening
              ? "1px solid rgba(239,68,68,0.3)"
              : "1px solid rgba(255,107,53,0.2)",
            borderRadius: 16,
            padding: "11px 28px",
            color: isListening ? "#ef4444" : "#ff6b35",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            animation: isListening ? "voicePulse 1.2s ease-in-out infinite" : "none",
          }}
        >
          {isParsing ? (
            <div style={{
              width: 20,
              height: 20,
              border: "2.5px solid rgba(255,107,53,0.3)",
              borderTop: "2.5px solid #ff6b35",
              borderRadius: "50%",
              animation: "voiceSpin 0.8s linear infinite",
              flexShrink: 0,
            }} />
          ) : (
            isListening ? <MicOff size={20} /> : <Mic size={20} />
          )}
          <span>{isParsing ? "מעבד..." : isListening ? "מאזין..." : "תיעוד קולי"}</span>
        </button>
      </div>
    </>
  );
}
