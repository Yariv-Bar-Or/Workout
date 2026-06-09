"use client";
import { useState, useEffect, useCallback } from "react";

async function playBeep() {
  console.log("[useRestTimer] playBeep called");
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    // New AudioContext is often suspended when not created in a user-gesture handler
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("[useRestTimer] playBeep error:", e);
  }
}

async function triggerNotification() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
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

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Tick once per second while running
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isRunning, secondsLeft]);

  // When countdown hits 0: beep, notify, auto-dismiss
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      playBeep();
      triggerNotification();
    }
  }, [isRunning, secondsLeft]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);
  }, []);

  const skipTimer = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, startTimer, skipTimer };
}
