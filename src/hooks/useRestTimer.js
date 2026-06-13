"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const LS_END_KEY = "timerEndTime";
const LS_TOTAL_KEY = "timerTotalSeconds";

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const intervalRef = useRef(null);

  const handleExpiry = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setSecondsLeft(0);
    setIsRunning(false);
    setTimerComplete(true);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      fetch("/api/push/send", { method: "POST" }).catch(() => {});
    }
  }, []);

  const startCountdown = useCallback((endTime, total) => {
    clearInterval(intervalRef.current);
    setTotalSeconds(total);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        handleExpiry();
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
  }, [handleExpiry]);

  // On mount: resume if a timer was active when the app was last closed
  useEffect(() => {
    const endTime = parseInt(localStorage.getItem(LS_END_KEY) || "0", 10);
    const total = parseInt(localStorage.getItem(LS_TOTAL_KEY) || "0", 10);
    if (!endTime || !total) return;
    const remaining = Math.round((endTime - Date.now()) / 1000);
    if (remaining > 0) {
      setSecondsLeft(remaining);
      startCountdown(endTime, total);
    } else {
      handleExpiry();
    }
    return () => clearInterval(intervalRef.current);
  }, [startCountdown, handleExpiry]);

  // When app returns to foreground: recalculate from localStorage end time
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      const endTime = parseInt(localStorage.getItem(LS_END_KEY) || "0", 10);
      const total = parseInt(localStorage.getItem(LS_TOTAL_KEY) || "0", 10);
      if (!endTime) return;
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        startCountdown(endTime, total);
      } else {
        handleExpiry();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startCountdown, handleExpiry]);

  const startTimer = useCallback((duration) => {
    if (!duration || duration <= 0) return;
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem(LS_END_KEY, endTime.toString());
    localStorage.setItem(LS_TOTAL_KEY, duration.toString());
    setTimerComplete(false);
    setSecondsLeft(duration);
    startCountdown(endTime, duration);
  }, [startCountdown]);

  const skipTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setTimerComplete(false);
  }, []);

  const dismissComplete = useCallback(() => {
    setTimerComplete(false);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, timerComplete, startTimer, skipTimer, dismissComplete };
}
