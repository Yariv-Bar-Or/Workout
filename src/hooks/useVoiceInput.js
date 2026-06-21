"use client";
import { useState, useRef, useCallback } from "react";

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  const [isSupported] = useState(() =>
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  const startListening = useCallback(() => {
    if (!isSupported) return;
    setTranscript("");
    setError(null);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "he-IL";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (e) => { setError(e.error); setIsListening(false); };

    recRef.current = rec;
    rec.start();

    let silenceTimer = null;

    rec.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript;
      setTranscript(t);
      // Reset silence timer on every new result
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        rec.stop();
      }, 2000); // stop 2 seconds after last word detected
    };
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { isListening, transcript, error, startListening, stopListening, isSupported };
}
