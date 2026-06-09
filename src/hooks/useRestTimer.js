"use client";
import { useState, useEffect, useRef, useCallback } from "react";

async function playBeep() {
  console.log("[useRestTimer] playBeep called");
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { console.warn("[useRestTimer] AudioContext not available"); return; }
    const ctx = new AC();
    console.log("[useRestTimer] AudioContext state:", ctx.state);
    if (ctx.state === "suspended") {
      await ctx.resume();
      console.log("[useRestTimer] AudioContext resumed");
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
    console.log("[useRestTimer] beep scheduled at", ctx.currentTime);
  } catch (e) {
    console.error("[useRestTimer] playBeep error:", e);
  }
}

async function triggerNotification() {
  console.log(
    "[useRestTimer] triggerNotification called — permission:",
    typeof Notification !== "undefined" ? Notification.permission : "unavailable"
  );
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
  const intervalRef = useRef(null);
  const secondsRef = useRef(0); // mutable mirror of secondsLeft for the interval callback

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    clearTimer();

    secondsRef.current = duration;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      secondsRef.current -= 1;
      setSecondsLeft(secondsRef.current);

      if (secondsRef.current <= 0) {
        clearTimer();
        setIsRunning(false);
        console.log("[useRestTimer] timer reached 0 — firing beep and notification");
        playBeep();
        triggerNotification();
      }
    }, 1000);
  }, []);

  const skipTimer = useCallback(() => {
    clearTimer();
    secondsRef.current = 0;
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, []);

  // Clean up interval if component unmounts mid-countdown
  useEffect(() => () => clearTimer(), []);

  return { secondsLeft, totalSeconds, isRunning, startTimer, skipTimer };
}
