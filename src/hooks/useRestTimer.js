"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const LS_END_KEY = "timerEndTime";
const LS_TOTAL_KEY = "timerTotalSeconds";

export function useRestTimer(userId) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const activeRef = useRef(false); // guards against double-fire from setTimeout + setInterval racing
  const userIdRef = useRef(userId);

  // Keep userIdRef current on every render without destabilising callback dep arrays
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Stable helper: deletes this user's active_timers row. Fire-and-forget.
  const deleteActiveTimer = useCallback(() => {
    if (!userIdRef.current) return;
    supabase
      .from("active_timers")
      .delete()
      .eq("user_id", userIdRef.current)
      .catch(console.error);
  }, []);

  const handleExpiry = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setSecondsLeft(0);
    setIsRunning(false);
    setTimerComplete(true);
    deleteActiveTimer();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      fetch("/api/push/send", { method: "POST" }).catch(() => {});
    }
  }, [deleteActiveTimer]);

  const startCountdown = useCallback((endTime, total) => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    activeRef.current = true;

    const msLeft = endTime - Date.now();
    if (msLeft <= 0) {
      handleExpiry();
      return;
    }

    setTotalSeconds(total);
    setIsRunning(true);

    // Exact-time expiry: fires at the precise millisecond regardless of tab throttling
    timeoutRef.current = setTimeout(handleExpiry, msLeft);

    // Visual countdown: updates display every second (throttled in background but display-only)
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
      // Timer expired while the app was closed. The activeRef guard in
      // handleExpiry prevents double-fire from a running setTimeout+setInterval
      // pair — those aren't active here, so arm the ref before calling.
      activeRef.current = true;
      handleExpiry();
    }
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
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
        // Same rationale as the mount effect.
        activeRef.current = true;
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
    if (userIdRef.current) {
      supabase
        .from("active_timers")
        .upsert({ user_id: userIdRef.current, ends_at: endTime }, { onConflict: "user_id" })
        .catch(console.error);
    }
  }, [startCountdown]);

  const skipTimer = useCallback(() => {
    activeRef.current = false;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    localStorage.removeItem(LS_END_KEY);
    localStorage.removeItem(LS_TOTAL_KEY);
    setIsRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setTimerComplete(false);
    deleteActiveTimer();
  }, [deleteActiveTimer]);

  const dismissComplete = useCallback(() => {
    setTimerComplete(false);
  }, []);

  return { secondsLeft, totalSeconds, isRunning, timerComplete, startTimer, skipTimer, dismissComplete };
}
