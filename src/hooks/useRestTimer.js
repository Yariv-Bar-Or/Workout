"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── WAV builder ───────────────────────────────────────────────────────────────

function bufferToWavDataUrl(buf) {
  const sr = buf.sampleRate;
  const data = buf.getChannelData(0);
  const n = data.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const v = new DataView(ab);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  const bytes = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(bin);
}

// Generated once per browser session and reused for every beep
let cachedBeepSrc = null;

async function ensureBeepSrc() {
  if (cachedBeepSrc) return cachedBeepSrc;
  try {
    const sr = 44100;
    const dur = 0.3;
    const offCtx = new OfflineAudioContext(1, Math.floor(sr * dur), sr);
    const osc = offCtx.createOscillator();
    const gain = offCtx.createGain();
    osc.connect(gain);
    gain.connect(offCtx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, dur);
    osc.start(0);
    osc.stop(dur);
    const rendered = await offCtx.startRendering();
    cachedBeepSrc = bufferToWavDataUrl(rendered);
    return cachedBeepSrc;
  } catch (e) {
    console.warn("[useRestTimer] ensureBeepSrc error:", e);
    return null;
  }
}

// ── Push notification ─────────────────────────────────────────────────────────

async function triggerNotification() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission !== "granted") return;
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SHOW_TIMER_NOTIFICATION" });
  } else {
    new Notification("⏱ LiftLog", {
      body: "סיים המנוחה — חזור לאימון!",
      icon: "/icons/icon-192x192.png",
    });
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const beepIntervalRef = useRef(null);

  // Pre-generate the beep WAV once on first mount
  useEffect(() => { ensureBeepSrc(); }, []);

  const stopBeeping = useCallback(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  }, []);

  const startBeeping = useCallback(() => {
    stopBeeping();
    function playOnce() {
      if (!cachedBeepSrc) return;
      const audio = new Audio(cachedBeepSrc);
      audio.play().catch(() => {});
    }
    playOnce(); // immediate first beep
    beepIntervalRef.current = setInterval(playOnce, 2000);
  }, [stopBeeping]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isRunning, secondsLeft]);

  // Timer ended naturally
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      setShowCompletionModal(true);
      startBeeping();
      triggerNotification();
    }
  }, [isRunning, secondsLeft, startBeeping]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    stopBeeping();
    setShowCompletionModal(false);
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);
  }, [stopBeeping]);

  const skipTimer = useCallback(() => {
    stopBeeping();
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, [stopBeeping]);

  const dismissModal = useCallback(() => {
    stopBeeping();
    setShowCompletionModal(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, [stopBeeping]);

  // Cleanup on unmount
  useEffect(() => () => stopBeeping(), [stopBeeping]);

  return { secondsLeft, totalSeconds, isRunning, showCompletionModal, startTimer, skipTimer, dismissModal };
}
